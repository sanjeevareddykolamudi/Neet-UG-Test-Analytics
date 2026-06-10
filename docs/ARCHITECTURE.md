# Architecture

## Application Layers

- App Router pages render the authenticated student workspace.
- API routes provide authenticated JSON endpoints for upload signatures, papers, and analytics shells.
- Mongoose models capture the durable domain state.
- Service helpers centralize database, Cloudinary, auth, validation, and API error handling.

## Domain Flow

1. Student signs in with Google.
2. Student uploads scanned question paper images or PDFs through signed Cloudinary parameters.
3. App stores test metadata in `Test` and paper asset metadata in `QuestionPaper`.
4. Future OCR and marked-option detection processors populate `Question`.
5. Student or admin adds an `AnswerKey`.
6. Future analysis compares selected answers with the answer key and writes `TestResult`.
7. Future planner generates `WeakTopic`, `MistakeJournal`, and `RevisionTask` records.

## API Routes

- `GET /api/tests` lists the authenticated student's papers.
- `POST /api/tests` stores validated paper upload metadata.
- `POST /api/uploads/signature` returns signed Cloudinary upload parameters.
- `GET /api/analytics` returns an authenticated analytics shell.
- `/api/auth/[...nextauth]` handles NextAuth.js auth routes.

## Data Models

- `User` stores student identity, profile fields, and account status.
- `Test` stores test-level metadata and lifecycle status.
- `QuestionPaper` stores scanned paper metadata and Cloudinary assets.
- `Question` stores OCR text, options, selected answer, confidence, and review state.
- `AnswerKey` stores correct answers and explanations.
- `TestResult` stores score and subject-level performance snapshots.
- `MistakeJournal` stores question-level mistakes and review notes.
- `WeakTopic` stores durable topic weakness metrics.
- `RevisionTask` stores generated revision work.

## Future Business Logic

- OCR extraction should be implemented as a processor or queue-backed job.
- Marked-option detection should operate on question-paper regions, not OMR sheets.
- Answer-key comparison should be deterministic and auditable.
- Weak-topic tracking should use normalized topic labels once syllabus mapping is introduced.
