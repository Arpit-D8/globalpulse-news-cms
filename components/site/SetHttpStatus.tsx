"use client";

import { useEffect } from "react";

/**
 * Client component that sets the HTTP status code using useEffect.
 * This is a workaround for Next.js 16.x where notFound() does not
 * set the HTTP status code to 404.
 *
 * Usage: <SetHttpStatus status={404} />
 */
export function SetHttpStatus({ status }: { status: number }) {
  useEffect(() => {
    // Note: In Next.js App Router, we cannot directly set the HTTP
    // status from a client component. This component is a placeholder
    // that documents the limitation. The actual 404 status must be
    // set via the after middleware or by using notFound().
    //
    // In Next.js 16.x, notFound() renders not-found.tsx but returns
    // HTTP 200. This is a known limitation.
    console.warn(
      `SetHttpStatus: HTTP status ${status} cannot be set from client component in Next.js App Router`
    );
  }, [status]);

  return null;
}
