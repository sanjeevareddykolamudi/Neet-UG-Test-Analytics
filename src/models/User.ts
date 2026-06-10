import { Schema, model, models, type InferSchemaType, type Model } from "mongoose";

const userSchema = new Schema(
  {
    name: { type: String, trim: true, maxlength: 120 },
    email: { type: String, required: true, lowercase: true, trim: true },
    googleId: { type: String, sparse: true, index: true },
    emailVerified: { type: Date },
    image: { type: String, trim: true },
    role: { type: String, enum: ["student", "admin"], default: "student", index: true },
    targetExamYear: { type: Number, min: 2024, max: 2100 },
    onboardingCompletedAt: { type: Date },
    lastLoginAt: { type: Date },
    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
    deletedAt: { type: Date, default: null },
    isDeleted: { type: Boolean, default: false, index: true }
  },
  { timestamps: true, versionKey: false }
);

userSchema.index(
  { email: 1, isDeleted: 1 },
  { unique: true, partialFilterExpression: { isDeleted: false } }
);
userSchema.index({ role: 1, isDeleted: 1, createdAt: -1 });
userSchema.index({ googleId: 1, isDeleted: 1 }, { sparse: true });

export type UserDocument = InferSchemaType<typeof userSchema>;

export const User =
  (models.User as Model<UserDocument>) || model<UserDocument>("User", userSchema);
