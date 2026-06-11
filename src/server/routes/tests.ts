import { Router, Response } from "express";
import multer from "multer";
import { connectToDatabase } from "../../lib/mongodb";
import { Test } from "../../models/Test";
import { TestAttempt } from "../../models/TestAttempt";
import { MistakeJournal } from "../../models/MistakeJournal";
import { QuestionBank } from "../../models/QuestionBank";
import { userTopicStatsRepository, userChapterStatsRepository } from "../../repositories/stats.repository";
import { cloudinary, uploadBuffer } from "../../lib/cloudinary";
import { validateUploadFile, MAX_FILE_SIZE_BYTES } from "../../lib/upload-validation";
import { OcrQueueService } from "../../services/ocr-queue.service";
import { AuthenticatedRequest, requireUser } from "../middleware/auth";

const router = Router();
const upload = multer({ limits: { fileSize: MAX_FILE_SIZE_BYTES } });

// Helper to extract Cloudinary public ID
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

// 1. Fetch all tests for user
router.get("/", requireUser, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    await connectToDatabase();

    const tests = await Test.find({ userId, isDeleted: false })
      .sort({ createdAt: -1 })
      .select("testName subject testDate totalQuestions uploadedFile processingStatus statusMessage createdAt updatedAt")
      .lean();

    const testsWithDetails = await Promise.all(
      tests.map(async (test) => {
        if (test.processingStatus === "completed") {
          const attempts = await TestAttempt.find({ testId: test._id, userId, isDeleted: false }).lean();
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

    return res.status(200).json({ tests: testsWithDetails });
  } catch (error) {
    console.error("[TestsRouter] Fetch tests error:", error);
    return res.status(500).json({ error: "Failed to load tests" });
  }
});

// 2. Create test metadata (JSON)
router.post("/", requireUser, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { title, examDate, assets } = req.body;

  if (!title) {
    return res.status(400).json({ error: "Missing title" });
  }

  try {
    await connectToDatabase();

    const test = await Test.create({
      userId,
      createdBy: userId,
      testName: title,
      subject: "combined",
      testDate: examDate ? new Date(examDate) : new Date(),
      uploadedFile: assets?.[0]?.secureUrl || "",
      processingStatus: "pending",
      totalQuestions: 0,
      isDeleted: false
    });

    return res.status(201).json({ test, questionPaper: test });
  } catch (error) {
    console.error("[TestsRouter] Create test error:", error);
    return res.status(500).json({ error: "Failed to create test paper metadata" });
  }
});

// 3. Upload and Parse Scanned Papers (Multipart)
router.post("/upload", requireUser, upload.array("files"), async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { title, subject } = req.body;
  const files = req.files as Express.Multer.File[];

  if (!title || !subject || !files || files.length === 0) {
    return res.status(400).json({ error: "Missing required fields: title, subject, or files." });
  }

  try {
    await connectToDatabase();

    interface UploadMetadata {
      publicId: string;
      secureUrl: string;
      format: string;
      bytes: number;
      originalFilename: string;
    }
    const cloudinaryUrls: string[] = [];
    const storageMetadata: UploadMetadata[] = [];

    // Validate and upload each file
    for (const file of files) {
      // Perform magic byte signature validation
      const validation = validateUploadFile(file.buffer, file.originalname, file.mimetype, MAX_FILE_SIZE_BYTES);
      if (!validation.isValid && validation.error) {
        return res.status(400).json({
          error: `Validation failed for file ${file.originalname}: ${validation.error.message}`,
          code: validation.error.code
        });
      }

      // Upload file buffer to Cloudinary
      const folder = `neet-test-analytics/${userId}`;
      const uploadResult = await uploadBuffer(file.buffer, folder, file.originalname, file.mimetype);

      cloudinaryUrls.push(uploadResult.secure_url);
      storageMetadata.push({
        publicId: uploadResult.public_id,
        secureUrl: uploadResult.secure_url,
        format: uploadResult.format,
        bytes: uploadResult.bytes,
        originalFilename: file.originalname
      });
    }

    // Save the Test record in MongoDB
    const test = await Test.create({
      userId,
      createdBy: userId,
      testName: title,
      subject,
      testDate: new Date(),
      uploadedFile: cloudinaryUrls.join(","),
      processingStatus: "pending",
      totalQuestions: 0,
      isDeleted: false
    });

    // Fire background OCR processing asynchronously
    OcrQueueService.triggerOcrJob(
      test._id.toString(),
      userId,
      cloudinaryUrls,
      subject,
      title
    );

    return res.status(201).json({
      success: true,
      message: "Question paper uploaded and queued for OCR processing.",
      test,
      storageMetadata
    });
  } catch (error: unknown) {
    console.error("[TestsRouter] Upload error:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      error: "Internal server error during upload processing.",
      details: errMsg
    });
  }
});

// 4. Soft Delete Graded Test
router.delete("/", requireUser, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.query;

  if (!id) {
    return res.status(400).json({ error: "Missing required query parameter: id" });
  }

  try {
    await connectToDatabase();

    const test = await Test.findOne({ _id: id, userId, isDeleted: false });
    if (!test) {
      return res.status(404).json({ error: "Test paper not found or already deleted." });
    }

    // Remove Cloudinary assets
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

    const attempts = await TestAttempt.find({ testId: id, userId, isDeleted: false }).lean();
    const questionHashes = attempts.map((a) => a.questionHash).filter(Boolean);

    // Soft delete associated attempt documents
    await TestAttempt.updateMany({ testId: id, userId }, { $set: { isDeleted: true } });
    await MistakeJournal.updateMany({ testId: id, userId }, { $set: { isDeleted: true } });

    if (questionHashes.length > 0) {
      await QuestionBank.updateMany(
        { questionHash: { $in: questionHashes } },
        { $set: { isDeleted: true } }
      );
      console.log(`Soft deleted ${questionHashes.length} questions from QuestionBank.`);
    }

    // Soft delete the Test paper itself
    await Test.updateOne({ _id: id, userId }, { $set: { isDeleted: true, deletedAt: new Date() } });

    // Recalculate stats caches asynchronously
    await userTopicStatsRepository.recalculateTopicStats(userId);
    await userChapterStatsRepository.recalculateChapterStats(userId);

    return res.status(200).json({
      success: true,
      message: "Test paper, Cloudinary assets, and related questions successfully deleted."
    });
  } catch (error) {
    console.error("[TestsRouter] Delete error:", error);
    const errMsg = error instanceof Error ? error.message : String(error);
    return res.status(500).json({
      error: "Internal server error during deletion processing.",
      details: errMsg
    });
  }
});

export default router;
