import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// ---------------------------------------------------------------------------
// Constants — External origins the app actually uses
// ---------------------------------------------------------------------------

const CLOUDINARY_HOSTS = [
  "https://res.cloudinary.com",
  "https://upload.cloudinary.com",
  "https://api.cloudinary.com",
];

const CLOUDINARY_IMG_SRC = [...CLOUDINARY_HOSTS, "https://*.cloudinary.com"];

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Build a CSP header value from a directive map.
 *
 * Each directive value is an array of source list tokens.
 * Empty arrays are skipped so directives are omitted when not needed.
 */
function buildCsp(directives: Record<string, string[]>): string {
  return Object.entries(directives)
    .filter(([, values]) => values.length > 0)
    .map(([directive, values]) => `${directive} ${values.join(" ")}`)
    .join("; ");
}

/**
 * Detect production environment.
 *
 * Checks VERCEL_ENV (Vercel), NODE_ENV, and NEXT_PUBLIC_VERCEL_ENV.
 */
function isProduction(): boolean {
  return (
    process.env.VERCEL_ENV === "production" ||
    process.env.NODE_ENV === "production" ||
    process.env.NEXT_PUBLIC_VERCEL_ENV === "production"
  );
}

// ---------------------------------------------------------------------------
// Core — Apply security headers
// ---------------------------------------------------------------------------

export function middleware(request: NextRequest) {
  const response = NextResponse.next();

  const { pathname } = request.nextUrl;

  // Skip middleware for static assets and Next.js internal routes
  // to avoid interfering with Next.js image optimization and HMR.
  if (
    pathname.startsWith("/_next/") ||
    pathname.startsWith("/api/") ||
    pathname.match(/\.(ico|svg|png|jpg|jpeg|gif|webp|woff2?)$/i)
  ) {
    return response;
  }

  const production = isProduction();

  // ------------------------------------------------------------------
  // Content-Security-Policy
  // ------------------------------------------------------------------

  const cspDirectives: Record<string, string[]> = {
    // Default fallback: only allow same-origin resources
    "default-src": ["'self'"],

    // Scripts: same-origin + Cloudinary (for image scripts) + unsafe-inline
    // (Next.js app router injects inline scripts; Tailwind v4 may use inline styles)
    "script-src": [
      "'self'",
      "'unsafe-inline'",
      ...CLOUDINARY_HOSTS,
    ],

    // Styles: same-origin + unsafe-inline (Tailwind v4 requires it)
    "style-src": [
      "'self'",
      "'unsafe-inline'",
    ],

    // Images: same-origin + data URIs + Cloudinary
    "img-src": [
      "'self'",
      "data:",
      ...CLOUDINARY_IMG_SRC,
    ],

    // Fonts: same-origin only (no external font libraries in this project)
    "font-src": ["'self'"],

    // Fetch/AJAX: same-origin + Cloudinary API
    "connect-src": [
      "'self'",
      ...CLOUDINARY_HOSTS,
      "https://*.googleapis.com", // NextAuth Google provider (if used)
    ],

    // Embedding: allow same-origin iframes
    "frame-src": ["'self'"],

    // Prevent <base> tag abuse
    "base-uri": ["'self'"],

    // Form submission: same-origin only
    "form-action": ["'self'"],

    // Clickjacking protection: deny framing
    "frame-ancestors": ["'none'"],

    // Restrict browser navigation via JS
    "navigate-to": ["'self'"],

    // Block plugin-based content
    "object-src": ["'none'"],

    // Upgrade insecure requests (production only)
    // (handled separately below)
  };

  if (production) {
    // Enforce HTTPS in production
    cspDirectives["upgrade-insecure-requests"] = [];
  }

  response.headers.set(
    "Content-Security-Policy",
    buildCsp(cspDirectives)
  );

  // ------------------------------------------------------------------
  // X-Frame-Options (legacy, complemented by CSP frame-ancestors)
  // ------------------------------------------------------------------
  response.headers.set("X-Frame-Options", "DENY");

  // ------------------------------------------------------------------
  // X-Content-Type-Options
  // ------------------------------------------------------------------
  response.headers.set("X-Content-Type-Options", "nosniff");

  // ------------------------------------------------------------------
  // Referrer-Policy
  // ------------------------------------------------------------------
  response.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");

  // ------------------------------------------------------------------
  // Permissions-Policy
  // ------------------------------------------------------------------
  response.headers.set(
    "Permissions-Policy",
    [
      "camera=()",
      "microphone=()",
      "geolocation=()",
      "payment=()",
      "usb=()",
      "magnetometer=()",
      "gyroscope=()",
      "accelerometer=()",
    ].join(", ")
  );

  // ------------------------------------------------------------------
  // Strict-Transport-Security (production only)
  // ------------------------------------------------------------------
  if (production) {
    // 1 year + includeSubDomains + preload
    response.headers.set(
      "Strict-Transport-Security",
      "max-age=31536000; includeSubDomains; preload"
    );
  }

  // ------------------------------------------------------------------
  // Cross-Origin-Opener-Policy
  // ------------------------------------------------------------------
  response.headers.set("Cross-Origin-Opener-Policy", "same-origin");

  // ------------------------------------------------------------------
  // Cross-Origin-Resource-Policy
  // ------------------------------------------------------------------
  response.headers.set("Cross-Origin-Resource-Policy", "same-origin");

  return response;
}

// ---------------------------------------------------------------------------
// Matcher — Run on all page routes, skip API/static/Next.js internals
// ---------------------------------------------------------------------------

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - API routes (/api/*)
     * - Next.js internals (_next/static, _next/image, favicon.ico)
     * - Static files (extensions)
     */
    "/((?!api|_next/static|_next/image|favicon\\.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp|woff2?)$).*)",
  ],
};
