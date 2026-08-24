import mongoose from 'mongoose';
import { connectDB } from '@/lib/mongodb';
import Category from '@/models/Category';
import Tag from '@/models/Tag';
import Author from '@/models/Author';
import Article from '@/models/Article';

async function main() {
  await connectDB();

  // Check collections
  const cats = await Category.find();
  const tags = await Tag.find();
  const authors = await Author.find();
  const articles = await Article.find().lean();

  console.log('Categories:', cats.length);
  console.log('Tags:', tags.length);
  console.log('Authors:', authors.length);
  console.log('Articles:', articles.length);

  // Find or create categories
  console.log('\nEnsuring categories exist...');
  const catSlugs = ['india', 'world', 'politics', 'business', 'sports'];
  const catNames = ['India', 'World', 'Politics', 'Business', 'Sports'];
  const createdCats: any[] = [];
  for (let i = 0; i < catSlugs.length; i++) {
    let cat = await Category.findOne({ slug: catSlugs[i] });
    if (!cat) {
      cat = await Category.create({ name: catNames[i], slug: catSlugs[i], icon: '📰', color: '#1e40af' });
      console.log(`  Created category: ${cat.name}`);
    } else {
      console.log(`  Found category: ${cat.name}`);
    }
    createdCats.push(cat);
  }

  // Find or create tags
  console.log('\nEnsuring tags exist...');
  const tagSlugs = ['ai', 'markets', 'cricket'];
  const tagNames = ['AI', 'Markets', 'Cricket'];
  const createdTags: any[] = [];
  for (let i = 0; i < tagSlugs.length; i++) {
    let tag = await Tag.findOne({ slug: tagSlugs[i] });
    if (!tag) {
      tag = await Tag.create({ name: tagNames[i], slug: tagSlugs[i], isActive: true });
      console.log(`  Created tag: ${tag.name}`);
    } else {
      console.log(`  Found tag: ${tag.name}`);
    }
    createdTags.push(tag);
  }

  // Find or create author
  console.log('\nEnsuring author exists...');
  let author = await Author.findOne({ slug: 'test-author' });
  if (!author) {
    author = await Author.create({ name: 'Test Author', slug: 'test-author', bio: 'Test author for integration testing', isActive: true });
    console.log(`  Created author: ${author.name}`);
  } else {
    console.log(`  Found author: ${author.name}`);
  }

  const catIds: Record<string, any> = {};
  createdCats.forEach((cat: any) => { catIds[cat.name] = cat._id; });

  const tagIds: Record<string, any> = {};
  createdTags.forEach((tag: any) => { tagIds[tag.name] = tag._id; });

  const authorId = author._id;

  // Always create test articles (check by slug to avoid duplicates)
  console.log('\nCreating test articles...');
  const existingSlugs = await Article.find({ slug: { $in: ['india-ai-policy-framework', 'stock-markets-record-highs', 'cricket-world-cup-india-benchmark'] } }).distinct('slug');
  const newArticles: any[] = [];

  if (!existingSlugs.includes('india-ai-policy-framework')) {
    newArticles.push({
      title: 'India AI Policy Framework: What It Means for Tech Growth',
      slug: 'india-ai-policy-framework',
      summary: 'A comprehensive look at India\'s new AI policy and its implications for the technology sector.',
      content: 'India has announced a comprehensive AI policy framework that aims to position the country as a global leader in artificial intelligence.\n\nThe policy outlines key initiatives for AI research, development, and ethical deployment across industries.\n\nExperts say this could transform India\'s tech landscape over the next decade.',
      author: authorId,
      category: catIds['India'],
      tags: [tagIds['AI']],
      isBreaking: true,
      isFeatured: true,
      status: 'published',
      publishedAt: new Date('2025-01-15T10:00:00Z'),
    });
  }

  if (!existingSlugs.includes('stock-markets-record-highs')) {
    newArticles.push({
      title: 'Stock Markets Hit Record Highs on Strong Economic Data',
      slug: 'stock-markets-record-highs',
      summary: 'Indian markets reached unprecedented levels as investors respond positively to latest economic indicators.',
      content: 'Indian stock markets surged to new record highs today following the release of stronger-than-expected economic data.\n\nThe Sensex crossed key psychological barriers while the Nifty also posted significant gains.\n\nAnalysts attribute the rally to improved foreign investor sentiment and robust domestic consumption.',
      author: authorId,
      category: catIds['Business'],
      tags: [tagIds['Markets']],
      isBreaking: false,
      isFeatured: false,
      status: 'published',
      publishedAt: new Date('2025-01-14T14:30:00Z'),
    });
  }

  if (!existingSlugs.includes('cricket-world-cup-india-benchmark')) {
    newArticles.push({
      title: 'Cricket World Cup Qualifiers: India Sets New Benchmark',
      slug: 'cricket-world-cup-india-benchmark',
      summary: 'India delivers a stellar performance in the World Cup qualifiers, setting a new team record.',
      content: 'The Indian cricket team has set a new benchmark in the World Cup qualifiers with a commanding victory.\n\nPlayers delivered outstanding performances across batting, bowling, and fielding.\n\nThis win strengthens India\'s position as a top contender for the championship.',
      author: authorId,
      category: catIds['Sports'],
      tags: [tagIds['Cricket']],
      isBreaking: false,
      isFeatured: false,
      status: 'published',
      publishedAt: new Date('2025-01-13T09:00:00Z'),
    });
  }

  if (newArticles.length > 0) {
    const createdArticles = await Article.insertMany(newArticles);
    console.log(`Created ${createdArticles.length} test articles:`, createdArticles.map((a: any) => a.title).join(', '));
  } else {
    console.log('All test articles already exist, skipping creation.');
  }

  console.log('\n=== Final Database State ===');
  console.log('Categories:', await Category.countDocuments());
  console.log('Tags:', await Tag.countDocuments());
  console.log('Authors:', await Author.countDocuments());
  console.log('Articles:', await Article.countDocuments());

  await mongoose.disconnect();
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
