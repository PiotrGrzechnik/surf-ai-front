import { readFile } from "node:fs/promises";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { connectMongo } from "@/lib/mongodb";
import { SurfRating } from "@/models/SurfRating";
import { loadBackendEnv } from "./backend-env.js";

const __dirname = dirname(fileURLToPath(import.meta.url));
loadBackendEnv();

async function main() {
  const dataFile = process.argv[2]
    ? resolve(process.cwd(), process.argv[2])
    : resolve(__dirname, "../data/sample-ratings.json");

  console.log(`Loading seed data from ${dataFile}`);
  const raw = await readFile(dataFile, "utf-8");
  const ratings = JSON.parse(raw);

  if (!Array.isArray(ratings) || !ratings.length) {
    throw new Error("Seed data must be a non-empty array");
  }

  await connectMongo();

  const operations = ratings.map((entry) => ({
    updateOne: {
      filter: { userId: entry.userId, time: entry.time },
      update: { $set: entry },
      upsert: true,
    },
  }));

  const result = await SurfRating.bulkWrite(operations);
  console.log(`Upserted ${result.upsertedCount}, modified ${result.modifiedCount}.`);
}

main()
  .then(() => {
    console.log("Seed completed ✅");
    process.exit(0);
  })
  .catch((error) => {
    console.error("Seed failed ❌", error);
    process.exit(1);
  });
