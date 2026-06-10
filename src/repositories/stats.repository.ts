/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";
import { BaseRepository } from "./base.repository";
import { UserTopicStats, UserTopicStatsDocument } from "@/models/UserTopicStats";
import { UserChapterStats, UserChapterStatsDocument } from "@/models/UserChapterStats";
import { TestAttempt } from "@/models/TestAttempt";

export class UserTopicStatsRepository extends BaseRepository<UserTopicStatsDocument> {
  constructor() {
    super(UserTopicStats);
  }

  async getStatsByUser(userId: string): Promise<any[]> {
    return this.find({ userId }, null, { sort: { subject: 1, chapter: 1, topic: 1 } });
  }

  async recalculateTopicStats(userId: string): Promise<any[]> {
    const userObjectId = new Types.ObjectId(userId);

    const pipeline = [
      {
        $match: {
          userId: userObjectId,
          isDeleted: false
        }
      },
      {
        $lookup: {
          from: "questionbanks",
          localField: "questionHash",
          foreignField: "questionHash",
          as: "questionDetails"
        }
      },
      {
        $unwind: "$questionDetails"
      },
      {
        $group: {
          _id: {
            userId: "$userId",
            subject: "$questionDetails.subject",
            chapter: "$questionDetails.chapter",
            topic: "$questionDetails.topic"
          },
          totalQuestions: { $sum: 1 },
          correctQuestions: {
            $sum: { $cond: [{ $eq: ["$result", "correct"] }, 1, 0] }
          },
          wrongQuestions: {
            $sum: { $cond: [{ $eq: ["$result", "wrong"] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          userId: "$_id.userId",
          subject: "$_id.subject",
          chapter: "$_id.chapter",
          topic: "$_id.topic",
          totalQuestions: 1,
          correctQuestions: 1,
          wrongQuestions: 1,
          accuracy: {
            $round: [
              {
                $multiply: [
                  { $divide: ["$correctQuestions", "$totalQuestions"] },
                  100
                ]
              },
              2
            ]
          }
        }
      }
    ];

    const aggregated = await TestAttempt.aggregate(pipeline);

    // Bulk upsert into UserTopicStats
    if (aggregated.length > 0) {
      const bulkOps = aggregated.map((item) => ({
        updateOne: {
          filter: {
            userId: item.userId,
            subject: item.subject,
            chapter: item.chapter,
            topic: item.topic,
            isDeleted: false
          },
          update: {
            $set: {
              totalQuestions: item.totalQuestions,
              correctQuestions: item.correctQuestions,
              wrongQuestions: item.wrongQuestions,
              accuracy: item.accuracy,
              lastUpdated: new Date()
            }
          },
          upsert: true
        }
      }));

      await this.model.bulkWrite(bulkOps as any);
    }

    return this.getStatsByUser(userId);
  }
}

export class UserChapterStatsRepository extends BaseRepository<UserChapterStatsDocument> {
  constructor() {
    super(UserChapterStats);
  }

  async getStatsByUser(userId: string): Promise<any[]> {
    return this.find({ userId }, null, { sort: { subject: 1, chapter: 1 } });
  }

  async recalculateChapterStats(userId: string): Promise<any[]> {
    const userObjectId = new Types.ObjectId(userId);

    const pipeline = [
      {
        $match: {
          userId: userObjectId,
          isDeleted: false
        }
      },
      {
        $lookup: {
          from: "questionbanks",
          localField: "questionHash",
          foreignField: "questionHash",
          as: "questionDetails"
        }
      },
      {
        $unwind: "$questionDetails"
      },
      {
        $group: {
          _id: {
            userId: "$userId",
            subject: "$questionDetails.subject",
            chapter: "$questionDetails.chapter"
          },
          totalQuestions: { $sum: 1 },
          correctQuestions: {
            $sum: { $cond: [{ $eq: ["$result", "correct"] }, 1, 0] }
          },
          wrongQuestions: {
            $sum: { $cond: [{ $eq: ["$result", "wrong"] }, 1, 0] }
          }
        }
      },
      {
        $project: {
          _id: 0,
          userId: "$_id.userId",
          subject: "$_id.subject",
          chapter: "$_id.chapter",
          totalQuestions: 1,
          correctQuestions: 1,
          wrongQuestions: 1,
          accuracy: {
            $round: [
              {
                $multiply: [
                  { $divide: ["$correctQuestions", "$totalQuestions"] },
                  100
                ]
              },
              2
            ]
          }
        }
      }
    ];

    const aggregated = await TestAttempt.aggregate(pipeline);

    // Bulk upsert into UserChapterStats
    if (aggregated.length > 0) {
      const bulkOps = aggregated.map((item) => ({
        updateOne: {
          filter: {
            userId: item.userId,
            subject: item.subject,
            chapter: item.chapter,
            isDeleted: false
          },
          update: {
            $set: {
              totalQuestions: item.totalQuestions,
              correctQuestions: item.correctQuestions,
              wrongQuestions: item.wrongQuestions,
              accuracy: item.accuracy,
              lastUpdated: new Date()
            }
          },
          upsert: true
        }
      }));

      await this.model.bulkWrite(bulkOps as any);
    }

    return this.getStatsByUser(userId);
  }
}

export const userTopicStatsRepository = new UserTopicStatsRepository();
export const userChapterStatsRepository = new UserChapterStatsRepository();
