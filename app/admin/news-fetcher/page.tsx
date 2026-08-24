"use client";

import { useState } from "react";

export default function NewsFetcherPage() {
  const [articles, setArticles] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchNews() {
    setLoading(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/news/fetch");
      const data = await res.json();
      setArticles(data.articles || []);
    } catch (err) {
      console.error("Failed to fetch news:", err);
      setError("Failed to fetch news articles.");
    } finally {
      setLoading(false);
    }
  }

  async function importNews() {
    setImporting(true);
    setError(null);
    setResult(null);

    try {
      const res = await fetch("/api/news/import", {
        method: "POST",
      });

      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.message || "Import failed");
      }

      setResult(data.data);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Import failed";
      setError(message);
      console.error("Import error:", err);
    } finally {
      setImporting(false);
    }
  }

  return (
    <div style={{ padding: 30 }}>
      <h1>News Fetcher</h1>

      <button onClick={fetchNews}>
        {loading ? "Fetching..." : "Fetch Latest News"}
      </button>

      <button
        onClick={importNews}
        disabled={importing || articles.length === 0}
        style={{ marginLeft: 10 }}
      >
        {importing ? "Importing..." : "Import to Database"}
      </button>

      {error && (
        <div
          style={{
            marginTop: 15,
            padding: 12,
            background: "#fee",
            border: "1px solid #c00",
            borderRadius: 6,
            color: "#c00",
          }}
        >
          {error}
        </div>
      )}

      <p>Total Articles: {articles.length}</p>

      {result && (
        <div
          style={{
            marginTop: 20,
            padding: 15,
            background: "#f5f5f5",
            borderRadius: 8,
          }}
        >
          <h3>Import Result</h3>
          <p>Imported: {result.imported}</p>
          <p>Skipped: {result.skipped}</p>
          {result.failed !== undefined && (
            <p>Failed: {result.failed}</p>
          )}
          <p>Total: {result.total}</p>
        </div>
      )}

      {articles.map((article: any) => (
        <div
          key={article.id}
          style={{
            border: "1px solid #ccc",
            padding: 15,
            marginTop: 20,
          }}
        >
          <h2>{article.title}</h2>
          <p>{article.source}</p>
          <p>{article.description}</p>
          <a href={article.url} target="_blank">
            Read Original
          </a>
        </div>
      ))}
    </div>
  );
}
