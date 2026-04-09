import api from './api';
import type {
  Product,
  GetProductsParams,
  ProductsResponse,
  PostProductResponse,
  BatchPostResponse,
  AppConfig,
  StatsResponse,
} from '@/types';

export const productsApi = {
  getProducts: async (params: GetProductsParams = {}): Promise<ProductsResponse> => {
    const { page = 1, limit = 12, status, search, sortBy = 'createdAt', sortOrder = 'desc' } = params;

    const response = await api.get<ProductsResponse>('/products', {
      params: { page, limit, status, search, sortBy, sortOrder },
    });

    return response.data;
  },

  getProduct: async (id: string): Promise<Product> => {
    const response = await api.get<Product>(`/products/${id}`);
    return response.data;
  },

  postProduct: async (id: string): Promise<PostProductResponse> => {
    const response = await api.post<PostProductResponse>(`/products/${id}/post`);
    return response.data;
  },

  batchPost: async (ids: string[]): Promise<BatchPostResponse> => {
    const response = await api.post<BatchPostResponse>('/products/batch-post', { ids });
    return response.data;
  },

  getConfig: async (): Promise<AppConfig> => {
    const response = await api.get<AppConfig>('/config');
    return response.data;
  },

  updateConfig: async (data: Partial<AppConfig>): Promise<AppConfig> => {
    const response = await api.put<AppConfig>('/config', data);
    return response.data;
  },

  getStats: async (): Promise<StatsResponse> => {
    const response = await api.get<StatsResponse>('/stats');
    return response.data;
  },

  getJobs: async (params: { page?: number; limit?: number; productId?: string } = {}) => {
    const { page = 1, limit = 20, productId } = params;
    const response = await api.get('/jobs', {
      params: { page, limit, productId },
    });
    return response.data;
  },
};

export default productsApi;
