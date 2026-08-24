// Create test data for public page tests (Tasks 10-12)
const mongoose = require("mongoose");

const MONGO_URI = "mongodb://localhost:27017/news-website";

async function createTestData() {
  await mongoose.connect(MONGO_URI);
  console.log("Connected to MongoDB");
  
  const db = mongoose.connection.db;
  const tagsCollection = db.collection("tags");
  const articlesCollection = db.collection("articles");
  
  // Clean up any existing test data
  await tagsCollection.deleteMany({ slug: { $regex: /^e2e-test-/ } });
  await articlesCollection.deleteMany({ slug: { $regex: /^e2e-test-/ } });
  
  // Create test tags
  const tag1 = await tagsCollection.insertOne({
    name: "E2E Test Politics",
    slug: "e2e-test-politics",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log(`✓ Tag 1: e2e-test-politics`);
  
  const tag2 = await tagsCollection.insertOne({
    name: "E2E Test Economy",
    slug: "e2e-test-economy",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log(`✓ Tag 2: e2e-test-economy`);
  
  const tag3 = await tagsCollection.insertOne({
    name: "E2E Test Technology",
    slug: "e2e-test-technology",
    isActive: true,
    createdAt: new Date(),
    updatedAt: new Date()
  });
  console.log(`✓ Tag 3: e2e-test-technology`);
  
  // Create a category ObjectId (we'll use a placeholder)
  const categoryId = new mongoose.Types.ObjectId();
  
  // Create test articles with tags
  const now = new Date();
  
  // Article 1: Has all 3 tags
  await articlesCollection.insertOne({
    title: "E2E Test Article: Politics and Economy Meet",
    slug: "e2e-test-politics-economy-meet",
    summary: "A comprehensive test article covering politics and economy.",
    content: "Full content for the politics and economy test article. This tests tag rendering on public pages.",
    category: categoryId,
    author: "E2E Test Author",
    tags: [tag1.insertedId, tag2.insertedId, tag3.insertedId],
    isBreaking: true,
    isFeatured: true,
    status: "published",
    publishedAt: now,
    createdAt: now,
    updatedAt: now
  });
  console.log(`✓ Article 1: e2e-test-politics-economy-meet (3 tags)`);
  
  // Article 2: Has 2 tags
  await articlesCollection.insertOne({
    title: "E2E Test Article: Technology Boom",
    slug: "e2e-test-technology-boom",
    summary: "Testing the technology sector boom.",
    content: "Full content for the technology boom article. This tests tag rendering.",
    category: categoryId,
    author: "E2E Test Author",
    tags: [tag3.insertedId],
    isBreaking: false,
    isFeatured: false,
    status: "published",
    publishedAt: new Date(now.getTime() - 86400000), // 1 day ago
    createdAt: new Date(now.getTime() - 86400000),
    updatedAt: new Date(now.getTime() - 86400000)
  });
  console.log(`✓ Article 2: e2e-test-technology-boom (1 tag)`);
  
  // Article 3: Has 1 tag
  await articlesCollection.insertOne({
    title: "E2E Test Article: Economy Rising",
    slug: "e2e-test-economy-rising",
    summary: "The economy is rising steadily.",
    content: "Full content for the economy rising article.",
    category: categoryId,
    author: "E2E Test Author",
    tags: [tag2.insertedId],
    isBreaking: false,
    isFeatured: false,
    status: "published",
    publishedAt: new Date(now.getTime() - 172800000), // 2 days ago
    createdAt: new Date(now.getTime() - 172800000),
    updatedAt: new Date(now.getTime() - 172800000)
  });
  console.log(`✓ Article 3: e2e-test-economy-rising (1 tag)`);
  
  // Article 4: Inactive (draft status) - should NOT appear in public pages
  await articlesCollection.insertOne({
    title: "E2E Test Draft Article",
    slug: "e2e-test-draft-article",
    summary: "This is a draft and should not appear publicly.",
    content: "Draft content.",
    category: categoryId,
    author: "E2E Test Author",
    tags: [tag1.insertedId],
    isBreaking: false,
    isFeatured: false,
    status: "draft",
    publishedAt: now,
    createdAt: now,
    updatedAt: now
  });
  console.log(`✓ Article 4 (draft): e2e-test-draft-article (should NOT appear publicly)`);
  
  // Article 5: Inactive tag - should NOT appear in tag page
  await articlesCollection.insertOne({
    title: "E2E Test Inactive Tag Article",
    slug: "e2e-test-inactive-tag-article",
    summary: "This article has an inactive tag.",
    content: "Content for inactive tag test.",
    category: categoryId,
    author: "E2E Test Author",
    tags: [tag1.insertedId],
    isBreaking: false,
    isFeatured: false,
    status: "published",
    publishedAt: now,
    createdAt: now,
    updatedAt: now
  });
  console.log(`✓ Article 5: e2e-test-inactive-tag-article (tag will be deactivated)`);
  
  // Deactivate tag1 for inactive tag test
  await tagsCollection.updateOne(
    { _id: tag1.insertedId },
    { $set: { isActive: false, updatedAt: new Date() } }
  );
  console.log(`✓ Tag 1 (e2e-test-politics) deactivated for inactive test`);
  
  const totalTags = await tagsCollection.countDocuments();
  const totalArticles = await articlesCollection.countDocuments();
  console.log(`\nTest data created: ${totalTags} tags, ${totalArticles} articles`);
  
  await mongoose.disconnect();
  console.log("Disconnected from MongoDB");
}

createTestData().catch(err => {
  console.error("Test data creation failed:", err);
  process.exit(1);
});
