import { NextResponse } from "next/server";

import { requireUser, parseJson } from "@/lib/api";
import { connectToDatabase } from "@/lib/mongodb";
import { createQuestionPaperSchema } from "@/lib/validations";
import { Test } from "@/models/Test";
import { TestAttempt } from "@/models/TestAttempt";
import { MistakeJournal } from "@/models/MistakeJournal";
import { QuestionBank } from "@/models/QuestionBank";
import { userTopicStatsRepository, userChapterStatsRepository } from "@/repositories/stats.repository";
import { cloudinary } from "@/lib/cloudinary";

export async function GET() {
  const { user, response } = await requireUser();

  if (response) {
    return response;
  }

  await connectToDatabase();

  const tests = await Test.find({ userId: user.id, isDeleted: false })
    .sort({ createdAt: -1 })
    .select("testName subject testDate totalQuestions uploadedFile processingStatus statusMessage createdAt updatedAt")
    .lean();

  const testsWithDetails = await Promise.all(
    tests.map(async (test) => {
      if (test.processingStatus === "completed") {
        const attempts = await TestAttempt.find({ testId: test._id, userId: user.id, isDeleted: false }).lean();
        const hashes = attempts.map((a) => a.questionHash);
        const questions = await QuestionBank.find({ questionHash: { $in: hashes } }).select("questionHash subject").lean();
        const questionSubjectMap = new Map(questions.map((q) => [q.questionHash, q.subject]));

        let correct = 0;
        let wrong = 0;
        let physicsCorrect = 0, physicsTotal = 0;
        let chemistryCorrect = 0, chemistryTotal = 0;
        let botanyCorrect = 0, botanyTotal = 0;
        let zoologyCorrect = 0, zoologyTotal = 0;

        for (const attempt of attempts) {
          const isCorrect = attempt.result === "correct";
          if (isCorrect) correct++;
          else if (attempt.result === "wrong") wrong++;

          const sub = questionSubjectMap.get(attempt.questionHash);
          if (sub === "physics") {
            physicsTotal++;
            if (isCorrect) physicsCorrect++;
          } else if (sub === "chemistry") {
            chemistryTotal++;
            if (isCorrect) chemistryCorrect++;
          } else if (sub === "botany") {
            botanyTotal++;
            if (isCorrect) botanyCorrect++;
          } else if (sub === "zoology") {
            zoologyTotal++;
            if (isCorrect) zoologyCorrect++;
          }
        }

        const score = correct * 4 - wrong * 1;
        const maxMarks = attempts.length * 4;

        const physicsAccuracy = physicsTotal > 0 ? Math.round((physicsCorrect / physicsTotal) * 100) : 0;
        const chemistryAccuracy = chemistryTotal > 0 ? Math.round((chemistryCorrect / chemistryTotal) * 100) : 0;
        const biologyTotal = botanyTotal + zoologyTotal;
        const biologyCorrect = botanyCorrect + zoologyCorrect;
        const biologyAccuracy = biologyTotal > 0 ? Math.round((biologyCorrect / biologyTotal) * 100) : 0;

        return {
          ...test,
          score,
          maxMarks,
          subjectAccuracy: {
            Physics: physicsAccuracy,
            Chemistry: chemistryAccuracy,
            Biology: biologyAccuracy
          }
        };
      }

      return {
        ...test,
        score: null,
        maxMarks: 180 * 4,
        subjectAccuracy: null
      };
    })
  );

  return NextResponse.json({ tests: testsWithDetails });
}

export async function POST(request: Request) {
  const { user, response } = await requireUser();

  if (response) {
    return response;
  }

  const parsed = await parseJson(request, createQuestionPaperSchema);

  if (parsed.response) {
    return parsed.response;
  }

  await connectToDatabase();

  // Consolidate Test and QuestionPaper metadata into the redesigned Test model
  const test = await Test.create({
    userId: user.id,
    createdBy: user.id,
    testName: parsed.data.title,
    subject: "combined", // Default to combined for NEET full syllabus, can be customized
    testDate: parsed.data.examDate ? new Date(parsed.data.examDate) : new Date(),
    uploadedFile: parsed.data.assets[0]?.secureUrl || "",
    processingStatus: "pending",
    totalQuestions: 0,
    isDeleted: false
  });

  return NextResponse.json({ test, questionPaper: test }, { status: 201 });
}

