'use client';

import { useQuery } from '@tanstack/react-query';
import { productsApi, queryKeys } from '@/lib/products.api';
import { StatsResponse } from '@/types';
import { Package, CheckCircle, XCircle, Clock } from 'lucide-react';

export function StatsCards() {
  const { data: stats, isLoading } = useQuery({
    queryKey: queryKeys.stats(),
    queryFn: productsApi.getStats,
    refetchInterval: 30000, // Refresh every 30 seconds
  });

  if (isLoading || !stats) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        {Array.from({ length: 4 }).map((_, i) => (
          <div key={i} className="card p-6 animate-pulse">
            <div className="h-6 bg-bg-surface rounded w-24 mb-2" />
            <div className="h-8 bg-bg-surface rounded w-16" />
          </div>
        ))}
      </div>
    );
  }

  const cards = [
    {
      name: 'Total Produk',
      value: stats.totalProducts,
      icon: Package,
      color: 'text-accent',
    },
    {
      name: 'Draft (Siap Post)',
      value: stats.draftProducts,
      icon: Clock,
      color: 'text-text-secondary',
    },
    {
      name: 'Posted Hari Ini',
      value: stats.postedToday,
      icon: CheckCircle,
      color: 'text-success',
    },
    {
      name: 'Gagal',
      value: stats.failedProducts,
      icon: XCircle,
      color: 'text-danger',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      {cards.map((card) => (
        <div key={card.name} className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <card.icon className={`w-6 h-6 ${card.color}`} />
            <span className="text-sm text-text-secondary">{card.name}</span>
          </div>
          <div className="text-3xl font-bold text-text-primary">
            {card.value}
          </div>
        </div>
      ))}
    </div>
  );
}
