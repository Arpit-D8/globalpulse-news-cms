import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: process.env.VERCEL ? undefined : 'standalone',
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.cloudinary.com",
      },
      {
        protocol: "https",
        hostname: "images.unsplash.com",
      },
    ],
  },
  async headers() {
    const headersList: any[] = [
      {
        key: "X-Frame-Options",
        value: "DENY",
      },
      {
        key: "X-Content-Type-Options",
        value: "nosniff",
      },
      {
        key: "Referrer-Policy",
        value: "strict-origin-when-cross-origin",
      },
      {
        key: "Permissions-Policy",
        value:
          "camera=(), microphone=(), geolocation=(), payment=(), usb=(), magnetometer=(), gyroscope=(), accelerometer=()",
      },
      {
        key: "Cross-Origin-Opener-Policy",
        value: "same-origin",
      },
      {
        key: "Cross-Origin-Resource-Policy",
        value: "same-origin",
      },
      {
        key: "Content-Security-Policy",
        value: [
          "default-src 'self'",
          "script-src 'self' 'unsafe-inline' https://res.cloudinary.com https://upload.cloudinary.com https://api.cloudinary.com",
          "style-src 'self' 'unsafe-inline'",
          "img-src 'self' data: https://*.cloudinary.com https://images.unsplash.com",
          "font-src 'self'",
          "connect-src 'self' https://res.cloudinary.com https://upload.cloudinary.com https://api.cloudinary.com https://*.googleapis.com",
          "frame-src 'self'",
          "base-uri 'self'",
          "form-action 'self'",
          "frame-ancestors 'none'",
          "navigate-to 'self'",
          "object-src 'none'",
        ].join("; "),
      },
    ];

    // HSTS: Enforce HTTPS in production only (avoid breaking localhost dev)
    if (process.env.NODE_ENV === "production") {
      headersList.push({
        key: "Strict-Transport-Security",
        value: "max-age=31536000; includeSubDomains",
      });
    }

    return [
      {
        source: "/(.*)",
        headers: headersList,
      },
    ];
  },
};

export default nextConfig;
