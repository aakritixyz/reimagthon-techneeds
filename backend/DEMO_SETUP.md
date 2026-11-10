# Local video walkthrough

The localhost app can run as an independent three-role demo. With `DEMO_MODE=true` in backend `.env` and `NEXT_PUBLIC_DEMO_MODE=true` in frontend `.env.local`, each role accepts any email/password and opens its preloaded demo identity. No admin invitation, mentor enrolment, or first-login password change is required to explore the demo.

| Role | Prefilled email | Suggested password |
| --- | --- | --- |
| Demo Admin | demo.admin@techneeds.local | demo123 |
| Demo Mentor | demo.mentor@techneeds.local | demo123 |
| Demo Mentee | demo.mentee@techneeds.local | demo123 |

The emails/passwords are convenient examples; arbitrary values work in local demo mode. Sign-ins map to fixed demo identities rather than creating a new account for each email. The admin has an email/password form in demo mode. Roles can remain signed in independently and the demo switcher links between all three interfaces.

## Data and recording flow

The dataset has six programs, six approved mentors, thirteen mentees, pending/expired/revoked invitations, and a CP-SAT allocation draft. The demo mentor has three assigned programs. The demo mentee has Web and ML enrolments; the Web track starts with 125 points, rank 4, and a four-day streak.

Web resources include a watched video, a submitted quiz whose answer review is open, a graded portfolio with feedback, a pending project submission, an unwatched video due soon, a fresh four-question React quiz, a new project, a missed deadline, and a mentor-only draft. The grading queue includes four pending projects. Secondary programs make program switching visible. All participant data and submitted work are fictional demo records; videos and repository references are public example material.

Suggested video order:

1. Techboard: show the three demo cards and prefilled login details.
2. Admin: overview, programs, invitations, mentor application settings, allocation suggestion/review/apply, activity history.
3. Mentor: switch cohorts, view mentee progress, add a mentee or CSV batch, create a draft resource, publish it, open the quiz builder, grade a pending project with feedback.
4. Mentee: progress and due-soon list, resource/status filters, video completion, the fresh React quiz, project submission/update, earlier answer review, scores and mentor feedback, leaderboard and profile visibility.

Changes use the actual API and persist in the demo database. The starting state is restored from **Reset walkthrough** on Techboard. The confirmation resets only the fictional demo database and clears that browser’s three role cookies. This also refreshes relative deadlines for a new recording session.

## Isolation and toggling

The backend overrides the connection’s database name to `techneeds_demo`; the existing `MONGO_URI` is kept unchanged. Reserved test runs use `techneeds_demo_test`. Reset refuses to run outside these reserved databases. Existing real data remains in the database named by the original URI.

Set both flags to `false` and restart the backend/frontend to return to regular authenticated behavior. Backend demo bypasses are disabled when `NODE_ENV=production` or the API is bound to a non-loopback host. Keep the frontend demo flag off when deploying the regular production site. The frontend flag alone cannot enable backend demo access.

The existing local Mongo replica set and OR-Tools solver are used, so demo mutations, allocation application, and resets remain transactional. No extra runtime dependencies were added for demo mode. No external messages or emails are sent.

## Tests

`tests/demo.integration.cjs` targets API port 8099 and the reserved database `127.0.0.1:27029/techneeds_demo_test` on `tnAdminTest`. Start the API with `DEMO_MODE=true`, `DEMO_DB_NAME=techneeds_demo_test`, and `HOST=127.0.0.1`. Use an isolated frontend on 3099 built with `NEXT_PUBLIC_DEMO_MODE=true` and `NEXT_PUBLIC_API_BASE_URL=http://127.0.0.1:8099`, then run `TEST_FRONTEND_URL=http://127.0.0.1:3099 node tests/demo.integration.cjs` from backend.

The suite exercises arbitrary sign-in for all roles, independent page access, seeded states, video completion, quiz scoring, project updates, grading, enrolment, program/invitation creation, allocation suggestion/application, reset, database isolation, and production/non-loopback safeguards.
