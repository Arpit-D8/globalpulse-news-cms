
"use client";

import { useState } from "react";

type NewsArticle = {
  id: string;
  title: string;
  description?: string;
  content?: string;
  source?: string;
  author?: string;
  category?: string;
  image?: string;
  url: string;
  publishedAt?: string;
};

export default function NewsFetcherPage() {
  const [articles, setArticles] = useState<NewsArticle[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Fetch latest news from the news provider
  async function fetchNews() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    setResult(null);

    try {
      const res = await fetch("/api/news/fetch", {
        method: "GET",
        cache: "no-store",
      });

      const data = await res.json();

      if (!res.ok || !data.success) {
        throw new Error(
          data.error?.message || "Failed to fetch news articles."
        );
      }

      const fetchedArticles: NewsArticle[] =
        data.data?.articles ?? [];

      setArticles(fetchedArticles);

      if (fetchedArticles.length === 0) {
        setError("No articles were returned by the news provider.");
      } else {
        setSuccess(
          `Successfully fetched ${fetchedArticles.length} news articles.`
        );
      }
    } catch (err) {
      console.error("News fetch error:", err);
      setArticles([]);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while fetching news."
      );
    } finally {
      setLoading(false);
    }
  }

  // Import fetched news into the database
  async function importNews() {
    if (articles.length === 0) {
      setError("Please fetch news articles before importing.");
      return;
    }

    setImporting(true);
    setError(null);
    setSuccess(null);
    setResult(null);

    try {
      const res = await fetch("/api/news/import", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
      });

      const data = await res.json();

      if (!res.ok || data.success === false) {
        throw new Error(
          data.error?.message ||
            data.message ||
            "Failed to import news articles."
        );
      }

      setResult(data.data ?? data);

      setSuccess("News import completed successfully.");
    } catch (err) {
      console.error("News import error:", err);

      setError(
        err instanceof Error
          ? err.message
          : "Something went wrong while importing news."
      );
    } finally {
      setImporting(false);
    }
  }

  return (
    <main
      style={{
        padding: "30px",
        maxWidth: "1100px",
        margin: "0 auto",
        fontFamily: "Arial, sans-serif",
      }}
    >
      <h1 style={{ fontSize: "28px", fontWeight: "bold" }}>
        News Fetcher
      </h1>

      <p style={{ color: "#666", marginTop: "8px" }}>
        Fetch the latest news and review articles before importing them
        into the database.
      </p>

      {/* Action buttons */}
      <div
        style={{
          display: "flex",
          gap: "12px",
          flexWrap: "wrap",
          marginTop: "24px",
        }}
      >
        <button
          onClick={fetchNews}
          disabled={loading || importing}
          style={{
            padding: "12px 20px",
            background: loading ? "#888" : "#2563eb",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor: loading ? "not-allowed" : "pointer",
            fontWeight: "bold",
          }}
        >
          {loading ? "Fetching News..." : "Fetch Latest News"}
        </button>

        <button
          onClick={importNews}
          disabled={importing || loading || articles.length === 0}
          style={{
            padding: "12px 20px",
            background:
              importing || articles.length === 0
                ? "#888"
                : "#16a34a",
            color: "white",
            border: "none",
            borderRadius: "8px",
            cursor:
              importing || articles.length === 0
                ? "not-allowed"
                : "pointer",
            fontWeight: "bold",
          }}
        >
          {importing ? "Importing..." : "Import to Database"}
        </button>
      </div>

      {/* Status messages */}
      {error && (
        <div
          style={{
            marginTop: "20px",
            padding: "14px",
            background: "#fee2e2",
            border: "1px solid #ef4444",
            color: "#991b1b",
            borderRadius: "8px",
          }}
        >
          <strong>Error:</strong> {error}
        </div>
      )}

      {success && (
        <div
          style={{
            marginTop: "20px",
            padding: "14px",
            background: "#dcfce7",
            border: "1px solid #22c55e",
            color: "#166534",
            borderRadius: "8px",
          }}
        >
          {success}
        </div>
      )}

      {/* Article count */}
      <div
        style={{
          marginTop: "24px",
          padding: "18px",
          background: "#f3f4f6",
          borderRadius: "8px",
        }}
      >
        <h2 style={{ fontSize: "18px", fontWeight: "bold" }}>
          Fetched Articles: {articles.length}
        </h2>
      </div>

      {/* Import results */}
      {result && (
        <div
          style={{
            marginTop: "20px",
            padding: "18px",
            background: "#eff6ff",
            border: "1px solid #93c5fd",
            borderRadius: "8px",
          }}
        >
          <h2 style={{ fontWeight: "bold", marginBottom: "10px" }}>
            Import Results
          </h2>

          <p>Imported: {result.imported ?? "N/A"}</p>
          <p>Skipped: {result.skipped ?? "N/A"}</p>
          <p>Failed: {result.failed ?? "N/A"}</p>
          <p>Total: {result.total ?? "N/A"}</p>
        </div>
      )}

      {/* Fetched article cards */}
      <section style={{ marginTop: "30px" }}>
        <h2
          style={{
            fontSize: "22px",
            fontWeight: "bold",
            marginBottom: "18px",
          }}
        >
          Latest Fetched News
        </h2>

        {articles.length === 0 && !loading && !error && (
          <p style={{ color: "#777" }}>
            No articles loaded yet. Click Fetch Latest News to get started.
          </p>
        )}

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))",
            gap: "20px",
          }}
        >
          {articles.map((article, index) => (
            <article
              key={article.id || article.url || index}
              style={{
                border: "1px solid #ddd",
                borderRadius: "10px",
                overflow: "hidden",
                background: "white",
              }}
            >
              {article.image && (
                <img
                  src={article.image}
                  alt={article.title}
                  style={{
                    width: "100%",
                    height: "190px",
                    objectFit: "cover",
                  }}
                />
              )}

              <div style={{ padding: "16px" }}>
                <p
                  style={{
                    color: "#2563eb",
                    fontSize: "13px",
                    fontWeight: "bold",
                    marginBottom: "8px",
                  }}
                >
                  {article.source || "News Source"}
                  {article.category
                    ? ` • ${article.category}`
                    : ""}
                </p>

                <h3
                  style={{
                    fontSize: "18px",
                    fontWeight: "bold",
                    marginBottom: "10px",
                  }}
                >
                  {article.title}
                </h3>

                <p
                  style={{
                    color: "#555",
                    fontSize: "14px",
                    lineHeight: "1.5",
                  }}
                >
                  {article.description || "No description available."}
                </p>

                {article.publishedAt && (
                  <p
                    style={{
                      color: "#888",
                      fontSize: "12px",
                      marginTop: "12px",
                    }}
                  >
                    Published:{" "}
                    {new Date(article.publishedAt).toLocaleString()}
                  </p>
                )}

                <a
                  href={article.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: "inline-block",
                    marginTop: "14px",
                    color: "#2563eb",
                    fontWeight: "bold",
                    textDecoration: "none",
                  }}
                >
                  Read Original Article →
                </a>
              </div>
            </article>
          ))}
        </div>
      </section>
    </main>
  );
}
