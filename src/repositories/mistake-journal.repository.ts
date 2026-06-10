/* eslint-disable @typescript-eslint/no-explicit-any */
import { Types } from "mongoose";
import { BaseRepository } from "./base.repository";
import { MistakeJournal, MistakeJournalDocument } from "@/models/MistakeJournal";

export class MistakeJournalRepository extends BaseRepository<MistakeJournalDocument> {
  constructor() {
    super(MistakeJournal);
  }

  async getUserMistakes(userId: string, filterParams: { subject?: string; chapter?: string } = {}): Promise<any[]> {
    const userObjectId = new Types.ObjectId(userId);
    
    const matchStage: any = {
      userId: userObjectId,
      isDeleted: false
    };

    if (filterParams.subject) {
      matchStage.subject = filterParams.subject;
    }
    if (filterParams.chapter) {
      matchStage.chapter = filterParams.chapter;
    }

    const pipeline: any[] = [
      {
        $match: matchStage
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
        $unwind: {
          path: "$questionDetails",
          preserveNullAndEmptyArrays: true
        }
      },
      {
        $project: {
          _id: 1,
          userId: 1,
          questionHash: 1,
          subject: 1,
          chapter: 1,
          topic: 1,
          testId: 1,
          studentNote: 1,
          createdAt: 1,
          updatedAt: 1,
          questionText: "$questionDetails.questionText",
          options: "$questionDetails.options",
          correctAnswer: "$questionDetails.correctAnswer",
          explanation: "$questionDetails.explanation",
          aiConfidence: "$questionDetails.aiConfidence",
          source: "$questionDetails.source",
          sourceTest: "$questionDetails.sourceTest"
        }
      },
      {
        $sort: { createdAt: -1 }
      }
    ];

    return this.model.aggregate(pipeline).exec();
  }

  async addMistake(mistake: Partial<MistakeJournalDocument>): Promise<any> {
    if (!mistake.userId || !mistake.questionHash || !mistake.testId) {
      throw new Error("userId, questionHash, and testId are required to add mistake");
    }

    return this.model.findOneAndUpdate(
      {
        userId: mistake.userId,
        questionHash: mistake.questionHash,
        isDeleted: false
      } as any,
      {
        $set: {
          ...mistake,
          isDeleted: false
        }
      },
      {
        new: true,
        upsert: true,
        lean: true
      }
    ).exec();
  }

  async addMistakesBatch(
    userId: string,
    testId: string,
    mistakes: Array<{
      questionHash: string;
      subject: string;
      chapter: string;
      topic: string;
      studentNote?: string;
    }>
  ): Promise<any[]> {
    const operations = mistakes.map((m) => ({
      updateOne: {
        filter: {
          userId: new Types.ObjectId(userId),
          questionHash: m.questionHash,
          isDeleted: false
        },
        update: {
          $set: {
            ...m,
            testId: new Types.ObjectId(testId),
            isDeleted: false
          }
        },
        upsert: true
      }
    }));

    if (operations.length === 0) return [];

    await this.model.bulkWrite(operations as any);
    return this.getUserMistakes(userId, { testId } as any);
  }
}

export const mistakeJournalRepository = new MistakeJournalRepository();
