import { v2 as cloudinary } from "cloudinary";

/**
 * Cloudinary configuration singleton.
 *
 * Reads cloud credentials from environment variables and initialises the
 * Cloudinary v2 SDK. Throws at module load time if any required variable
 * is missing so misconfigured deployments fail fast.
 */
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// ---------------------------------------------------------------------------
// Validation
// ---------------------------------------------------------------------------

const missingVars: string[] = [];

if (!process.env.CLOUDINARY_CLOUD_NAME) {
  missingVars.push("CLOUDINARY_CLOUD_NAME");
}
if (!process.env.CLOUDINARY_API_KEY) {
  missingVars.push("CLOUDINARY_API_KEY");
}
if (!process.env.CLOUDINARY_API_SECRET) {
  missingVars.push("CLOUDINARY_API_SECRET");
}

if (missingVars.length > 0) {
  throw new Error(
    `Cloudinary configuration error: missing ${missingVars.join(", ")}. ` +
      "Add these values to .env.local and restart the dev server."
  );
}

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/**
 * Configured Cloudinary instance (v2 API).
 *
 * @see https://cloudinary.com/documentation/cloudinary_nodesdk
 */
export { cloudinary };
