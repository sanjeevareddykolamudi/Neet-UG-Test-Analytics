import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import {
  auditFields,
  boundingBoxSchema,
  optionValues,
  ownedSchemaOptions,
  subjectValues
} from "@/models/shared";

const optionSchema = new Schema(
  {
    key: { type: String, enum: optionValues, required: true },
    text: { type: String, default: "", trim: true },
    confidence: { type: Number, min: 0, max: 1 }
  },
  { _id: false }
);

const questionSchema = new Schema(
  {
    ...auditFields,
    testId: { type: Schema.Types.ObjectId, ref: "Test", required: true, index: true },
    questionPaperId: {
      type: Schema.Types.ObjectId,
      ref: "QuestionPaper",
      required: true,
      index: true
    },
    questionNumber: { type: Number, required: true, min: 1 },
    subject: { type: String, enum: subjectValues, required: true, index: true },
    topic: { type: String, trim: true, index: true },
    chapter: { type: String, trim: true },
    text: { type: String, default: "", trim: true },
    options: { type: [optionSchema], default: [] },
    selectedAnswer: { type: String, enum: [...optionValues, null], default: null },
    selectedAnswerConfidence: { type: Number, min: 0, max: 1 },
    ocrConfidence: { type: Number, min: 0, max: 1 },
    boundingBox: boundingBoxSchema,
    needsHumanReview: { type: Boolean, default: true, index: true }
  },
  ownedSchemaOptions
);

questionSchema.index(
  { userId: 1, testId: 1, questionNumber: 1, isDeleted: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
questionSchema.index({ userId: 1, questionPaperId: 1, isDeleted: 1 });
questionSchema.index({ userId: 1, subject: 1, topic: 1, isDeleted: 1 });
questionSchema.index({ text: "text", topic: "text", chapter: "text" });

export type QuestionDocument = InferSchemaType<typeof questionSchema>;

export const Question =
  (models.Question as Model<QuestionDocument>) ||
  model<QuestionDocument>("Question", questionSchema);
