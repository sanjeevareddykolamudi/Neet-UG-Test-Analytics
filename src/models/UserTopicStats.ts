import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { subjectValues } from "@/models/shared";

const userTopicStatsSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    subject: { type: String, enum: subjectValues, required: true },
    chapter: { type: String, required: true, trim: true },
    topic: { type: String, required: true, trim: true },
    totalQuestions: { type: Number, default: 0, min: 0 },
    correctQuestions: { type: Number, default: 0, min: 0 },
    wrongQuestions: { type: Number, default: 0, min: 0 },
    accuracy: { type: Number, default: 0, min: 0, max: 100 },
    lastUpdated: { type: Date, default: Date.now },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: { createdAt: false, updatedAt: false }, versionKey: false }
);

// Compound index to guarantee uniqueness of user statistics per topic
userTopicStatsSchema.index(
  { userId: 1, subject: 1, chapter: 1, topic: 1, isDeleted: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

export type UserTopicStatsDocument = InferSchemaType<typeof userTopicStatsSchema>;

export const UserTopicStats =
  (models.UserTopicStats as Model<UserTopicStatsDocument>) ||
  model<UserTopicStatsDocument>("UserTopicStats", userTopicStatsSchema);
