import { v2 as cloudinary } from "cloudinary";

// Import env.ts to trigger startup validation of CLOUDINARY_* variables
// (and all other required environment variables).
import { getCloudinaryConfig } from "@/lib/env";

const { cloudName, apiKey, apiSecret } = getCloudinaryConfig();

cloudinary.config({ cloudName, apiKey, apiSecret });

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------

/**
 * Configured Cloudinary instance (v2 API).
 *
 * @see https://cloudinary.com/documentation/cloudinary_nodesdk
 */
export { cloudinary };
