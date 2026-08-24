// scripts/preload-env.ts — Must run BEFORE any other imports
import { readFileSync } from "node:fs";
import { resolve } from "node:path";

const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=");
    if (!process.env[key.trim()]) {
      process.env[key.trim()] = value.replace(/^["']|["']$/g, "");
    }
  }
}

if (!process.env.MONGODB_URI) {
  console.error("ERROR: MONGODB_URI not loaded");
  process.exit(1);
}

console.log("✓ Environment loaded from .env.local");
