// Import env.ts to trigger startup validation of MONGODB_URI (and all other
// required environment variables).  The validated value is consumed via
// getMongodbUri() below.
import { getMongodbUri } from "@/lib/env";

import mongoose from "mongoose";

// Ensure all Mongoose models are registered before any query runs.
// This prevents MissingSchemaError when .populate() resolves references.
import "@/models/Article";
import "@/models/Author";
import "@/models/Category";
import "@/models/Media";
import "@/models/Tag";

type MongooseCache = {
  conn: typeof mongoose | null;
  promise: Promise<typeof mongoose> | null;
};

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached = globalThis.mongooseCache ?? {
  conn: null,
  promise: null,
};

if (!globalThis.mongooseCache) {
  globalThis.mongooseCache = cached;
}

export async function connectDB() {
  if (cached.conn) {
    return cached.conn;
  }

  cached.promise ??= mongoose.connect(getMongodbUri(), {
    bufferCommands: false,
  });

  cached.conn = await cached.promise;
  return cached.conn;
}
