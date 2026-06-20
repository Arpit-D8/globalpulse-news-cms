import Link from "next/link";
import { FaRegNewspaper, FaUserShield } from "react-icons/fa6";
import { CATEGORIES, CATEGORY_CONFIG } from "@/lib/constants";

export function Header() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="bg-neutral-950 text-xs font-medium text-white">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
          <span>Live newsroom updates</span>
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-neutral-200 transition hover:text-white"
          >
            <FaUserShield aria-hidden="true" />
            Admin
          </Link>
        </div>
      </div>

      <div className="mx-auto flex max-w-7xl flex-col gap-4 px-4 py-5 md:flex-row md:items-end md:justify-between">
        <Link href="/" className="inline-flex items-center gap-3">
          <span className="grid size-12 place-items-center bg-red-700 text-white">
            <FaRegNewspaper aria-hidden="true" className="text-2xl" />
          </span>
          <span>
            <span className="block text-3xl font-black uppercase leading-none tracking-normal text-neutral-950 md:text-4xl">
              GlobalPulse
            </span>
            <span className="block text-sm font-semibold uppercase tracking-[0.18em] text-red-700">
              News Network
            </span>
          </span>
        </Link>

        <nav aria-label="Primary navigation" className="flex flex-wrap gap-2">
          {CATEGORIES.map((category) => (
            <Link
              key={category}
              href={`/category/${CATEGORY_CONFIG[category].slug}`}
              className="border border-neutral-300 px-3 py-2 text-sm font-bold uppercase text-neutral-800 transition hover:border-red-700 hover:bg-red-700 hover:text-white"
            >
              {category}
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
