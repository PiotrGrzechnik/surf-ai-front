# Utility Scripts

The `scripts/` directory contains maintenance helpers that reuse the live Next.js application's models
and configuration. They automatically load environment variables from the project root (`.env.local`
or `.env`) and can be run through the npm scripts declared in `package.json`.

## Seeding Ratings

```bash
npm run backend:seed           # uses data/sample-ratings.json by default
npm run backend:seed -- ./path/to/custom.json
```

Each entry must include the same fields expected by the production API (`pages/api/rating.ts`). Records
are upserted by the `(userId, time)` composite key.

## Training Trees Locally

```bash
npm run backend:train -- demo-user
```

The command trains the `ml-cart` decision trees for the supplied `userId` and prints accuracy and a JSON
snapshot of both trees. Existing ratings are pulled via Mongoose, so ensure `MONGODB_URI` is configured.

## Fallback Forecast Data

`pages/api/forecast.ts` can return a cached response when the upstream Marine API is unreachable. Place
a JSON payload that matches the `ForecastResponse` shape in `data/sample-forecast.json`, or point the
`FORECAST_FALLBACK_PATH` environment variable at a different file.
