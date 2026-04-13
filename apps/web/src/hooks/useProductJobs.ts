import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/products.api';
import { Job } from '@/types';

export function useProductJobs(productId: string | null) {
  return useQuery({
    queryKey: ['products', productId, 'jobs'],
    queryFn: () => productsApi.getJobs({ productId: productId! }),
    enabled: !!productId,
    select: (data) => data.data as Job[],
  });
}
