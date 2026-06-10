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

// Utility to strip surrounding quotes and whitespace from raw environment variables
const cleanEnvVar = (val: string | undefined): string | undefined => {
  if (!val) return undefined;
  return val.trim().replace(/^["']|["']$/g, "").trim();
};

export const env = envSchema.parse({
  NEXTAUTH_URL: cleanEnvVar(process.env.NEXTAUTH_URL),
  NEXTAUTH_SECRET: cleanEnvVar(process.env.NEXTAUTH_SECRET),
  GOOGLE_CLIENT_ID: cleanEnvVar(process.env.GOOGLE_CLIENT_ID),
  GOOGLE_CLIENT_SECRET: cleanEnvVar(process.env.GOOGLE_CLIENT_SECRET),
  MONGODB_URI: cleanEnvVar(process.env.MONGODB_URI),
  CLOUDINARY_CLOUD_NAME: cleanEnvVar(process.env.CLOUDINARY_CLOUD_NAME),
  CLOUDINARY_API_KEY: cleanEnvVar(process.env.CLOUDINARY_API_KEY),
  CLOUDINARY_API_SECRET: cleanEnvVar(process.env.CLOUDINARY_API_SECRET),
  CLOUDINARY_UPLOAD_FOLDER: cleanEnvVar(process.env.CLOUDINARY_UPLOAD_FOLDER),
  APP_ENV: cleanEnvVar(process.env.APP_ENV)
});