function getPublicIdFromUrl(url: string): { publicId: string; resourceType: "image" | "raw" } | null {
  try {
    const parts = url.split("/upload/");
    if (parts.length < 2) return null;

    let path = parts[1];
    if (path.startsWith("v")) {
      const firstSlash = path.indexOf("/");
      if (firstSlash !== -1) {
        path = path.slice(firstSlash + 1);
      }
    }

    const lastDot = path.lastIndexOf(".");
    const publicId = lastDot !== -1 ? path.slice(0, lastDot) : path;
    const resourceType = url.includes("/raw/") ? "raw" : "image";

    return { publicId, resourceType };
  } catch (e) {
    console.error("Failed to parse Cloudinary URL:", url, e);
    return null;
  }
}

export async function DELETE(request: Request) {
  try {
    const { user, response: authResponse } = await requireUser();

    if (authResponse) {
      return authResponse;
    }

    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");

    if (!id) {
      return NextResponse.json(
        { error: "Missing required query parameter: id" },
        { status: 400 }
      );
    }

    await connectToDatabase();

    // 1. Find the Test record to be deleted
    const test = await Test.findOne({ _id: id, userId: user.id, isDeleted: false });
    if (!test) {
      return NextResponse.json(
        { error: "Test paper not found or already deleted." },
        { status: 404 }
      );
    }

    // 2. Remove Cloudinary assets associated with this Test paper
    if (test.uploadedFile) {
      const urls = test.uploadedFile.split(",").filter(Boolean);
      for (const url of urls) {
        const parsed = getPublicIdFromUrl(url);
        if (parsed) {
          try {
            await cloudinary.uploader.destroy(parsed.publicId, { resource_type: parsed.resourceType });
            console.log(`Cloudinary asset deleted: ${parsed.publicId} (${parsed.resourceType})`);
          } catch (cloudinaryErr) {
            console.error(`Failed to delete Cloudinary asset ${parsed.publicId}:`, cloudinaryErr);
          }
        }
      }
    }

    // 3. Find all test attempts to extract their question hashes
    const attempts = await TestAttempt.find({ testId: id, userId: user.id, isDeleted: false }).lean();
    const questionHashes = attempts.map((a) => a.questionHash).filter(Boolean);

    // 4. Soft delete attempts, mistakes, and question bank records in parallel/sequence
    await TestAttempt.updateMany(
      { testId: id, userId: user.id },
      { $set: { isDeleted: true } }
    );

    await MistakeJournal.updateMany(
      { testId: id, userId: user.id },
      { $set: { isDeleted: true } }
    );

    if (questionHashes.length > 0) {
      await QuestionBank.updateMany(
        { questionHash: { $in: questionHashes } },
        { $set: { isDeleted: true } }
      );
      console.log(`Soft deleted ${questionHashes.length} questions from QuestionBank.`);
    }

    // 5. Soft delete the Test document itself
    await Test.updateOne(
      { _id: id, userId: user.id },
      { $set: { isDeleted: true, deletedAt: new Date() } }
    );

    // 6. Recalculate stats caches asynchronously
    await userTopicStatsRepository.recalculateTopicStats(user.id);
    await userChapterStatsRepository.recalculateChapterStats(user.id);

    return NextResponse.json({
      success: true,
      message: "Test paper, Cloudinary assets, and related questions successfully deleted."
    });
  } catch (error: unknown) {
    console.error("Test deletion api error:", error);
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Internal server error during deletion processing.", details: errorMessage },
      { status: 500 }
    );
  }
}
