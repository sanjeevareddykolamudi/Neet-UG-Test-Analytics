import { z } from "zod";

// Base asset schema
export const uploadedAssetSchema = z.object({
  publicId: z.string().min(1),
  secureUrl: z.string().url(),
  resourceType: z.enum(["image", "raw"]),
  format: z.string().optional(),
  bytes: z.number().int().positive(),
  pageCount: z.number().int().positive().optional()
});

// Create Test / Paper Schema Input
export const createQuestionPaperSchema = z.object({
  title: z.string().min(3).max(140),
  examDate: z.string().datetime().optional(),
  sourceType: z.enum(["image", "pdf"]),
  assets: z.array(uploadedAssetSchema).min(1).max(30)
});

export const uploadSignatureSchema = z.object({
  resourceType: z.enum(["image", "raw"]).default("image")
});

export type CreateQuestionPaperInput = z.infer<typeof createQuestionPaperSchema>;

// User Validation
export const userSchemaVal = z.object({
  googleId: z.string().optional(),
  name: z.string().min(1).max(120),
  email: z.string().email().toLowerCase(),
  image: z.string().url().optional().or(z.literal("")),
  role: z.enum(["student", "admin"]).default("student")
});

// QuestionBank Option Validation
export const optionVal = z.object({
  key: z.enum(["A", "B", "C", "D"]),
  text: z.string().trim()
});

// QuestionBank Validation
export const questionBankSchemaVal = z.object({
  questionHash: z.string().min(1),
  questionText: z.string().min(1),
  options: z.array(optionVal),
  correctAnswer: z.enum(["A", "B", "C", "D"]),
  subject: z.enum(["physics", "chemistry", "botany", "zoology"]),
  chapter: z.string().trim().default(""),
  topic: z.string().trim().default(""),
  explanation: z.string().trim().optional(),
  aiConfidence: z.number().min(0).max(1).default(1.0),
  source: z.string().trim().default(""),
  sourceTest: z.string().trim().default("")
});

// Test Validation
export const testSchemaVal = z.object({
  userId: z.string().min(1),
  testName: z.string().min(3).max(140),
  subject: z.enum(["physics", "chemistry", "botany", "zoology", "biology", "combined"]),
  testDate: z.union([z.date(), z.string().datetime()]).default(() => new Date()),
  totalQuestions: z.number().int().nonnegative().default(0),
  uploadedFile: z.string().trim().default(""),
  processingStatus: z.enum(["pending", "processing", "completed", "failed"]).default("pending")
});

// TestAttempt Validation
export const testAttemptSchemaVal = z.object({
  userId: z.string().min(1),
  testId: z.string().min(1),
  questionHash: z.string().min(1),
  selectedAnswer: z.enum(["A", "B", "C", "D"]).nullable(),
  correctAnswer: z.enum(["A", "B", "C", "D"]),
  result: z.enum(["correct", "wrong", "unattempted"]),
  confidence: z.number().min(0).max(1).default(1.0)
});

// MistakeJournal Validation
export const mistakeJournalSchemaVal = z.object({
  userId: z.string().min(1),
  questionHash: z.string().min(1),
  subject: z.enum(["physics", "chemistry", "botany", "zoology"]),
  chapter: z.string().trim().default(""),
  topic: z.string().trim().default(""),
  testId: z.string().min(1),
  studentNote: z.string().max(1000).optional()
});

// UserTopicStats Validation
export const userTopicStatsSchemaVal = z.object({
  userId: z.string().min(1),
  subject: z.enum(["physics", "chemistry", "botany", "zoology"]),
  chapter: z.string().trim(),
  topic: z.string().trim(),
  totalQuestions: z.number().int().nonnegative().default(0),
  correctQuestions: z.number().int().nonnegative().default(0),
  wrongQuestions: z.number().int().nonnegative().default(0),
  accuracy: z.number().min(0).max(100).default(0),
  lastUpdated: z.union([z.date(), z.string().datetime()]).default(() => new Date())
});

// UserChapterStats Validation
export const userChapterStatsSchemaVal = z.object({
  userId: z.string().min(1),
  subject: z.enum(["physics", "chemistry", "botany", "zoology"]),
  chapter: z.string().trim(),
  totalQuestions: z.number().int().nonnegative().default(0),
  correctQuestions: z.number().int().nonnegative().default(0),
  wrongQuestions: z.number().int().nonnegative().default(0),
  accuracy: z.number().min(0).max(100).default(0),
  lastUpdated: z.union([z.date(), z.string().datetime()]).default(() => new Date())
});

// RevisionTask Validation
export const revisionTaskSchemaVal = z.object({
  userId: z.string().min(1),
  topic: z.string().min(1),
  chapter: z.string().min(1),
  priority: z.enum(["low", "medium", "high"]).default("medium"),
  dueDate: z.union([z.date(), z.string().datetime()]),
  status: z.enum(["pending", "in_progress", "done", "skipped"]).default("pending")
});
