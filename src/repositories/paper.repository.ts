/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseRepository } from "./base.repository";
import { QuestionPaper, QuestionPaperDocument } from "@/models/QuestionPaper";

export class PaperRepository extends BaseRepository<QuestionPaperDocument> {
  constructor() {
    super(QuestionPaper);
  }

  async findUserPapers(userId: string): Promise<any[]> {
    return this.find(
      { userId },
      "testId title sourceType status assets.secureUrl assets.pageCount assets.bytes processing createdAt",
      { sort: { createdAt: -1 } }
    );
  }

  async findUserPaperById(userId: string, paperId: string): Promise<any | null> {
    return this.findOne({ _id: paperId, userId });
  }

  async findUserPaperByTestId(userId: string, testId: string): Promise<any | null> {
    return this.findOne({ testId, userId });
  }

  async softDeleteUserPaper(userId: string, paperId: string): Promise<any | null> {
    return this.model
      .findOneAndUpdate(
        { _id: paperId, userId, isDeleted: false } as any,
        { isDeleted: true, deletedAt: new Date(), deletedBy: userId },
        { new: true, lean: true }
      )
      .exec();
  }
}

export const paperRepository = new PaperRepository();
