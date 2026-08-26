// ===========================================================================
// Environment Variable Validation
// ===========================================================================
//
// Validates all required environment variables at module load time so that
// misconfigured deployments fail fast with a clear error message instead of
// producing cryptic runtime errors later.
//
// Required variables (validated at import):
//   - MONGODB_URI
//   - NEXTAUTH_SECRET
//   - ADMIN_EMAIL
//   - ADMIN_PASSWORD
//   - CLOUDINARY_CLOUD_NAME
//   - CLOUDINARY_API_KEY
//   - CLOUDINARY_API_SECRET
//
// Optional / feature-specific (validated at point of use, not at startup):
//   - GEMINI_API_KEY  — AI content generation
//   - NEWS_API_KEY    — external news import
//   - NEXT_PUBLIC_SITE_URL — SEO metadata (defaults to http://localhost:3000)
//
// Import this module early (e.g. in proxy.ts or a top-level layout) to
// ensure all required variables are present before any other module loads.
// ===========================================================================

// ---------------------------------------------------------------------------
// 1. Validation
// ---------------------------------------------------------------------------

const REQUIRED_VARS: Record<string, string> = {
  MONGODB_URI: "MongoDB connection string (e.g. mongodb://localhost:27017/news-website)",
  NEXTAUTH_SECRET: "Random secret for signing NextAuth sessions (openssl rand -hex 32)",
  ADMIN_EMAIL: "Admin email address for built-in credentials provider",
  ADMIN_PASSWORD: "Admin password for built-in credentials provider",
  CLOUDINARY_CLOUD_NAME: "Cloudinary cloud name for media upload",
  CLOUDINARY_API_KEY: "Cloudinary API key for media upload",
  CLOUDINARY_API_SECRET: "Cloudinary API secret for media upload",
};

const missing: string[] = [];

for (const [key, description] of Object.entries(REQUIRED_VARS)) {
  if (!process.env[key]) {
    missing.push(`${key}\n    → ${description}`);
  }
}

if (missing.length > 0) {
  const body = missing.join("\n\n");
  throw new Error(
    `Environment validation failed — the following required variables are missing:\n\n${body}\n\nAdd these to your .env.local (or deployment environment) and restart the server.`
  );
}

// ---------------------------------------------------------------------------
// 2. Export validated values (type-safe accessors)
// ---------------------------------------------------------------------------

/**
 * Returns the validated MONGODB_URI.
 *
 * Use this instead of reading process.env.MONGODB_URI directly.
 */
export function getMongodbUri(): string {
  return process.env.MONGODB_URI!;
}

/**
 * Returns the validated NEXTAUTH_SECRET.
 *
 * Use this instead of reading process.env.NEXTAUTH_SECRET directly.
 */
export function getNextauthSecret(): string {
  return process.env.NEXTAUTH_SECRET!;
}

/**
 * Returns the validated admin credentials.
 */
export function getAdminCredentials() {
  return {
    email: process.env.ADMIN_EMAIL!,
    password: process.env.ADMIN_PASSWORD!,
  };
}

/**
 * Returns the validated Cloudinary configuration.
 */
export function getCloudinaryConfig() {
  return {
    cloudName: process.env.CLOUDINARY_CLOUD_NAME!,
    apiKey: process.env.CLOUDINARY_API_KEY!,
    apiSecret: process.env.CLOUDINARY_API_SECRET!,
  };
}

// ---------------------------------------------------------------------------
// 3. Optional / feature-specific variables (not validated at startup)
// ---------------------------------------------------------------------------

/**
 * Returns GEMINI_API_KEY if configured, undefined otherwise.
 *
 * Feature-specific — only needed for AI content generation.
 */
export function getGeminiApiKey(): string | undefined {
  return process.env.GEMINI_API_KEY;
}

/**
 * Returns NEWS_API_KEY if configured, undefined otherwise.
 *
 * Feature-specific — only needed for external news import.
 */
export function getNewsApiKey(): string | undefined {
  return process.env.NEWS_API_KEY;
}

/**
 * Returns NEXT_PUBLIC_SITE_URL if configured, defaults to http://localhost:3000.
 *
 * Public variable — used for SEO meta tags and sitemaps.
 */
export function getSiteUrl(): string {
  return process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";
}
