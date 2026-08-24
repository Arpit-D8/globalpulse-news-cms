import { Header } from "@/components/site/Header";
import { Footer } from "@/components/site/Footer";

export default function Loading() {
  return (
    <main>
      <Header />

      {/* Hero / Top Updates skeleton */}
      <section className="border-b border-neutral-200 bg-white">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 py-8 lg:grid-cols-[1fr_360px]">
          <div className="bg-white">
            <div className="grid bg-white md:grid-cols-[1.4fr_1fr]">
              <div className="relative min-h-80 overflow-hidden bg-neutral-200 md:min-h-[480px]">
                <div className="absolute inset-0 animate-pulse bg-gradient-to-r from-neutral-200 via-neutral-100 to-neutral-200" />
              </div>
              <div className="flex flex-col justify-center border-t-4 border-red-700 p-6 md:p-8">
                <div className="mt-3 h-5 w-24 animate-pulse rounded bg-neutral-200" />
                <div className="mt-4 h-8 w-3/4 animate-pulse rounded bg-neutral-200 md:h-10" />
                <div className="mt-4 h-4 w-full animate-pulse rounded bg-neutral-200" />
                <div className="mt-2 h-4 w-2/3 animate-pulse rounded bg-neutral-200" />
              </div>
            </div>
          </div>

          <aside className="border-t-4 border-neutral-950 bg-neutral-50 p-5">
            <div className="mb-3 h-5 w-28 animate-pulse rounded bg-neutral-200" />
            <div className="space-y-4">
              {[1, 2, 3, 4, 5].map((i) => (
                <div key={i} className="flex items-center gap-3 py-3">
                  <div className="h-16 w-16 flex-shrink-0 animate-pulse rounded bg-neutral-200" />
                  <div className="flex-1 space-y-2">
                    <div className="h-4 w-3/4 animate-pulse rounded bg-neutral-200" />
                    <div className="h-3 w-1/2 animate-pulse rounded bg-neutral-200" />
                  </div>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {/* Latest Stories skeleton */}
      <section className="mx-auto max-w-7xl px-4 py-10">
        <div className="mb-5 h-8 w-40 animate-pulse rounded bg-neutral-200 pb-3" />
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="bg-white">
              <div className="aspect-[16/10] animate-pulse bg-neutral-200" />
              <div className="p-4 space-y-2">
                <div className="h-3 w-16 animate-pulse rounded bg-neutral-200" />
                <div className="h-5 w-full animate-pulse rounded bg-neutral-200" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-neutral-200" />
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Category sections skeleton */}
      <section className="bg-white py-10">
        <div className="mx-auto max-w-7xl px-4">
          <div className="grid gap-8 lg:grid-cols-5">
            {[1, 2, 3, 4, 5].map((i) => (
              <div key={i} className="border-t-4 border-neutral-950 pt-4">
                <div className="min-h-28 space-y-3">
                  <div className="h-3 w-20 animate-pulse rounded bg-neutral-200" />
                  <div className="h-6 w-32 animate-pulse rounded bg-neutral-200" />
                </div>
                <div className="divide-y divide-neutral-200">
                  {[1, 2, 3].map((j) => (
                    <div key={j} className="flex items-center gap-3 py-3">
                      <div className="h-12 w-12 flex-shrink-0 animate-pulse rounded bg-neutral-200" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-full animate-pulse rounded bg-neutral-200" />
                        <div className="h-3 w-2/3 animate-pulse rounded bg-neutral-200" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      <Footer />
    </main>
  );
}
