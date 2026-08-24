#!/usr/bin/env node
/**
 * Migration: Seed authors & migrate Article.author strings to ObjectIds
 *
 * This script uses the native MongoDB driver (no Mongoose models needed).
 *
 * - Seeds Author documents for every unique string author value found in articles
 *   (skips authors that already exist by name)
 * - Converts Article.author from string to the matching Author _id (ObjectId)
 * - Idempotent: safe to run multiple times
 *
 * Usage: MONGODB_URI=... node scripts/migrate-authors.js
 */

"use strict";

const { MongoClient, ObjectId } = require("mongodb");

// ---------------------------------------------------------------------------
// Database connection
// ---------------------------------------------------------------------------

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error(
    "❌ MONGODB_URI not found in environment. Run with: MONGODB_URI=... node scripts/migrate-authors.js"
  );
  process.exit(1);
}

const client = new MongoClient(MONGODB_URI);
const DB_NAME = "globalpulse"; // Extracted from MONGODB_URI

async function getDb() {
  await client.connect();
  return client.db(DB_NAME);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Slugify a string: lowercase, replace non-alphanumeric with hyphens,
 * collapse multiple hyphens, trim leading/trailing hyphens.
 */
function slugify(str) {
  return str
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

// ---------------------------------------------------------------------------
// Author seeding
// ---------------------------------------------------------------------------

/**
 * Create Author documents for every unique string author value found in
 * the articles collection. Skips authors that already exist by name.
 *
 * Returns a Map from author name -> Author _id (string).
 */
async function seedAuthors(db) {
  const articlesCol = db.collection("articles");
  const authorsCol = db.collection("authors");

  console.log("\n📦 Seeding authors from article data...");

  // Get all unique string author values
  const pipeline = [
    { $match: { author: { $type: "string" } } },
    { $group: { _id: "$author" } },
    { $sort: { _id: 1 } },
  ];
  const uniqueAuthors = await articlesCol
    .aggregate(pipeline)
    .toArray();

  console.log(`   Found ${uniqueAuthors.length} unique string author values`);

  const authorMap = new Map();

  for (const entry of uniqueAuthors) {
    const authorName = entry._id;

    // Check if author already exists
    const existing = await authorsCol.findOne({ name: authorName });

    if (existing) {
      authorMap.set(authorName, existing._id.toString());
      console.log(`  ✅ Author already exists: "${authorName}" (${existing._id.toString()})`);
    } else {
      // Create new author
      const newAuthor = {
        name: authorName,
        slug: slugify(authorName),
        bio: "",
        photoUrl: "",
        email: "",
        twitterHandle: "",
        websiteUrl: "",
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      const result = await authorsCol.insertOne(newAuthor);
      authorMap.set(authorName, result.insertedId.toString());
      console.log(`  ✅ Created author: "${authorName}" -> ${result.insertedId.toString()}`);
    }
  }

  // List all authors for verification
  const allAuthors = await authorsCol.find({}).sort({ name: 1 }).toArray();
  console.log(`\n📊 Total authors in database: ${allAuthors.length}`);

  return authorMap;
}

// ---------------------------------------------------------------------------
// Article migration
// ---------------------------------------------------------------------------

/**
 * Convert Article.author from string to ObjectId reference.
 * Uses the authorMap to look up the correct Author _id.
 */
async function migrateArticles(db, authorMap) {
  const articlesCol = db.collection("articles");

  console.log("\n🔄 Migrating articles...");

  // Get all articles
  const articles = await articlesCol.find({}).toArray();
  console.log(`   Total articles found: ${articles.length}`);

  let migratedCount = 0;
  let alreadyValidCount = 0;
  let skippedCount = 0;
  const errors = [];

  for (const article of articles) {
    const authorValue = article.author;

    // Check if author is already a valid ObjectId reference
    if (authorValue && typeof authorValue === "object" && authorValue._str) {
      // It's a Mongoose-style ObjectId wrapper — already valid
      alreadyValidCount++;
      continue;
    }

    // Check if author is a valid ObjectId string
    if (authorValue && typeof authorValue === "string" && ObjectId.isValid(authorValue) && authorValue.length === 24) {
      alreadyValidCount++;
      continue;
    }

    // Try to migrate string author to ObjectId
    if (typeof authorValue === "string" && authorMap.has(authorValue)) {
      const newObjectId = authorMap.get(authorValue);
      try {
        await articlesCol.updateOne(
          { _id: article._id },
          { $set: { author: new ObjectId(newObjectId) } }
        );
        migratedCount++;
        console.log(`  ✅ Migrated article "${article.title?.slice(0, 50)}..." (${authorValue} → ${newObjectId})`);
      } catch (err) {
        errors.push({
          article: article._id.toString(),
          title: article.title,
          error: err.message,
        });
        console.error(`  ❌ Failed to migrate article "${article.title}": ${err.message}`);
      }
    } else if (!authorValue || authorValue === "" || authorValue === null || authorValue === undefined) {
      // Skip articles without an author
      skippedCount++;
      console.log(`  ⏭️  Skipped article "${article.title}" (no author assigned)`);
    } else {
      // Unknown author value
      errors.push({
        article: article._id.toString(),
        title: article.title,
        error: `Unknown author value: ${authorValue}`,
      });
      console.error(`  ❌ Unknown author value for article "${article.title}": ${authorValue}`);
    }
  }

  console.log(`\n📊 Migration summary:`);
  console.log(`   ✅ Already valid: ${alreadyValidCount}`);
  console.log(`   ✅ Migrated: ${migratedCount}`);
  console.log(`   ⏭️  Skipped (no author): ${skippedCount}`);
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
  const authorsCol = db.collection("authors");

  console.log("\n🔍 Verifying migration...");

  // Get all valid author ObjectIds
  const authors = await authorsCol.find({}).toArray();
  const validAuthorIds = new Set(authors.map((a) => a._id.toString()));

  // Find articles with invalid authors
  const allArticles = await articlesCol.find({}).toArray();
  let invalidCount = 0;
  const stringAuthorArticles = [];

  for (const article of allArticles) {
    const authorValue = article.author;

    if (!authorValue || authorValue === null || authorValue === undefined) {
      console.log(`   ⚠️  Article "${article.title}" has NO author`);
      invalidCount++;
      continue;
    }

    // Check if it's still a string
    if (typeof authorValue === "string") {
      stringAuthorArticles.push({ title: article.title, author: authorValue });
      invalidCount++;
      console.log(`   ❌ Article "${article.title}" still has STRING author: ${authorValue}`);
    } else {
      // It's an ObjectId — verify it exists
      const idStr = authorValue.toString();
      if (!ObjectId.isValid(idStr) || !validAuthorIds.has(idStr)) {
        console.log(`   ❌ Article "${article.title}" has INVALID author: ${idStr}`);
        invalidCount++;
      }
    }
  }

  console.log(`\n📊 Verification results:`);
  console.log(`   Total articles: ${allArticles.length}`);
  console.log(`   ✅ Valid ObjectId authors: ${allArticles.length - invalidCount}`);
  console.log(`   ❌ Invalid/missing authors: ${invalidCount}`);

  if (invalidCount === 0) {
    console.log("\n🎉 Migration successful! All articles have valid Author ObjectIds.");
  } else {
    console.log(
      `\n⚠️  ${invalidCount} article(s) still have invalid authors. Manual intervention may be required.`
    );
  }

  return {
    total: allArticles.length,
    valid: allArticles.length - invalidCount,
    invalid: invalidCount,
    stringAuthorArticles,
  };
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=".repeat(60));
  console.log("🚀 Author Migration Script");
  console.log("=".repeat(60));

  let db;
  try {
    db = await getDb();
    console.log("✅ Connected to MongoDB");

    // Step 1: Seed authors
    const authorMap = await seedAuthors(db);

    // Step 2: Migrate articles
    const migrationResult = await migrateArticles(db, authorMap);

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
