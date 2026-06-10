import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { optionValues } from "@/models/shared";

const testAttemptSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    testId: { type: Schema.Types.ObjectId, ref: "Test", required: true, index: true },
    questionHash: { type: String, required: true, index: true, trim: true },
    selectedAnswer: { type: String, enum: [...optionValues, null], default: null },
    correctAnswer: { type: String, enum: optionValues, required: true },
    result: {
      type: String,
      enum: ["correct", "wrong", "unattempted"],
      required: true,
      index: true
    },
    confidence: { type: Number, default: 1.0, min: 0, max: 1 },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false }
);

// Compound index for querying a user's attempts on a particular test
testAttemptSchema.index({ userId: 1, testId: 1, isDeleted: 1 });
// Compound index for lookups by hash
testAttemptSchema.index({ testId: 1, questionHash: 1, isDeleted: 1 });

export type TestAttemptDocument = InferSchemaType<typeof testAttemptSchema>;

export const TestAttempt =
  (models.TestAttempt as Model<TestAttemptDocument>) ||
  model<TestAttemptDocument>("TestAttempt", testAttemptSchema);
