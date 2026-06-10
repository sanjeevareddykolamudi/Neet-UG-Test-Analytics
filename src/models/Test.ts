import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const testSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    testName: { type: String, required: true, trim: true, maxlength: 140 },
    subject: {
      type: String,
      enum: ["physics", "chemistry", "botany", "zoology", "biology", "combined"],
      required: true,
      index: true
    },
    testDate: { type: Date, default: Date.now, index: true },
    totalQuestions: { type: Number, default: 0, min: 0 },
    uploadedFile: { type: String, default: "", trim: true },
    processingStatus: {
      type: String,
      enum: ["pending", "processing", "completed", "failed"],
      default: "pending",
      index: true
    },
    statusMessage: { type: String, default: "" },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false, index: true }
  },
  { timestamps: true, versionKey: false }
);

testSchema.index({ userId: 1, isDeleted: 1, createdAt: -1 });
testSchema.index({ userId: 1, processingStatus: 1, isDeleted: 1 });
testSchema.index({ testName: "text" });

export type TestDocument = InferSchemaType<typeof testSchema>;

export const Test =
  (models.Test as Model<TestDocument>) || model<TestDocument>("Test", testSchema);
