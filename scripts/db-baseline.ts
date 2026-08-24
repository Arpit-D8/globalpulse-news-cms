/**
 * Database baseline inspector for PHASE 6E.5 testing.
 * 
 * Connects to MongoDB and records:
 * - Tag document count
 * - Article document count
 * - Tag indexes (confirming unique slug index)
 * - Sample tags (first 10)
 * - Sample articles (first 5 with tags)
 */

import { MongoClient } from "mongodb";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/news-website";

async function main() {
  console.log("=".repeat(80));
  console.log("DATABASE BASELINE INSPECTOR");
  console.log("=".repeat(80));
  console.log(`\nMongoDB URI: ${MONGODB_URI}`);
  console.log(`Timestamp: ${new Date().toISOString()}\n`);

  const client = new MongoClient(MONGODB_URI);

  try {
    // Connect to MongoDB
    console.log("Connecting to MongoDB...");
    await client.connect();
    console.log("✓ Connected successfully\n");

    const db = client.db("news-website");

    // --- Tag Counts ---
    const tagCollection = db.collection("tags");
    const tagCount = await tagCollection.countDocuments();
    console.log("TAG COLLECTION");
    console.log("-".repeat(40));
    console.log(`Total tags: ${tagCount}`);

    // Active vs Inactive
    const activeTags = await tagCollection.countDocuments({ isActive: true });
    const inactiveTags = await tagCollection.countDocuments({ isActive: false });
    console.log(`Active tags: ${activeTags}`);
    console.log(`Inactive tags: ${inactiveTags}\n`);

    // Sample tags
    const sampleTags = await tagCollection.find({}).sort({ name: 1 }).limit(10).toArray();
    if (sampleTags.length > 0) {
      console.log("Sample tags (first 10):");
      sampleTags.forEach((tag) => {
        console.log(`  - ${tag.name} (slug: ${tag.slug}, active: ${tag.isActive}, _id: ${tag._id})`);
      });
    } else {
      console.log("No tags found in database");
    }
    console.log();

    // --- Tag Indexes ---
    const tagIndexes = await tagCollection.indexes();
    console.log("TAG INDEXES");
    console.log("-".repeat(40));
    if (Array.isArray(tagIndexes) && tagIndexes.length > 0) {
      tagIndexes.forEach((idx) => {
        const keyStr = Object.entries(idx.key).map(([k, v]) => `${k}: ${v}`).join(", ");
        const unique = idx.unique ? " [UNIQUE]" : "";
        const name = idx.name ? ` (${idx.name})` : "";
        console.log(`  ${keyStr}${unique}${name}`);
      });
    } else {
      console.log("  No indexes found (unexpected)");
    }
    console.log();

    // --- Article Counts ---
    const articleCollection = db.collection("articles");
    const articleCount = await articleCollection.countDocuments();
    console.log("ARTICLE COLLECTION");
    console.log("-".repeat(40));
    console.log(`Total articles: ${articleCount}`);

    // By status
    const publishedArticles = await articleCollection.countDocuments({ status: "published" });
    const draftArticles = await articleCollection.countDocuments({ status: "draft" });
    const archivedArticles = await articleCollection.countDocuments({ status: "archived" });
    console.log(`Published: ${publishedArticles}`);
    console.log(`Draft: ${draftArticles}`);
    console.log(`Archived: ${archivedArticles}\n`);

    // Articles with tags
    const articlesWithTags = await articleCollection.countDocuments({ tags: { $exists: true, $ne: [], $not: { $size: 0 } } });
    const articlesWithoutTags = articleCount - articlesWithTags;
    console.log(`Articles with tags: ${articlesWithTags}`);
    console.log(`Articles without tags: ${articlesWithoutTags}\n`);

    // Sample articles with tags
    const sampleArticles = await articleCollection.find({ tags: { $exists: true, $ne: [], $not: { $size: 0 } } })
      .sort({ createdAt: -1 })
      .limit(5)
      .toArray();
    
    if (sampleArticles.length > 0) {
      console.log("Sample articles with tags (first 5):");
      sampleArticles.forEach((article) => {
        const tagIds = article.tags.map((id: any) => id.toString ? id.toString() : String(id));
        console.log(`  - ${article.title.substring(0, 60)}...`);
        console.log(`    Status: ${article.status}, Tags: [${tagIds.join(", ")}]`);
      });
    } else {
      console.log("No articles with tags found in database");
    }
    console.log();

    // --- Article Indexes ---
    const articleIndexes = await articleCollection.indexes();
    console.log("ARTICLE INDEXES (tags-related)");
    console.log("-".repeat(40));
    const tagsIndex = articleIndexes.find((idx) => idx.key.tags);
    if (tagsIndex) {
      const keyStr = Object.entries(tagsIndex.key).map(([k, v]) => `${k}: ${v}`).join(", ");
      const name = tagsIndex.name ? ` (${tagsIndex.name})` : "";
      console.log(`  ${keyStr}${name}`);
    } else {
      console.log("  No tags index found");
    }
    console.log();

    console.log("=".repeat(80));
    console.log("BASELINE INSPECTION COMPLETE");
    console.log("=".repeat(80));

  } catch (error) {
    console.error("✗ Error:", (error as Error).message);
    process.exit(1);
  } finally {
    await client.close();
    console.log("\nDisconnected from MongoDB");
  }
}

main();
