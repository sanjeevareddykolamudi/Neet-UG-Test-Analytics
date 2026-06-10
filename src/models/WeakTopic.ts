import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

import { auditFields, ownedSchemaOptions, subjectValues } from "@/models/shared";

const weakTopicSchema = new Schema(
  {
    ...auditFields,
    subject: { type: String, enum: subjectValues, required: true, index: true },
    topic: { type: String, required: true, trim: true },
    chapter: { type: String, trim: true },
    attempts: { type: Number, default: 0, min: 0 },
    correct: { type: Number, default: 0, min: 0 },
    incorrect: { type: Number, default: 0, min: 0 },
    accuracy: { type: Number, default: 0, min: 0, max: 100 },
    weaknessScore: { type: Number, default: 0, min: 0, max: 100, index: true },
    lastMistakeAt: { type: Date },
    sourceTestIds: { type: [Schema.Types.ObjectId], ref: "Test", default: [] }
  },
  ownedSchemaOptions
);

weakTopicSchema.index(
  { userId: 1, subject: 1, topic: 1, isDeleted: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
weakTopicSchema.index({ userId: 1, weaknessScore: -1, isDeleted: 1 });
weakTopicSchema.index({ userId: 1, lastMistakeAt: -1, isDeleted: 1 });
weakTopicSchema.index({ topic: "text", chapter: "text" });

export type WeakTopicDocument = InferSchemaType<typeof weakTopicSchema>;

export const WeakTopic =
  (models.WeakTopic as Model<WeakTopicDocument>) ||
  model<WeakTopicDocument>("WeakTopic", weakTopicSchema);
