'use client';

import { Product } from '@/types';
import { formatPrice, formatRelativeTime, truncateText } from '@/lib/utils';
import { ExternalLink, Clock } from 'lucide-react';

interface ProductCardProps {
  product: Product;
  onPost?: (id: string) => void;
  onView?: (id: string) => void;
  isPosting?: boolean;
  isSelectable?: boolean;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export function ProductCard({
  product,
  onPost,
  onView,
  isPosting = false,
  isSelectable = false,
  isSelected = false,
  onSelect,
}: ProductCardProps) {
  const canPost = product.status === 'DRAFT' || product.status === 'FAILED';

  return (
    <div
      className={`
        card p-4 hover:border-accent/50 transition-all duration-200 relative group
        ${isSelected ? 'ring-2 ring-accent' : ''}
      `}
      onClick={() => onView?.(product.id)}
    >
      {/* Select Checkbox */}
      {isSelectable && (
        <div
          className="absolute top-3 left-3 z-10"
          onClick={(e) => {
            e.stopPropagation();
            onSelect?.(product.id);
          }}
        >
          <div
            className={`
              w-5 h-5 rounded border-2 flex items-center justify-center cursor-pointer
              ${isSelected ? 'bg-accent border-accent' : 'border-border hover:border-accent'}
            `}
          >
            {isSelected && (
              <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
              </svg>
            )}
          </div>
        </div>
      )}

      {/* Product Image */}
      <div className="aspect-video rounded-lg overflow-hidden bg-bg-surface mb-3">
        {product.imageUrl || product.imageLocal ? (
          <img
            src={product.imageLocal || product.imageUrl || '/placeholder.jpg'}
            alt={product.title}
            className="w-full h-full object-cover"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center text-text-secondary">
            <span className="text-sm">No Image</span>
          </div>
        )}
      </div>

      {/* Product Info */}
      <div className="space-y-2">
        {/* Title */}
        <h3 className="font-medium text-text-primary line-clamp-2 min-h-[40px]">
          {truncateText(product.title, 80)}
        </h3>

        {/* Price */}
        <p className="text-lg font-semibold text-accent">
          {formatPrice(product.price)}
        </p>

        {/* Status Badge */}
        <div className="flex items-center justify-between">
          <span className={`badge badge-${product.status.toLowerCase()}`}>
            {product.status}
          </span>

          {/* Relative Time */}
          <span className="flex items-center text-xs text-text-secondary">
            <Clock className="w-3 h-3 mr-1" />
            {formatRelativeTime(product.createdAt)}
          </span>
        </div>

        {/* Actions */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
          {/* View Source Button */}
          {product.sourceUrl && (
            <a
              href={product.sourceUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary flex-1 flex items-center justify-center gap-1 text-xs"
              onClick={(e) => e.stopPropagation()}
            >
              <ExternalLink className="w-3 h-3" />
              Source
            </a>
          )}

          {/* Post Button */}
          {canPost && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onPost?.(product.id);
              }}
              disabled={!canPost || isPosting}
              className="btn btn-primary flex-1 text-xs"
            >
              {isPosting ? (
                <span className="flex items-center justify-center">
                  <svg className="animate-spin h-4 w-4 mr-2" viewBox="0 0 24 24">
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                      fill="none"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Posting...
                </span>
              ) : (
                'Post'
              )}
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
