export function ProductSkeleton() {
  return (
    <div className="card p-4">
      {/* Image Skeleton */}
      <div className="aspect-video rounded-lg bg-bg-surface mb-3 animate-pulse" />

      {/* Content Skeleton */}
      <div className="space-y-2">
        {/* Title Skeleton */}
        <div className="h-5 bg-bg-surface rounded animate-pulse" />
        <div className="h-5 bg-bg-surface rounded animate-pulse w-3/4" />

        {/* Price Skeleton */}
        <div className="h-6 bg-bg-surface rounded animate-pulse w-1/2" />

        {/* Status Badge Skeleton */}
        <div className="flex items-center justify-between">
          <div className="h-6 w-16 bg-bg-surface rounded-full animate-pulse" />
          <div className="h-4 w-20 bg-bg-surface rounded animate-pulse" />
        </div>

        {/* Actions Skeleton */}
        <div className="flex gap-2 mt-3 pt-3 border-t border-border">
          <div className="h-9 flex-1 bg-bg-surface rounded animate-pulse" />
          <div className="h-9 flex-1 bg-bg-surface rounded animate-pulse" />
        </div>
      </div>
    </div>
  );
}
