export type PriceResult = {
  store: 'eBay' | 'Amazon' | string;
  title: string;
  price: number;
  url: string;
  image: string;
};

export type ComparisonData = {
  productName: string;
  results: PriceResult[];
  bestPrice: PriceResult | null;
  summary: string;
};

export type SearchHistoryEntry = {
  id: string;
  productName:string;
  bestPrice: number;
  store: string;
  timestamp: string;
};
