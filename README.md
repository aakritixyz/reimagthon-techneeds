# TechNeeds IGDTUW

The Next.js frontend lives at the project root. The Express and MongoDB API lives in `backend/`. The local project is based on [the TechNeeds starter](https://github.com/Agarwalvidu/tn_web).

## Video demo mode

The local app has independent Demo Admin, Demo Mentor, and Demo Mentee sign-ins. With `DEMO_MODE=true` in backend `.env` and `NEXT_PUBLIC_DEMO_MODE=true` in frontend `.env.local`, any email/password opens the selected preloaded demo role. Open `/techboard` to start or reset the walkthrough. See `backend/DEMO_SETUP.md` for the recording flow and mode toggle.

## Start the API

Use Node.js 22 LTS. In Terminal, from the project root:

```sh
cd backend
npm ci
npm start
```

Before starting, open `backend/.env` and set `MONGO_URI` to your own MongoDB connection URL. Admin operations need MongoDB transactions. The preconfigured local server runs as the `techneedsLocal` replica set at `127.0.0.1:27017`; Atlas also works. See `backend/ADMIN_SETUP.md` for solver installation and replica-set setup. If `.env` is missing, copy `.env.example` to `.env` and generate independent values for `JWT_SECRET` and `ADMIN_KEY` with `openssl rand -hex 32`. Keep the file local.

The backend listens on loopback at `http://localhost:8000`. The frontend uses that URL by default. Set `NEXT_PUBLIC_API_BASE_URL` in the frontend's `.env.local` to override it. If using a different frontend port, set `FRONTEND_ORIGIN` in `backend/.env` to match.

## Start the frontend

Open a second Terminal at the project root.

```sh
npm ci
npm run dev
```

On Node.js 25, use `NODE_OPTIONS=--no-webstorage npm run dev`. Visit http://localhost:3000. The homepage and role picker also work while the API is offline.

If port 8000 is already occupied, run `PORT=8087 npm start` in `backend/` and use `NEXT_PUBLIC_API_BASE_URL=http://localhost:8087 NODE_OPTIONS=--no-webstorage npm run dev` at the project root.

## Walk through the portal

1. At `/admin`, sign in with `ADMIN_KEY` from your backend environment. Create and configure a program, create a mentor invitation, and share its private link. The mentor chooses a password. Approve their track applications, generate an allocation draft, review its gaps and match scores, then apply it.
2. At `/mentor`, sign in with the invited email and chosen password. Choose a cohort, add mentees individually or by CSV, save the one-time credentials, create draft video/quiz/project resources, and publish when ready. Review and grade projects with feedback. See `backend/MENTOR_SETUP.md` for the full workflow.
3. At `/mentee`, use an enrollment number or email and the generated password. Choose a new password at first login, then open your learning dashboard, watch videos, complete quizzes, submit or update ungraded projects, and view score feedback. Cohort boards support weekly filtering and privacy opt-out. See `backend/MENTEE_SETUP.md`.

The admin key is for local development. The current profile displays activity data from the starter API. AI-generated profiles are a separate feature.

## TechGuide

Use **Ask TechGuide** in the bottom right. Set `GEMINI_API_KEY` in `backend/.env` and restart the API to enable live replies. The default model is `gemini-3.5-flash`. Set `GEMINI_GUIDE_MODEL` to override it. Without a provider key, the guide gives labelled demo replies.
