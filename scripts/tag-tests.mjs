import mongoose from "mongoose";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/news-website";

// Connect to database
await mongoose.connect(MONGODB_URI);
console.log("Connected to MongoDB");

// Get the Tag model
const Tag = mongoose.models.Tag || mongoose.model("Tag", new mongoose.Schema({
  name: { type: String, required: true },
  slug: { type: String, required: true, unique: true },
  isActive: { type: Boolean, default: true }
}));

// Generate slug like the service does
function generateSlug(input) {
  return input.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+/, "").replace(/-+$/, "");
}

// TASK 4 — TAG CREATION TEST
console.log("=== TASK 4: TAG CREATION TEST ===");

const testKeyword = "Integration Test India";
const testSlug = generateSlug(testKeyword);
console.log(`Testing tag creation with keyword: "${testKeyword}"`);
console.log(`Expected slug: "${testSlug}"`);

// Create a new tag (simulating what the importer does)
const newTag = new Tag({
  name: testKeyword,
  slug: testSlug,
  isActive: true
});

const savedTag = await newTag.save();
console.log(`✓ Tag created: _id=${savedTag._id}, name="${savedTag.name}", slug="${savedTag.slug}", isActive=${savedTag.isActive}`);

// Verify it exists in the database
const foundTag = await Tag.findOne({ slug: testSlug });
if (!foundTag) throw new Error("Tag should exist in database");
console.log("✓ Tag verified in database");

// TASK 5 — TAG REUSE TEST
console.log("\n=== TASK 5: TAG REUSE TEST ===");
console.log(`Attempting to create duplicate tag with same slug: "${testSlug}"`);

const duplicateTag = new Tag({
  name: testKeyword,
  slug: testSlug,
  isActive: true
});

try {
  await duplicateTag.save();
  console.log("✗ ERROR: Duplicate tag was created (unique index not working!)");
} catch (err) {
  if (err.code === 11000 || err.codeName === "DuplicateKey") {
    console.log(`✓ Duplicate key error caught (code: ${err.code}) — unique index working`);
    
    // Simulate importer behavior: find existing tag by slug
    const reusedTag = await Tag.findOne({ slug: testSlug });
    if (!reusedTag) throw new Error("Should find existing tag by slug");
    console.log(`✓ Tag reuse logic: found existing tag _id=${reusedTag._id}`);
  } else {
    console.log(`✗ Unexpected error: ${err.message}`);
  }
}

// TASK 6 — DEDUPLICATION TEST
console.log("\n=== TASK 6: DEDUPLICATION TEST ===");

// Create a few more tags with slight variations
const tag2 = new Tag({ name: "Mumbai Cricket", slug: "mumbai-cricket", isActive: true });
await tag2.save();
console.log(`✓ Tag 2 created: "${tag2.name}" slug="${tag2.slug}"`);

const tag3 = new Tag({ name: "Delhi Politics", slug: "delhi-politics", isActive: true });
await tag3.save();
console.log(`✓ Tag 3 created: "${tag3.name}" slug="${tag3.slug}"`);

// Verify all tags are unique
const allTags = await Tag.find({}).sort({ slug: 1 });
console.log(`Total unique tags: ${allTags.length}`);
const slugs = allTags.map(t => t.slug);
const uniqueSlugs = new Set(slugs);
if (slugs.length !== uniqueSlugs.size) throw new Error("All slugs should be unique");
console.log("✓ All slugs are unique (no duplicates)");

// TASK 7 — INACTIVE TAG TEST
console.log("\n=== TASK 7: INACTIVE TAG TEST ===");

// Deactivate one of the tags
const deactivated = await Tag.findOneAndUpdate(
  { slug: "delhi-politics" },
  { isActive: false },
  { new: true }
);
console.log(`✓ Tag deactivated: "${deactivated.name}" slug="${deactivated.slug}" isActive=${deactivated.isActive}`);

// Verify inactive tag is not found by active queries
const activeOnly = await Tag.find({ isActive: true });
console.log(`Active tags: ${activeOnly.length}`);
const inactiveTags = await Tag.find({ isActive: false });
console.log(`Inactive tags: ${inactiveTags.length}`);

// Test that getArticlesByTag would skip inactive tags (simulate the logic)
const inactiveTagSlug = "delhi-politics";
const inactiveTagDoc = await Tag.findOne({ slug: inactiveTagSlug, isActive: true });
if (inactiveTagDoc) throw new Error("Inactive tag should not be found with isActive:true filter");
console.log("✓ Inactive tag correctly excluded from active queries");

// Reactivate for further tests
await Tag.findOneAndUpdate(
  { slug: "delhi-politics" },
  { isActive: true }
);
console.log("✓ Tag reactivated");

console.log("\n=== TASKS 4-7 COMPLETE ===");

// Clean up test data
console.log("\n=== CLEANING UP TEST DATA ===");
await Tag.deleteMany({ slug: { $in: [testSlug, "mumbai-cricket", "delhi-politics"] } });
const remainingTags = await Tag.countDocuments();
console.log(`Test tags removed. Remaining tags: ${remainingTags}`);

await mongoose.disconnect();
console.log("Disconnected from MongoDB");
