import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { auditFields, ownedSchemaOptions, uploadedAssetSchema } from "@/models/shared";

const questionPaperSchema = new Schema(
  {
    ...auditFields,
    testId: { type: Schema.Types.ObjectId, ref: "Test", required: true, index: true },
    title: { type: String, required: true, trim: true, maxlength: 140 },
    sourceType: { type: String, enum: ["image", "pdf"], required: true, index: true },
    assets: { type: [uploadedAssetSchema], required: true, default: [] },
    status: {
      type: String,
      enum: ["uploaded", "queued", "ocr_pending", "review_required", "ready", "failed"],
      default: "uploaded",
      index: true
    },
    processing: {
      ocrProvider: { type: String, trim: true },
      detectorVersion: { type: String, trim: true },
      startedAt: { type: Date },
      completedAt: { type: Date },
      errorMessage: { type: String, trim: true }
    }
  },
  ownedSchemaOptions
);

questionPaperSchema.index({ userId: 1, testId: 1, isDeleted: 1 });
questionPaperSchema.index({ userId: 1, status: 1, isDeleted: 1, createdAt: -1 });

export type QuestionPaperDocument = InferSchemaType<typeof questionPaperSchema>;

export const QuestionPaper =
  (models.QuestionPaper as Model<QuestionPaperDocument>) ||
  model<QuestionPaperDocument>("QuestionPaper", questionPaperSchema);
