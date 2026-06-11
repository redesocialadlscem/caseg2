import { memo } from 'react';
import { Card } from './Card';
import { LucideIcon } from 'lucide-react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface StatCardProps {
  label: string;
  value: string | number;
  icon: LucideIcon;
  variant?: 'brand' | 'black';
  className?: string;
}

export const StatCard = memo(function StatCard({ 
  label, 
  value, 
  icon: Icon, 
  variant = 'brand',
  className 
}: StatCardProps) {
  const iconBg = variant === 'brand' ? 'bg-brand' : 'bg-black';

  return (
    <Card className={twMerge(clsx('p-5 flex flex-row sm:flex-col gap-4 sm:gap-3 items-center sm:items-start', className))}>
      <div className={twMerge(clsx(
        'w-12 h-12 sm:w-10 sm:h-10 border-2 border-black shadow-brutal-sm flex items-center justify-center shrink-0',
        iconBg
      ))}>
        <Icon size={22} className="text-white" strokeWidth={2.5} />
      </div>
      <div>
        <p className="font-display font-bold text-2xl sm:text-3xl leading-none">
          {value}
        </p>
        <p className="font-body text-xs sm:text-sm text-gray-500 font-medium mt-1 uppercase tracking-wide">
          {label}
        </p>
      </div>
    </Card>
  );
});
