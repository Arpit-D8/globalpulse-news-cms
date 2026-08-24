export interface NewsItem {
  id: string;

  title: string;

  description: string;

  content?: string;

  url: string;

  image?: string;

  source: string;

  author?: string;

  keywords?: string[];

category?:
  | "India"
  | "World"
  | "Business"
  | "Technology"
  | "Sports";

  publishedAt: Date;
}

export interface NewsProvider {
  name: string;

  fetchNews(): Promise<NewsItem[]>;
}