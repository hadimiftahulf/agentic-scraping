export type ProductStatus = 'DRAFT' | 'PROCESSING' | 'POSTED' | 'FAILED';

export interface Product {
  id: string;
  title: string;
  price: number;
  imageUrl: string | null;
  imageLocal: string | null;
  description: string | null;
  hash: string;
  status: ProductStatus;
  postedAt: string | null;
  sourceUrl: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface Job {
  id: string;
  productId: string;
  product: Product;
  status: string;
  log: string | null;
  attempt: number;
  createdAt: string;
}

export interface GetProductsParams {
  page?: number;
  limit?: number;
  status?: ProductStatus;
  search?: string;
  sortBy?: 'createdAt' | 'price';
  sortOrder?: 'asc' | 'desc';
}

export interface ProductsResponse {
  products: Product[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PostProductResponse {
  jobId: string;
  productId: string;
}

export interface BatchPostResponse {
  success: boolean;
  message: string;
  queuedCount: number;
  jobIds: string[];
}

export interface AppConfig {
  priceMarkupPercent: number;
  minPrice: number;
  maxPrice: number;
  blacklistKeywords: string[];
  maxPostPerDay: number;
  scraperIntervalMinutes: number;
  targetUrl: string;
}

export interface StatsResponse {
  totalProducts: number;
  draftProducts: number;
  postedToday: number;
  failedProducts: number;
}
