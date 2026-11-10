# Mentee learning workspace

The mentee side extends the existing Next.js App Router + Express + MongoDB application. It reuses mentor enrolments, published resources, transactional submissions, and grading records. The workspace matches admin and mentor: pale blue surfaces, navy headings, mono labels, the actual TechNeeds logo at top left, and a compact footer.

## Flow

1. An assigned mentor enrols the learner and shares the one-time initial password and enrolment number.
2. At `/mentee`, sign in with an enrolment number or email. New/reset accounts must choose a new password at `/change-password` before accessing learning APIs.
3. `/mentee` and `/dashboard` both open the learning workspace when signed in. The program picker appears only for multiple enrolments.
4. Resources are sorted by deadline. The dashboard shows completed/total progress, points, shared cohort rank, IST streak, pending feedback, due-soon work, type tabs, and Pending/Submitted/Graded/Missed filters. Missed resources have disabled submission controls; server checks remain authoritative.
5. Open a video, quiz, or project in its resource view. Scores and feedback appear in the score-history tab. Profile lists enrolment numbers, allows a name change, links to password change, and controls leaderboard visibility.

Direct routes: `/mentee/[programId]`, `/mentee/[programId]/resources/[resourceId]`, `/mentee/[programId]/scores`, `/mentee/[programId]/leaderboard`, and `/mentee/profile`.

## Sessions and access

Mentee sessions use a seven-day HttpOnly, SameSite=Lax cookie (`Secure` in production). New browser clients do not store bearer tokens in localStorage. Older stored tokens migrate once to a cookie and are cleared. The legacy token response/header remains compatible with existing integrations and tests. All session requests use credentialed fetch with loopback hostname alignment.

Five failed attempts lock the account for 15 minutes. Unknown accounts, bad passwords, and locked accounts receive the same response. Identifier+IP and IP-wide rate limits also apply. Successful login clears failures and records `lastLoginAt`. Password changes and mentor resets clear lockout state, rotate the account token version, and invalidate older sessions.

Next middleware validates an existing mentee cookie with the API. It redirects forced-change sessions to `/change-password` and signed-in mentees away from `/admin` and `/mentor` to their dashboard. Sign out of the mentee account before switching to another role in the same browser. The middleware is a navigation layer; each backend endpoint independently checks the signed role, current token version, forced-change state, and ownership. A mentee cookie never grants mentor or admin API access.

Use HTTPS and same-site frontend/API hostnames for production. The in-memory rate limits and leaderboard cache require a shared store if the API is deployed on multiple instances. Database passwords remain bcrypt-hashed consistently with the existing stack.

## Learning rules

- Only published resources from enrolled programs are returned. Queries include ownership. Resource detail returns only the requesting mentee’s own submission, never arbitrary mentee IDs or quiz answer keys.
- Videos embed exact YouTube, Vimeo, or Drive hosts, with validated embed IDs, iframe sandbox restrictions, and a safe external link. Completion is self-reported and awards the resource score once.
- Quizzes load only public question text, options, and points. There is one server-graded submission; duplicate submissions fail. The runner counts down to the mentor’s global deadline. No individual attempt-duration setting is configured. After the deadline, a separate review endpoint returns the submitted learner’s choices and correct answer text. It does not return internal correct-option indices.
- Projects accept a repository or demo link and an optional note. Supported hosts include GitHub, GitLab, Bitbucket, Drive, Vercel, Netlify, Cloudflare Pages, Render, Firebase, Figma, CodePen, and other listed code-hosting services. Scheme and hostname checks reject lookalike domains and script URLs. Unsupported custom domains should use a supported repository link alongside them.
- Project updates are allowed until the deadline while ungraded. A transaction updates the existing completion instead of creating duplicates. Graded projects are immutable to the mentee. Distinct submission days are retained for IST streaks.
- The server clock enforces all deadlines. UTC is stored; the UI renders IST and highlights countdowns under 24 hours. Grade changes replace scores instead of accumulating duplicates.
- Submission events, locked logins, profile changes, and password changes are audited without storing passwords or tokens in logs.

## Cohort leaderboard and privacy

The board is scoped to the selected program, with all-time and IST week filters. Scores are derived from published-resource completion records. Ties share a rank (`1, 1, 3`), with earlier last-submission time and ID stabilizing equal-score display order. Top 3 receive muted medal accents; the top 20 are listed and the viewer’s rank remains pinned even outside the list. Rows animate with Framer Motion while respecting reduced motion.

Cohort data has a five-second in-process cache, invalidated on learning, grading, and profile updates. Clients poll every 30 seconds while visible and refresh on focus. Names use first name plus last initial. Opting out hides the learner from all cohort and public boards immediately after saving; private scores remain available with an unranked personal card. The original published public leaderboard snapshot remains unchanged and appears only while there are no local mentee accounts.

## Verification

`tests/mentee.integration.cjs` drops **only** `127.0.0.1:27029/techneeds_mentee_test` on the isolated `tnAdminTest` replica set. Start a test API on **8098** with `ADMIN_KEY=isolated-mentee-admin-key` and `JWT_SECRET=isolated-mentee-jwt-secret-not-live`. Run `node tests/mentee.integration.cjs` from backend. Restart the test API before repeats to clear rate-limit counters.

For middleware verification, build a separate frontend with `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8098`, serve it on 3099, then run the test with `TEST_FRONTEND_URL=http://127.0.0.1:3099`. Do not run this fixture against the real project database.

Tests cover cookies, forced password changes, lockout/expiry, API roles, cross-program and cross-mentee privacy, drafts, video/quiz scores and duplicates, project resubmission and graded locks, unsafe hosts, answer-review timing, shared ranks, abbreviated names, opt-out, private scores, weekly filtering, audit events, and actual Next middleware redirects. Existing mentor/admin workflows have separate regression tests.
