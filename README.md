# Surf Forecast AI Predictor — Frontend

Surf Forecast AI Predictor is a production-ready Next.js 14 application that authenticates whitelisted Gmail users through Firebase, fetches real-time marine forecasts for Playa de las Arenas (Valencia) from Open-Meteo, stores surfer ratings in MongoDB, and trains an on-demand decision tree using `ml-cart` to predict surf quality. Supporting maintenance scripts (seed/train utilities) live alongside the app in the `scripts/` directory.

## Stack

- Next.js 14 (pages router, TypeScript)
- Tailwind CSS for the beach-inspired UI
- Firebase Authentication (Google & email/password flows)
- Firebase Admin SDK for secure token validation
- MongoDB + Mongoose
- `ml-cart` decision tree classifier
- SWR data fetching

## Features

- Gmail allowlist enforcement via the `ALLOWED_GMAILS` environment variable
- Serverless API routes under `pages/api` for forecast, ratings CRUD, and ML predictions
- Decision tree per user to forecast wave size & quality (`gini`, depth 6, min samples 2)
- Rating UI with automatic `quality = zero` when `waveSize = flat`
- Access denied screen and graceful auth handling

## Prerequisites

- Node.js 18+
- npm 9+ (or pnpm/yarn)
- Firebase project with Authentication enabled
- MongoDB Atlas (or compatible MongoDB deployment)

## Environment Variables

Create `surf-ai-front/.env.local` with the following values (see `.env.example`):

```bash
NEXT_PUBLIC_FIREBASE_API_KEY=
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=
NEXT_PUBLIC_FIREBASE_PROJECT_ID=
FIREBASE_PROJECT_ID=
FIREBASE_CLIENT_EMAIL=
FIREBASE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\nYOUR_PRIVATE_KEY\n-----END PRIVATE KEY-----\n"
MONGODB_URI=
ALLOWED_GMAILS=user1@gmail.com,user2@gmail.com
```

### Gmail Allowlist

- Only Gmail addresses listed in `ALLOWED_GMAILS` can use the app.
- Separate addresses with commas, no spaces.
- Disallowed users are automatically signed out and shown the Access Denied screen.

### Firebase Admin Credentials

The admin SDK validates ID tokens for every API request. Generate a service account key in the Firebase console and copy `project_id`, `client_email`, and `private_key` into the environment variables above. Escape newline characters in `FIREBASE_PRIVATE_KEY` (`\n` for each line break).

## Installation

```bash
cd surf-ai-front
npm install
```

## Local Development

```bash
npm run dev
```

- App runs on [http://localhost:3000](http://localhost:3000)
- Forecast, rating, and prediction API routes live under `pages/api/*`
- Ensure `.env.local` is configured before hitting the API endpoints

## Testing the Flow

1. Sign in with an allowlisted Gmail account.
2. View hourly forecasts sourced from Open-Meteo.
3. Select an hour, submit a rating, and re-run predictions.
4. Ratings persist in the `surf_ratings` MongoDB collection.
5. `/api/predict` trains on your historical ratings every time.

## Deployment (Vercel)

1. Push the repository to GitHub (or GitLab/Bitbucket).
2. Import the project into Vercel and select `surf-ai-front`.
3. Set all environment variables via Vercel Project Settings.
4. Deploy — Next.js API routes will run as Vercel serverless functions.

## Project Structure

```
scripts/                # Seed/train utilities + env loader
data/                   # Sample ratings/forecast payloads
pages/
  index.tsx            # Main UI
  api/
    forecast.ts        # Open-Meteo proxy + formatting
    rating.ts          # Ratings CRUD with MongoDB
    predict.ts         # ml-cart decision trees
context/AuthContext.tsx
components/            # ForecastCard, RatingForm, PredictionPanel, AccessDenied
lib/                   # Firebase client/admin, MongoDB connector
models/SurfRating.ts   # Mongoose schema
styles/globals.css     # Tailwind entrypoint
types/                 # Shared TypeScript interfaces
```

## MongoDB Schema

Documents live in `surf_ratings`:

```
{
  userId: string,
  time: string,
  waveSize: number,
  wavePeriod: number,
  waveDirection: number,
  windWaveHeight: number,
  windWavePeriod: number,
  windWaveDirection: number,
  swellWaveHeight: number,
  swellWavePeriod: number,
  swellWaveDirection: number,
  secondarySwellWaveHeight: number,
  secondarySwellWavePeriod: number,
  secondarySwellWaveDirection: number,
  windSpeed: number,
  windDirection: number,
  rating_waveSize: "flat" | "small" | "medium" | "big",
  rating_quality: "zero" | "clean" | "fair" | "choppy" | "messy",
  createdAt: Date,
  updatedAt: Date
}
```

## Production Checklist

- [ ] Configure Firebase Authentication providers (Google + email/password)
- [ ] Seed `ALLOWED_GMAILS` with authorized surfers
- [ ] Provision MongoDB Atlas cluster and whitelist Vercel IPs as needed
- [ ] Secure Firebase Admin credentials in the hosting environment
- [ ] Run `npm run build` before deploying

## Backend Utilities

Maintenance helpers for seeding and training now live under `scripts/` and share the main app's dependencies:

```bash
npm run backend:seed
npm run backend:train -- demo-user
```

Both commands read the root `.env.local` (or `.env`) automatically; no extra configuration files are required.
Sample datasets reside in `data/` (`sample-ratings.json`, `sample-forecast.json`) and can be swapped by passing a path (for seeding) or setting `FORECAST_FALLBACK_PATH`.

Happy forecasting! 🏄‍♂️🌊
