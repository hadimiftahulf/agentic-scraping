import { QueryKey } from '@tanstack/react-query';

export const queryKeys = {
  products: (params?: any) => ['products', params] as QueryKey,
  product: (id: string) => ['product', id] as QueryKey,
  config: () => ['config'] as QueryKey,
  stats: () => ['stats'] as QueryKey,
  jobs: (params?: any) => ['jobs', params] as QueryKey,
} as const;
