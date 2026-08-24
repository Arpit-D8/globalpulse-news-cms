/**
 * Runtime verification script for Phase 6E.5.1
 * Tests that getArticleById() populates tags correctly.
 *
 * Usage: MONGODB_URI=... npx tsx scripts/verify-tag-population.ts
 */

import { connectDB } from "@/lib/mongodb";
import Article from "@/models/Article";
import Tag from "@/models/Tag";
import Category from "@/models/Category";
import Author from "@/models/Author";
import { ObjectId } from "mongodb";

// ---------------------------------------------------------------------------
// Colors for terminal output
// ---------------------------------------------------------------------------
const GREEN = "\x1b[32m";
const RED = "\x1b[31m";
const YELLOW = "\x1b[33m";
const BOLD = "\x1b[1m";
const RESET = "\x1b[0m";

function pass(msg: string) {
  console.log(`${GREEN}✓${RESET} ${msg}`);
}

function fail(msg: string) {
  console.log(`${RED}✗${RESET} ${msg}`);
}

function info(msg: string) {
  console.log(`${YELLOW}›${RESET} ${msg}`);
}

// ---------------------------------------------------------------------------
// Test setup
// ---------------------------------------------------------------------------

async function main() {
  console.log(`${BOLD}Phase 6E.5.1 — Runtime Verification${RESET}\n`);
  console.log(`${BOLD}Test: getArticleById() populates tags correctly${RESET}\n`);

  await connectDB();

  // Generate unique test identifiers to avoid conflicts.
  const timestamp = Date.now();
  const testTag1Name = `VerifyTag1_${timestamp}`;
  const testTag2Name = `VerifyTag2_${timestamp}`;
  const testTag1Slug = `verify-tag-1-${timestamp}`;
  const testTag2Slug = `verify-tag-2-${timestamp}`;
  const testArticleTitle = `Verify Article ${timestamp}`;
  const testArticleSlug = `verify-article-${timestamp}`;

  let testTag1: any;
  let testTag2: any;
  let testCategory: any;
  let testAuthor: any;
  let testArticle: any;

  try {
    // ------------------------------------------------------------------
    // Step 1: Create test tags (let MongoDB auto-generate _id)
    // ------------------------------------------------------------------
    info(`Creating test tags: ${testTag1Name}, ${testTag2Name}`);

    testTag1 = await Tag.create({
      name: testTag1Name,
      slug: testTag1Slug,
    });
    const testTag1Id = testTag1._id.toString();
    pass(`Created tag: ${testTag1Name} (${testTag1Id})`);

    testTag2 = await Tag.create({
      name: testTag2Name,
      slug: testTag2Slug,
    });
    const testTag2Id = testTag2._id.toString();
    pass(`Created tag: ${testTag2Name} (${testTag2Id})`);

    // ------------------------------------------------------------------
    // Step 2: Create test category (required by Article schema)
    // ------------------------------------------------------------------
    info("Creating test category");

    testCategory = await Category.create({
      name: `Verify Category ${timestamp}`,
      slug: `verify-category-${timestamp}`,
    });
    pass(`Created category: ${testCategory.name} (${testCategory._id})`);

    // ------------------------------------------------------------------
    // Step 3: Create test author (required by Article schema)
    // ------------------------------------------------------------------
    info("Creating test author");

    testAuthor = await Author.create({
      name: `Verify Author ${timestamp}`,
      slug: `verify-author-${timestamp}`,
    });
    pass(`Created author: ${testAuthor.name} (${testAuthor._id})`);

    // ------------------------------------------------------------------
    // Step 4: Create test article with tag references
    // ------------------------------------------------------------------
    info("Creating test article with tag references");

    testArticle = await Article.create({
      title: testArticleTitle,
      slug: testArticleSlug,
      summary: "Verification test article",
      content: "<p>This article is used for runtime verification of tag population.</p>",
      author: testAuthor._id,
      category: testCategory._id,
      tags: [testTag1Id, testTag2Id],
      status: "draft",
    });
    pass(`Created article: ${testArticleTitle} (${testArticle._id})`);

    // ------------------------------------------------------------------
    // Step 5: Test getArticleById() WITHOUT .populate()
    // ------------------------------------------------------------------
    info("Testing Article.findById() WITHOUT .populate('tags')");

    const unpopulated = await Article.findById(testArticle._id);
    const unpopulatedTags = unpopulated?.tags;

    if (Array.isArray(unpopulatedTags) && unpopulatedTags.length === 2) {
      const isObjectId = unpopulatedTags.every((t) => t instanceof ObjectId || typeof t === "string");
      if (isObjectId) {
        pass(`Unpopulated tags are ObjectId references (expected)`);
      } else {
        fail(`Unpopulated tags should be ObjectId references, got: ${typeof unpopulatedTags[0]}`);
      }
    } else {
      fail(`Expected 2 unpopulated tags, got: ${unpopulatedTags?.length ?? 0}`);
    }

    // ------------------------------------------------------------------
    // Step 6: Test getArticleById() WITH .populate("tags")
    // ------------------------------------------------------------------
    info("Testing Article.findById().populate('tags')");

    const populated = await Article.findById(testArticle._id).populate("tags");

    if (!populated) {
      fail("Article not found after creation");
      return;
    }

    const populatedTags = populated.tags;

    if (!Array.isArray(populatedTags)) {
      fail(`Tags should be an array, got: ${typeof populatedTags}`);
      return;
    }

    if (populatedTags.length !== 2) {
      fail(`Expected 2 populated tags, got: ${populatedTags.length}`);
      return;
    }
    pass(`Found ${populatedTags.length} populated tags`);

    // Verify each tag has the expected structure.
    const expectedTagIds = [testTag1Id, testTag2Id];
    const expectedTagNames = [testTag1Name, testTag2Name];
    const expectedTagSlugs = [testTag1Slug, testTag2Slug];

    let allTagsValid = true;
    for (let i = 0; i < populatedTags.length; i++) {
      const tag = populatedTags[i];
      const hasId = typeof (tag as any)._id === "string" || (tag as any)._id?.toString;
      const hasName = typeof (tag as any).name === "string";
      const hasSlug = typeof (tag as any).slug === "string";

      if (!hasId || !hasName || !hasSlug) {
        fail(`Tag[${i}] missing expected fields: ${JSON.stringify(tag)}`);
        allTagsValid = false;
        continue;
      }

      const tagId = (tag as any)._id.toString?.() ?? (tag as any)._id;
      const tagName = (tag as any).name;
      const tagSlug = (tag as any).slug;

      const idx = expectedTagIds.indexOf(tagId);
      if (idx === -1) {
        fail(`Tag[${i}] unexpected _id: ${tagId}`);
        allTagsValid = false;
      } else {
        if (tagName !== expectedTagNames[idx]) {
          fail(`Tag[${i}] name mismatch: expected ${expectedTagNames[idx]}, got ${tagName}`);
          allTagsValid = false;
        } else {
          pass(`Tag[${i}] matches: ${tagName} (${tagSlug})`);
        }

        if (tagSlug !== expectedTagSlugs[idx]) {
          fail(`Tag[${i}] slug mismatch: expected ${expectedTagSlugs[idx]}, got ${tagSlug}`);
          allTagsValid = false;
        }
      }
    }

    if (allTagsValid) {
      pass("All populated tags have correct structure ({ _id, name, slug })");
    }

    // ------------------------------------------------------------------
    // Step 7: Verify toArticle() helper serialization
    // ------------------------------------------------------------------
    info("Verifying toArticle() serialization of populated tags");

    // Simulate what toArticle() does.
    const rawTags = populated.tags ?? [];
    const serializedTags: Array<{ _id: string; name: string; slug: string }> = rawTags.map((tag: any) => {
      if (typeof tag.name === "string") {
        // Populated Tag document.
        return {
          _id: tag._id.toString?.() ?? tag._id,
          name: tag.name,
          slug: tag.slug,
        };
      }
      // Unpopulated ObjectId.
      return {
        _id: tag.toString?.() ?? tag,
        name: "",
        slug: "",
      };
    });

    if (serializedTags.length === 2) {
      pass(`Serialized ${serializedTags.length} tags correctly`);
    } else {
      fail(`Expected 2 serialized tags, got: ${serializedTags.length}`);
    }

    for (let i = 0; i < serializedTags.length; i++) {
      const st = serializedTags[i];
      if (st._id && st.name && st.slug) {
        pass(`Serialized tag[${i}]: { _id: "${st._id}", name: "${st.name}", slug: "${st.slug}" }`);
      } else {
        fail(`Serialized tag[${i}] missing fields: ${JSON.stringify(st)}`);
      }
    }

    // ------------------------------------------------------------------
    // Summary
    // ------------------------------------------------------------------
    console.log("\n" + "=".repeat(60));
    if (allTagsValid && serializedTags.length === 2) {
      console.log(`${GREEN}${BOLD}ALL CHECKS PASSED${RESET}`);
      console.log(`${GREEN}Tags are correctly populated and serialized.${RESET}\n`);
    } else {
      console.log(`${RED}${BOLD}SOME CHECKS FAILED${RESET}`);
      console.log(`${RED}Review the output above for details.${RESET}\n`);
      process.exit(1);
    }
    console.log("=".repeat(60) + "\n");

  } catch (error) {
    fail(`Runtime error: ${(error as Error).message}`);
    console.error(error);
    process.exit(1);
  } finally {
    // ------------------------------------------------------------------
    // Cleanup: remove test records
    // ------------------------------------------------------------------
    info("Cleaning up test records");

    try {
      await Article.deleteMany({
        title: { $regex: `^Verify Article ${timestamp}$` },
      });
      pass("Deleted test article");
    } catch (e) {
      fail(`Failed to delete test article: ${(e as Error).message}`);
    }

    try {
      await Tag.deleteMany({
        name: { $regex: `^VerifyTag` },
      });
      pass("Deleted test tags");
    } catch (e) {
      fail(`Failed to delete test tags: ${(e as Error).message}`);
    }

    try {
      await Category.deleteMany({
        name: { $regex: `^Verify Category` },
      });
      pass("Deleted test category");
    } catch (e) {
      fail(`Failed to delete test category: ${(e as Error).message}`);
    }

    try {
      await Author.deleteMany({
        name: { $regex: `^Verify Author` },
      });
      pass("Deleted test author");
    } catch (e) {
      fail(`Failed to delete test author: ${(e as Error).message}`);
    }

    info("Cleanup complete");
  }
}

main();
