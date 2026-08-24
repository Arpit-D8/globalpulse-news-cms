import { CategoryNav } from "./CategoryNav";

export function Footer() {
  return (
    <footer className="mt-16 border-t border-neutral-200 bg-neutral-950 text-neutral-200">
      <div className="mx-auto grid max-w-7xl gap-8 px-4 py-10 md:grid-cols-[1.4fr_1fr]">
        <div>
          <p className="text-2xl font-black uppercase text-white">VIDARBHA PRINT</p>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-neutral-400">
            A newsroom CMS for fast publishing, category coverage, breaking
            updates, and editorial control across every screen.
          </p>
        </div>
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-white">
            Sections
          </p>
          <div className="mt-4">
            <CategoryNav variant="dark" />
          </div>
        </div>
      </div>
    </footer>
  );
}
