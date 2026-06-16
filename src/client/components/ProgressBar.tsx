import { memo } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ProgressBarProps {
  value: number; // 0-100
  className?: string;
  showLabel?: boolean;
  size?: 'sm' | 'md' | 'lg';
}

export const ProgressBar = memo(function ProgressBar({ 
  value, 
  className, 
  showLabel = true,
  size = 'md'
}: ProgressBarProps) {
  const clampedValue = Math.min(100, Math.max(0, value));
  
  const heights = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  return (
    <div className={twMerge(clsx('w-full', className))}>
      {showLabel && (
        <div className="flex justify-between mb-1.5">
          <span className="font-body text-xs font-bold uppercase text-black/70">Progresso</span>
          <span className="font-display font-bold text-xs text-black">{Math.round(clampedValue)}%</span>
        </div>
      )}
      <div
        className={twMerge(clsx(
          'w-full bg-brand-light/15 border-2 border-black overflow-hidden',
          heights[size]
        ))}
        role="progressbar"
        aria-valuenow={clampedValue}
        aria-valuemin={0}
        aria-valuemax={100}
      >
        <div
          className="h-full bg-brand transition-all duration-500 ease-out"
          style={{ width: `${clampedValue}%` }}
        />
      </div>
    </div>
  );
});
