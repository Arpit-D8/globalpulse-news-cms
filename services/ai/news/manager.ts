import { NewsProvider, NewsItem } from "./types";

export class NewsManager {
  constructor(private providers: NewsProvider[]) {}

  async fetchAllNews(): Promise<NewsItem[]> {
    const results = await Promise.allSettled(
      this.providers.map((provider) => provider.fetchNews())
    );

    const articles: NewsItem[] = [];

    for (const result of results) {
      if (result.status === "fulfilled") {
        articles.push(...result.value);
      }
    }

    return articles;
  }
}