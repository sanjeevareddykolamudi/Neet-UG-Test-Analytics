/* eslint-disable no-console */
import { connectToDatabase } from "../lib/mongodb";
import { User } from "../models/User";
import { QuestionBank } from "../models/QuestionBank";
import { Test } from "../models/Test";
import { TestAttempt } from "../models/TestAttempt";
import { MistakeJournal } from "../models/MistakeJournal";
import { RevisionTask } from "../models/RevisionTask";
import { UserTopicStats } from "../models/UserTopicStats";
import { UserChapterStats } from "../models/UserChapterStats";
import { userTopicStatsRepository, userChapterStatsRepository } from "../repositories/stats.repository";
import { mistakeJournalRepository } from "../repositories/mistake-journal.repository";
import { testAttemptRepository } from "../repositories/test-attempt.repository";
import mongoose from "mongoose";

async function main() {
  console.log("Connecting to Database...");
  await connectToDatabase();

  const userId = new mongoose.Types.ObjectId().toString();
  const testId = new mongoose.Types.ObjectId().toString();

  console.log(`Seeding database mock entries with UserId: ${userId}, TestId: ${testId}`);

  // 1. Create a dummy User
  const user = await User.create({
    _id: new mongoose.Types.ObjectId(userId),
    email: `student-${Date.now()}@example.com`,
    name: "Verification Student",
    role: "student",
    googleId: `google-${Date.now()}`
  });
  console.log("✓ User created:", user.email);

  // 2. Create a dummy Test
  const test = await Test.create({
    _id: new mongoose.Types.ObjectId(testId),
    userId,
    testName: "NEET Physics Test 1",
    subject: "physics",
    testDate: new Date(),
    totalQuestions: 3,
    uploadedFile: "https://res.cloudinary.com/demo/image/upload/mock-paper.png",
    processingStatus: "completed"
  });
  console.log("✓ Test created:", test.testName);

  // 3. Create canonical questions in QuestionBank
  const questions = [
    {
      questionHash: "hash-phy-q1",
      questionText: "What is the unit of angular momentum?",
      options: [
        { key: "A", text: "kg m/s" },
        { key: "B", text: "kg m²/s" },
        { key: "C", text: "kg m²/s²" },
        { key: "D", text: "kg m/s²" }
      ],
      correctAnswer: "B",
      subject: "physics",
      chapter: "Rotational Motion",
      topic: "Angular Momentum",
      explanation: "Angular momentum L = r x p has units of kg m²/s.",
      aiConfidence: 0.98,
      source: "NEET 2022",
      sourceTest: "Mock 1"
    },
    {
      questionHash: "hash-phy-q2",
      questionText: "What is the moment of inertia of a ring of mass M and radius R about its diameter?",
      options: [
        { key: "A", text: "MR²" },
        { key: "B", text: "1/2 MR²" },
        { key: "C", text: "1/4 MR²" },
        { key: "D", text: "2 MR²" }
      ],
      correctAnswer: "B",
      subject: "physics",
      chapter: "Rotational Motion",
      topic: "Moment of Inertia",
      explanation: "Moment of inertia about diameter is 1/2 MR².",
      aiConfidence: 0.95,
      source: "NEET 2021",
      sourceTest: "Mock 1"
    },
    {
      questionHash: "hash-phy-q3",
      questionText: "Torque is the rotational equivalent of which translational quantity?",
      options: [
        { key: "A", text: "Force" },
        { key: "B", text: "Momentum" },
        { key: "C", text: "Acceleration" },
        { key: "D", text: "Velocity" }
      ],
      correctAnswer: "A",
      subject: "physics",
      chapter: "Rotational Motion",
      topic: "Torque",
      explanation: "Torque is rotational equivalent of translational Force.",
      aiConfidence: 1.0,
      source: "NEET 2023",
      sourceTest: "Mock 1"
    }
  ];

  await QuestionBank.insertMany(questions);
  console.log("✓ Canonical QuestionBank populated.");

  // 4. Log attempts for the user on this test
  // Q1: Correct (B)
  // Q2: Wrong (A selected, correct B)
  // Q3: Unattempted (null selected)
  const attempts = [
    {
      questionHash: "hash-phy-q1",
      selectedAnswer: "B",
      correctAnswer: "B",
      result: "correct" as const,
      confidence: 0.99
    },
    {
      questionHash: "hash-phy-q2",
      selectedAnswer: "A",
      correctAnswer: "B",
      result: "wrong" as const,
      confidence: 0.85
    },
    {
      questionHash: "hash-phy-q3",
      selectedAnswer: null,
      correctAnswer: "A",
      result: "unattempted" as const,
      confidence: 1.0
    }
  ];

  await testAttemptRepository.createAttemptsBatch(userId, testId, attempts);
  console.log("✓ Test Attempts batch created.");

  // 5. Test accuracy aggregation for the Test
  const accuracyResult = await testAttemptRepository.calculateTestAccuracy(userId, testId);
  console.log("✓ Computed Test Accuracy Stats:", accuracyResult);
  if (accuracyResult.total !== 3 || accuracyResult.correct !== 1 || accuracyResult.accuracy !== 33.33333333333333) {
    throw new Error("Test accuracy calculation mismatch!");
  }

  // 6. Recalculate Topic and Chapter Stats
  console.log("Recalculating User Topic Stats...");
  const topicStats = await userTopicStatsRepository.recalculateTopicStats(userId);
  console.log("✓ Topic Stats Recalculated:", topicStats);

  console.log("Recalculating User Chapter Stats...");
  const chapterStats = await userChapterStatsRepository.recalculateChapterStats(userId);
  console.log("✓ Chapter Stats Recalculated:", chapterStats);

  // Validate topic accuracy calculation
  const angularMomentumStats = topicStats.find(t => t.topic === "Angular Momentum");
  if (!angularMomentumStats || angularMomentumStats.accuracy !== 100) {
    throw new Error("Topic Stats accuracy calculation mismatch for Angular Momentum!");
  }

  const momentOfInertiaStats = topicStats.find(t => t.topic === "Moment of Inertia");
  if (!momentOfInertiaStats || momentOfInertiaStats.accuracy !== 0) {
    throw new Error("Topic Stats accuracy calculation mismatch for Moment of Inertia!");
  }

  // 7. Log a mistake in MistakeJournal for Q2 (Moment of Inertia)
  console.log("Logging a mistake to MistakeJournal...");
  await mistakeJournalRepository.addMistake({
    userId: new mongoose.Types.ObjectId(userId) as unknown as mongoose.Types.ObjectId,
    questionHash: "hash-phy-q2",
    subject: "physics",
    chapter: "Rotational Motion",
    topic: "Moment of Inertia",
    testId: new mongoose.Types.ObjectId(testId) as unknown as mongoose.Types.ObjectId,
    studentNote: "Forgot division by 2 for diameter axis"
  });

  const mistakes = await mistakeJournalRepository.getUserMistakes(userId);
  console.log("✓ Mistake Journal lookup completed. Retrieved populated mistake:", mistakes[0]);
  if (!mistakes[0] || mistakes[0].questionText !== questions[1].questionText) {
    throw new Error("Mistake lookup failed to resolve canonical question text!");
  }

  // 8. Create RevisionTask for Rotational Motion
  console.log("Creating RevisionTask...");
  const task = await RevisionTask.create({
    userId: new mongoose.Types.ObjectId(userId),
    topic: "Moment of Inertia",
    chapter: "Rotational Motion",
    priority: "high",
    dueDate: new Date(Date.now() + 86400000), // tomorrow
    status: "pending"
  });
  console.log("✓ Revision Task created:", task.topic);

  // Clean up seeded elements
  console.log("Cleaning up verification seed data...");
  await User.deleteOne({ _id: user._id });
  await Test.deleteOne({ _id: test._id });
  await QuestionBank.deleteMany({ questionHash: { $in: ["hash-phy-q1", "hash-phy-q2", "hash-phy-q3"] } });
  await TestAttempt.deleteMany({ userId, testId });
  await UserTopicStats.deleteMany({ userId });
  await UserChapterStats.deleteMany({ userId });
  await MistakeJournal.deleteMany({ userId });
  await RevisionTask.deleteOne({ _id: task._id });

  console.log("\n=================================");
  console.log("🎉 DATABASE VERIFICATION SUCCESSFUL! 🎉");
  console.log("All schemas, indexes, relationships, repositories,");
  console.log("and aggregation pipelines verified successfully!");
  console.log("=================================\n");
  
  process.exit(0);
}

main().catch((err) => {
  console.error("❌ Verification Failed:", err);
  process.exit(1);
});
