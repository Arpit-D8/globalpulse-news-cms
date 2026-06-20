import Link from "next/link";
import { CATEGORIES, CATEGORY_CONFIG } from "@/lib/constants";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-neutral-200 bg-neutral-950 text-neutral-200">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-2xl font-black uppercase text-white">GlobalPulse</p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
            A newsroom CMS for fast publishing, category coverage, breaking
            updates, and editorial control across every screen.
          </p>
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-white">
            Sections
          </p>
          <div className="mt-4 flex flex-wrap gap-2">
            {CATEGORIES.map((category) => (
              <Link
                key={category}
                href={`/category/${CATEGORY_CONFIG[category].slug}`}
                className="border border-neutral-700 px-3 py-2 text-sm font-semibold text-neutral-300 transition hover:border-white hover:text-white"
              >
                {category}
              </Link>
            ))}
          </div>
        </div>
      </div>
    </footer>
  );
}
