export type Category =
  | "reviews"
  | "guides"
  | "deals"
  | "news"
  | "comparisons";

export interface AffiliateProgram {
  id: string;
  name: string;
  domain: string;
  buildUrl: (productUrl: string, tag?: string) => string;
}

export interface Product {
  id: string;
  name: string;
  brand: string;
  category: string;
  image?: string;
  price?: number;
  rating?: number;
  description?: string;
  pros?: string[];
  cons?: string[];
  specs?: Record<string, string>;
  links: {
    program: string;
    url: string;
  }[];
}

export interface TOCItem {
  title: string;
  url: string;
  depth: number;
}
