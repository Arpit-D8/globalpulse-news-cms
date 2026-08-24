import mongoose from "mongoose";
import Article from "@/models/Article";
import Tag from "@/models/Tag";

(async () => {
  await mongoose.connect(process.env.MONGODB_URI!);
  
  const tags = await Tag.find({}).select("name slug");
  const articles = await Article.find({}).select("title slug status").limit(30);
  
  console.log("=== ALL TAGS ===");
  tags.forEach(t => console.log(`  ${t.name} → ${t.slug} (active=${t.isActive})`));
  
  console.log("\n=== ALL ARTICLES ===");
  articles.forEach(a => console.log(`  ${a.title} → ${a.slug} (${a.status})`));
  
  console.log(`\nTotal tags: ${tags.length}`);
  console.log(`Total articles: ${articles.length}`);
  
  await mongoose.disconnect();
})();
