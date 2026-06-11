import { Router, Response } from "express";
import { connectToDatabase } from "../../lib/mongodb";
import { QuestionBank } from "../../models/QuestionBank";
import { TestAttempt } from "../../models/TestAttempt";
import { AuthenticatedRequest, requireUser } from "../middleware/auth";

const router = Router();

// Fetch all questions with user's attempt status
router.get("/", requireUser, async (req: AuthenticatedRequest, res: Response) => {
  const userId = req.user!.id;

  try {
    await connectToDatabase();

    // 1. Fetch all attempts for the user to determine question status
    const attempts = await TestAttempt.find({ userId, isDeleted: false })
      .select("questionHash result")
      .lean();

    // Map questionHash to user's result
    const attemptMap = new Map<string, string>();
    for (const a of attempts) {
      // If we have multiple attempts, prefer correct over incorrect, etc.
      const existing = attemptMap.get(a.questionHash);
      if (!existing || (existing !== "correct" && a.result === "correct")) {
        attemptMap.set(a.questionHash, a.result);
      }
    }

    // 2. Fetch canonical questions from QuestionBank
    const dbQuestions = await QuestionBank.find({ isDeleted: false })
      .sort({ createdAt: -1 })
      .lean();

    // 3. Map to UI BankQuestion shape
    const mappedQuestions = dbQuestions.map((q, index) => {
      const status = attemptMap.get(q.questionHash) || "unattempted";
      
      // Calculate a derived difficulty
      let difficulty: "Easy" | "Medium" | "Hard" = "Medium";
      if (q.aiConfidence < 0.6) {
        difficulty = "Hard";
      } else if (q.aiConfidence > 0.85) {
        difficulty = "Easy";
      }

      // Generate a nice readable question code
      const subCode = q.subject ? q.subject.substring(0, 1).toUpperCase() : "Q";
      const code = `NEET-${subCode}-${String(index + 100).padStart(3, "0")}`;

      return {
        id: q._id.toString(),
        code,
        text: q.questionText,
        subject: q.subject.charAt(0).toUpperCase() + q.subject.slice(1),
        topic: q.topic || q.chapter || "General",
        difficulty,
        status: status === "wrong" ? "incorrect" : status,
        options: q.options && q.options.length > 0 ? q.options.map(opt => ({
          key: opt.key,
          text: opt.text
        })) : [
          { key: "A", text: "Option A" },
          { key: "B", text: "Option B" },
          { key: "C", text: "Option C" },
          { key: "D", text: "Option D" }
        ],
        correctOption: q.correctAnswer,
        explanation: q.explanation || "No explanation provided."
      };
    });

    return res.status(200).json({ questions: mappedQuestions });
  } catch (error) {
    console.error("[QuestionsRouter] Fetch questions error:", error);
    return res.status(500).json({ error: "Failed to fetch question bank." });
  }
});

export default router;
