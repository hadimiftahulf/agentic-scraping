'use client';

import { cn } from '@/lib/utils';

interface BadgeProps {
  variant?: 'draft' | 'processing' | 'posted' | 'failed';
  children: React.ReactNode;
  className?: string;
}

export function Badge({ variant, children, className }: BadgeProps) {
  return (
    <span className={cn('badge', `badge-${variant}`, className)}>
      {children}
    </span>
  );
}
