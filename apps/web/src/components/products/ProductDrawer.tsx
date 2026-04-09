'use client';

import { Product, Job } from '@/types';
import { formatPrice, formatDateTime } from '@/lib/utils';
import { X, ExternalLink, Clock, AlertCircle, CheckCircle } from 'lucide-react';
import { useEffect, useState } from 'react';

interface ProductDrawerProps {
  product: Product | null;
  jobs: Job[];
  isOpen: boolean;
  onClose: () => void;
}

export function ProductDrawer({ product, jobs, isOpen, onClose }: ProductDrawerProps) {
  const [isAnimating, setIsAnimating] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setIsAnimating(true);
    } else {
      setIsAnimating(false);
    }

    // Close on ESC
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isOpen, onClose]);

  if (!product) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`fixed inset-0 bg-black/50 z-40 transition-opacity duration-300 ${
          isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'
        }`}
        onClick={onClose}
      />

      {/* Drawer */}
      <div
        className={`
          fixed inset-y-0 right-0 w-full md:w-[480px] bg-bg-card border-l border-border z-50
          transform transition-transform duration-300 ease-in-out
          ${isOpen ? 'translate-x-0' : 'translate-x-full'}
        `}
      >
        <div className="h-full flex flex-col">
          {/* Header */}
          <div className="flex items-center justify-between p-6 border-b border-border">
            <h2 className="text-xl font-semibold text-text-primary">Product Details</h2>
            <button
              onClick={onClose}
              className="p-2 hover:bg-bg-surface rounded-md transition-colors"
            >
              <X className="w-5 h-5 text-text-secondary" />
            </button>
          </div>

          {/* Content */}
          <div className="flex-1 overflow-y-auto">
            {/* Product Image */}
            <div className="aspect-video w-full bg-bg-surface">
              {product.imageUrl || product.imageLocal ? (
                <img
                  src={product.imageLocal || product.imageUrl || '/placeholder.jpg'}
                  alt={product.title}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-text-secondary">
                  No Image
                </div>
              )}
            </div>

            {/* Product Info */}
            <div className="p-6 space-y-4">
              {/* Title */}
              <div>
                <h3 className="text-lg font-semibold text-text-primary mb-2">
                  {product.title}
                </h3>
                <p className="text-2xl font-bold text-accent">
                  {formatPrice(product.price)}
                </p>
              </div>

              {/* Description */}
              {product.description && (
                <div>
                  <h4 className="text-sm font-medium text-text-secondary mb-2">Description</h4>
                  <p className="text-text-primary whitespace-pre-wrap">
                    {product.description}
                  </p>
                </div>
              )}

              {/* Status */}
              <div className="flex items-center gap-3">
                <span className={`badge badge-${product.status.toLowerCase()}`}>
                  {product.status}
                </span>
                {product.postedAt && (
                  <span className="flex items-center text-sm text-text-secondary">
                    <Clock className="w-4 h-4 mr-1" />
                    Posted {formatDateTime(product.postedAt)}
                  </span>
                )}
              </div>

              {/* Source Link */}
              {product.sourceUrl && (
                <a
                  href={product.sourceUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn btn-secondary w-full flex items-center justify-center gap-2"
                >
                  <ExternalLink className="w-4 h-4" />
                  View Source
                </a>
              )}

              {/* Job History */}
              {jobs.length > 0 && (
                <div>
                  <h4 className="text-sm font-medium text-text-secondary mb-3">Job History</h4>
                  <div className="space-y-2">
                    {jobs.map((job) => (
                      <div
                        key={job.id}
                        className="bg-bg-surface rounded-md p-3 border border-border"
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {job.status === 'POSTED' ? (
                              <CheckCircle className="w-4 h-4 text-success" />
                            ) : (
                              <AlertCircle className="w-4 h-4 text-danger" />
                            )}
                            <span className="text-sm font-medium text-text-primary">
                              {job.status}
                            </span>
                          </div>
                          <span className="text-xs text-text-secondary">
                            Attempt #{job.attempt}
                          </span>
                        </div>
                        <p className="text-xs text-text-secondary">
                          {formatDateTime(job.createdAt)}
                        </p>
                        {job.log && (
                          <div className="mt-2 p-2 bg-bg-primary rounded text-xs text-text-secondary">
                            {job.log}
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Metadata */}
              <div className="space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-text-secondary">Product ID</span>
                  <span className="text-text-primary font-mono">{product.id}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Created</span>
                  <span className="text-text-primary">{formatDateTime(product.createdAt)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-text-secondary">Updated</span>
                  <span className="text-text-primary">{formatDateTime(product.updatedAt)}</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}
