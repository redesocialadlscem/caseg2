import { memo, type HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: 'neutral' | 'brand' | 'warning';
}

export const Badge = memo(function Badge({ className, variant = 'neutral', children, ...props }: BadgeProps) {
  const variants = {
    neutral: 'bg-white text-black shadow-brutal-sm',
    brand: 'bg-brand text-white shadow-brutal-sm',
    warning: 'bg-brand-light text-black shadow-brutal-sm',
  };

  return (
    <span
      className={twMerge(clsx(
        'inline-flex items-center px-3 py-1 rounded-lg border-2 border-black text-xs font-bold uppercase tracking-wide',
        variants[variant],
        className
      ))}
      {...props}
    >
      {children}
    </span>
  );
});
