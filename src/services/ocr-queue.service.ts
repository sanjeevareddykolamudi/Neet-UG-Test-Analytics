import { Types } from "mongoose";
import { Test } from "@/models/Test";
import { OcrPipelineService } from "@/services/ocr/pipeline";
import { OcrQuestion } from "@/services/ocr/types";
import { QuestionBankDocument } from "@/models/QuestionBank";
import { questionBankRepository } from "@/repositories/question-bank.repository";
import { testAttemptRepository } from "@/repositories/test-attempt.repository";
import { userTopicStatsRepository, userChapterStatsRepository } from "@/repositories/stats.repository";
import { mistakeJournalRepository } from "@/repositories/mistake-journal.repository";
import { detectMimeType } from "@/lib/upload-validation";

export class OcrQueueService {
  /**
   * Triggers OCR document processing asynchronously in the background.
   * Updates test statuses, parses question banks, attempts, and statistics cache.
   */
  static triggerOcrJob(
    testId: string,
    userId: string,
    fileUrls: string[],
    subject: string,
    testName: string
  ): void {
    // Fire-and-forget background IIFE execution
    (async () => {
      try {
        console.log(`Starting background OCR job for Test: ${testId} (User: ${userId})`);

        // 1. Set status to processing
        await Test.updateOne(
          { _id: testId },
          { $set: { processingStatus: "processing", statusMessage: "Initializing analysis..." } }
        );

        const buffers: { buffer: Buffer; mimeType: "application/pdf" | "image/jpeg" | "image/png" | "image/webp" }[] = [];

        // 2. Download files from Cloudinary
        let downloadIndex = 0;
        for (const url of fileUrls) {
          downloadIndex++;
          await Test.updateOne(
            { _id: testId },
            { $set: { statusMessage: `Downloading file ${downloadIndex} of ${fileUrls.length}...` } }
          );

          const response = await fetch(url);
          if (!response.ok) {
            throw new Error(`Failed to fetch file from Cloudinary URL: ${url}`);
          }
          const arrayBuffer = await response.arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);

          // Detect MIME type via magic bytes
          let mimeType = detectMimeType(buffer);
          if (!mimeType) {
            // Fallback to URL extension checking
            const lowerUrl = url.toLowerCase();
            if (lowerUrl.includes(".pdf")) {
              mimeType = "application/pdf";
            } else if (lowerUrl.includes(".png")) {
              mimeType = "image/png";
            } else if (lowerUrl.includes(".webp")) {
              mimeType = "image/webp";
            } else {
              mimeType = "image/jpeg";
            }
          }

          buffers.push({ buffer, mimeType });
        }

        // 3. Process buffers using the OCR Pipeline Service
        const ocrPipeline = new OcrPipelineService();
        const extractedQuestions: OcrQuestion[] = [];
        let ocrTestName: string | undefined;
        let ocrSubject: string | undefined;
        let ocrDate: string | undefined;

        let processIndex = 0;
        for (const item of buffers) {
          processIndex++;
          await Test.updateOne(
            { _id: testId },
            { $set: { statusMessage: `Running OCR on page/file ${processIndex} of ${buffers.length}...` } }
          );

          const result = await ocrPipeline.processDocument(item.buffer, item.mimeType);
          if (result.success) {
            if (result.questions) {
              extractedQuestions.push(...result.questions);
            }
            if (!ocrTestName && result.testName) ocrTestName = result.testName;
            if (!ocrSubject && result.subject) ocrSubject = result.subject;
            if (!ocrDate && result.date) ocrDate = result.date;
          } else {
            console.warn(`OCR Pipeline warning: single page scan failed. Details:`, result.error);
          }
        }

        if (extractedQuestions.length === 0) {
          throw new Error("No questions extracted from scanned files.");
        }

        const finalTestName = ocrTestName || testName;
        const finalSubject = ocrSubject || subject;

        // 4. Transform OCR output into canonical models
        await Test.updateOne(
          { _id: testId },
          { $set: { statusMessage: "Transforming questions into database format..." } }
        );

        const canonicalQuestions: Partial<QuestionBankDocument>[] = [];
        const attemptsBatch: Array<{
          questionHash: string;
          selectedAnswer: string | null;
          correctAnswer: string;
          result: "correct" | "wrong" | "unattempted";
          confidence: number;
        }> = [];

        for (let i = 0; i < extractedQuestions.length; i++) {
          const eq = extractedQuestions[i];
          const qHash = eq.hash || `hash-${testId}-q${i + 1}`;

          // Format options structure
          const formattedOptions = [
            { key: "A" as const, text: eq.options?.A || "Option A" },
            { key: "B" as const, text: eq.options?.B || "Option B" },
            { key: "C" as const, text: eq.options?.C || "Option C" },
            { key: "D" as const, text: eq.options?.D || "Option D" }
          ];

          let dbSubject: "physics" | "chemistry" | "botany" | "zoology" = "physics";
          let mappingSubject = finalSubject;
          if (ocrSubject && ocrSubject !== "combined") {
            mappingSubject = ocrSubject;
          }
          if (mappingSubject === "chemistry") {
            dbSubject = "chemistry";
          } else if (mappingSubject === "biology" || mappingSubject === "botany") {
            dbSubject = "botany";
          } else if (mappingSubject === "zoology") {
            dbSubject = "zoology";
          }

          const qBankDoc = {
            questionHash: qHash,
            questionText: eq.questionText || `Scanned Question #${i + 1}`,
            options: formattedOptions,
            correctAnswer: (eq.correctAnswer || "A") as "A" | "B" | "C" | "D",
            subject: dbSubject,
            chapter: eq.chapter || "General physics",
            topic: eq.topic || "General topic",
            explanation: eq.explanation || "No automated explanation available.",
            aiConfidence: eq.confidence?.overall || 0.95,
            source: finalTestName,
            sourceTest: finalTestName
          };

          canonicalQuestions.push(qBankDoc as unknown as Partial<QuestionBankDocument>);

          // Evaluate result accuracy based on OCR marks detected
          const selectedAnswer = (eq.detectedMark && eq.detectedMark !== "Unattempted" ? eq.detectedMark : null) || 
                                 (eq.selectedAnswer && eq.selectedAnswer !== "Unattempted" ? eq.selectedAnswer : null);
          const correctAnswer = qBankDoc.correctAnswer;
          let result: "correct" | "wrong" | "unattempted" = "unattempted";

          if (selectedAnswer) {
            result = selectedAnswer === correctAnswer ? "correct" : "wrong";
          }

          attemptsBatch.push({
            questionHash: qHash,
            selectedAnswer,
            correctAnswer,
            result,
            confidence: eq.confidence?.overall || 0.95
          });
        }

        // 5. Bulk write to Mongoose collections
        await Test.updateOne(
          { _id: testId },
          { $set: { statusMessage: "Saving question bank and attempt records..." } }
        );
        await questionBankRepository.bulkUpsert(canonicalQuestions);
        await testAttemptRepository.createAttemptsBatch(userId, testId, attemptsBatch);

        // 6. Recalculate stats cache asynchronously
        await Test.updateOne(
          { _id: testId },
          { $set: { statusMessage: "Recalculating learning metrics & mistake journal..." } }
        );
        await userTopicStatsRepository.recalculateTopicStats(userId);
        await userChapterStatsRepository.recalculateChapterStats(userId);

        // 7. Push incorrect answers directly to Mistake Journal
        for (const attempt of attemptsBatch) {
          if (attempt.result === "wrong") {
            const canonical = canonicalQuestions.find(cq => cq.questionHash === attempt.questionHash);
            await mistakeJournalRepository.addMistake({
              userId: new Types.ObjectId(userId) as unknown as Types.ObjectId,
              questionHash: attempt.questionHash,
              subject: canonical?.subject || "physics",
              chapter: canonical?.chapter || "General",
              topic: canonical?.topic || "General topic",
              testId: new Types.ObjectId(testId) as unknown as Types.ObjectId,
              studentNote: `OCR Automated: Marked ${attempt.selectedAnswer} (Correct: ${attempt.correctAnswer})`
            });
          }
        }

        // 8. Update Test record as completed
        const updateFields: Record<string, string | number | Date> = {
          processingStatus: "completed",
          statusMessage: "Analysis completed successfully.",
          totalQuestions: extractedQuestions.length
        };

        if (ocrTestName) {
          updateFields.testName = ocrTestName;
        }
        if (ocrSubject) {
          const validSubjects = ["physics", "chemistry", "botany", "zoology", "biology", "combined"];
          if (validSubjects.includes(ocrSubject)) {
            updateFields.subject = ocrSubject;
          }
        }
        if (ocrDate) {
          const parsedDate = new Date(ocrDate);
          if (!isNaN(parsedDate.getTime())) {
            updateFields.testDate = parsedDate;
          }
        }

        await Test.updateOne(
          { _id: testId },
          {
            $set: updateFields
          }
        );

        console.log(`✓ Background OCR processing successfully completed for Test: ${testId}`);
      } catch (error) {
        console.error(`❌ Background OCR job failed for Test: ${testId}. Error:`, error);
        const errMsg = error instanceof Error ? error.message : String(error);
        
        // Mark test status as failed in database
        await Test.updateOne(
          { _id: testId },
          { 
            $set: { 
              processingStatus: "failed",
              statusMessage: `Failed: ${errMsg}`
            } 
          }
        ).catch(dbErr => console.error("Failed to set test status to failed:", dbErr));
      }
    })();
  }
}
