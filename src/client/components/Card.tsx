import { memo, type HTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  variant?: 'default' | 'accent';
}

export const Card = memo(function Card({ className, variant = 'default', children, ...props }: CardProps) {
  const baseStyles = "bg-white border-2 border-black rounded-xl shadow-brutal p-6 sm:p-8";
  
  const variants = {
    default: "",
    accent: "bg-emerald-50",
  };

  return (
    <div className={twMerge(clsx(baseStyles, variants[variant], className))} {...props}>
      {children}
    </div>
  );
});
