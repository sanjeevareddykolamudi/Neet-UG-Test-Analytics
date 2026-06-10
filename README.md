# NEET Test Analytics Platform

Production-ready foundation for a NEET practice-test analytics app built with Next.js 15, TypeScript, Tailwind CSS, shadcn/ui-style components, MongoDB Atlas, Mongoose, NextAuth.js, Google Sign-In, Cloudinary, TanStack Query, Recharts, Zod, and React Hook Form.

This application does not parse OMR sheets. It is scoped to scanned question papers where the student marks answers directly on the paper.

## Current Scope

- Accept scanned question paper image/PDF upload metadata.
- Store paper assets, extracted question placeholders, selected answers, answer keys, analytics snapshots, and revision plans.
- Provide authenticated dashboard shell and secure API boundaries.
- Leave OCR extraction, marked-option detection, answer-key comparison, mistake classification, weak-topic analysis, and revision-plan generation for the business-logic phase.

## Project Structure

- `src/app` - Next.js App Router pages, route groups, and API routes.
- `src/app/(auth)` - Google sign-in experience.
- `src/app/(dashboard)` - Protected dashboard shell and student workspace pages.
- `src/app/api` - Authenticated API routes for tests, analytics, uploads, and NextAuth.
- `src/components/app` - Product-level dashboard, auth, form, and chart components.
- `src/components/ui` - shadcn/ui-style primitives.
- `src/lib` - Environment validation, auth options, MongoDB/Mongoose, Cloudinary, API helpers, and Zod schemas.
- `src/models` - Mongoose domain models.
- `src/providers` - Client providers for NextAuth and TanStack Query.
- `src/types` - Shared TypeScript domain and NextAuth types.

## Local Setup

1. Install dependencies with `npm install`.
2. Copy `.env.example` to `.env.local`.
3. Fill Google OAuth, MongoDB Atlas, Cloudinary, and NextAuth secrets.
4. Run `npm run dev`.

## Render Deployment

The `render.yaml` file defines a free-tier web service. Configure the environment variables in Render, point `NEXTAUTH_URL` to the Render app URL, and use MongoDB Atlas plus Cloudinary free-tier credentials.
