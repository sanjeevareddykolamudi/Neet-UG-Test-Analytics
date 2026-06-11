import { Router } from "express";
import { Types } from "mongoose";
import { connectToDatabase } from "../../lib/mongodb";
import { Test } from "../../models/Test";
import { TestAttempt } from "../../models/TestAttempt";
import { QuestionBank } from "../../models/QuestionBank";
import { UserTopicStats } from "../../models/UserTopicStats";
import { UserChapterStats } from "../../models/UserChapterStats";
import { RevisionTask } from "../../models/RevisionTask";
import { MistakeJournal } from "../../models/MistakeJournal";
import { AuthenticatedRequest, requireUser } from "../middleware/auth";

const router = Router();

router.get("/", requireUser, async (req: AuthenticatedRequest, res) => {
  const userId = req.user!.id;

  try {
    await connectToDatabase();

    // 1. Fetch counts
    const totalTests = await Test.countDocuments({ userId, isDeleted: false });
    const weakTopicsCount = await UserTopicStats.countDocuments({
      userId,
      accuracy: { $lt: 60 },
      isDeleted: false
    });
    const pendingRevisionTasksCount = await RevisionTask.countDocuments({
      userId,
      status: "pending",
      isDeleted: false
    });
    const questionBankSize = await QuestionBank.countDocuments({ isDeleted: false });
    const recurringMistakesCount = await MistakeJournal.countDocuments({ userId, isDeleted: false });

    // 2. Fetch completed tests to calculate scores
    const completedTests = await Test.find({ userId, processingStatus: "completed", isDeleted: false })
      .sort({ testDate: 1 })
      .lean();

    const marksTrend: Array<{ testName: string; score: number; averageScore: number; date: string }> = [];
    let bestScore = 0;
    let bestScoreTestName = "N/A";
    let totalScoreSum = 0;

    for (const test of completedTests) {
      const attempts = await TestAttempt.find({ testId: test._id, userId, isDeleted: false }).lean();
      let correct = 0;
      let wrong = 0;

      for (const attempt of attempts) {
        if (attempt.result === "correct") correct++;
        else if (attempt.result === "wrong") wrong++;
      }

      const score = correct * 4 - wrong * 1;
      totalScoreSum += score;
      if (score > bestScore || bestScore === 0) {
        bestScore = score;
        bestScoreTestName = test.testName;
      }

      marksTrend.push({
        testName: test.testName,
        score,
        averageScore: 540, // standard baseline comparison
        date: new Date(test.testDate).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" })
      });
    }

    const averageMarks = completedTests.length > 0 ? Math.round(totalScoreSum / completedTests.length) : 0;
    const currentRank = completedTests.length > 0 ? Math.max(100, Math.round(10000 - totalScoreSum * 8)) : 0;

    // 3. Subject Accuracies
    const subjectStats = await UserTopicStats.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          isDeleted: false
        }
      },
      {
        $group: {
          _id: "$subject",
          total: { $sum: "$totalQuestions" },
          correct: { $sum: "$correctQuestions" }
        }
      }
    ]);

    const subjectMap = {
      physics: { subject: "Physics", accuracy: 0, totalQuestions: 0, correctAnswers: 0 },
      chemistry: { subject: "Chemistry", accuracy: 0, totalQuestions: 0, correctAnswers: 0 },
      botany: { subject: "Botany", accuracy: 0, totalQuestions: 0, correctAnswers: 0 },
      zoology: { subject: "Zoology", accuracy: 0, totalQuestions: 0, correctAnswers: 0 }
    };

    for (const stat of subjectStats) {
      const sub = (stat._id || "").toLowerCase() as keyof typeof subjectMap;
      if (subjectMap[sub]) {
        subjectMap[sub].totalQuestions = stat.total;
        subjectMap[sub].correctAnswers = stat.correct;
        subjectMap[sub].accuracy = stat.total > 0 ? Math.round((stat.correct / stat.total) * 100) : 0;
      }
    }

    // 4. Topic Accuracies
    const topicStats = await UserTopicStats.find({ userId, isDeleted: false })
      .sort({ accuracy: 1 })
      .limit(8)
      .lean();

    const topicAccuracy = topicStats.map((t) => ({
      topic: t.topic,
      subject: t.subject.charAt(0).toUpperCase() + t.subject.slice(1),
      accuracy: t.accuracy,
      weightage: t.totalQuestions > 10 ? "High" : "Medium"
    }));

    // 5. Chapter Accuracies
    const chapterStats = await UserChapterStats.find({ userId, isDeleted: false })
      .sort({ accuracy: 1 })
      .limit(8)
      .lean();

    const chapterAccuracy = chapterStats.map((c) => ({
      subject: c.subject.charAt(0).toUpperCase() + c.subject.slice(1),
      chapter: c.chapter,
      accuracy: c.accuracy
    }));

    // 6. Recent uploads
    const recentTests = await Test.find({ userId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(5)
      .lean();

    const recentUploads = recentTests.map((t) => ({
      id: t._id.toString(),
      name: t.testName,
      size: "N/A",
      uploadedAt: new Date(t.createdAt).toLocaleDateString("en-US", { month: "short", day: "2-digit" }),
      status: t.processingStatus as "completed" | "parsing" | "failed" | "pending_review"
    }));

    // 7. Recent completed exams with score/accuracy for the table
    const recentExams: Array<{ id: string; title: string; score: number; total: number; accuracy: number; date: string }> = [];
    const sortedCompleted = [...completedTests]
      .sort((a, b) => new Date(b.testDate).getTime() - new Date(a.testDate).getTime())
      .slice(0, 5);

    for (const test of sortedCompleted) {
      const attempts = await TestAttempt.find({ testId: test._id, userId, isDeleted: false }).lean();
      let correct = 0;
      let wrong = 0;

      for (const attempt of attempts) {
        if (attempt.result === "correct") correct++;
        else if (attempt.result === "wrong") wrong++;
      }

      const score = correct * 4 - wrong * 1;
      const total = attempts.length * 4;
      const accuracy = attempts.length > 0 ? Math.round((correct / attempts.length) * 100) : 0;

      recentExams.push({
        id: test._id.toString(),
        title: test.testName,
        score,
        total,
        accuracy,
        date: new Date(test.testDate).toLocaleDateString("en-US", { month: "2-digit", day: "2-digit" })
      });
    }

    // 8. Recent Activities
    const recentActivities: Array<{ id: string; type: "upload" | "grade" | "mistake" | "revision"; title: string; description: string; timestamp: string }> = [];
    
    // Pull most recent activities from recent uploads
    for (const t of recentTests.slice(0, 2)) {
      recentActivities.push({
        id: `act-${t._id}`,
        type: t.processingStatus === "completed" ? "grade" : "upload",
        title: t.processingStatus === "completed" ? "Analysis Completed" : "Test Paper Uploaded",
        description: t.processingStatus === "completed" 
          ? `Analysis of ${t.testName} is ready.` 
          : `Uploaded scanned ${t.testName} paper.`,
        timestamp: "Recently"
      });
    }

    // Pull recent mistakes
    const recentMistakes = await MistakeJournal.find({ userId, isDeleted: false })
      .sort({ createdAt: -1 })
      .limit(2)
      .lean();

    for (const m of recentMistakes) {
      // Find question number if possible or use a fallback
      const qNumberStr = m.questionHash.match(/\d+$/)?.[0];
      const qNumber = qNumberStr ? `Q${qNumberStr}` : "Question";

      recentActivities.push({
        id: `act-${m._id}`,
        type: "mistake",
        title: "Mistake Logged",
        description: `Logged mistake for ${qNumber} in ${m.topic} (${m.subject}).`,
        timestamp: "Recently"
      });
    }

    // 9. Revision Tasks
    const activeTasks = await RevisionTask.find({ userId, status: "pending", isDeleted: false })
      .sort({ dueDate: 1 })
      .limit(5)
      .lean();

    const revisionTasks = activeTasks.map((task) => ({
      id: task._id.toString(),
      topic: task.topic,
      subject: task.subject.charAt(0).toUpperCase() + task.subject.slice(1),
      dueDate: new Date(task.dueDate).toISOString().split("T")[0],
      priority: task.priority ? task.priority.charAt(0).toUpperCase() + task.priority.slice(1) : "Medium",
      completed: task.status === "done",
      notes: task.notes || ""
    }));

    // 10. Weak Topics Distribution
    const physicsWeak = await UserTopicStats.countDocuments({ userId, subject: "physics", accuracy: { $lt: 60 }, isDeleted: false });
    const chemistryWeak = await UserTopicStats.countDocuments({ userId, subject: "chemistry", accuracy: { $lt: 60 }, isDeleted: false });
    const botanyWeak = await UserTopicStats.countDocuments({ userId, subject: "botany", accuracy: { $lt: 60 }, isDeleted: false });
    const zoologyWeak = await UserTopicStats.countDocuments({ userId, subject: "zoology", accuracy: { $lt: 60 }, isDeleted: false });

    const weakTopicsDistribution = [
      { subject: "Physics", count: physicsWeak, color: "hsl(var(--destructive))" },
      { subject: "Chemistry", count: chemistryWeak, color: "hsl(var(--secondary))" },
      { subject: "Botany", count: botanyWeak, color: "hsl(var(--primary))" },
      { subject: "Zoology", count: zoologyWeak, color: "hsl(var(--accent))" }
    ];

    // 11. Most Repeated Mistakes
    const repeatedMistakesAggregate = await MistakeJournal.aggregate([
      {
        $match: {
          userId: new Types.ObjectId(userId),
          status: "review_needed",
          isDeleted: false
        }
      },
      {
        $group: {
          _id: { topic: "$topic", subject: "$subject" },
          count: { $sum: 1 },
          lastSeenId: { $first: "$testId" }
        }
      },
      { $sort: { count: -1 } },
      { $limit: 4 }
    ]);

    const mostRepeatedMistakes = await Promise.all(
      repeatedMistakesAggregate.map(async (m) => {
        let lastSeenName = "Mock Exam";
        if (m.lastSeenId) {
          const testDoc = await Test.findById(m.lastSeenId).select("testName").lean();
          if (testDoc) lastSeenName = testDoc.testName;
        }
        return {
          topic: m._id.topic,
          subject: m._id.subject.charAt(0).toUpperCase() + m._id.subject.slice(1),
          count: m.count,
          lastSeen: lastSeenName
        };
      })
    );

    // Respond with consolidated active DB metrics
    return res.status(200).json({
      summary: {
        totalTests,
        averageMarks,
        bestScore,
        bestScoreTestName,
        currentRank,
        weakTopicsCount,
        pendingRevisionTasksCount,
        questionBankSize,
        recurringMistakesCount
      },
      marksTrend,
      subjectAccuracy: Object.values(subjectMap),
      topicAccuracy,
      chapterAccuracy,
      topicMasteryTrend: [], // dynamic historical trends omitted for simplicity
      monthlyPerformance: [],
      weakTopicsDistribution,
      recentActivities,
      revisionTasks,
      recentUploads,
      recentExams,
      mostRepeatedMistakes
    });
  } catch (error) {
    console.error("[DashboardRouter] Aggregate dashboard statistics error:", error);
    return res.status(500).json({ error: "Failed to load dashboard metrics." });
  }
});

export default router;
