/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseRepository } from "./base.repository";
import { Test, TestDocument } from "@/models/Test";

export class TestRepository extends BaseRepository<TestDocument> {
  constructor() {
    super(Test);
  }

  async findUserTests(userId: string): Promise<any[]> {
    return this.find(
      { userId },
      "testName subject testDate totalQuestions uploadedFile processingStatus createdAt updatedAt",
      { sort: { createdAt: -1 } }
    );
  }

  async findUserTestById(userId: string, testId: string): Promise<any | null> {
    return this.findOne({ _id: testId, userId });
  }

  async softDeleteUserTest(userId: string, testId: string): Promise<any | null> {
    return this.model
      .findOneAndUpdate(
        { _id: testId, userId, isDeleted: false } as any,
        { isDeleted: true, deletedAt: new Date(), deletedBy: userId },
        { new: true, lean: true }
      )
      .exec();
  }
}

export const testRepository = new TestRepository();
