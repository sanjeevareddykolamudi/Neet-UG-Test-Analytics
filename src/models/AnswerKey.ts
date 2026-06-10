import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { auditFields, optionValues, ownedSchemaOptions, subjectValues } from "@/models/shared";

const answerSchema = new Schema(
  {
    questionNumber: { type: Number, required: true, min: 1 },
    questionId: { type: Schema.Types.ObjectId, ref: "Question" },
    correctAnswer: { type: String, enum: optionValues, required: true },
    subject: { type: String, enum: subjectValues, required: true },
    topic: { type: String, trim: true },
    explanation: { type: String, default: "", trim: true }
  },
  { _id: false }
);

const answerKeySchema = new Schema(
  {
    ...auditFields,
    testId: { type: Schema.Types.ObjectId, ref: "Test", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    answers: { type: [answerSchema], default: [] },
    status: { type: String, enum: ["draft", "locked"], default: "draft", index: true },
    lockedAt: { type: Date }
  },
  ownedSchemaOptions
);

answerKeySchema.index(
  { userId: 1, testId: 1, isDeleted: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
answerKeySchema.index({ userId: 1, status: 1, isDeleted: 1, updatedAt: -1 });

export type AnswerKeyDocument = InferSchemaType<typeof answerKeySchema>;

export const AnswerKey =
  (models.AnswerKey as Model<AnswerKeyDocument>) ||
  model<AnswerKeyDocument>("AnswerKey", answerKeySchema);
