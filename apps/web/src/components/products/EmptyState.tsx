'use client';

import { Package } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
}

export function EmptyState({
  title = 'Belum ada produk',
  description = 'Produk akan muncul di sini setelah scraping selesai.',
}: EmptyStateProps) {
  return (
    <div className="flex flex-col items-center justify-center py-20 text-center">
      <Package className="w-16 h-16 text-text-secondary mb-4" />
      <h3 className="text-xl font-semibold text-text-primary mb-2">{title}</h3>
      <p className="text-text-secondary max-w-md">{description}</p>
    </div>
  );
}
