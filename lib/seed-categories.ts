#!/usr/bin/env node
/**
 * Idempotent category seed script.
 *
 * Creates or updates the standard categories (India, World, Business,
 * Technology, Sports) using findOneAndUpdate so repeated runs are safe.
 *
 * Usage (from Next.js API route context):
 *   import { seedCategories } from "@/lib/seed-categories";
 *   await seedCategories();
 *
 * Or run directly via Node (requires MongoDB_URI env var):
 *   npx ts-node lib/seed-categories.ts
 */

import mongoose from "mongoose";
import Category from "@/models/Category";
import { connectDB } from "@/lib/mongodb";

// ---------------------------------------------------------------------------
// Category definitions
// ---------------------------------------------------------------------------

type CategoryDef = {
  name: string;
  slug: string;
  description: string;
  color: string;
  icon: string;
  displayOrder: number;
};

const CATEGORIES: CategoryDef[] = [
  {
    name: "India",
    slug: "india",
    description: "Indian national news, politics, and updates from across the country.",
    color: "#b91c1c",
    icon: "🇮🇳",
    displayOrder: 1,
  },
  {
    name: "World",
    slug: "world",
    description: "International news and global affairs.",
    color: "#1d4ed8",
    icon: "🌍",
    displayOrder: 2,
  },
  {
    name: "Business",
    slug: "business",
    description: "Markets, economy, finance, and business news.",
    color: "#047857",
    icon: "📈",
    displayOrder: 3,
  },
  {
    name: "Technology",
    slug: "technology",
    description: "Tech industry, innovation, and digital trends.",
    color: "#6d28d9",
    icon: "💻",
    displayOrder: 4,
  },
  {
    name: "Sports",
    slug: "sports",
    description: "Sports news, scores, and highlights.",
    color: "#b45309",
    icon: "🏏",
    displayOrder: 5,
  },
];

// ---------------------------------------------------------------------------
// Seed function
// ---------------------------------------------------------------------------

/**
 * Seed categories idempotently.
 *
 * Uses findOneAndUpdate with upsert: false so existing categories are
 * updated (displayOrder, color, etc.) but never duplicated.
 *
 * Returns an object summarising what happened.
 */
export async function seedCategories(): Promise<{
  created: number;
  updated: number;
  skipped: number;
}> {
  await connectDB();

  let created = 0;
  let updated = 0;
  let skipped = 0;

  for (const def of CATEGORIES) {
    const result = await Category.findOneAndUpdate(
      { slug: def.slug },
      {
        $set: {
          name: def.name,
          slug: def.slug,
          description: def.description,
          color: def.color,
          icon: def.icon,
          displayOrder: def.displayOrder,
          isActive: true,
        },
      },
      { new: true }
    );

    if (result) {
      // Document existed — check if anything changed
      if (
        result.name !== def.name ||
        result.color !== def.color ||
        result.displayOrder !== def.displayOrder
      ) {
        updated += 1;
      } else {
        skipped += 1;
      }
    } else {
      // Document did not exist — create it
      await Category.create(def);
      created += 1;
    }
  }

  return { created, updated, skipped };
}

// ---------------------------------------------------------------------------
// CLI entry point (optional)
// ---------------------------------------------------------------------------

async function main() {
  try {
    const result = await seedCategories();
    console.log("Category seeding complete:", result);
  } catch (error) {
    console.error("Category seeding failed:", error);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

// Run CLI when executed directly.
if (require.main === module) {
  main();
}
