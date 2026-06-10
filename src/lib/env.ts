import { z } from "zod";

const envSchema = z.object({
  NEXTAUTH_URL: z.string().url().default("http://localhost:3001"),
  NEXTAUTH_SECRET: z.string().min(32).default("a_very_long_secret_key_at_least_32_characters_for_nextauth"),
  GOOGLE_CLIENT_ID: z.string().min(1).default("mock_google_client_id_for_neet_analytics"),
  GOOGLE_CLIENT_SECRET: z.string().min(1).default("mock_google_client_secret_for_neet_analytics"),
  MONGODB_URI: z.string().min(1).default("mongodb://localhost:27017/neet_analytics"),
  CLOUDINARY_CLOUD_NAME: z.string().min(1).default("mock_cloudinary_cloud"),
  CLOUDINARY_API_KEY: z.string().min(1).default("mock_cloudinary_api_key"),
  CLOUDINARY_API_SECRET: z.string().min(1).default("mock_cloudinary_api_secret"),
  CLOUDINARY_UPLOAD_FOLDER: z.string().default("neet-test-analytics"),
  APP_ENV: z.enum(["development", "test", "production"]).default("development")
});

export const env = envSchema.parse({
  NEXTAUTH_URL: process.env.NEXTAUTH_URL || undefined,
  NEXTAUTH_SECRET: process.env.NEXTAUTH_SECRET || undefined,
  GOOGLE_CLIENT_ID: process.env.GOOGLE_CLIENT_ID || undefined,
  GOOGLE_CLIENT_SECRET: process.env.GOOGLE_CLIENT_SECRET || undefined,
  MONGODB_URI: process.env.MONGODB_URI || undefined,
  CLOUDINARY_CLOUD_NAME: process.env.CLOUDINARY_CLOUD_NAME || undefined,
  CLOUDINARY_API_KEY: process.env.CLOUDINARY_API_KEY || undefined,
  CLOUDINARY_API_SECRET: process.env.CLOUDINARY_API_SECRET || undefined,
  CLOUDINARY_UPLOAD_FOLDER: process.env.CLOUDINARY_UPLOAD_FOLDER || undefined,
  APP_ENV: process.env.APP_ENV || undefined
});
