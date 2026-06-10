import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { auditFields, ownedSchemaOptions, subjectValues } from "@/models/shared";

const subjectScoreSchema = new Schema(
  {
    subject: { type: String, enum: subjectValues, required: true },
    attempted: { type: Number, default: 0, min: 0 },
    correct: { type: Number, default: 0, min: 0 },
    incorrect: { type: Number, default: 0, min: 0 },
    unattempted: { type: Number, default: 0, min: 0 },
    score: { type: Number, default: 0 },
    accuracy: { type: Number, default: 0, min: 0, max: 100 }
  },
  { _id: false }
);

const testResultSchema = new Schema(
  {
    ...auditFields,
    testId: { type: Schema.Types.ObjectId, ref: "Test", required: true, index: true },
    answerKeyId: { type: Schema.Types.ObjectId, ref: "AnswerKey", required: true },
    totalQuestions: { type: Number, required: true, min: 0 },
    attemptedCount: { type: Number, default: 0, min: 0 },
    correctCount: { type: Number, default: 0, min: 0 },
    incorrectCount: { type: Number, default: 0, min: 0 },
    unattemptedCount: { type: Number, default: 0, min: 0 },
    score: { type: Number, default: 0 },
    maxMarks: { type: Number, default: 720, min: 0 },
    accuracy: { type: Number, default: 0, min: 0, max: 100 },
    subjectScores: { type: [subjectScoreSchema], default: [] },
    analyzedAt: { type: Date, index: true }
  },
  ownedSchemaOptions
);

testResultSchema.index(
  { userId: 1, testId: 1, isDeleted: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
testResultSchema.index({ userId: 1, analyzedAt: -1, isDeleted: 1 });
testResultSchema.index({ userId: 1, score: -1, isDeleted: 1 });

export type TestResultDocument = InferSchemaType<typeof testResultSchema>;

export const TestResult =
  (models.TestResult as Model<TestResultDocument>) ||
  model<TestResultDocument>("TestResult", testResultSchema);
