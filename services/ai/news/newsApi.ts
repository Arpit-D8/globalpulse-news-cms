import { NewsItem, NewsProvider } from "./types";

export class NewsAPIProvider implements NewsProvider {
  name = "NewsAPI";

  async fetchNews(): Promise<NewsItem[]> {
    const apiKey = process.env.NEWS_API_KEY;

    if (!apiKey) {
      throw new Error("Missing NEWS_API_KEY");
    }

    const url =
  `https://newsapi.org/v2/everything?q=India&language=en&pageSize=20&sortBy=publishedAt&apiKey=${apiKey}`;
    const response = await fetch(url, {
      next: {
        revalidate: 1800,
      },
    });

    if (!response.ok) {
      throw new Error("Failed to fetch news from NewsAPI");
    }

    const data = await response.json();
    console.log("Status:", response.status);


    return data.articles.map((article: any, index: number): NewsItem => ({
      id: `${Date.now()}-${index}`,

      title: article.title ?? "",

      description: article.description ?? "",

      content: article.content ?? "",

      url: article.url,

      image: article.urlToImage,

      source: article.source?.name ?? "NewsAPI",

      author: article.author ?? "",

      keywords: Array.isArray(article.keywords) ? article.keywords : undefined,

      category: "India",

      publishedAt: new Date(article.publishedAt),
    }));
  }
}