import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const revisionTaskSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    topic: { type: String, required: true, trim: true },
    chapter: { type: String, required: true, trim: true },
    priority: { type: String, enum: ["low", "medium", "high"], default: "medium", index: true },
    dueDate: { type: Date, required: true, index: true },
    status: {
      type: String,
      enum: ["pending", "in_progress", "done", "skipped"],
      default: "pending",
      index: true
    },
    completedAt: { type: Date },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false }
);

revisionTaskSchema.index({ userId: 1, status: 1, dueDate: 1, isDeleted: 1 });
revisionTaskSchema.index({ userId: 1, priority: 1, isDeleted: 1, dueDate: 1 });
revisionTaskSchema.index({ userId: 1, chapter: 1, topic: 1, isDeleted: 1 });

export type RevisionTaskDocument = InferSchemaType<typeof revisionTaskSchema>;

export const RevisionTask =
  (models.RevisionTask as Model<RevisionTaskDocument>) ||
  model<RevisionTaskDocument>("RevisionTask", revisionTaskSchema);
