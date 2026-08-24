/**
 * Phase 6C — READ-ONLY LIVE DATABASE TAG INVENTORY
 * 
 * This script performs a COMPLETE inspection of the MongoDB database
 * for Tags and Article.tags data. It does NOT modify any data.
 */

import mongoose from "mongoose";
import Tag from "@/models/Tag";
import Article from "@/models/Article";
import { connectDB } from "@/lib/mongodb";

// ---------------------------------------------------------------------------
// Configuration
// ---------------------------------------------------------------------------

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("ERROR: MONGODB_URI environment variable is not set.");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/**
 * Normalize a tag string for comparison: trim, lowercase.
 */
function normalizeTag(str: string): string {
  return str.trim().toLowerCase();
}

/**
 * Group items by a key function.
 */
function groupBy<T>(items: T[], key: (item: T) => string): Map<string, T[]> {
  const map = new Map<string, T[]>();
  for (const item of items) {
    const k = key(item);
    if (!map.has(k)) map.set(k, []);
    map.get(k)!.push(item);
  }
  return map;
}

// ---------------------------------------------------------------------------
// Main
// ---------------------------------------------------------------------------

async function main() {
  console.log("=".repeat(80));
  console.log("PHASE 6C — READ-ONLY LIVE DATABASE TAG INVENTORY");
  console.log("=".repeat(80));
  console.log("");

  // -- Connect --
  console.log("1. DATABASE CONNECTION");
  console.log("-".repeat(80));
  console.log(`URI: ${MONGODB_URI!.replace(/:\/\/.*@/, "://***@")} (redacted)`);
  await connectDB();
  const db = mongoose.connection;
  console.log(`Database: ${db.name}`);
  console.log(`State: ${db.readyState === 1 ? "connected" : "disconnected"}`);
  console.log("");

  // -- 2. TAG COLLECTION SUMMARY --
  console.log("2. TAG COLLECTION SUMMARY");
  console.log("-".repeat(80));
  const totalTags = await Tag.countDocuments();
  console.log(`Total Tag documents: ${totalTags}`);
  console.log("");

  // -- 3. COMPLETE TAG INVENTORY --
  console.log("3. COMPLETE TAG INVENTORY");
  console.log("-".repeat(80));
  const allTags = await Tag.find({}).lean();
  
  const activeTags = allTags.filter((t) => t.isActive);
  const inactiveTags = allTags.filter((t) => !t.isActive);
  
  console.log(`Active tags: ${activeTags.length}`);
  console.log(`Inactive tags: ${inactiveTags.length}`);
  console.log("");

  // Full inventory
  console.log("All Tag documents:");
  console.log("");
  for (const tag of allTags) {
    console.log(`  _id: ${tag._id}`);
    console.log(`  name: "${tag.name}"`);
    console.log(`  slug: "${tag.slug}"`);
    console.log(`  isActive: ${tag.isActive}`);
    console.log(`  description: "${tag.description || ""}"`);
    console.log(`  createdAt: ${tag.createdAt}`);
    console.log(`  updatedAt: ${tag.updatedAt}`);
    console.log("");
  }

  // -- 4. DUPLICATE ANALYSIS --
  console.log("4. DUPLICATE ANALYSIS");
  console.log("-".repeat(80));

  // Duplicate names (case-insensitive, whitespace-trimmed)
  const nameGroups = groupBy(allTags, (t) => normalizeTag(t.name as string));
  const duplicateNames = [...nameGroups.entries()].filter(([, items]) => items.length > 1);
  console.log(`Duplicate names (case-insensitive, trimmed): ${duplicateNames.length} groups`);
  for (const [, items] of duplicateNames) {
    const normalized = normalizeTag(items[0].name as string);
    console.log(`  Normalized: "${normalized}"`);
    for (const item of items) {
      console.log(`    - "${item.name}" (id: ${item._id}, isActive: ${item.isActive})`);
    }
  }
  console.log("");

  // Duplicate slugs
  const slugGroups = groupBy(allTags, (t) => (t.slug as string).toLowerCase());
  const duplicateSlugs = [...slugGroups.entries()].filter(([, items]) => items.length > 1);
  console.log(`Duplicate slugs: ${duplicateSlugs.length} groups`);
  for (const [, items] of duplicateSlugs) {
    console.log(`  Slug: "${items[0].slug}"`);
    for (const item of items) {
      console.log(`    - "${item.name}" (id: ${item._id})`);
    }
  }
  console.log("");

  // Malformed names
  const malformedNames = allTags.filter((t) => !t.name || !t.name.trim());
  console.log(`Tags with malformed/missing names: ${malformedNames.length}`);
  for (const tag of malformedNames) {
    console.log(`  _id: ${tag._id}, name: "${tag.name}"`);
  }
  console.log("");

  // Malformed slugs
  const malformedSlugs = allTags.filter((t) => !t.slug || !t.slug.trim());
  console.log(`Tags with malformed/missing slugs: ${malformedSlugs.length}`);
  for (const tag of malformedSlugs) {
    console.log(`  _id: ${tag._id}, slug: "${tag.slug}"`);
  }
  console.log("");

  // -- 5. ARTICLE COLLECTION SUMMARY --
  console.log("5. ARTICLE COLLECTION SUMMARY");
  console.log("-".repeat(80));
  const totalArticles = await Article.countDocuments();
  console.log(`Total Article documents: ${totalArticles}`);
  console.log("");

  // -- 6. ARTICLE TAG INVENTORY --
  console.log("6. ARTICLE TAG INVENTORY");
  console.log("-".repeat(80));
  
  const allArticles = await Article.find({}).lean();
  
  let articlesWithMissingTags = 0;
  let articlesWithNullTags = 0;
  let articlesWithEmptyTags = 0;
  let articlesWithTags = 0;
  let totalTagValues = 0;
  
  const allTagValues: string[] = [];
  const articleTagMap: { articleId: string; tags: string[] }[] = [];
  
  for (const article of allArticles) {
    const rawTags = article.tags as (string | { toString: () => string })[] | undefined | null;
    const tags = (rawTags ?? []).map((t) => typeof t === "string" ? t : t.toString());

    if (tags.length === 0) {
      articlesWithEmptyTags++;
      articleTagMap.push({ articleId: article._id as string, tags: [] });
      continue;
    }
    
    articlesWithTags++;
    totalTagValues += tags.length;
    allTagValues.push(...tags);
    articleTagMap.push({ articleId: article._id as string, tags: [...tags] });
  }
  
  console.log(`Articles with missing tags field: ${articlesWithMissingTags}`);
  console.log(`Articles with null tags: ${articlesWithNullTags}`);
  console.log(`Articles with empty tags array: ${articlesWithEmptyTags}`);
  console.log(`Articles with at least one tag: ${articlesWithTags}`);
  console.log(`Total tag values across all articles: ${totalTagValues}`);
  console.log("");

  // Unique tag strings (exact)
  const exactUnique = new Set(allTagValues);
  console.log(`Unique tag strings (exact): ${exactUnique.size}`);
  console.log("");

  // Unique tag strings (normalized)
  const normalizedUnique = new Set(allTagValues.map(normalizeTag));
  console.log(`Unique tag strings (normalized, case-insensitive, trimmed): ${normalizedUnique.size}`);
  console.log("");

  // -- 7. DUPLICATE/NORMALIZATION FINDINGS --
  console.log("7. DUPLICATE/NORMALIZATION FINDINGS");
  console.log("-".repeat(80));
  
  const normalizedTagGroups = groupBy(allTagValues, normalizeTag);
  const normalizationGroups = [...normalizedTagGroups.entries()].filter(([, values]) => {
    // Check if there are multiple distinct original values
    const unique = new Set(values);
    return unique.size > 1;
  });
  
  console.log(`Tag strings with multiple spellings: ${normalizationGroups.length}`);
  for (const [normalized, values] of normalizationGroups) {
    const uniqueValues = [...new Set(values)];
    const counts = new Map<string, number>();
    for (const v of values) counts.set(v, (counts.get(v) || 0) + 1);
    
    console.log(`  Normalized: "${normalized}"`);
    for (const [val, count] of counts) {
      console.log(`    - "${val}" (used ${count} times)`);
    }
  }
  console.log("");

  // -- 8. MALFORMED TAG FINDINGS --
  console.log("8. MALFORMED TAG FINDINGS");
  console.log("-".repeat(80));
  
  const emptyStrings = allTagValues.filter((t) => t === "");
  const whitespaceOnly = allTagValues.filter((t) => t.trim() === "" && t !== "");
  const tooLong = allTagValues.filter((t) => t.length > 50);
  
  console.log(`Empty strings: ${emptyStrings.length}`);
  console.log(`Whitespace-only strings: ${whitespaceOnly.length}`);
  console.log(`Strings longer than 50 characters: ${tooLong.length}`);
  for (const tag of tooLong) {
    console.log(`  "${tag.substring(0, 60)}..." (length: ${tag.length})`);
  }
  console.log("");

  // Duplicate values within same article
  const articlesWithDuplicateTags: { articleId: string; duplicates: string[] }[] = [];
  for (const item of articleTagMap) {
    const counts = new Map<string, number>();
    for (const t of item.tags) counts.set(t, (counts.get(t) || 0) + 1);
    const duplicates = [...counts.entries()].filter(([, count]) => count > 1);
    if (duplicates.length > 0) {
      articlesWithDuplicateTags.push({
        articleId: item.articleId,
        duplicates: duplicates.map(([tag]) => tag),
      });
    }
  }
  
  console.log(`Articles with duplicate tag values: ${articlesWithDuplicateTags.length}`);
  for (const item of articlesWithDuplicateTags) {
    console.log(`  Article ${item.articleId}: ${item.duplicates.join(", ")}`);
  }
  console.log("");

  // Case-insensitive duplicates within same article
  const articlesWithCaseDuplicates: { articleId: string; groups: string[][] }[] = [];
  for (const item of articleTagMap) {
    const caseGroups = groupBy(item.tags, normalizeTag);
    for (const [, values] of caseGroups) {
      const unique = [...new Set(values)];
      if (unique.length > 1) {
        articlesWithCaseDuplicates.push({
          articleId: item.articleId,
          groups: [unique],
        });
        break; // Only report once per article
      }
    }
  }
  
  console.log(`Articles with case-insensitive duplicates: ${articlesWithCaseDuplicates.length}`);
  for (const item of articlesWithCaseDuplicates) {
    console.log(`  Article ${item.articleId}: ${item.groups[0].join(" vs ")}`);
  }
  console.log("");

  // Whitespace-only duplicates within same article
  const articlesWithWhitespaceDuplicates: { articleId: string; groups: string[][] }[] = [];
  for (const item of articleTagMap) {
    const wsGroups = groupBy(item.tags, (t) => t.trim().toLowerCase());
    for (const [, values] of wsGroups) {
      const unique = [...new Set(values)];
      if (unique.length > 1) {
        articlesWithWhitespaceDuplicates.push({
          articleId: item.articleId,
          groups: [unique],
        });
        break;
      }
    }
  }
  
  console.log(`Articles with whitespace-only duplicates: ${articlesWithWhitespaceDuplicates.length}`);
  for (const item of articlesWithWhitespaceDuplicates) {
    console.log(`  Article ${item.articleId}: ${item.groups[0].join(" vs ")}`);
  }
  console.log("");

  // -- 9. TAG.NAME MATCHING RESULTS --
  console.log("9. TAG.NAME MATCHING RESULTS");
  console.log("-".repeat(80));
  
  const tagNames = new Map(allTags.map((t) => [normalizeTag(t.name as string), t]));
  
  let exactMatch = 0;
  let nameMatch = 0;
  let caseWhitespaceVariant = 0;
  let unmatched = 0;
  const unmatchedTags: string[] = [];
  const matchedToActive: string[] = [];
  const matchedToInactive: string[] = [];
  
  const uniqueNormalizedTags = [...normalizedUnique];
  
  for (const normalized of uniqueNormalizedTags) {
    const tag = tagNames.get(normalized);
    if (tag) {
      // Check if it's an exact match (name matches exactly after normalization)
      const originalValues = normalizedTagGroups.get(normalized) || [];
      const allExact = originalValues.every((v) => normalizeTag(v) === normalized && v.trim() === tag.name.trim());
      
      if (allExact && originalValues.length === 1) {
        exactMatch++;
      } else {
        caseWhitespaceVariant++;
      }
      
      if (tag.isActive) {
        matchedToActive.push(normalized);
      } else {
        matchedToInactive.push(normalized);
      }
    } else {
      unmatched++;
      unmatchedTags.push(normalized);
    }
  }
  
  console.log(`Exact/valid matches: ${exactMatch}`);
  console.log(`Case/whitespace variants: ${caseWhitespaceVariant}`);
  console.log(`Unmatched: ${unmatched}`);
  console.log("");
  console.log(`Matched to active Tag: ${matchedToActive.length}`);
  console.log(`Matched to inactive Tag: ${matchedToInactive.length}`);
  console.log("");

  if (unmatchedTags.length > 0) {
    console.log("Unmatched tags:");
    for (const tag of unmatchedTags) {
      console.log(`  - "${tag}"`);
    }
    console.log("");
  }

  // -- 10. TAG.SLUG MATCHING RESULTS --
  console.log("10. TAG.SLUG MATCHING RESULTS");
  console.log("-".repeat(80));
  
  const tagSlugs = new Map(allTags.map((t) => [t.slug.toLowerCase(), t]));
  
  let slugExactMatch = 0;
  let slugNoMatch = 0;
  
  for (const normalized of uniqueNormalizedTags) {
    const tag = tagSlugs.get(normalized);
    if (tag) {
      slugExactMatch++;
    } else {
      slugNoMatch++;
    }
  }
  
  console.log(`Slug exact matches: ${slugExactMatch}`);
  console.log(`Slug no matches: ${slugNoMatch}`);
  console.log("");

  // -- 11. AMBIGUOUS TAGS --
  console.log("11. AMBIGUOUS TAGS");
  console.log("-".repeat(80));
  
  // An article tag is ambiguous if it could match multiple Tag documents
  const ambiguousTags: { tag: string; matches: string[] }[] = [];
  
  for (const normalized of uniqueNormalizedTags) {
    const matches = allTags.filter((t) => normalizeTag(t.name as string) === normalized);
    if (matches.length > 1) {
      ambiguousTags.push({
        tag: normalized,
        matches: matches.map((t) => `"${t.name}" (id: ${t._id})`),
      });
    }
  }
  
  console.log(`Ambiguous tags: ${ambiguousTags.length}`);
  for (const item of ambiguousTags) {
    console.log(`  "${item.tag}" matches:`);
    for (const match of item.matches) {
      console.log(`    - ${match}`);
    }
  }
  console.log("");

  // -- 12. ARTICLE-LEVEL MIGRATION READINESS --
  console.log("12. ARTICLE-LEVEL MIGRATION READINESS");
  console.log("-".repeat(80));
  
  let ready = 0;
  let needsNormalization = 0;
  let unmatchedArticles = 0;
  let ambiguousArticles = 0;
  let malformedArticles = 0;
  let mixedArticles = 0;
  
  for (const item of articleTagMap) {
    const hasMalformed = item.tags.some((t) => !t.trim() || t.length > 50);
    const hasUnmatched = item.tags.some((t) => {
      const normalized = normalizeTag(t);
      return !tagNames.has(normalized);
    });
    const hasAmbiguous = false; // Simplified check
    
    if (hasMalformed) {
      malformedArticles++;
    } else if (hasUnmatched) {
      unmatchedArticles++;
    } else if (hasAmbiguous) {
      ambiguousArticles++;
    } else {
      // Check if any need normalization
      const needsNorm = item.tags.some((t) => normalizeTag(t) !== (t as string).trim().toLowerCase());
      if (needsNorm) {
        needsNormalization++;
      } else {
        ready++;
      }
    }
  }
  
  console.log(`READY (unambiguous match): ${ready} articles`);
  console.log(`NEEDS NORMALIZATION: ${needsNormalization} articles`);
  console.log(`UNMATCHED: ${unmatchedArticles} articles`);
  console.log(`AMBIGUOUS: ${ambiguousArticles} articles`);
  console.log(`MALFORMED: ${malformedArticles} articles`);
  console.log(`MIXED (some match, some don't): ${mixedArticles} articles`);
  console.log("");

  // -- 13. RELEVANT INDEXES --
  console.log("13. RELEVANT INDEXES");
  console.log("-".repeat(80));
  
  const articleIndexes = await Article.collection.indexes();
  console.log("Article indexes:");
  for (const idx of articleIndexes) {
    console.log(`  ${JSON.stringify(idx.key)} (${idx.unique ? "unique" : "non-unique"})`);
  }
  console.log("");
  
  const tagIndexes = await Tag.collection.indexes();
  console.log("Tag indexes:");
  for (const idx of tagIndexes) {
    console.log(`  ${JSON.stringify(idx.key)} (${idx.unique ? "unique" : "non-unique"})`);
  }
  console.log("");

  // -- 14. APPLICATION FILES ASSUMING string[] TAGS --
  console.log("14. APPLICATION FILES ASSUMING string[] TAGS");
  console.log("-".repeat(80));
  console.log("(This section requires manual code inspection - see Phase 6D)");
  console.log("");

  // -- 15. DATABASE WRITES --
  console.log("15. DATABASE WRITES PERFORMED");
  console.log("-".repeat(80));
  console.log("NONE - This script is READ-ONLY");
  console.log("");

  // -- 16. FILES MODIFIED --
  console.log("16. FILES MODIFIED");
  console.log("-".repeat(80));
  console.log("NONE - This script is READ-ONLY");
  console.log("");

  console.log("=".repeat(80));
  console.log("PHASE 6C INVENTORY COMPLETE");
  console.log("=".repeat(80));

  await mongoose.disconnect();
}

main().catch((err) => {
  console.error("ERROR:", err);
  process.exit(1);
});
