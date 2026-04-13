'use client';

import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { productsApi } from '@/lib/products.api';
import { queryKeys } from '@/lib/query-keys';
import { ProductStatus, GetProductsParams } from '@/types';
import { ProductCard } from '@/components/products/ProductCard';
import { ProductSkeleton } from '@/components/products/ProductSkeleton';
import { FilterBar } from '@/components/products/FilterBar';
import { Pagination } from '@/components/products/Pagination';
import { EmptyState } from '@/components/products/EmptyState';
import { ProductDrawer } from '@/components/products/ProductDrawer';
import { usePostProduct } from '@/hooks/usePostProduct';
import { useProductsPolling } from '@/hooks/useProductsPolling';
import { useProductJobs } from '@/hooks/useProductJobs';
import { useDebounce } from '@/hooks/useDebounce';
import { Product } from '@/types';

export default function ProductsPage() {
  const [status, setStatus] = useState<ProductStatus | 'ALL'>('ALL');
  const [search, setSearch] = useState('');
  const [sortBy, setSortBy] = useState('createdAt-desc');
  const [page, setPage] = useState(1);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Debounce search
  const debouncedSearch = useDebounce(search, 300);

  // Parse sort by
  const [sortFieldRaw, sortOrder] = sortBy.split('-') as [string, 'asc' | 'desc'];
  const sortField = (sortFieldRaw === 'price' || sortFieldRaw === 'createdAt') ? sortFieldRaw : 'createdAt';

  // Build query params
  const params: GetProductsParams = {
    page,
    limit: 12,
    status: status === 'ALL' ? undefined : status,
    search: debouncedSearch || undefined,
    sortBy: sortField,
    sortOrder,
  };

  // Fetch products with polling
  const { data, isLoading, error, refetch } = useProductsPolling(params);

  // Fetch jobs for selected product
  const { data: jobs = [] } = useProductJobs(selectedProduct?.id || null);

  // Post product mutation with optimistic UI
  const postProduct = usePostProduct();

  const handlePost = (id: string) => {
    postProduct.mutate(id);
  };

  const handleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  const handleDeselectAll = () => {
    setSelectedIds(new Set());
  };

  const handleView = (product: Product) => {
    setSelectedProduct(product);
    setIsDrawerOpen(true);
  };

  const handleCloseDrawer = () => {
    setIsDrawerOpen(false);
    // Delay clearing selected product to allow for closing animation
    setTimeout(() => setSelectedProduct(null), 300);
  };

  // Check if polling should be enabled
  const hasProcessingProducts = data?.products.some(
    (product) => product.status === 'PROCESSING'
  );

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="container mx-auto px-4 py-8">
        <h1 className="text-3xl font-bold text-text-primary mb-6">Products</h1>

        {/* Filter Bar */}
        <FilterBar
          status={status}
          onStatusChange={(newStatus) => {
            setStatus(newStatus);
            setPage(1); // Reset to first page
          }}
          search={search}
          onSearchChange={(newSearch) => {
            setSearch(newSearch);
            setPage(1); // Reset to first page
          }}
          sortBy={sortBy}
          onSortChange={(newSortBy) => {
            setSortBy(newSortBy);
            setPage(1); // Reset to first page
          }}
          selectedCount={selectedIds.size}
          onDeselectAll={handleDeselectAll}
        />

        {/* Content */}
        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
            {Array.from({ length: 8 }).map((_, i) => (
              <ProductSkeleton key={i} />
            ))}
          </div>
        ) : error ? (
          <div className="mt-6">
            <div className="card p-6 text-center">
              <h3 className="text-xl font-semibold text-danger mb-2">
                Error Loading Products
              </h3>
              <p className="text-text-secondary mb-4">{(error as Error).message}</p>
              <button
                onClick={() => refetch()}
                className="btn btn-primary"
              >
                Retry
              </button>
            </div>
          </div>
        ) : data?.products.length === 0 ? (
          <EmptyState />
        ) : (
          <>
            {/* Product Grid */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 mt-6">
              {data?.products.map((product) => (
                <ProductCard
                  key={product.id}
                  product={product}
                  onPost={handlePost}
                  onView={handleView}
                  isPosting={postProduct.isPending}
                  isSelectable={selectedIds.size > 0 || status === 'DRAFT'}
                  isSelected={selectedIds.has(product.id)}
                  onSelect={handleSelect}
                />
              ))}
            </div>

            {/* Pagination */}
            {data && data.totalPages > 1 && (
              <Pagination
                currentPage={data.page}
                totalPages={data.totalPages}
                onPageChange={setPage}
              />
            )}

            {/* Product Detail Drawer */}
            <ProductDrawer
              product={selectedProduct}
              jobs={jobs}
              isOpen={isDrawerOpen}
              onClose={handleCloseDrawer}
            />
          </>
        )}
      </div>
    </div>
  );
}
