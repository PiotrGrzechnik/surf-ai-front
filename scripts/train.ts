import { DecisionTreeClassifier } from "ml-cart";
import type { TrainingOptions } from "ml-cart";
import { connectMongo } from "@/lib/mongodb";
import { SurfRating } from "@/models/SurfRating";
import { loadBackendEnv } from "./backend-env.js";

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

const TREE_CONFIG: TrainingOptions = {
  gainFunction: "gini",
  maxDepth: 6,
  minNumSamples: 2,
};

async function main() {
  loadBackendEnv();
  const userId = process.argv[2];
  if (!userId) {
    throw new Error("Usage: npm run backend:train -- <userId>");
  }

  await connectMongo();
  const docs = await SurfRating.find({ userId }).lean();

  if (!docs.length) {
    throw new Error(`No ratings found for userId=${userId}`);
  }

  const featureMatrix = docs.map((doc) => FEATURE_FIELDS.map((field) => Number(doc[field])));

  const qualityTree = new DecisionTreeClassifier(TREE_CONFIG);
  const waveSizeTree = new DecisionTreeClassifier(TREE_CONFIG);

  qualityTree.train(featureMatrix, docs.map((doc) => doc.rating_quality));
  waveSizeTree.train(featureMatrix, docs.map((doc) => doc.rating_waveSize));

  const qualityPredictions = featureMatrix.map((features) => qualityTree.predict([features])[0]);
  const waveSizePredictions = featureMatrix.map((features) => waveSizeTree.predict([features])[0]);

  const qualityAccuracy = accuracy(qualityPredictions, docs.map((doc) => doc.rating_quality));
  const waveSizeAccuracy = accuracy(waveSizePredictions, docs.map((doc) => doc.rating_waveSize));

  console.log(`Quality accuracy: ${(qualityAccuracy * 100).toFixed(1)}%`);
  console.log(`Wave size accuracy: ${(waveSizeAccuracy * 100).toFixed(1)}%`);
  console.log("Decision tree snapshot:");
  console.log(
    JSON.stringify(
      {
        qualityTree: qualityTree.toJSON(),
        waveSizeTree: waveSizeTree.toJSON(),
      },
      null,
      2
    )
  );
}

function accuracy(predicted: unknown[], actual: unknown[]): number {
  const correct = predicted.filter((value, index) => value === actual[index]).length;
  return correct / actual.length;
}

main()
  .then(() => {
    console.log("Training complete ✅");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Training failed ❌", error);
    process.exit(1);
  });
