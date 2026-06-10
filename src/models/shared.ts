import { Schema } from "mongoose";

export const subjectValues = ["physics", "chemistry", "botany", "zoology"] as const;
export const optionValues = ["A", "B", "C", "D"] as const;

export const auditFields = {
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
  createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  deletedBy: { type: Schema.Types.ObjectId, ref: "User" },
  deletedAt: { type: Date, default: null },
  isDeleted: { type: Boolean, default: false, index: true }
};

export const ownedSchemaOptions = {
  timestamps: true,
  versionKey: false
} as const;

export const uploadedAssetSchema = new Schema(
  {
    publicId: { type: String, required: true, trim: true },
    secureUrl: { type: String, required: true, trim: true },
    resourceType: { type: String, enum: ["image", "raw"], required: true },
    format: { type: String, trim: true },
    bytes: { type: Number, required: true, min: 1 },
    pageCount: { type: Number, min: 1 },
    width: { type: Number, min: 1 },
    height: { type: Number, min: 1 }
  },
  { _id: false }
);

export const boundingBoxSchema = new Schema(
  {
    page: { type: Number, required: true, min: 1 },
    x: { type: Number, required: true, min: 0 },
    y: { type: Number, required: true, min: 0 },
    width: { type: Number, required: true, min: 0 },
    height: { type: Number, required: true, min: 0 }
  },
  { _id: false }
);
