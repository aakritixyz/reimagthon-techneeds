# TechNeeds IGDTUW

The Next.js frontend lives at the project root. The Express and MongoDB API lives in `backend/`. The local project is based on [the TechNeeds starter](https://github.com/Agarwalvidu/tn_web).

## Start the API

Use Node.js 22 LTS. In Terminal, from the project root:

```sh
cd backend
npm ci
npm start
```

Before starting, open `backend/.env` and set `MONGO_URI` to your own MongoDB connection URL. The preconfigured local URL works if a MongoDB server is already running at `127.0.0.1:27017`. If `.env` is missing, copy `.env.example` to `.env` and generate independent values for `JWT_SECRET` and `ADMIN_KEY` with `openssl rand -hex 32`. Keep the file local.

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

1. At `/admin`, unlock the local admin workspace with `ADMIN_KEY` from your backend environment. Create a cohort and mentor, save the generated mentor password, and assign the mentor to the cohort.
2. At `/mentor`, sign in with the generated credentials. Select the cohort, enroll a mentee, and publish a video, quiz, or project with a deadline and score.
3. At `/mentee`, use the generated enrollment number and password. Complete work in the dashboard and check the progress summary and leaderboard.

The admin key is for local development. The current profile displays activity data from the starter API. AI-generated profiles are a separate feature.
