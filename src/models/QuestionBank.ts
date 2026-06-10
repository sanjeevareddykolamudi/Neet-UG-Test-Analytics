import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { optionValues, subjectValues } from "@/models/shared";

const optionSchema = new Schema(
  {
    key: { type: String, enum: optionValues, required: true },
    text: { type: String, default: "", trim: true }
  },
  { _id: false }
);

const questionBankSchema = new Schema(
  {
    questionHash: { type: String, required: true, unique: true, index: true, trim: true },
    questionText: { type: String, required: true, trim: true },
    options: { type: [optionSchema], default: [] },
    correctAnswer: { type: String, enum: optionValues, required: true },
    subject: { type: String, enum: subjectValues, required: true, index: true },
    chapter: { type: String, default: "", trim: true, index: true },
    topic: { type: String, default: "", trim: true, index: true },
    explanation: { type: String, default: "", trim: true },
    aiConfidence: { type: Number, default: 1.0, min: 0, max: 1 },
    source: { type: String, default: "", trim: true },
    sourceTest: { type: String, default: "", trim: true },
    isDeleted: { type: Boolean, default: false, index: true }
  },
  { timestamps: true, versionKey: false }
);

// Compound index for efficient queries on category levels
questionBankSchema.index({ subject: 1, chapter: 1, topic: 1 });
// Text search capabilities for questions search
questionBankSchema.index({ questionText: "text", topic: "text", chapter: "text" });

export type QuestionBankDocument = InferSchemaType<typeof questionBankSchema>;

export const QuestionBank =
  (models.QuestionBank as Model<QuestionBankDocument>) ||
  model<QuestionBankDocument>("QuestionBank", questionBankSchema);
