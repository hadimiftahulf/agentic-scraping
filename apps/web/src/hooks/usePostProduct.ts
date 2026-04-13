'use client';

import { useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { productsApi } from '@/lib/products.api';
import { queryKeys } from '@/lib/query-keys';
import { ProductStatus } from '@/types';

interface UsePostProductOptions {
  onSuccess?: (jobId: string) => void;
  onError?: (error: Error) => void;
}

export function usePostProduct(options?: UsePostProductOptions) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: productsApi.postProduct,

    onMutate: async (productId) => {
      // Cancel any outgoing refetches
      await queryClient.cancelQueries({ queryKey: queryKeys.products() });

      // Snapshot previous value
      const previousData = queryClient.getQueryData(queryKeys.products());

      // Optimistically update to PROCESSING
      queryClient.setQueryData(
        queryKeys.products(),
        (old: any) => {
          if (!old) return old;

          return {
            ...old,
            products: old.products.map((product: any) =>
              product.id === productId
                ? { ...product, status: 'PROCESSING' as ProductStatus }
                : product
            ),
          };
        }
      );

      // Return context with previous data
      return { previousData };
    },

    onSuccess: (data, variables, context) => {
      toast.success(`Job berhasil di-queue! Job ID: ${data.jobId}`);
      options?.onSuccess?.(data.jobId);
    },

    onError: (error, variables, context) => {
      // Rollback to previous data
      if (context?.previousData) {
        queryClient.setQueryData(queryKeys.products(), context.previousData);
      }

      toast.error(`Gagal mempost produk: ${error.message}`);
      options?.onError?.(error as Error);
    },

    onSettled: () => {
      // Always refetch after error or success
      queryClient.invalidateQueries({ queryKey: queryKeys.products() });
    },
  });
}
