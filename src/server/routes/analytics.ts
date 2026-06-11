import { Router } from "express";
import { Types } from "mongoose";
import { connectToDatabase } from "../../lib/mongodb";
import { Test } from "../../models/Test";
import { TestAttempt } from "../../models/TestAttempt";
import { UserTopicStats } from "../../models/UserTopicStats";
import { QuestionBank } from "../../models/QuestionBank";
import { RevisionTask } from "../../models/RevisionTask";
import { AuthenticatedRequest, requireUser } from "../middleware/auth";

const router = Router();

// 1. Fetch detailed analytics report
router.get("/", requireUser, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  try {
    await connectToDatabase();

    // A. Summary counts
    const testsUploaded = await Test.countDocuments({ userId, isDeleted: false });
    const questionsExtracted = await TestAttempt.countDocuments({ userId, isDeleted: false });
    const weakTopicsCount = await UserTopicStats.countDocuments({
      userId,
      accuracy: { $lt: 60 },
      isDeleted: false
    });
    const revisionTasksCount = await RevisionTask.countDocuments({
      userId,
      status: "pending",
      isDeleted: false
    });

    // B. Calculate subject stats (attempted, correct, incorrect, unattempted, accuracy)
    const attempts = await TestAttempt.find({ userId, isDeleted: false }).lean();
    const hashes = attempts.map((a) => a.questionHash);
    const questions = await QuestionBank.find({ questionHash: { $in: hashes } }).select("questionHash subject").lean();
    const questionSubjectMap = new Map(questions.map((q) => [q.questionHash, q.subject]));

    const subjectStatsMap = {
      physics: { subject: "Physics", attempted: 0, correct: 0, incorrect: 0, unattempted: 0, accuracy: 0 },
      chemistry: { subject: "Chemistry", attempted: 0, correct: 0, incorrect: 0, unattempted: 0, accuracy: 0 },
      botany: { subject: "Botany", attempted: 0, correct: 0, incorrect: 0, unattempted: 0, accuracy: 0 },
      zoology: { subject: "Zoology", attempted: 0, correct: 0, incorrect: 0, unattempted: 0, accuracy: 0 }
    };

    for (const attempt of attempts) {
      const sub = questionSubjectMap.get(attempt.questionHash);
      if (sub && subjectStatsMap[sub as keyof typeof subjectStatsMap]) {
        const stats = subjectStatsMap[sub as keyof typeof subjectStatsMap];
        stats.attempted++;
        if (attempt.result === "correct") {
          stats.correct++;
        } else if (attempt.result === "wrong") {
          stats.incorrect++;
        } else {
          stats.unattempted++;
        }
      }
    }

    for (const key in subjectStatsMap) {
      const stats = subjectStatsMap[key as keyof typeof subjectStatsMap];
      stats.accuracy = stats.attempted > 0 ? Math.round((stats.correct / stats.attempted) * 100) : 0;
    }

    // C. Monthly trends (max score per month)
    const completedTests = await Test.find({ userId, processingStatus: "completed", isDeleted: false })
      .sort({ testDate: 1 })
      .lean();

    const monthlyMap: Record<string, number> = {};
    for (const test of completedTests) {
      const testAttempts = await TestAttempt.find({ testId: test._id, userId, isDeleted: false }).lean();
      let correct = 0;
      let wrong = 0;
      for (const attempt of testAttempts) {
        if (attempt.result === "correct") correct++;
        else if (attempt.result === "wrong") wrong++;
      }
      const score = correct * 4 - wrong * 1;
      const monthStr = new Date(test.testDate).toLocaleDateString("en-US", { month: "short" });
      monthlyMap[monthStr] = Math.max(monthlyMap[monthStr] || 0, score);
    }
    
    let monthlyTrend = Object.entries(monthlyMap).map(([month, score]) => ({ month, score }));
    if (monthlyTrend.length === 0) {
      monthlyTrend = [
        { month: "No Data", score: 0 }
      ];
    }

    // D. Topic Radar area chart (top 6 topics by volume)
    const topicStats = await UserTopicStats.find({ userId, isDeleted: false })
      .sort({ totalQuestions: -1 })
      .limit(6)
      .lean();

    let topicRadar = topicStats.map((ts) => ({
      topic: ts.topic,
      A: ts.accuracy,
      fullMark: 100
    }));

    if (topicRadar.length === 0) {
      topicRadar = [
        { topic: "Physics", A: 0, fullMark: 100 },
        { topic: "Chemistry", A: 0, fullMark: 100 },
        { topic: "Biology", A: 0, fullMark: 100 }
      ];
    }

    return res.status(200).json({
      summary: {
        testsUploaded,
        questionsExtracted,
        weakTopics: weakTopicsCount,
        revisionTasks: revisionTasksCount
      },
      subjectAccuracy: Object.values(subjectStatsMap),
      monthlyTrend,
      topicRadar
    });
  } catch (error) {
    console.error("[AnalyticsRouter] Aggregate stats error:", error);
    return res.status(500).json({ error: "Failed to load analytics statistics." });
  }
});

// 2. Fetch weak topics (accuracy < 60%)
router.get("/weak-topics", requireUser, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  try {
    await connectToDatabase();

    const weakTopics = await UserTopicStats.find({
      userId,
      accuracy: { $lt: 60 },
      isDeleted: false
    })
      .sort({ accuracy: 1 })
      .lean();

    const mapped = weakTopics.map((wt) => {
      // derive incorrect and unattempted counts
      const incorrect = wt.wrongQuestions;
      const unattempted = Math.max(0, wt.totalQuestions - (wt.correctQuestions + wt.wrongQuestions));
      const weightage = wt.totalQuestions > 10 ? "High" : wt.totalQuestions > 5 ? "Medium" : "Low";

      return {
        id: wt._id.toString(),
        topic: wt.topic,
        subject: wt.subject.charAt(0).toUpperCase() + wt.subject.slice(1),
        accuracy: wt.accuracy,
        incorrectQuestions: incorrect,
        unattemptedQuestions: unattempted,
        weightage,
        status: wt.accuracy < 40 ? "critical" : "warning"
      };
    });

    return res.status(200).json({ weakTopics: mapped });
  } catch (error) {
    console.error("[AnalyticsRouter] Fetch weak topics error:", error);
    return res.status(500).json({ error: "Failed to load weak topics chapter lists." });
  }
});

export default router;
