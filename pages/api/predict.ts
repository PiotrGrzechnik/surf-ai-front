import type { NextApiRequest, NextApiResponse } from "next";
import { DecisionTreeClassifier } from "ml-cart";
import { firebaseAdminAuth } from "../../lib/firebaseAdmin";
import { connectMongo } from "../../lib/mongodb";
import { SurfRating } from "../../models/SurfRating";
import type { RatingQuality, RatingWaveSize } from "../../types/rating";

const FEATURE_FIELDS = [
  "waveSize",
  "wavePeriod",
  "waveDirection",
  "windWaveHeight",
  "windWavePeriod",
  "windWaveDirection",
  "swellWaveHeight",
  "swellWavePeriod",
  "swellWaveDirection",
  "secondarySwellWaveHeight",
  "secondarySwellWavePeriod",
  "secondarySwellWaveDirection",
  "windSpeed",
  "windDirection",
] as const;

type FeatureKey = (typeof FEATURE_FIELDS)[number];

interface PredictResponse {
  predicted: {
    waveSize: RatingWaveSize;
    quality: RatingQuality;
  };
  samplesUsed: number;
}

const TREE_CONFIG = { gainFunction: "gini", maxDepth: 6, minNumSamples: 2 };

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse<PredictResponse | { message: string }>
) {
  if (req.method !== "GET") {
    res.setHeader("Allow", "GET");
    return res.status(405).json({ message: "Method Not Allowed" });
  }

  try {
    const authHeader = req.headers.authorization;
    if (!authHeader?.startsWith("Bearer ")) {
      return res.status(401).json({ message: "Missing or invalid authorization header" });
    }

    const token = authHeader.split("Bearer ")[1];
    const decoded = await firebaseAdminAuth.verifyIdToken(token);

    if (req.query.userId && req.query.userId !== decoded.uid) {
      return res.status(403).json({ message: "Forbidden" });
    }

    const featureVector = parseFeatures(req.query);
    await connectMongo();

    const ratings = await SurfRating.find({ userId: decoded.uid }).lean();
    if (!ratings.length) {
      return res.status(400).json({ message: "Not enough training data to make a prediction" });
    }

    const featureMatrix = ratings.map((rating) =>
      FEATURE_FIELDS.map((field) => Number(rating[field]))
    );

    const qualityClassifier = new DecisionTreeClassifier(TREE_CONFIG);
    const waveSizeClassifier = new DecisionTreeClassifier(TREE_CONFIG);

    qualityClassifier.train(featureMatrix, ratings.map((rating) => rating.rating_quality));
    waveSizeClassifier.train(featureMatrix, ratings.map((rating) => rating.rating_waveSize));

    const predictedQuality = qualityClassifier.predict([featureVector])[0] as RatingQuality;
    const predictedWaveSize = waveSizeClassifier.predict([featureVector])[0] as RatingWaveSize;

    return res.status(200).json({
      predicted: {
        waveSize: predictedWaveSize,
        quality: predictedQuality,
      },
      samplesUsed: ratings.length,
    });
  } catch (error) {
    console.error("[predict] error", error);
    const message = error instanceof Error ? error.message : "Internal Server Error";
    const isBadRequest =
      message.includes("Missing query parameter") || message.includes("Invalid numeric value");
    const isAuthError = message.toLowerCase().includes("auth");
    const status = isBadRequest ? 400 : isAuthError ? 401 : 500;
    return res.status(status).json({ message });
  }
}

function parseFeatures(query: NextApiRequest["query"]): number[] {
  return FEATURE_FIELDS.map((field) => {
    const value = query[field];
    if (value === undefined) {
      throw new Error(`Missing query parameter: ${field}`);
    }

    const numericValue = Array.isArray(value) ? Number(value[0]) : Number(value);
    if (!Number.isFinite(numericValue)) {
      throw new Error(`Invalid numeric value for ${field}`);
    }
    return numericValue;
  });
}
