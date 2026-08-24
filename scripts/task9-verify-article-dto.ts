/**
 * Task 9: Verify Article DTO — getArticleBySlug() populate bug demonstration
 * 
 * This script tests the actual API endpoint to verify:
 * 1. The bug: getArticleBySlug() does NOT populate tags
 * 2. serializeArticle() handles unpopulated tags correctly (empty name/slug)
 */

// Load environment variables BEFORE any imports (imports are hoisted in ES modules)
import { readFileSync } from "fs";
import { resolve } from "path";

const envPath = resolve(process.cwd(), ".env.local");
const envContent = readFileSync(envPath, "utf-8");
for (const line of envContent.split("\n")) {
  const trimmed = line.trim();
  if (trimmed && !trimmed.startsWith("#") && trimmed.includes("=")) {
    const [key, ...valueParts] = trimmed.split("=");
    const value = valueParts.join("=");
    if (!process.env[key.trim()]) {
      process.env[key.trim()] = value.replace(/^["']|["']$/g, "");
    }
  }
}

// Verify MONGODB_URI is loaded
if (!process.env.MONGODB_URI) {
  console.error("ERROR: MONGODB_URI not loaded from .env.local");
  console.error("Available env keys:", Object.keys(process.env).filter(k => k.includes("MONGO")));
  process.exit(1);
}

console.log("✓ MONGODB_URI loaded:", process.env.MONGODB_URI!.split("@")[0] + "@...");

// Now import the modules that need MongoDB
import { getArticleBySlug, getPublishedArticles } from "@/lib/articles";

async function testArticleDTO() {
  console.log("=== TASK 9: Verify Article DTO ===\n");
  
  const slug = "integration-test-article-tag-reference-verification";
  
  console.log(`Fetching article by slug: ${slug}`);
  const article = await getArticleBySlug(slug);
  
  if (!article) {
    console.error("❌ Article not found!");
    process.exit(1);
  }
  
  console.log(`✓ Article found: ${article.title}`);
  console.log(`  _id: ${article._id}`);
  console.log(`  slug: ${article.slug}`);
  console.log(`  status: ${article.status}`);
  console.log(`  tags count: ${article.tags.length}`);
  
  if (article.tags.length > 0) {
    const tag = article.tags[0];
    console.log(`\n  Tag DTO:`);
    console.log(`    _id: ${tag._id}`);
    console.log(`    name: "${tag.name}"`);
    console.log(`    slug: "${tag.slug}"`);
    
    // Verify the bug
    if (tag.name === "" && tag.slug === "") {
      console.log("\n  ❌ BUG CONFIRMED: Tags have empty name and slug");
      console.log("     This is because getArticleBySlug() does NOT call .populate('tags')");
      console.log("     Expected: name='Integration Test India', slug='integration-test-india'");
      console.log("     Actual: name='', slug=''");
    } else {
      console.log("\n  ✓ Tags are properly populated");
    }
  } else {
    console.log("\n  ⚠ Article has no tags");
  }
  
  // Compare with getPublishedArticles which DOES populate tags
  console.log("\n=== COMPARISON: getPublishedArticles() ===");
  const publishedArticles = await getPublishedArticles({ limit: 10 });
  const matchingArticle = publishedArticles.find(a => a.slug === slug);
  
  if (matchingArticle) {
    console.log(`✓ Article from getPublishedArticles:`);
    console.log(`  tags count: ${matchingArticle.tags.length}`);
    if (matchingArticle.tags.length > 0) {
      const tag = matchingArticle.tags[0];
      console.log(`    _id: ${tag._id}`);
      console.log(`    name: "${tag.name}"`);
      console.log(`    slug: "${tag.slug}"`);
      
      if (tag.name && tag.slug) {
        console.log("\n  ✓ Tags ARE populated in getPublishedArticles()");
        console.log("  This confirms the bug is specific to getArticleBySlug()");
      }
    }
  }
  
  return article;
}

testArticleDTO().catch(console.error);
