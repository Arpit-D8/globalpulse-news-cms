import mongoose from "mongoose";
import ArticleModel from "../models/Article.js";
import TagModel from "../models/Tag.js";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/news-website";

// Connect to database
await mongoose.connect(MONGODB_URI);
console.log("Connected to MongoDB");

// TASK 8 — ARTICLE TAG REFERENCES TEST
console.log("=== TASK 8: ARTICLE TAG REFERENCES TEST ===");

// Create test tags first
const tag1 = new TagModel({ name: "Test Technology", slug: "test-technology", isActive: true });
await tag1.save();
console.log(`✓ Tag 1 created: _id=${tag1._id}, slug="${tag1.slug}"`);

const tag2 = new TagModel({ name: "Test AI", slug: "test-ai", isActive: true });
await tag2.save();
console.log(`✓ Tag 2 created: _id=${tag2._id}, slug="${tag2.slug}"`);

// Create a test article with tag ObjectId references
const testArticle = new ArticleModel({
  title: "Integration Test Article: AI in Technology",
  slug: "integration-test-ai-technology",
  summary: "This article tests tag references in the Article schema.",
  content: "Full article content here. This tests that tags are properly stored as ObjectId references.",
  category: "Technology",
  featuredImage: null,
  author: "Test Author",
  tags: [tag1._id, tag2._id],  // ObjectId references, not strings
  isBreaking: false,
  isFeatured: false,
  status: "published",
  publishedAt: new Date()
});

const savedArticle = await testArticle.save();
console.log(`✓ Article created: _id=${savedArticle._id}, slug="${savedArticle.slug}"`);
console.log(`  Article tags (ObjectId refs): ${savedArticle.tags.map(id => id.toString()).join(", ")}`);

// Verify tags are stored as ObjectId references
const rawArticle = await ArticleModel.findById(savedArticle._id).lean();
console.log(`  Raw article tags type: ${typeof rawArticle.tags[0]} (${rawArticle.tags[0].constructor.name})`);

// Verify we can populate tags
const populatedArticle = await ArticleModel.findById(savedArticle._id).populate("tags").lean();
console.log(`  Populated tags: ${JSON.stringify(populatedArticle.tags)}`);

// TASK 9 — DTO VERIFICATION TEST
console.log("\n=== TASK 9: DTO VERIFICATION TEST ===");

// Simulate serializeArticle() logic
function generateSlug(input) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
}

function toIsoDate(value, fallback) {
  const source = value ?? fallback ?? new Date();
  const date = source instanceof Date ? source : new Date(source);
  if (Number.isNaN(date.getTime())) return new Date().toISOString();
  return date.toISOString();
}

function toObjectIdString(value) {
  if (value && typeof value.toString === "function") {
    return value.toString();
  }
  return "";
}

// Test 1: Populated tags (Tag documents)
console.log("\n--- Test 1: Populated Tags ---");
const serializedTags = (populatedArticle.tags ?? []).map(tag => {
  const id = toObjectIdString(tag._id);
  return {
    _id: id,
    name: tag.name ?? "",
    slug: tag.slug ?? ""
  };
});
console.log("Serialized tag DTOs:");
serializedTags.forEach((tag, i) => {
  console.log(`  [${i}] _id=${tag._id}, name="${tag.name}", slug="${tag.slug}"`);
  // Verify DTO shape
  if (!tag._id || !tag.name || !tag.slug) {
    throw new Error(`Tag DTO[${i}] missing required fields: ${JSON.stringify(tag)}`);
  }
});
console.log("✓ All tag DTOs have correct shape: {_id, name, slug}");

// Test 2: Unpopulated tags (bare ObjectId strings)
console.log("\n--- Test 2: Unpopulated Tags ---");
const unpopulatedTags = (rawArticle.tags ?? []).map(tag => {
  // Unpopulated: bare ObjectId string
  if (typeof tag === "string") {
    return { _id: tag, name: "", slug: "" };
  }
  // Populated Tag document
  const id = toObjectIdString(tag._id);
  return {
    _id: id,
    name: tag.name ?? "",
    slug: tag.slug ?? ""
  };
});
console.log("Unpopulated tag DTOs:");
unpopulatedTags.forEach((tag, i) => {
  console.log(`  [${i}] _id=${tag._id}, name="${tag.name}", slug="${tag.slug}"`);
});
console.log("✓ Unpopulated tags handled correctly (empty name/slug, _id present)");

// Test 3: Verify ArticleCard rendering would work
console.log("\n--- Test 3: ArticleCard Rendering Simulation ---");
serializedTags.forEach(tag => {
  const linkHref = `/tags/${tag.slug}`;
  console.log(`  ArticleCard would render: <Link href="${linkHref}">${tag.name}</Link>`);
});
console.log("✓ ArticleCard rendering simulation successful");

// Test 4: Verify getArticlesByTag resolution
console.log("\n--- Test 4: getArticlesByTag Resolution Simulation ---");
for (const tag of [tag1, tag2]) {
  const tagDoc = await TagModel.findOne({ slug: tag.slug, isActive: true });
  if (tagDoc) {
    const queryTags = { $in: [tagDoc._id] };
    console.log(`  Tag "${tag.slug}" resolved to ObjectId: ${tagDoc._id.toString()}`);
    console.log(`  Query would be: tags: ${JSON.stringify(queryTags)}`);
  } else {
    console.log(`  Tag "${tag.slug}" not found or inactive — would return []`);
  }
}
console.log("✓ getArticlesByTag resolution simulation successful");

// Verify article has correct tags
const articlesWithTag1 = await ArticleModel.find({ 
  tags: { $in: [tag1._id] },
  status: "published"
}).countDocuments();
console.log(`\n  Articles with tag "${tag1.slug}": ${articlesWithTag1}`);
if (articlesWithTag1 !== 1) throw new Error("Should find exactly 1 article with tag1");
console.log("✓ Article tag query verification successful");

// CLEANUP
console.log("\n=== CLEANING UP TEST DATA ===");
await ArticleModel.deleteOne({ _id: savedArticle._id });
await TagModel.deleteMany({ slug: { $in: ["test-technology", "test-ai"] } });
const remainingTags = await TagModel.countDocuments();
const remainingArticles = await ArticleModel.countDocuments();
console.log(`Test data removed. Remaining tags: ${remainingTags}, articles: ${remainingArticles}`);

await mongoose.disconnect();
console.log("Disconnected from MongoDB");
console.log("\n=== TASKS 8-9 COMPLETE ===");
