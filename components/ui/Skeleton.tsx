import React, { HTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

export function Skeleton({ className, ...props }: HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn('animate-pulse rounded-xl bg-gray-200 dark:bg-gray-800', className)}
      {...props}
    />
  );
}

export function Progress({
  value = 0,
  max = 100,
  className,
  color = 'bg-emerald-600',
}: {
  value?: number;
  max?: number;
  className?: string;
  color?: string;
}) {
  const percentage = Math.min(100, Math.max(0, (value / max) * 100));

  return (
    <div className={cn('w-full bg-gray-100 dark:bg-gray-800 rounded-full h-2 overflow-hidden', className)}>
      <div
        className={cn('h-full transition-all duration-300 rounded-full', color)}
        style={{ width: `${percentage}%` }}
      />
    </div>
  );
}
