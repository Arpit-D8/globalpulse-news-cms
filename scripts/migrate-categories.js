#!/usr/bin/env node
/**
 * Migration: Seed categories & migrate Article.category strings to ObjectIds
 *
 * This script uses the native MongoDB driver (no Mongoose models needed).
 * 
 * Usage: MONGODB_URI=... node scripts/migrate-categories.js
 */

"use strict";

const { MongoClient, ObjectId } = require("mongodb");

// ---------------------------------------------------------------------------
// Database connection
// ---------------------------------------------------------------------------

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI not found in environment. Run with: MONGODB_URI=... node scripts/migrate-categories.js");
  process.exit(1);
}

const client = new MongoClient(MONGODB_URI);
const DB_NAME = "globalpulse"; // Extracted from MONGODB_URI

async function getDb() {
  await client.connect();
  return client.db(DB_NAME);
}

// ---------------------------------------------------------------------------
// Category seeding
// ---------------------------------------------------------------------------

const SEED_CATEGORIES = [
  { name: "India", slug: "india", description: "National news from across India", color: "#dc2626", icon: "🇮🇳", displayOrder: 0 },
  { name: "World", slug: "world", description: "International news and global affairs", color: "#1e40af", icon: "🌍", displayOrder: 1 },
  { name: "Business", slug: "business", description: "Markets, economy, and business news", color: "#047857", icon: "💼", displayOrder: 2 },
  { name: "Technology", slug: "technology", description: "Tech industry, innovation, and digital trends", color: "#6d28d9", icon: "💻", displayOrder: 3 },
  { name: "Sports", slug: "sports", description: "Cricket, football, and sports updates", color: "#d97706", icon: "🏏", displayOrder: 4 },
];

async function seedCategories(db) {
  const categoriesCol = db.collection("categories");

  console.log("\n📦 Seeding categories...");

  for (const cat of SEED_CATEGORIES) {
    const existing = await categoriesCol.findOne({ slug: cat.slug });

    if (existing) {
      // Update existing category with latest metadata
      await categoriesCol.updateOne(
        { _id: existing._id },
        { $set: { name: cat.name, description: cat.description, color: cat.color, icon: cat.icon, displayOrder: cat.displayOrder, isActive: true } }
      );
      console.log(`  ✅ Updated category: ${cat.name} (${cat.slug})`);
    } else {
      await categoriesCol.insertOne({ ...cat, isActive: true, createdAt: new Date(), updatedAt: new Date() });
      console.log(`  ✅ Created category: ${cat.name} (${cat.slug})`);
    }
  }

  // List all categories for verification
  const allCategories = await categoriesCol.find({}).sort({ displayOrder: 1, name: 1 }).toArray();
  console.log(`\n📊 Total categories in database: ${allCategories.length}`);
  for (const cat of allCategories) {
    console.log(`   - ${cat.name} (${cat.slug}) [${cat.isActive ? "active" : "inactive"}]`);
  }

  return allCategories;
}

// ---------------------------------------------------------------------------
// Article migration
// ---------------------------------------------------------------------------

