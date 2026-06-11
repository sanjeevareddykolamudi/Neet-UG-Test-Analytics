import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";
import { subjectValues } from "@/models/shared";

const mistakeJournalSchema = new Schema(
  {
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    questionHash: { type: String, required: true, index: true, trim: true },
    subject: { type: String, enum: subjectValues, required: true, index: true },
    chapter: { type: String, default: "", trim: true, index: true },
    topic: { type: String, default: "", trim: true, index: true },
    testId: { type: Schema.Types.ObjectId, ref: "Test", required: true, index: true },
    studentNote: { type: String, default: "", trim: true, maxlength: 1000 },
    status: {
      type: String,
      enum: ["review_needed", "resolved"],
      default: "review_needed",
      index: true
    },
    isDeleted: { type: Boolean, default: false, index: true },
    deletedAt: { type: Date, default: null }
  },
  { timestamps: true, versionKey: false }
);

// Unique compound index to prevent logging the exact same question mistake twice for a user
mistakeJournalSchema.index(
  { userId: 1, questionHash: 1, isDeleted: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);

// Compound index for revision queries filtering by subject/topic
mistakeJournalSchema.index({ userId: 1, subject: 1, chapter: 1, topic: 1 });

export type MistakeJournalDocument = InferSchemaType<typeof mistakeJournalSchema>;

export const MistakeJournal =
  (models.MistakeJournal as Model<MistakeJournalDocument>) ||
  model<MistakeJournalDocument>("MistakeJournal", mistakeJournalSchema);
