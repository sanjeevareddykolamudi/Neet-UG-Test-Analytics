/* eslint-disable @typescript-eslint/no-explicit-any */
import { testRepository } from "@/repositories/test.repository";
import { logger } from "@/lib/logger";

export class TestService {
  async getTestsForUser(userId: string): Promise<any[]> {
    return testRepository.findUserTests(userId);
  }

  async getTestById(userId: string, testId: string): Promise<any | null> {
    return testRepository.findUserTestById(userId, testId);
  }

  async createTest(
    userId: string,
    data: {
      title: string;
      description?: string;
      examDate?: Date;
      testType?: "full_syllabus" | "part_test" | "chapter_test" | "custom";
      totalQuestions?: number;
      maxMarks?: number;
    },
    contextInfo?: { ip?: string; userAgent?: string }
  ): Promise<any> {
    try {
      const test = await testRepository.create({
        ...data,
        userId,
        createdBy: userId,
        status: "draft"
      });

      await logger.audit({
        userId,
        action: "create_test",
        status: "success",
        ipAddress: contextInfo?.ip,
        userAgent: contextInfo?.userAgent,
        metadata: { testId: test._id.toString(), title: data.title }
      });

      return test;
    } catch (error) {
      await logger.audit({
        userId,
        action: "create_test",
        status: "failure",
        ipAddress: contextInfo?.ip,
        userAgent: contextInfo?.userAgent,
        metadata: { title: data.title, error: String(error) }
      });
      throw error;
    }
  }

  async deleteTest(
    userId: string,
    testId: string,
    contextInfo?: { ip?: string; userAgent?: string }
  ): Promise<boolean> {
    try {
      const deleted = await testRepository.softDeleteUserTest(userId, testId);
      if (!deleted) {
        throw new Error("Test not found or access denied");
      }

      await logger.audit({
        userId,
        action: "delete_test",
        status: "success",
        ipAddress: contextInfo?.ip,
        userAgent: contextInfo?.userAgent,
        metadata: { testId }
      });

      return true;
    } catch (error) {
      await logger.audit({
        userId,
        action: "delete_test",
        status: "failure",
        ipAddress: contextInfo?.ip,
        userAgent: contextInfo?.userAgent,
        metadata: { testId, error: String(error) }
      });
      return false;
    }
  }
}

export const testService = new TestService();
