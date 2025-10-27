import type { NextApiRequest, NextApiResponse } from "next";
import { firebaseAdminAuth } from "../../lib/firebaseAdmin";
import { connectMongo } from "../../lib/mongodb";
import { SurfRating } from "../../models/SurfRating";
import type { RatingQuality, RatingRequestBody, RatingWaveSize } from "../../types/rating";

const WAVE_SIZE_OPTIONS: RatingWaveSize[] = ["flat", "small", "medium", "big"];
const QUALITY_OPTIONS: RatingQuality[] = ["zero", "clean", "fair", "choppy", "messy"];

/**
 * Sanitises the quality selection based on the business rule:
 * flat wave size must always yield zero quality.
 */
function enforceQualityRule(waveSize: RatingWaveSize, quality: RatingQuality): RatingQuality {
  return waveSize === "flat" ? "zero" : quality;
}

/**
 * Validates numeric fields in either the request body or query string.
 */
function requireNumber(value: unknown, field: string): number {
  const numericValue = Number(value);
  if (!Number.isFinite(numericValue)) {
    throw new Error(`"${field}" must be a numeric value`);
  }
  return numericValue;
}

/**
 * Extracts and verifies the Firebase user from the bearer token.
 */
async function authenticate(req: NextApiRequest) {
  const authHeader = req.headers.authorization;
  if (!authHeader?.startsWith("Bearer ")) {
    throw new Error("Missing or invalid authorization header");
  }

  const token = authHeader.split("Bearer ")[1];
  return firebaseAdminAuth.verifyIdToken(token);
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  try {
    const decodedToken = await authenticate(req);
    await connectMongo();

    const userId = decodedToken.uid;

    switch (req.method) {
      case "GET":
        return handleGet(req, res, userId);
      case "POST":
        return handlePost(req, res, userId);
      case "PUT":
        return handlePut(req, res, userId);
      case "DELETE":
        return handleDelete(req, res, userId);
      default:
        res.setHeader("Allow", "GET,POST,PUT,DELETE");
        return res.status(405).json({ message: "Method Not Allowed" });
    }
  } catch (error) {
    console.error("[rating] error", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const lower = message.toLowerCase();
    const status = lower.includes("authorization")
      ? 401
      : lower.includes("required") || lower.includes("numeric") || lower.includes("invalid")
      ? 400
      : 500;
    return res.status(status).json({ message });
  }
}

async function handleGet(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { time } = req.query;
  if (time && typeof time === "string") {
    const rating = await SurfRating.findOne({ userId, time }).lean();
    if (!rating) {
      return res.status(404).json({ message: "Rating not found" });
    }
    return res.status(200).json(rating);
  }

  const ratings = await SurfRating.find({ userId }).sort({ time: 1 }).lean();
  return res.status(200).json(ratings);
}

async function handlePost(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const body: RatingRequestBody = req.body;

  if (!body?.time) {
    return res.status(400).json({ message: "time is required" });
  }

  const { rating } = body;
  if (!rating) {
    return res.status(400).json({ message: "rating is required" });
  }

  if (!WAVE_SIZE_OPTIONS.includes(rating.waveSize)) {
    return res.status(400).json({ message: "Invalid waveSize" });
  }
  if (!QUALITY_OPTIONS.includes(rating.quality)) {
    return res.status(400).json({ message: "Invalid quality" });
  }

  const ratingQuality = enforceQualityRule(rating.waveSize, rating.quality);

  const payload = {
    userId,
    time: body.time,
    waveSize: requireNumber(body.waveSize, "waveSize"),
    wavePeriod: requireNumber(body.wavePeriod, "wavePeriod"),
    waveDirection: requireNumber(body.waveDirection, "waveDirection"),
    windWaveHeight: requireNumber(body.windWaveHeight, "windWaveHeight"),
    windWavePeriod: requireNumber(body.windWavePeriod, "windWavePeriod"),
    windWaveDirection: requireNumber(body.windWaveDirection, "windWaveDirection"),
    swellWaveHeight: requireNumber(body.swellWaveHeight, "swellWaveHeight"),
    swellWavePeriod: requireNumber(body.swellWavePeriod, "swellWavePeriod"),
    swellWaveDirection: requireNumber(body.swellWaveDirection, "swellWaveDirection"),
    secondarySwellWaveHeight: requireNumber(body.secondarySwellWaveHeight, "secondarySwellWaveHeight"),
    secondarySwellWavePeriod: requireNumber(body.secondarySwellWavePeriod, "secondarySwellWavePeriod"),
    secondarySwellWaveDirection: requireNumber(body.secondarySwellWaveDirection, "secondarySwellWaveDirection"),
    windSpeed: requireNumber(body.windSpeed, "windSpeed"),
    windDirection: requireNumber(body.windDirection, "windDirection"),
    rating_waveSize: rating.waveSize,
    rating_quality: ratingQuality,
  };

  try {
    const created = await SurfRating.create(payload);
    return res.status(201).json(created);
  } catch (error) {
    if (error instanceof Error && error.message.includes("duplicate key")) {
      return res.status(409).json({ message: "A rating already exists for this time" });
    }
    throw error;
  }
}

async function handlePut(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const body: RatingRequestBody = req.body;
  if (!body?.time) {
    return res.status(400).json({ message: "time is required" });
  }
  if (!body.rating) {
    return res.status(400).json({ message: "rating is required" });
  }
  if (!WAVE_SIZE_OPTIONS.includes(body.rating.waveSize)) {
    return res.status(400).json({ message: "Invalid waveSize" });
  }
  if (!QUALITY_OPTIONS.includes(body.rating.quality)) {
    return res.status(400).json({ message: "Invalid quality" });
  }

  const ratingQuality = enforceQualityRule(body.rating.waveSize, body.rating.quality);

  const update = {
    waveSize: requireNumber(body.waveSize, "waveSize"),
    wavePeriod: requireNumber(body.wavePeriod, "wavePeriod"),
    waveDirection: requireNumber(body.waveDirection, "waveDirection"),
    windWaveHeight: requireNumber(body.windWaveHeight, "windWaveHeight"),
    windWavePeriod: requireNumber(body.windWavePeriod, "windWavePeriod"),
    windWaveDirection: requireNumber(body.windWaveDirection, "windWaveDirection"),
    swellWaveHeight: requireNumber(body.swellWaveHeight, "swellWaveHeight"),
    swellWavePeriod: requireNumber(body.swellWavePeriod, "swellWavePeriod"),
    swellWaveDirection: requireNumber(body.swellWaveDirection, "swellWaveDirection"),
    secondarySwellWaveHeight: requireNumber(body.secondarySwellWaveHeight, "secondarySwellWaveHeight"),
    secondarySwellWavePeriod: requireNumber(body.secondarySwellWavePeriod, "secondarySwellWavePeriod"),
    secondarySwellWaveDirection: requireNumber(body.secondarySwellWaveDirection, "secondarySwellWaveDirection"),
    windSpeed: requireNumber(body.windSpeed, "windSpeed"),
    windDirection: requireNumber(body.windDirection, "windDirection"),
    rating_waveSize: body.rating.waveSize,
    rating_quality: ratingQuality,
  };

  const updated = await SurfRating.findOneAndUpdate({ userId, time: body.time }, update, {
    new: true,
  });

  if (!updated) {
    return res.status(404).json({ message: "Rating not found" });
  }

  return res.status(200).json(updated);
}

async function handleDelete(req: NextApiRequest, res: NextApiResponse, userId: string) {
  const { time } = req.query;
  if (!time || typeof time !== "string") {
    return res.status(400).json({ message: "time is required" });
  }

  const deleted = await SurfRating.findOneAndDelete({ userId, time });
  if (!deleted) {
    return res.status(404).json({ message: "Rating not found" });
  }

  return res.status(204).end();
}
