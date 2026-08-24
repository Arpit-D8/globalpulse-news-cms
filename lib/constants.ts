export const CATEGORIES = [
  "India",
  "World",
  "Business",
  "Technology",
  "Sports",
] as const;

export const CATEGORY_CONFIG = {
  India: {
    slug: "india",
    kicker: "National desk",
    color: "border-red-600",
    image:
      "https://images.unsplash.com/photo-1524492412937-b28074a5d7da?auto=format&fit=crop&w=1200&q=80",
  },
  World: {
    slug: "world",
    kicker: "Global desk",
    color: "border-blue-700",
    image:
      "https://images.unsplash.com/photo-1451187580459-43490279c0fa?auto=format&fit=crop&w=1200&q=80",
  },
  Business: {
    slug: "business",
    kicker: "Markets desk",
    color: "border-emerald-700",
    image:
      "https://images.unsplash.com/photo-1486406146926-c627a92ad1ab?auto=format&fit=crop&w=1200&q=80",
  },
  Technology: {
    slug: "technology",
    kicker: "Innovation desk",
    color: "border-violet-700",
    image:
      "https://images.unsplash.com/photo-1518770660439-4636190af475?auto=format&fit=crop&w=1200&q=80",
  },
  Sports: {
    slug: "sports",
    kicker: "Sports desk",
    color: "border-amber-600",
    image:
      "https://images.unsplash.com/photo-1461896836934-ffe607ba8211?auto=format&fit=crop&w=1200&q=80",
  },
} as const;

export const FALLBACK_HERO_IMAGE =
  "https://images.unsplash.com/photo-1504711434969-e33886168f5c?auto=format&fit=crop&w=1600&q=80";

export const SITE_NAME = "VIDARBHA PRINT News";
export const SITE_DESCRIPTION =
  "VIDARBHA PRINT delivers breaking news, top stories, and in-depth analysis across India, World, Business, Technology, and Sports.";
export const SITE_URL = process.env.NEXT_PUBLIC_SITE_URL ?? "http://localhost:3000";

export function getCategoryFromSlug(slug: string) {
  return CATEGORIES.find((category) => CATEGORY_CONFIG[category].slug === slug);
}
