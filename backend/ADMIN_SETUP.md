# TechNeeds admin workspace

The existing Next.js + Express + MongoDB stack is retained. The admin key is exchanged for an eight-hour, HttpOnly, SameSite=Strict cookie. Every `/api/admin/*` workspace route is guarded on the server. The legacy `x-admin-key` API interface remains available to local scripts. Mentor JWTs cannot grant admin access.

## Run locally

1. Use a MongoDB replica set (Atlas supports transactions). A local single-node set works too. Stop any standalone mongod cleanly before restarting it with the **same data directory**, `--replSet techneedsLocal`, and `--bind_ip 127.0.0.1`. Initiate once with `rs.initiate({_id: 'techneedsLocal', members: [{_id: 0, host: '127.0.0.1:27017'}]})` in mongosh. Back up the database first. Set `MONGO_URI=mongodb://127.0.0.1:27017/techneeds?replicaSet=techneedsLocal` in `backend/.env`.
2. Install the private solver worker (Python 3.11 recommended):

   ```bash
   cd backend
   python3.11 -m venv solver/.venv
   solver/.venv/bin/python -m pip install -r solver/requirements.txt
   npm install
   npm start
   ```

   `SOLVER_PYTHON` optionally overrides the Python executable. Otherwise the API finds `solver/.venv/bin/python`. OR-Tools runs as a private child process; no public solver service or solver API key is required.
3. Set `PORT`, `FRONTEND_ORIGIN`, `JWT_SECRET`, and `ADMIN_KEY` in backend `.env`. Set `NEXT_PUBLIC_API_BASE_URL` in frontend `.env.local` to the API origin, then run the frontend. On this Mac the API uses **8087**, as 8000 is already occupied.
4. Open `/admin`, enter the local admin key, and create a program. The workspace tabs also load directly at `/admin/programs`, `/admin/mentors`, `/admin/allocations`, and `/admin/activity`.

The frontend request helper aligns localhost and 127.0.0.1 loopback hostnames automatically, so previewing either address keeps the admin cookie same-site. For production, use HTTPS with same-site frontend/API domains; secure cookies are enabled when `NODE_ENV=production`. A managed identity provider and 2FA can replace the local admin-key sign-in for a public deployment. The local in-memory login/onboarding limiter needs a shared store for multiple API replicas.

## Admin workflow

- **Programs:** create and edit name, cohort, description, dates, capacity, mentor limits, and DRAFT/OPEN/ACTIVE/CLOSED status. Archive and restore without deleting history. Assigned mentors can be removed individually.
- **Mentors:** invitations expire after 48 hours; only SHA-256 token hashes are stored. Links put the token in the URL fragment so it is not sent in navigation/referrer logs. Mentors choose a bcrypt-hashed password. Acceptance, account creation, program assignment, invite consumption, and audit entry happen in one MongoDB transaction. Existing accounts are never overwritten by invitations. Reissue invalidates the old token; revoke prevents acceptance.
- **Delivery:** there is no configured email provider. The UI shows a link once for the admin to copy and share; “New link” regenerates a link rather than sending email. Applying a plan updates existing mentor access and does not send notifications. No external messages are sent automatically.
- **Applications:** admin records applied tracks and integer preference/skill scores from 0–100. Only explicitly approved mentors and applied pairs enter the solver. There are no invented scores or preapproved applications.
- **Allocation:** draft proposals use CP-SAT with hard mentor workload and track caps, lock/exclude overrides, shortage penalties (1,000 per missing mentor, 20 per missing seat), retained-pair bonus 50, and minimum spare capacity weight 5. These are weighted trade-offs, not lexicographic guarantees. Closed/archived programs are excluded. Existing assignments outside the draft reduce available mentor workload. Planned demand is program mentee capacity or current enrolments, whichever is higher.
- **Review:** show every match score, first-choice/retained/locked markers, seats, staffing gaps, and unmatched mentors. Infeasible drafts cannot be applied. Gaps need explicit acknowledgement. Changing rules requires regeneration. Applying is atomic, synchronizes mentor/program links, preserves out-of-scope assignments, rejects stale inputs, and consumes a draft once.
- **History:** admin mutations and invite acceptance write an audit record. The UI shows the latest 50 events and 15 plans; older records remain in MongoDB. The local shared admin key is represented as actor ADMIN, rather than claiming individual identities.

The frontend uses the same blue-steel palette, sans-serif and mono labels as the public pages, with responsive navigation and forms. Empty states reflect real local data; no demo users are seeded.

## Tests

```bash
solver/.venv/bin/python -m unittest discover -s solver -p 'test_*.py'
```

`tests/admin.integration.cjs` uses **only** `127.0.0.1:27029/techneeds_admin_test` and API port **8096**. It drops that test database. Start an isolated mongod replica set named `tnAdminTest` on 27029, initiate it, then run the backend on 8096 with `MONGO_URI=mongodb://127.0.0.1:27029/techneeds_admin_test?replicaSet=tnAdminTest`, `ADMIN_KEY=isolated-admin-test-key`, `JWT_SECRET=isolated-jwt-test-secret-not-live`, and `FRONTEND_ORIGIN=http://localhost:3000`. Restart the test API before each run to reset its rate limiter. From `backend/`, run `node tests/admin.integration.cjs`.

Covers server guards, cookie flags, untrusted origins, rate limits, program validation and duplicates, invitation expiry/reuse/tampering/revocation/reissue/concurrent acceptance, transaction rollback, mentor scoping, solver shortages and conflicts, stale/repeated apply protection, assignment consistency, and audit output without password/token hashes. Frontend production build: `NODE_OPTIONS=--no-webstorage npm run build` from the frontend root.

Solver reference: [Google OR-Tools CP-SAT](https://developers.google.com/optimization/cp/cp_solver).
