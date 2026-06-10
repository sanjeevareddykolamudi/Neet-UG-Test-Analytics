# Security Architecture

## Authentication

- Google Sign-In is the only configured identity provider.
- NextAuth uses database-backed sessions through the MongoDB adapter.
- Protected pages are guarded by `middleware.ts` and server-side session checks.
- Protected APIs call `requireUser()` before reading or writing data.

## Authorization

- Student-owned records include `userId` and are queried through that owner boundary.
- Upload signatures are generated per authenticated user and scoped to `CLOUDINARY_UPLOAD_FOLDER/userId`.
- Future processors should never trust client-submitted ownership fields; derive ownership from the active session.

## Data Storage

- MongoDB Atlas stores app data through Mongoose models.
- Cloudinary stores scanned image/PDF assets.
- The app stores Cloudinary public IDs and secure URLs, not raw file bytes.

## Validation

- Environment variables are validated with Zod in `src/lib/env.ts`.
- API request bodies are validated with Zod in `src/lib/validations.ts`.
- Invalid payloads return structured `400` responses.

## Processing Boundary

- OCR and marked-option detection are not implemented in this scaffold.
- Any future OCR/detection worker should write confidence scores and set `needsHumanReview` for uncertain questions.
- The platform explicitly does not include OMR parsing.

## Deployment Notes

- Keep `NEXTAUTH_SECRET`, OAuth secrets, MongoDB URI, and Cloudinary API secret private in Render environment variables.
- Use HTTPS production URLs for OAuth redirect URIs and `NEXTAUTH_URL`.
- Rotate secrets if they are ever exposed in local logs, screenshots, or commits.
