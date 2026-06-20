import Link from "next/link";
import { FaHouse } from "react-icons/fa6";
import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export default function NotFound() {
  return (
    <main>
      <Header />
      <section className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="text-xs font-black uppercase tracking-[0.2em] text-red-700">
          404
        </p>
        <h1 className="mt-3 text-4xl font-black tracking-normal text-neutral-950 md:text-6xl">
          Story not found
        </h1>
        <p className="mt-4 text-lg leading-8 text-neutral-600">
          The page may have moved, or the article is no longer published.
        </p>
        <Link
          href="/"
          className="mt-8 inline-flex items-center gap-2 bg-red-700 px-5 py-3 text-sm font-black uppercase text-white transition hover:bg-red-800"
        >
          <FaHouse aria-hidden="true" />
          Home
        </Link>
      </section>
      <Footer />
    </main>
  );
}
