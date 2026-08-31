"use client";

import Link from "next/link";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html lang="en">
      <body>
        <div className="flex min-h-screen flex-col items-center justify-center bg-white px-4">
          <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">
            Something went wrong
          </p>
          <h1 className="mt-3 text-4xl font-black tracking-normal text-neutral-950 md:text-6xl">
            We couldn&apos;t load this page
          </h1>
          <p className="mt-4 text-lg leading-8 text-neutral-600">
            Please try again or return to the homepage.
          </p>
          <div className="mt-8 flex gap-4">
            <button
              onClick={() => reset()}
              className="inline-flex items-center gap-2 bg-red-700 px-5 py-3 text-sm font-black uppercase text-white transition hover:bg-red-800"
            >
              <svg
                xmlns="http://www.w3.org/2000/svg"
                width="14"
                height="14"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              >
                <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                <path d="M3 3v5h5" />
              </svg>
              Try again
            </button>
            <Link
              href="/"
              className="inline-flex items-center gap-2 border-2 border-neutral-950 px-5 py-3 text-sm font-black uppercase text-neutral-950 transition hover:bg-neutral-950 hover:text-white"
            >
              Go homepage
            </Link>
          </div>
        </div>
      </body>
    </html>
  );
}
