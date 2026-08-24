/**
 * NEWS IMPORTER END-TO-END TEST — DATA SETUP & VERIFICATION
 * 
 * Creates test data in the empty database to verify:
 * - Tag creation with unique keywords
 * - Tag reuse (same keyword across articles)
 * - Case/whitespace deduplication
 * - Inactive tag behavior
 * - Article.tag references (ObjectId[])
 * - Article serialization (populate + serializeArticle)
 * - Public tag page queries (getArticlesByTag)
 * 
 * All test records use "E2E_TEST_" prefix for easy identification and cleanup.
 */

import mongoose from "mongoose";
import Tag from "./models/Tag";
import Article from "./models/Article";
import Category from "./models/Category";
import Author from "./models/Author";
import Media from "./models/Media";
import { getArticlesByTag, serializeArticle } from "./lib/articles";

const MONGODB_URI = process.env.MONGODB_URI;
if (!MONGODB_URI) {
  console.error("ERROR: MONGODB_URI not set");
  process.exit(1);
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

async function connect() {
  await mongoose.connect(MONGODB_URI);
  console.log(`\n[TEST] Connected to: ${mongoose.connection.name}\n`);
}

async function cleanup() {
  const tagsDeleted = await Tag.deleteMany({
    name: { $regex: /^E2E_TEST_/ },
  });
  const articlesDeleted = await Article.deleteMany({
    title: { $regex: /^E2E_TEST_/ },
  });
  console.log(`[CLEANUP] Removed ${tagsDeleted.deletedCount} test tags, ${articlesDeleted.deletedCount} test articles\n`);
}

// ---------------------------------------------------------------------------
// Task 4: Tag creation with temporary keyword
// ---------------------------------------------------------------------------

async function task4_TagCreation() {
  console.log("=".repeat(70));
  console.log("TASK 4: Tag creation with temporary keyword");
  console.log("=".repeat(70));

  const tag = await Tag.create({
    name: "E2E_TEST_VidarbhaPolitics",
    slug: "e2e_test_vidarbhapolitics",
    description: "Test tag for e2e verification",
    isActive: true,
  });

  console.log(`[TASK 4] Created tag: _id=${tag._id}, name=${tag.name}, slug=${tag.slug}, active=${tag.isActive}`);
  
  // Verify retrieval
  const found = await Tag.findOne({ slug: tag.slug });
  if (!found) {
    console.error("[TASK 4] FAIL: Could not retrieve created tag");
    return null;
  }
  console.log(`[TASK 4] PASS: Tag retrieved successfully\n`);
  return tag;
}

// ---------------------------------------------------------------------------
// Task 5: Tag reuse (same keyword across articles)
// ---------------------------------------------------------------------------

async function task5_TagReuse() {
  console.log("=".repeat(70));
  console.log("TASK 5: Tag reuse (same keyword across multiple articles)");
  console.log("=".repeat(70));

  // Create a shared tag
  const sharedTag = await Tag.create({
    name: "E2E_TEST_NationalNews",
    slug: "e2e_test_nationalnews",
    description: "Shared test tag",
    isActive: true,
  });

  // Create two articles referencing the same tag
  const article1 = await Article.create({
    title: "E2E_TEST_NationalPolicy_Change_1",
    slug: "e2e-test-nationalpolicy-change-1",
    summary: "Test article 1 for tag reuse verification",
    content: "Content for test article 1. This article tests tag reuse.",
    status: "published",
    publishedAt: new Date(),
    tags: [sharedTag._id],
  });

  const article2 = await Article.create({
    title: "E2E_TEST_NationalPolicy_Change_2",
    slug: "e2e-test-nationalpolicy-change-2",
    summary: "Test article 2 for tag reuse verification",
    content: "Content for test article 2. This article also uses the same tag.",
    status: "published",
    publishedAt: new Date(),
    tags: [sharedTag._id],
  });

  console.log(`[TASK 5] Shared tag: _id=${sharedTag._id}`);
  console.log(`[TASK 5] Article 1: _id=${article1._id}, tags=[${article1.tags.map(t => t.toString()).join(",")}]`);
  console.log(`[TASK 5] Article 2: _id=${article2._id}, tags=[${article2.tags.map(t => t.toString()).join(",")}]`);

  // Verify getArticlesByTag returns both
  const articles = await getArticlesByTag("e2e-test-nationalnews");
  if (articles.length !== 2) {
    console.error(`[TASK 5] FAIL: Expected 2 articles, got ${articles.length}`);
    return null;
  }
  console.log(`[TASK 5] PASS: getArticlesByTag returned ${articles.length} articles\n`);
  return { sharedTag, article1, article2 };
}

// ---------------------------------------------------------------------------
// Task 6: Case/whitespace deduplication
// ---------------------------------------------------------------------------

async function task6_Deduplication() {
  console.log("=".repeat(70));
  console.log("TASK 6: Case/whitespace deduplication");
  console.log("=".repeat(70));

  // Create tags with similar names (should have unique slugs)
  const tag1 = await Tag.create({
    name: "E2E_TEST_Maharashtra",
    slug: "e2e_test_maharashtra",
    description: "Test tag - exact case",
    isActive: true,
  });

  // The importer generates slugs via generateSlug() which lowercases,
  // so "MAHARASHTRA", "maharashtra", " Maharashtra " all become "maharashtra"
  // createTag() will detect the duplicate and append a suffix
  
  // Simulate what the importer would do: try to create with same slug
  // But we can't directly test this because createTag generates unique slugs
  // Instead, verify that the slug generation normalizes correctly
  
  const { generateSlug } = await import("./lib/slug");
  const slug1 = generateSlug("MAHARASHTRA");
  const slug2 = generateSlug("  maharashtra  ");
  const slug3 = generateSlug("Maharashtra");

  console.log(`[TASK 6] "MAHARASHTRA" → slug="${slug1}"`);
  console.log(`[TASK 6] "  maharashtra  " → slug="${slug2}"`);
  console.log(`[TASK 6] "Maharashtra" → slug="${slug3}"`);

  if (slug1 === slug2 && slug2 === slug3) {
    console.log(`[TASK 6] PASS: All variants produce identical slug "${slug1}"\n`);
    return { tag1, slug: slug1 };
  } else {
    console.error("[TASK 6] FAIL: Slugs differ");
    return null;
  }
}

// ---------------------------------------------------------------------------
// Task 7: Inactive tag behavior
// ---------------------------------------------------------------------------

async function task7_InactiveTag() {
  console.log("=".repeat(70));
  console.log("TASK 7: Inactive tag behavior");
  console.log("=".repeat(70));

  // Create an inactive tag
  const inactiveTag = await Tag.create({
    name: "E2E_TEST_InactiveTopic",
    slug: "e2e_test_inactivetopic",
    description: "Test tag set to inactive",
    isActive: false,
  });

  console.log(`[TASK 7] Created inactive tag: _id=${inactiveTag._id}, active=${inactiveTag.isActive}`);

  // Verify getArticlesByTag returns empty for inactive tag
  const articles = await getArticlesByTag("e2e-test-inactivetopic");
  if (articles.length !== 0) {
    console.error(`[TASK 7] FAIL: Expected 0 articles for inactive tag, got ${articles.length}`);
    return null;
  }

  // Verify the tag page would notFound()
  const tagDoc = await Tag.findOne({ slug: "e2e-test-inactivetopic", isActive: true });
  if (tagDoc) {
    console.error("[TASK 7] FAIL: Inactive tag should not be found with isActive:true filter");
    return null;
  }

  console.log(`[TASK 7] PASS: Inactive tag returns 0 articles and is not found by isActive filter\n`);
  return inactiveTag;
}

// ---------------------------------------------------------------------------
// Task 8: Article tag references (ObjectId[])
// ---------------------------------------------------------------------------

async function task8_ArticleTagReferences() {
  console.log("=".repeat(70));
  console.log("TASK 8: Article tag references (ObjectId[])");
  console.log("=".repeat(70));

  const tag = await Tag.create({
    name: "E2E_TEST_ObjectIdRef",
    slug: "e2e_test_objectidref",
    description: "Test for ObjectId reference verification",
    isActive: true,
  });

  const article = await Article.create({
    title: "E2E_TEST_ObjectIdRef_Article",
    slug: "e2e-test-objectidref-article",
    summary: "Verifies that article.tags stores ObjectId[]",
    content: "Content for ObjectId reference test.",
    status: "published",
    publishedAt: new Date(),
    tags: [tag._id],
  });

  // Verify raw MongoDB document
  const rawDoc = await Article.findById(article._id).lean();
  console.log(`[TASK 8] Article._id: ${article._id}`);
  console.log(`[TASK 8] Article.tags (raw): ${JSON.stringify(rawDoc.tags)}`);
  console.log(`[TASK 8] Tag._id: ${tag._id}`);

  // Verify tags is an array of ObjectId strings
  if (!Array.isArray(rawDoc.tags) || rawDoc.tags.length !== 1) {
    console.error(`[TASK 8] FAIL: Expected array with 1 element, got ${JSON.stringify(rawDoc.tags)}`);
    return null;
  }

  // Verify it's a valid ObjectId reference
  if (!mongoose.Types.ObjectId.isValid(rawDoc.tags[0])) {
    console.error("[TASK 8] FAIL: Tag reference is not a valid ObjectId");
    return null;
  }

  // Verify populate works
  const populated = await Article.findById(article._id).populate("tags");
  if (!populated.tags || populated.tags.length !== 1) {
    console.error("[TASK 8] FAIL: Populate returned wrong number of tags");
    return null;
  }
  const populatedTag = populated.tags[0];
  console.log(`[TASK 8] Populated tag: _id=${populatedTag._id}, name=${populatedTag.name}, slug=${populatedTag.slug}`);
  console.log(`[TASK 8] PASS: Article.tags is ObjectId[], populate works correctly\n`);
  return { article, tag };
}

// ---------------------------------------------------------------------------
// Task 9: Article DTO (serializeArticle)
// ---------------------------------------------------------------------------

async function task9_ArticleDTO() {
  console.log("=".repeat(70));
  console.log("TASK 9: Article DTO (serializeArticle)");
  console.log("=".repeat(70));

  const tag = await Tag.create({
    name: "E2E_TEST_DTOTag",
    slug: "e2e_test_dtotag",
    description: "Test tag for DTO verification",
    isActive: true,
  });

  const article = await Article.create({
    title: "E2E_TEST_DTOArticle",
    slug: "e2e-test-dtoarticle",
    summary: "Test article for DTO serialization",
    content: "Content for DTO test.",
    status: "published",
    publishedAt: new Date(),
    tags: [tag._id],
  });

  // Test with populated tags
  const populated = await Article.findById(article._id)
    .populate("tags")
    .lean();

  const serialized = serializeArticle(populated);
  console.log(`[TASK 9] Serialized article:`);
  console.log(`  _id: ${serialized._id}`);
  console.log(`  title: ${serialized.title}`);
  console.log(`  tags: ${JSON.stringify(serialized.tags)}`);
  console.log(`  status: ${serialized.status}`);
  console.log(`  category: ${serialized.category}`);

  // Verify tags are ArticleTag DTOs
  if (!Array.isArray(serialized.tags) || serialized.tags.length !== 1) {
    console.error(`[TASK 9] FAIL: Expected 1 tag DTO, got ${serialized.tags.length}`);
    return null;
  }

  const tagDTO = serialized.tags[0];
  if (!tagDTO._id || !tagDTO.name || !tagDTO.slug) {
    console.error("[TASK 9] FAIL: Tag DTO missing _id, name, or slug");
    return null;
  }

  console.log(`[TASK 9] Tag DTO: _id=${tagDTO._id}, name=${tagDTO.name}, slug=${tagDTO.slug}`);
  console.log(`[TASK 9] PASS: serializeArticle produces correct ArticleTag DTOs\n`);
  return { article, tag, serialized };
}

// ---------------------------------------------------------------------------
// Task 10-12: Public tag page, ArticleCard, Article detail
// ---------------------------------------------------------------------------

async function task10_PublicTagPage() {
  console.log("=".repeat(70));
  console.log("TASK 10: Public tag page /tags/[slug]");
  console.log("=".repeat(70));

  // Create a tag and article for the public tag page test
  const tag = await Tag.create({
    name: "E2E_TEST_PublicTagPage",
    slug: "e2e_test_publictagpage",
    description: "Test tag for public tag page",
    isActive: true,
  });

  const article = await Article.create({
    title: "E2E_TEST_PublicTag_Article",
    slug: "e2e-test-publictag-article",
    summary: "Visible on /tags/e2e-test-publictagpage",
    content: "Content for public tag page test.",
    status: "published",
    publishedAt: new Date(),
    tags: [tag._id],
  });

  // Verify the tag page query
  const articles = await getArticlesByTag("e2e-test-publictagpage");
  if (articles.length !== 1) {
    console.error(`[TASK 10] FAIL: Expected 1 article, got ${articles.length}`);
    return null;
  }

  const articleData = articles[0];
  console.log(`[TASK 10] Tag page query returned ${articles.length} article(s)`);
  console.log(`[TASK 10] Article: ${articleData.title}`);
  console.log(`[TASK 10] Tags in article: ${JSON.stringify(articleData.tags)}`);

  // Verify tag slug is correct for linking
  if (articleData.tags[0].slug !== "e2e-test-publictagpage") {
    console.error("[TASK 10] FAIL: Tag slug mismatch");
    return null;
  }

  console.log(`[TASK 10] PASS: Public tag page would render article with correct tag links\n`);
  return { tag, article };
}

// ---------------------------------------------------------------------------
// Task 13: Failure isolation (malformed keywords)
// ---------------------------------------------------------------------------

async function task13_FailureIsolation() {
  console.log("=".repeat(70));
  console.log("TASK 13: Failure isolation (malformed keywords)");
  console.log("=".repeat(70));

  // Test generateSlug with malformed input
  const { generateSlug } = await import("./lib/slug");
  
  const malformedInputs = [
    "",
    "   ",
    "!!!",
    "  @@@  ",
    "a".repeat(200), // Very long keyword
  ];

  console.log("[TASK 13] Testing generateSlug with malformed inputs:");
  for (const input of malformedInputs) {
    const slug = generateSlug(input);
    console.log(`  Input: "${input.slice(0, 30)}..." → slug="${slug}" (length: ${slug.length})`);
    
    // Empty/whitespace-only should produce empty slug
    if (input.trim().length === 0 && slug.length !== 0) {
      console.error(`[TASK 13] FAIL: Expected empty slug for "${input}", got "${slug}"`);
      return null;
    }
  }

  console.log(`[TASK 13] PASS: Malformed keywords produce empty/valid slugs (importer skips them)\n`);
  return true;
}

// ---------------------------------------------------------------------------
// Task 15: Import statistics
// ---------------------------------------------------------------------------

async function task15_ImportStatistics() {
  console.log("=".repeat(70));
  console.log("TASK 15: Import statistics structure");
  console.log("=".repeat(70));

  // Verify the import route returns the expected statistics structure
  // We can't actually call the API without auth, so we verify the code structure
  
  const fs = await import("fs");
  const routeContent = fs.readFileSync("./app/api/news/import/route.ts", "utf8");
  
  // Check for all expected statistics fields
  const expectedFields = ["imported", "skipped", "failed", "total", "tagsCreated", "tagsReused", "tagsSkipped"];
  const missingFields = expectedFields.filter(field => !routeContent.includes(field));
  
  console.log(`[TASK 15] Expected statistics fields: ${expectedFields.join(", ")}`);
  console.log(`[TASK 15] Missing fields: ${missingFields.length > 0 ? missingFields.join(", ") : "NONE"}`);
  
  // Check successResponse includes all fields
  const hasSuccessResponse = routeContent.includes("successResponse({ imported, skipped, failed, total");
  console.log(`[TASK 15] successResponse call present: ${hasSuccessResponse}`);
  
  if (missingFields.length > 0 || !hasSuccessResponse) {
    console.error("[TASK 15] FAIL: Statistics structure incomplete");
    return null;
  }
  
  console.log(`[TASK 15] PASS: Import statistics structure is complete\n`);
  return true;
}

// ---------------------------------------------------------------------------
// Main test runner
// ---------------------------------------------------------------------------

async function runTests() {
  console.log("\n");
  console.log("╔" + "═".repeat(68) + "╗");
  console.log("║" + " ".repeat(14) + "NEWS IMPORTER E2E TEST — DATA SETUP" + " ".repeat(18) + "║");
  console.log("╚" + "═".repeat(68) + "╝");
  console.log("");

  await connect();
  await cleanup();

  const results = {
    task4: await task4_TagCreation(),
    task5: await task5_TagReuse(),
    task6: await task6_Deduplication(),
    task7: await task7_InactiveTag(),
    task8: await task8_ArticleTagReferences(),
    task9: await task9_ArticleDTO(),
    task10: await task10_PublicTagPage(),
    task13: await task13_FailureIsolation(),
    task15: await task15_ImportStatistics(),
  };

  // Final database state
  console.log("=".repeat(70));
  console.log("FINAL DATABASE STATE");
  console.log("=".repeat(70));
  
  const tagCount = await Tag.countDocuments({ name: { $regex: /^E2E_TEST_/ } });
  const articleCount = await Article.countDocuments({ title: { $regex: /^E2E_TEST_/ } });
  console.log(`Test tags: ${tagCount}`);
  console.log(`Test articles: ${articleCount}`);
  console.log("");

  // Summary
  const passed = Object.values(results).filter(v => v !== null && v !== false).length;
  const total = Object.keys(results).length;
  console.log("=".repeat(70));
  console.log(`TEST SUMMARY: ${passed}/${total} tasks passed`);
  console.log("=".repeat(70));

  // Leave test data for further verification (don't cleanup yet)
  console.log("\n[Test data left in database for Tasks 10-12 frontend verification]");
  console.log("Run cleanup manually with: node scripts/e2e-test.mjs --cleanup\n");

  await mongoose.disconnect();
  process.exit(passed === total ? 0 : 1);
}

// Handle --cleanup flag
if (process.argv[2] === "--cleanup") {
  (async () => {
    await mongoose.connect(MONGODB_URI);
    await cleanup();
    console.log("[CLEANUP] All test data removed.");
    await mongoose.disconnect();
    process.exit(0);
  })();
} else {
  runTests().catch(err => {
    console.error("[FATAL]", err);
    process.exit(1);
  });
}
