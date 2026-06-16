import { ButtonHTMLAttributes } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'danger' | 'dark';
  size?: 'sm' | 'md' | 'lg';
}

export function Button({ 
  className, 
  variant = 'primary', 
  size = 'md',
  children, 
  ...props 
}: ButtonProps) {
  const baseStyles = "font-display font-bold uppercase tracking-wide border-2 border-black brutal-interactive disabled:opacity-50 disabled:cursor-not-allowed disabled:transform-none disabled:shadow-none";
  
  const variants = {
    primary: "bg-brand text-white shadow-brutal hover:bg-brand-light",
    secondary: "bg-black text-white shadow-brutal hover:bg-gray-800",
    outline: "bg-white text-black shadow-brutal hover:bg-gray-50",
    danger: "bg-danger text-white shadow-brutal hover:bg-red-700",
    dark: "bg-black text-white shadow-brutal hover:bg-gray-800",
  };

  const sizes = {
    sm: "px-4 py-2 text-sm",
    md: "px-6 py-3 text-base",
    lg: "px-8 py-4 text-lg",
  };

  return (
    <button 
      className={twMerge(clsx(baseStyles, variants[variant], sizes[size], className))}
      {...props}
    >
      {children}
    </button>
  );
}
