'use client';

import { useEffect } from 'react';
import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys, productsApi } from '@/lib/products.api';
import { ProductStatus } from '@/types';
import { toast } from 'react-hot-toast';

export function useProductsPolling(
  params?: any,
  pollingEnabled: boolean = true
) {
  const queryClient = useQueryClient();

  // Fetch products with conditional polling
  const query = useQuery({
    queryKey: queryKeys.products(params),
    queryFn: () => productsApi.getProducts(params),
    refetchInterval: pollingEnabled ? 5000 : undefined, // Poll every 5 seconds
  });

  const { data: previousData } = query;

  // Watch for status changes and show toasts
  useEffect(() => {
    if (!previousData || !query.data) return;

    const previousProducts = previousData.products;
    const currentProducts = query.data.products;

    // Find products that changed status
    currentProducts.forEach((currentProduct) => {
      const previousProduct = previousProducts.find(p => p.id === currentProduct.id);

      if (previousProduct && previousProduct.status === 'PROCESSING') {
        // Status changed from PROCESSING
        if (currentProduct.status === 'POSTED') {
          toast.success(`✅ Produk "${currentProduct.title}" berhasil diposting!`, {
            id: `product-${currentProduct.id}`, // Prevent duplicate toasts
          });
        } else if (currentProduct.status === 'FAILED') {
          toast.error(`❌ Posting produk "${currentProduct.title}" gagal`, {
            id: `product-${currentProduct.id}`,
          });
        }
      }
    });
  }, [query.data, previousData]);

  // Stop polling if no products are in PROCESSING status
  const hasProcessingProducts = query.data?.products.some(
    (product) => product.status === 'PROCESSING'
  );

  useEffect(() => {
    if (!hasProcessingProducts && pollingEnabled) {
      // No more processing products, stop polling
      queryClient.invalidateQueries({ queryKey: queryKeys.products(params) });
    }
  }, [hasProcessingProducts, pollingEnabled, params, queryClient]);

  return query;
}

// Hook to get polling state
export function usePollingState() {
  return {
    hasProcessing: (products: any[]) =>
      products.some((p) => p.status === 'PROCESSING'),
  };
}
