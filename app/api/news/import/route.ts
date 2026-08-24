import { connectDB } from "@/lib/mongodb";
import Article from "@/models/Article";
import Category from "@/models/Category";
import Media from "@/models/Media";
import Author from "@/models/Author";
import { uploadImage } from "@/lib/services/media.service";
import { generateUniqueSlug as generateArticleSlug } from "@/lib/services/article.service";
import { authorExists, createAuthor } from "@/lib/services/author.service";
import { getTagBySlug, createTag } from "@/lib/services/tag.service";
import { generateSlug } from "@/lib/slug";

import {
  NewsAPIProvider,
  NewsManager,
} from "@/services/ai/news";
import { successResponse, handleService } from "@/lib/api/response";
import { requireAdmin } from "@/lib/auth-guard";
import { checkRateLimit } from "@/lib/rate-limit";

// ---------------------------------------------------------------------------
// POST /api/news/import
// ---------------------------------------------------------------------------

/**
 * Import articles from the NewsAPI provider into the database.
 *
 * Skips articles that already exist (slug match). Returns import
 * statistics (imported, skipped, failed, total).
 */
export async function POST(request: Request) {
  // Rate limit: 2 requests/minute/IP
  const rateLimitResult = await checkRateLimit(request, "news:import");
  if (rateLimitResult) {
    return rateLimitResult;
  }

  return handleService(async () => {
    await requireAdmin();
    await connectDB();

    const manager = new NewsManager([new NewsAPIProvider()]);
    const articles = await manager.fetchAllNews();

    let imported = 0;
    let skipped = 0;
    let failed = 0;
    let tagsCreated = 0;
    let tagsReused = 0;
    let tagsSkipped = 0;

    for (const article of articles) {
      try {
        // --- Slug: use project's unique-slug helper ---
        const baseSlug = article.title
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "");
        const slug = await generateArticleSlug(baseSlug);

        // --- Duplicate check by slug ---
        const existing = await Article.findOne({ slug });
        if (existing) {
          skipped++;
          continue;
        }

        // --- Category resolution ---
        let categoryId: string | null = null;
        const categoryName = (article.category as string) || "India";
        const categoryDoc = await Category.findOne({
          name: { $regex: new RegExp(`^${categoryName}$`, "i") },
        }).lean();
        categoryId = categoryDoc?._id.toString() ?? null;

        if (!categoryId) {
          const newCategory = await Category.create({
            name: categoryName,
            slug: categoryName.toLowerCase().replace(/[^a-z0-9]+/g, "-"),
            description: `News about ${categoryName}`,
            displayOrder: 999,
            isActive: true,
          });
          categoryId = newCategory._id.toString();
        }

        // --- Author resolution ---
        let authorId: string | null = null;
        const authorName = article.author
          ? String(article.author).trim()
          : null;

        if (authorName) {
          const normalizedAuthor = authorName.toLowerCase();
          const alreadyExists = await authorExists(normalizedAuthor);
          if (alreadyExists) {
            const authorDoc = await Author.findOne({
              name: { $regex: new RegExp(`^${authorName}$`, "i") },
            }).lean();
            authorId = authorDoc?._id.toString() ?? null;
          } else {
            const newAuthor = await createAuthor({
              name: authorName,
              slug: normalizedAuthor.replace(/[^a-z0-9]+/g, "-"),
              bio: "",
              photoUrl: "",
              email: "",
              twitterHandle: "",
              websiteUrl: "",
              isActive: true,
            });
            authorId = newAuthor._id;
          }
        }

        // --- Media / featuredImage ---
        let featuredImageId: string | null = null;
        const imageUrl = article.image;

        if (imageUrl && typeof imageUrl === "string" && imageUrl.trim().length > 0) {
          try {
            const isCloudinaryUrl = /^https?:\/\/res\.cloudinary\.com\//.test(
              imageUrl
            );

            if (isCloudinaryUrl) {
              const urlParts = new URL(imageUrl)
                .pathname.split("/")
                .filter(Boolean);
              const imageIndex = urlParts.findIndex(
                (part) => part === "image"
              );
              if (imageIndex !== -1 && imageIndex < urlParts.length - 1) {
                let rawPublicId = urlParts[imageIndex + 1];
                let format = "jpg";

                const formatMatch = rawPublicId.match(
                  /^(.*)\.([a-z0-9]+)$/i
                );
                if (formatMatch) {
                  format = formatMatch[2].toLowerCase();
                  rawPublicId = formatMatch[1];
                }

                // Fetch real dimensions via HEAD request
                let width = 1200;
                let height = 630;
                try {
                  const headRes = await fetch(imageUrl, {
                    method: "HEAD",
                    headers: { "User-Agent": "VidarbhaPrint/1.0" },
                    redirect: "follow",
                  });
                  if (headRes.ok) {
                    const urlParams = new URL(imageUrl).searchParams;
                    const w = urlParams.get("w") || urlParams.get("width");
                    const h = urlParams.get("h") || urlParams.get("height");
                    if (w && h) {
                      width = parseInt(w, 10) || 1200;
                      height = parseInt(h, 10) || 630;
                    }
                  }
                } catch {
                  // HEAD request failed — use defaults below
                }

                // Ensure dimensions meet schema minimums (>= 1)
                if (width < 1) width = 1;
                if (height < 1) height = 1;

                const mediaDoc = await Media.create({
                  publicId: rawPublicId.toLowerCase(),
                  url: imageUrl,
                  width,
                  height,
                  format,
                  bytes: 0,
                  createdBy: "news-import",
                });
                featuredImageId = mediaDoc._id.toString();
              }
            } else {
              // Not Cloudinary — upload to Cloudinary and create Media document
              const mediaDoc = await uploadImage(imageUrl, {
                createdBy: "news-import",
              });
              featuredImageId = mediaDoc._id.toString();
            }
          } catch (mediaError) {
            console.error(
              `[news-import] Failed to create Media document for "${article.title}":`,
              mediaError
            );
            // Continue without featured image
          }
        }

        // --- Tag resolution ---
        const tagIds: string[] = [];
        const seenKeywords = new Set<string>();

        if (article.keywords && article.keywords.length > 0) {
          for (const rawKeyword of article.keywords) {
            // Normalize: trim whitespace
            const trimmed = String(rawKeyword).trim();

            // Skip empty strings
            if (trimmed.length === 0) {
              continue;
            }

            // Generate slug
            const slug = generateSlug(trimmed);

            // Skip if slug is empty
            if (slug.length === 0) {
              continue;
            }

            // Skip duplicate keywords within the same article (case-insensitive)
            const normalizedKey = slug.toLowerCase();
            if (seenKeywords.has(normalizedKey)) {
              continue;
            }
            seenKeywords.add(normalizedKey);

            try {
              // Look up existing active Tag by slug
              const existingTag = await getTagBySlug(slug);

              if (existingTag) {
                if (existingTag.isActive) {
                  // Reuse active tag
                  tagIds.push(existingTag._id);
                  tagsReused++;
                } else {
                  // Inactive tag — do not silently reactivate, do not create duplicate
                  console.warn(
                    `[news-import] Skipping keyword "${trimmed}" for article "${article.title}": existing tag is inactive`
                  );
                  tagsSkipped++;
                }
              } else {
                // Create new managed Tag
                const newTag = await createTag({
                  name: trimmed,
                  slug,
                  description: "",
                  isActive: true,
                });
                tagIds.push(newTag._id);
                tagsCreated++;
              }
            } catch (tagError) {
              // Handle race condition: if createTag fails (e.g. duplicate),
              // try lookup again
              if (
                tagError instanceof Error &&
                (tagError.message.includes("duplicate") ||
                  tagError.message.includes("duplicate key") ||
                  tagError.message.includes("Conflict"))
              ) {
                try {
                  const retryTag = await getTagBySlug(slug);
                  if (retryTag && retryTag.isActive) {
                    tagIds.push(retryTag._id);
                    tagsReused++;
                  } else if (retryTag) {
                    console.warn(
                      `[news-import] Skipping keyword "${trimmed}" for article "${article.title}": existing tag is inactive`
                    );
                    tagsSkipped++;
                  }
                } catch {
                  // Tag still not found after retry — skip
                  tagsSkipped++;
                }
              } else {
                // Other error — log and skip
                console.error(
                  `[news-import] Failed to resolve tag for keyword "${trimmed}" in article "${article.title}":`,
                  tagError
                );
                tagsSkipped++;
              }
            }
          }
        }

        // --- Create Article ---
        await Article.create({
          title: article.title,
          slug,
          summary: article.description,
          content: article.content,
          category: categoryId,
          featuredImage: featuredImageId,
          author: authorId,
          status: "draft",
          publishedAt: article.publishedAt,
          tags: tagIds,
        });

        imported++;
      } catch (articleError) {
        console.error(
          `[news-import] Failed to import article "${article.title}":`,
          articleError
        );
        failed++;
        // Continue with next article
      }
    }

    return successResponse({ imported, skipped, failed, total: articles.length, tagsCreated, tagsReused, tagsSkipped });
  });
}
