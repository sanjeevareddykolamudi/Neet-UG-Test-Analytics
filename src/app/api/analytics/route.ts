import { NextResponse } from "next/server";
import { Types } from "mongoose";

import { requireUser } from "@/lib/api";
import { connectToDatabase } from "@/lib/mongodb";
import { Test } from "@/models/Test";
import { TestAttempt } from "@/models/TestAttempt";
import { UserTopicStats } from "@/models/UserTopicStats";
import { RevisionTask } from "@/models/RevisionTask";

export async function GET() {
  const { user, response } = await requireUser();

  if (response) {
    return response;
  }

  await connectToDatabase();

  try {
    const userId = user.id;

    // 1. Get tests uploaded count
    const testsUploaded = await Test.countDocuments({ userId, isDeleted: false });

    // 2. Get questions attempted count
    const questionsExtracted = await TestAttempt.countDocuments({ userId, isDeleted: false });

    // 3. Get weak topics count (accuracy < 60%)
    const weakTopics = await UserTopicStats.countDocuments({
      userId,
      accuracy: { $lt: 60 },
      isDeleted: false
    });

    // 4. Get active revision tasks count
    const revisionTasks = await RevisionTask.countDocuments({
      userId,
      status: "pending",
      isDeleted: false
    });

    // 5. Aggregate subject accuracy
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
      },
      {
        $project: {
          _id: 0,
          subject: "$_id",
          totalQuestions: "$total",
          correctAnswers: "$correct",
          accuracy: {
            $cond: [
              { $gt: ["$total", 0] },
              { $round: [{ $multiply: [{ $divide: ["$correct", "$total"] }, 100] }, 2] },
              0
            ]
          }
        }
      }
    ]);

    // Map subjects to a formatted payload
    const subjectMap = {
      physics: { subject: "Physics", accuracy: 0, totalQuestions: 0, correctAnswers: 0 },
      chemistry: { subject: "Chemistry", accuracy: 0, totalQuestions: 0, correctAnswers: 0 },
      botany: { subject: "Botany", accuracy: 0, totalQuestions: 0, correctAnswers: 0 },
      zoology: { subject: "Zoology", accuracy: 0, totalQuestions: 0, correctAnswers: 0 }
    };

    for (const stat of subjectStats) {
      const sub = stat.subject as keyof typeof subjectMap;
      if (subjectMap[sub]) {
        subjectMap[sub].accuracy = stat.accuracy;
        subjectMap[sub].totalQuestions = stat.totalQuestions;
        subjectMap[sub].correctAnswers = stat.correctAnswers;
      }
    }

    return NextResponse.json({
      summary: {
        testsUploaded,
        questionsExtracted,
        weakTopics,
        revisionTasks
      },
      subjectAccuracy: Object.values(subjectMap)
    });
  } catch (error) {
    console.error("Failed to run database analytics aggregation:", error);
    return NextResponse.json(
      { error: "Failed to load analytics statistics." },
      { status: 500 }
    );
  }
}
