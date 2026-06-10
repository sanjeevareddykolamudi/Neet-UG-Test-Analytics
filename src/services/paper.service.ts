/* eslint-disable @typescript-eslint/no-explicit-any */
import { paperRepository } from "@/repositories/paper.repository";
import { testRepository } from "@/repositories/test.repository";
import { logger } from "@/lib/logger";

export class PaperService {
  async getPapersForUser(userId: string): Promise<any[]> {
    return paperRepository.findUserPapers(userId);
  }

  async getPaperByTestId(userId: string, testId: string): Promise<any | null> {
    return paperRepository.findUserPaperByTestId(userId, testId);
  }

  async createPaper(
    userId: string,
    data: {
      testId: string;
      title: string;
      sourceType: "image" | "pdf";
      assets: Array<{
        publicId: string;
        secureUrl: string;
        resourceType: "image" | "raw";
        format?: string;
        bytes: number;
        pageCount?: number;
        width?: number;
        height?: number;
      }>;
    },
    contextInfo?: { ip?: string; userAgent?: string }
  ): Promise<any> {
    try {
      const test = await testRepository.findUserTestById(userId, data.testId);
      if (!test) {
        throw new Error("Target mock test not found or access denied");
      }

      const paper = await paperRepository.create({
        ...data,
        userId,
        createdBy: userId,
        status: "uploaded"
      });

      await testRepository.update(data.testId, { status: "uploaded" });

      await logger.audit({
        userId,
        action: "upload_paper",
        status: "success",
        ipAddress: contextInfo?.ip,
        userAgent: contextInfo?.userAgent,
        metadata: { paperId: paper._id.toString(), testId: data.testId, assetsCount: data.assets.length }
      });

      return paper;
    } catch (error) {
      await logger.audit({
        userId,
        action: "upload_paper",
        status: "failure",
        ipAddress: contextInfo?.ip,
        userAgent: contextInfo?.userAgent,
        metadata: { testId: data.testId, error: String(error) }
      });
      throw error;
    }
  }

  async deletePaper(
    userId: string,
    paperId: string,
    contextInfo?: { ip?: string; userAgent?: string }
  ): Promise<boolean> {
    try {
      const paper = await paperRepository.findUserPaperById(userId, paperId);
      if (!paper) {
        throw new Error("Question paper not found or access denied");
      }

      await paperRepository.softDeleteUserPaper(userId, paperId);
      await testRepository.update(paper.testId.toString(), { status: "draft" });

      await logger.audit({
        userId,
        action: "delete_paper",
        status: "success",
        ipAddress: contextInfo?.ip,
        userAgent: contextInfo?.userAgent,
        metadata: { paperId, testId: paper.testId.toString() }
      });

      return true;
    } catch (error) {
      await logger.audit({
        userId,
        action: "delete_paper",
        status: "failure",
        ipAddress: contextInfo?.ip,
        userAgent: contextInfo?.userAgent,
        metadata: { paperId, error: String(error) }
      });
      return false;
    }
  }
}

export const paperService = new PaperService();
