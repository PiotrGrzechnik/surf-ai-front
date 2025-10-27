import mongoose from "mongoose";

/**
 * Cached connection across hot reloads to prevent creating redundant clients.
 */
interface MongooseCache {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
}

declare global {
  // eslint-disable-next-line no-var
  var mongooseCache: MongooseCache | undefined;
}

const MONGODB_URI = process.env.MONGODB_URI ?? "";

if (!MONGODB_URI) {
  throw new Error("Please define the MONGODB_URI environment variable inside .env.local");
}

const cache: MongooseCache = global.mongooseCache ?? { conn: null, promise: null };

/**
 * Establishes (or reuses) a Mongoose connection.
 */
export async function connectMongo(): Promise<typeof mongoose> {
  if (cache.conn) {
    return cache.conn;
  }

  if (!cache.promise) {
    cache.promise = mongoose.connect(MONGODB_URI, { bufferCommands: false });
  }

  cache.conn = await cache.promise;
  global.mongooseCache = cache;
  return cache.conn;
}
