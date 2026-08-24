import Link from "next/link";
import { FaRegNewspaper, FaUserShield, FaSearchengin } from "react-icons/fa6";
import { CategoryNav } from "./CategoryNav";

export function Header() {
  return (
    <header className="border-b border-neutral-200 bg-white">
      <div className="border-b border-neutral-100">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-2">
          <span className="text-xs font-medium text-neutral-500">Live newsroom updates</span>

          <form action="/search" method="GET" className="flex items-center gap-3">
            <div className="relative">
              <input
                type="search"
                name="q"
                placeholder="Search news..."
                className="w-48 rounded-full border border-neutral-200 bg-neutral-50 py-1.5 pr-9 pl-4 text-xs font-semibold text-neutral-800 outline-none transition focus:border-red-700 focus:bg-white focus:ring-2 focus:ring-red-100 md:w-64"
              />
              <button
                type="submit"
                className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 transition hover:text-red-700"
                aria-label="Search"
              >
                <FaSearchengin aria-hidden="true" className="text-xs" />
              </button>
            </div>
          </form>

          <Link
            href="/admin"
            className="inline-flex items-center gap-2 text-xs font-medium text-neutral-500 transition hover:text-red-700"
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
              VIDARBHA PRINT
            </span>
            <span className="block text-sm font-semibold uppercase tracking-[0.18em] text-red-700">
              News Network
            </span>
          </span>
        </Link>

        <CategoryNav />
      </div>
    </header>
  );
}