async function migrateArticles(db, allCategories) {
  const articlesCol = db.collection("articles");
  const categoriesCol = db.collection("categories");

  console.log("\n🔄 Migrating articles...");

  // Build a map from category name to ObjectId
  const categoryMap = new Map();
  for (const cat of allCategories) {
    categoryMap.set(cat.name, cat._id.toString());
  }

  console.log(`   Category map: ${JSON.stringify(Object.fromEntries(categoryMap))}`);

  // Find all articles
  const articles = await articlesCol.find({}).toArray();
  console.log(`   Total articles found: ${articles.length}`);

  let migratedCount = 0;
  let alreadyValidCount = 0;
  let skippedCount = 0;
  const errors = [];

  for (const article of articles) {
    const categoryId = article.category;

    // Check if category is already a valid ObjectId reference
    if (categoryId && ObjectId.isValid(categoryId.toString()) && categoryId.toString().length === 24) {
      // Verify the ObjectId actually exists in the Category collection
      const exists = await categoriesCol.findOne({ _id: categoryId });
      if (exists) {
        alreadyValidCount++;
        continue;
      }
    }

    // Try to migrate string category to ObjectId
    if (typeof categoryId === "string" && categoryMap.has(categoryId)) {
      const newObjectId = categoryMap.get(categoryId);
      try {
        await articlesCol.updateOne(
          { _id: article._id },
          { $set: { category: new ObjectId(newObjectId) } }
        );
        migratedCount++;
        console.log(`  ✅ Migrated article "${article.title}" (${categoryId} → ${newObjectId})`);
      } catch (err) {
        errors.push({ article: article._id.toString(), title: article.title, error: err.message });
        console.error(`  ❌ Failed to migrate article "${article.title}": ${err.message}`);
      }
    } else if (!categoryId || categoryId === "" || categoryId === null || categoryId === undefined) {
      // Skip articles without a category
      skippedCount++;
      console.log(`  ⏭️  Skipped article "${article.title}" (no category assigned)`);
    } else {
      // Unknown category value
      errors.push({ article: article._id.toString(), title: article.title, error: `Unknown category value: ${categoryId}` });
      console.error(`  ❌ Unknown category value for article "${article.title}": ${categoryId}`);
    }
  }

  console.log(`\n📊 Migration summary:`);
  console.log(`   ✅ Already valid: ${alreadyValidCount}`);
  console.log(`   ✅ Migrated: ${migratedCount}`);
  console.log(`   ⏭️  Skipped (no category): ${skippedCount}`);
  console.log(`   ❌ Errors: ${errors.length}`);

  if (errors.length > 0) {
    console.log("\n⚠️  Error details:");
    for (const err of errors) {
      console.log(`   - ${err.title}: ${err.error}`);
    }
  }

  return { migratedCount, alreadyValidCount, skippedCount, errors };
}

// ---------------------------------------------------------------------------
// Verification
// ---------------------------------------------------------------------------

async function verifyMigration(db) {
  const articlesCol = db.collection("articles");
  const categoriesCol = db.collection("categories");

  console.log("\n🔍 Verifying migration...");

  // Get all valid category ObjectIds
  const categories = await categoriesCol.find({}).toArray();
  const validCategoryIds = new Set(categories.map((c) => c._id.toString()));

  // Find articles with invalid categories
  const allArticles = await articlesCol.find({}).toArray();
  let invalidCount = 0;

  for (const article of allArticles) {
    const categoryId = article.category;

    if (!categoryId || categoryId === null || categoryId === undefined) {
      console.log(`   ⚠️  Article "${article.title}" has NO category`);
      invalidCount++;
      continue;
    }

    const idStr = categoryId.toString();
    if (!ObjectId.isValid(idStr) || !validCategoryIds.has(idStr)) {
      console.log(`   ❌ Article "${article.title}" has INVALID category: ${idStr}`);
      invalidCount++;
    }
  }

  console.log(`\n📊 Verification results:`);
  console.log(`   Total articles: ${allArticles.length}`);
  console.log(`   ✅ Valid categories: ${allArticles.length - invalidCount}`);
  console.log(`   ❌ Invalid/missing categories: ${invalidCount}`);

  if (invalidCount === 0) {
    console.log("\n🎉 Migration successful! All articles have valid Category ObjectIds.");
  } else {
    console.log(`\n⚠️  ${invalidCount} article(s) still have invalid categories. Manual intervention may be required.`);
  }

  return { total: allArticles.length, valid: allArticles.length - invalidCount, invalid: invalidCount };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=".repeat(60));
  console.log("🚀 Category Migration Script");
  console.log("=".repeat(60));

  let db;
  try {
    db = await getDb();
    console.log("✅ Connected to MongoDB");

    // Step 1: Seed categories
    const allCategories = await seedCategories(db);

    // Step 2: Migrate articles
    const migrationResult = await migrateArticles(db, allCategories);

    // Step 3: Verify
    const verificationResult = await verifyMigration(db);

    console.log("\n" + "=".repeat(60));
    console.log("✅ Migration completed successfully!");
    console.log("=".repeat(60));

    process.exit(0);
  } catch (err) {
    console.error("\n❌ Migration failed:", err);
    process.exit(1);
  }
}

// Run the migration
main().catch((err) => {
  console.error("Fatal error:", err);
  process.exit(1);
});
