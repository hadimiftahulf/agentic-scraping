'use client';

import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'react-hot-toast';
import { productsApi, queryKeys } from '@/lib/products.api';
import { AppConfig } from '@/types';
import { formatPrice } from '@/lib/utils';
import { useDebounce } from '@/hooks/useDebounce';

export default function SettingsPage() {
  const [config, setConfig] = useState<Partial<AppConfig>>({});
  const debouncedConfig = useDebounce(config, 1000);

  const queryClient = useQueryClient();

  // Fetch config
  const { data: currentConfig } = useQuery({
    queryKey: queryKeys.config(),
    queryFn: productsApi.getConfig,
    onSuccess: (data) => {
      setConfig(data);
    },
  });

  // Update config mutation
  const updateMutation = useMutation({
    mutationFn: (data: Partial<AppConfig>) => productsApi.updateConfig(data),
    onSuccess: (data) => {
      setConfig(data);
      toast.success('Pengaturan tersimpan ✓');
    },
    onError: (error: Error) => {
      toast.error(`Gagal menyimpan: ${error.message}`);
    },
  });

  // Auto-save on debounced change
  useEffect(() => {
    if (Object.keys(debouncedConfig).length > 0) {
      updateMutation.mutate(debouncedConfig);
    }
  }, [debouncedConfig]);

  if (!currentConfig) {
    return <div>Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-bg-primary">
      <div className="container mx-auto px-4 py-8 max-w-2xl">
        <h1 className="text-3xl font-bold text-text-primary mb-6">Settings</h1>

        <div className="card p-6 space-y-6">
          {/* Price Markup */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Markup Harga (%)
            </label>
            <input
              type="range"
              min="0"
              max="200"
              step="5"
              value={config.priceMarkupPercent ?? currentConfig.priceMarkupPercent}
              onChange={(e) => setConfig({ ...config, priceMarkupPercent: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex items-center gap-2 mt-2">
              <input
                type="number"
                min="0"
                max="200"
                value={config.priceMarkupPercent ?? currentConfig.priceMarkupPercent}
                onChange={(e) => setConfig({ ...config, priceMarkupPercent: parseInt(e.target.value) })}
                className="w-24 px-3 py-2 bg-bg-surface border border-border rounded-md text-text-primary"
              />
              <span className="text-text-secondary">%</span>
            </div>
          </div>

          {/* Price Range */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Harga Minimum
              </label>
              <input
                type="number"
                min="0"
                value={config.minPrice ?? currentConfig.minPrice}
                onChange={(e) => setConfig({ ...config, minPrice: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-bg-surface border border-border rounded-md text-text-primary"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-text-primary mb-2">
                Harga Maksimum
              </label>
              <input
                type="number"
                min="0"
                value={config.maxPrice ?? currentConfig.maxPrice}
                onChange={(e) => setConfig({ ...config, maxPrice: parseInt(e.target.value) })}
                className="w-full px-3 py-2 bg-bg-surface border border-border rounded-md text-text-primary"
              />
            </div>
          </div>

          {/* Max Post Per Day */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Max Post Per Hari
            </label>
            <input
              type="range"
              min="1"
              max="20"
              value={config.maxPostPerDay ?? currentConfig.maxPostPerDay}
              onChange={(e) => setConfig({ ...config, maxPostPerDay: parseInt(e.target.value) })}
              className="w-full"
            />
            <div className="flex items-center gap-2 mt-2">
              <input
                type="number"
                min="1"
                max="20"
                value={config.maxPostPerDay ?? currentConfig.maxPostPerDay}
                onChange={(e) => setConfig({ ...config, maxPostPerDay: parseInt(e.target.value) })}
                className="w-24 px-3 py-2 bg-bg-surface border border-border rounded-md text-text-primary"
              />
              <span className="text-text-secondary">posts per day</span>
            </div>
          </div>

          {/* Scraper Interval */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Interval Scraping (menit)
            </label>
            <select
              value={config.scraperIntervalMinutes ?? currentConfig.scraperIntervalMinutes}
              onChange={(e) => setConfig({ ...config, scraperIntervalMinutes: parseInt(e.target.value) })}
              className="w-full px-3 py-2 bg-bg-surface border border-border rounded-md text-text-primary"
            >
              <option value={10}>10 menit</option>
              <option value={20}>20 menit</option>
              <option value={30}>30 menit</option>
              <option value={60}>60 menit</option>
            </select>
          </div>

          {/* Blacklist Keywords */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Blacklist Keywords (comma-separated)
            </label>
            <textarea
              value={config.blacklistKeywords?.join(', ') ?? currentConfig.blacklistKeywords.join(', ')}
              onChange={(e) => setConfig({ ...config, blacklistKeywords: e.target.value.split(',').map(k => k.trim()).filter(Boolean) })}
              className="w-full px-3 py-2 bg-bg-surface border border-border rounded-md text-text-primary"
              rows={3}
              placeholder="bundle, rusak, damaged, second"
            />
          </div>

          {/* Target URL */}
          <div>
            <label className="block text-sm font-medium text-text-primary mb-2">
              Target URL
            </label>
            <input
              type="url"
              value={config.targetUrl ?? currentConfig.targetUrl}
              onChange={(e) => setConfig({ ...config, targetUrl: e.target.value })}
              className="w-full px-3 py-2 bg-bg-surface border border-border rounded-md text-text-primary"
            />
          </div>
        </div>

        {/* Auto-save indicator */}
        {updateMutation.isPending && (
          <div className="mt-4 text-sm text-text-secondary">
            Menyimpan...
          </div>
        )}
      </div>
    </div>
  );
}
