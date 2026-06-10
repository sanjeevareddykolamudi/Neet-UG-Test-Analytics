/* eslint-disable @typescript-eslint/no-explicit-any */
import { BaseRepository } from "./base.repository";
import { TestAttempt, TestAttemptDocument } from "@/models/TestAttempt";

export class TestAttemptRepository extends BaseRepository<TestAttemptDocument> {
  constructor() {
    super(TestAttempt);
  }

  async findUserAttemptsForTest(userId: string, testId: string): Promise<any[]> {
    return this.find({ userId, testId }, null, { sort: { createdAt: 1 } });
  }

  async createAttemptsBatch(
    userId: string,
    testId: string,
    attempts: Array<{
      questionHash: string;
      selectedAnswer: string | null;
      correctAnswer: string;
      result: "correct" | "wrong" | "unattempted";
      confidence: number;
    }>
  ): Promise<any[]> {
    const documents = attempts.map((a) => ({
      ...a,
      userId,
      testId,
      isDeleted: false
    }));

    // Perform bulk delete of any existing attempts for this test first to allow re-evaluation / re-processing
    await this.model.deleteMany({ userId, testId });

    return this.model.insertMany(documents);
  }

  async calculateTestAccuracy(userId: string, testId: string): Promise<{
    total: number;
    correct: number;
    wrong: number;
    unattempted: number;
    accuracy: number;
  }> {
    const attempts = await this.findUserAttemptsForTest(userId, testId);
    if (attempts.length === 0) {
      return { total: 0, correct: 0, wrong: 0, unattempted: 0, accuracy: 0 };
    }

    let correct = 0;
    let wrong = 0;
    let unattempted = 0;

    for (const attempt of attempts) {
      if (attempt.result === "correct") correct++;
      else if (attempt.result === "wrong") wrong++;
      else unattempted++;
    }

    const total = attempts.length;
    const accuracy = total > 0 ? (correct / total) * 100 : 0;

    return { total, correct, wrong, unattempted, accuracy };
  }
}

export const testAttemptRepository = new TestAttemptRepository();
