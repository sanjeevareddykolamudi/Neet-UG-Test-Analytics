import { v2 as cloudinary } from "cloudinary";

import { env } from "@/lib/env";

cloudinary.config({
  cloud_name: env.CLOUDINARY_CLOUD_NAME,
  api_key: env.CLOUDINARY_API_KEY,
  api_secret: env.CLOUDINARY_API_SECRET,
  secure: true
});

export { cloudinary };

export function createUploadSignature(userId: string) {
  const timestamp = Math.round(Date.now() / 1000);
  const folder = `${env.CLOUDINARY_UPLOAD_FOLDER}/${userId}`;

  const signature = cloudinary.utils.api_sign_request(
    {
      folder,
      timestamp,
      resource_type: "auto"
    },
    env.CLOUDINARY_API_SECRET
  );

  return {
    apiKey: env.CLOUDINARY_API_KEY,
    cloudName: env.CLOUDINARY_CLOUD_NAME,
    folder,
    signature,
    timestamp
  };
}
