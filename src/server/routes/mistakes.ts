import { Router, Response } from "express";
import { Types } from "mongoose";
import { connectToDatabase } from "../../lib/mongodb";
import { MistakeJournal } from "../../models/MistakeJournal";
import { Test } from "../../models/Test";
import { QuestionBank } from "../../models/QuestionBank";
import { TestAttempt } from "../../models/TestAttempt";
import { AuthenticatedRequest, requireUser } from "../middleware/auth";
import crypto from "crypto";

const router = Router();

// 1. Fetch all mistakes for the logged-in user
router.get("/", requireUser, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    await connectToDatabase();

    const mistakes = await MistakeJournal.find({ userId, isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();

    const mappedMistakes = await Promise.all(
      mistakes.map(async (m) => {
        // Find test name
        const test = await Test.findById(m.testId).select("testName").lean();
        
        // Find attempt to get marked/correct answers
        const attempt = await TestAttempt.findOne({
          userId,
          testId: m.testId,
          questionHash: m.questionHash,
          isDeleted: false
        }).select("selectedAnswer correctAnswer").lean();

        // Find question details
        const question = await QuestionBank.findOne({
          questionHash: m.questionHash,
          isDeleted: false
        }).select("questionText options").lean();

        // Calculate a question number (or default to 1)
        const qNumberStr = m.questionHash.match(/\d+$/)?.[0];
        const questionNumber = qNumberStr ? parseInt(qNumberStr) : 1;

        return {
          id: m._id.toString(),
          testName: test?.testName || "Manual Entry",
          questionNumber,
          subject: m.subject.charAt(0).toUpperCase() + m.subject.slice(1),
          topic: m.topic || m.chapter || "General",
          markedOption: attempt?.selectedAnswer || "B",
          correctOption: attempt?.correctAnswer || "A",
          conceptsToRevise: m.studentNote || question?.questionText || "",
          status: (m as any).status || "review_needed"
        };
      })
    );

    return res.status(200).json({ mistakes: mappedMistakes });
  } catch (error) {
    console.error("[MistakesRouter] Fetch mistakes error:", error);
    return res.status(500).json({ error: "Failed to fetch mistake journal." });
  }
});

// 2. Add a new mistake manually
router.post("/", requireUser, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { testName, questionNumber, subject, topic, markedOption, correctOption, conceptsToRevise } = req.body;

  if (!testName || !subject || !topic || !conceptsToRevise) {
    return res.status(400).json({ error: "Missing required fields: testName, subject, topic, or conceptsToRevise." });
  }

  try {
    await connectToDatabase();

    // A. Find or create a Test document to satisfy testId constraint
    let test = await Test.findOne({ userId, testName, isDeleted: false });
    if (!test) {
      test = await Test.create({
        userId,
        createdBy: userId,
        testName,
        subject: subject.toLowerCase(),
        testDate: new Date(),
        processingStatus: "completed",
        totalQuestions: 180,
        isDeleted: false
      });
    }

    // B. Create a unique question hash
    const questionHash = `manual-${userId}-${crypto.randomBytes(4).toString("hex")}-q${questionNumber || 1}`;

    // C. Create canonical question in QuestionBank
    await QuestionBank.create({
      questionHash,
      questionText: conceptsToRevise,
      options: [
        { key: "A", text: "Option A" },
        { key: "B", text: "Option B" },
        { key: "C", text: "Option C" },
        { key: "D", text: "Option D" }
      ],
      correctAnswer: correctOption || "A",
      subject: subject.toLowerCase(),
      topic,
      chapter: topic,
      explanation: "Manually logged concept check.",
      source: "Manual Entry",
      sourceTest: testName
    });

    // D. Create TestAttempt record
    await TestAttempt.create({
      userId,
      testId: test._id,
      questionHash,
      selectedAnswer: markedOption || "B",
      correctAnswer: correctOption || "A",
      result: "wrong",
      isDeleted: false
    });

    // E. Create MistakeJournal record
    const mistake = await MistakeJournal.create({
      userId,
      questionHash,
      subject: subject.toLowerCase(),
      topic,
      chapter: topic,
      testId: test._id,
      studentNote: conceptsToRevise,
      status: "review_needed",
      isDeleted: false
    });

    return res.status(201).json({
      success: true,
      mistake: {
        id: mistake._id.toString(),
        testName,
        questionNumber: questionNumber || 1,
        subject,
        topic,
        markedOption,
        correctOption,
        conceptsToRevise,
        status: "review_needed"
      }
    });
  } catch (error) {
    console.error("[MistakesRouter] Log mistake error:", error);
    return res.status(500).json({ error: "Failed to log mistake entry." });
  }
});

// 3. Toggle status or update notes
router.patch("/:id", requireUser, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;
  const { status, conceptsToRevise } = req.body;

  try {
    await connectToDatabase();

    const mistake = await MistakeJournal.findOne({ _id: id, userId, isDeleted: false });
    if (!mistake) {
      return res.status(404).json({ error: "Mistake journal entry not found." });
    }

    const updates: any = {};
    if (status) updates.status = status;
    if (conceptsToRevise !== undefined) updates.studentNote = conceptsToRevise;

    await MistakeJournal.updateOne({ _id: id, userId }, { $set: updates });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("[MistakesRouter] Update mistake error:", error);
    return res.status(500).json({ error: "Failed to update mistake entry." });
  }
});

// 4. Delete mistake journal entry
router.delete("/:id", requireUser, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;
  const { id } = req.params;

  try {
    await connectToDatabase();

    const mistake = await MistakeJournal.findOne({ _id: id, userId, isDeleted: false });
    if (!mistake) {
      return res.status(404).json({ error: "Mistake journal entry not found." });
    }

    // Soft delete
    await MistakeJournal.updateOne({ _id: id, userId }, { $set: { isDeleted: true, deletedAt: new Date() } });

    // Soft delete associated attempt if manual
    if (mistake.questionHash.startsWith("manual-")) {
      await TestAttempt.updateOne(
        { userId, questionHash: mistake.questionHash },
        { $set: { isDeleted: true, deletedAt: new Date() } }
      );
      await QuestionBank.updateOne(
        { questionHash: mistake.questionHash },
        { $set: { isDeleted: true } }
      );
    }

    return res.status(200).json({ success: true, message: "Mistake deleted successfully." });
  } catch (error) {
    console.error("[MistakesRouter] Delete mistake error:", error);
    return res.status(500).json({ error: "Failed to delete mistake entry." });
  }
});

export default router;
