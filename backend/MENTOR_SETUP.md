# Mentor workspace

The mentor implementation extends the existing Next.js / Express / MongoDB application and the admin workspace. It uses the same local replica set, transactional writes, blue-steel styles, and narrow workspace footer. No PostgreSQL/Prisma migration or second backend is needed.

## Use it

1. Start the API and frontend as described in `ADMIN_SETUP.md`. On this Mac they run at localhost:8087 and localhost:3000.
2. From the admin workspace, invite a mentor and assign programs. The mentor accepts the private link and chooses their password.
3. Open `/mentor` and sign in. This exchanges credentials for an eight-hour HttpOnly, SameSite=Strict cookie, with Secure enabled in production. Existing local bearer-token sessions can migrate once; new sessions are not kept in localStorage.
4. Choose a program. Only programs whose mentor membership includes this account are queried. Closed and archived programs are read-only for mentors.

### Mentees

Add one learner or import a CSV with `name,email` headers (up to 200 rows, under 1 MB). Papa Parse handles quoted fields; the preview shows invalid names/emails, duplicate emails, and malformed rows. The API repeats validation. Batches are atomic: an invalid or duplicate existing enrolment rolls back the entire batch and counter.

Program capacity and the enrolment sequence are checked inside the same transaction. Numbers follow `TN26-WEBABC123-0001`: the program code includes a short ID suffix to distinguish cohorts with the same track name. Concurrent requests cannot reuse a sequence. Each program enrolment has its own unique number and one unique mentee/program relationship.

The account email is normalized and unique. Adding an existing mentee to another program preserves the account name and password; only the new enrolment number is returned. A new account gets a cryptographically random 14-character initial password; only its bcrypt hash is stored. The response shows passwords once and offers an escaped CSV download. They are not logged or put in browser storage. A mentor can reset an enrolled mentee’s password; this invalidates existing sessions across programs, sets `mustChangePw`, and returns the new initial password once.

Mentee login accepts email or any assigned enrolment number. Generated/reset accounts must visit `/change-password` before using any dashboard or submission API. The backend enforces this independently of redirects. Password changes invalidate old tokens and issue a new versioned token. Login limits apply by identifier plus IP, with a separate IP-wide ceiling. The local limiter must use a shared store for multiple API replicas.

### Resources

Create videos, quizzes, or projects. Save as draft, review, then publish separately. Mentee queries and direct submission endpoints hide drafts. Existing resources from before draft support are marked published on startup to preserve their visibility.

- Video links allow exact YouTube, Vimeo, and Google Drive hosts, using HTTP(S) URLs without embedded credentials.
- Projects require instructions and may include an optional reference link.
- Quizzes have 1–50 questions, 2–6 options each, a valid correct option, and positive integer points. The total score is computed from points and capped at 1,000. Answers are never sent to mentees. Quizzes are scored immediately on submission.
- Publishing requires a future deadline. Forms interpret times in **IST**, send UTC, and display deadlines/countdowns in IST. The server clock enforces strict deadlines and quiz opening times.
- After a submission exists, only the description and a deadline extension can change. Scoring and quiz answers stay fixed. Resource revision writes serialize concurrent edits/submissions.

### Grading

Pick a published resource. Project submissions awaiting review appear first. Grade from 0 to the resource maximum and add up to 1,000 characters of feedback. Updating a grade replaces the existing score; it never adds it twice. Mentees see feedback and pending-review status in their dashboard. Videos and quizzes show their automatic scores in the review screen.

Resource creation, enrolment, password resets, publishing, editing, and grade changes write audit entries. Lists of mentees and submissions are paginated in groups of 25. Every resource/submission action derives its program from the database before checking access. Legacy mutation URLs delegate to the same protected handlers.

Scores are derived from completion records. Streaks use consecutive IST days with completed/submitted work, and expire after inactivity. The original public leaderboard snapshot remains visible only while there are no local mentee accounts. Standings are queried fresh; no stale leaderboard cache is introduced.

Email delivery remains unconfigured. No credentials or invitations are automatically emailed. Public deployment should use HTTPS, a managed identity provider, a shared rate-limit store, and backups. Existing MongoDB data with duplicate case-normalized mentee emails must be reconciled before adding the unique email index; this local database has no legacy accounts.

## Routes

- `/mentor`: overview, program picker, mentee/resource counts, pending reviews, next deadlines
- `/mentor/[programId]/mentees`: directory, CSV import, one-time credentials, password reset
- `/mentor/[programId]/resources`: draft/published resources, type-specific editor, quiz builder
- `/mentor/[programId]/resources/[resourceId]/submissions`: review and grading
- `/mentor/[programId]/activity`: program audit history
- `/change-password`: required mentee first-login/reset password change

The mentor API lives under `/api/mentor`. Each route checks the authenticated mentor on the server; UI navigation is a convenience layer.

## Validation

`tests/mentor.integration.cjs` runs only against API port **8097** and replica-set database **127.0.0.1:27029/techneeds_mentor_test** (`tnAdminTest`). It drops that isolated test database. Start a separate test API with `MONGO_URI=mongodb://127.0.0.1:27029/techneeds_mentor_test?replicaSet=tnAdminTest`, `PORT=8097`, `ADMIN_KEY=isolated-mentor-admin-key`, and `JWT_SECRET=isolated-mentor-jwt-secret-not-live`, then run `node tests/mentor.integration.cjs`. Restart the test API before repeating to reset rate counters.

Checks include permissions, cookies and origins, atomic bulk and concurrent enrolment, reuse of existing accounts, counter rollback, forced password changes, reset/session invalidation, hidden drafts, quiz answer secrecy, exact video-host validation, strict server deadlines, auto-grading, bounded project grading, regrading totals, pagination, archived-program protection, and audit output. The frontend production build and CSV/IST helper checks also pass.

References: [Papa Parse](https://www.papaparse.com/docs), [Mongoose transaction guidance](https://mongoosejs.com/docs/8.x/docs/transactions.html).
