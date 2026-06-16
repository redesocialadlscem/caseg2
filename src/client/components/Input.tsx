import { InputHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

interface InputProps extends InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ className, label, error, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, '-');

    return (
      <div className="flex flex-col gap-1.5 w-full">
        {label && (
          <label 
            htmlFor={inputId} 
            className="font-display font-bold text-xs uppercase tracking-wide mb-2 block"
          >
            {label}
          </label>
        )}
        <input
          ref={ref}
          id={inputId}
          className={twMerge(clsx(
            "w-full bg-white border-2 border-black rounded-xl px-4 py-3 font-body text-base",
            "placeholder:text-gray-400 focus:outline-none focus:ring-4 focus:ring-brand/30 focus:border-brand",
            "transition-shadow duration-150",
            error && "border-danger focus:ring-danger/30 focus:border-danger",
            className
          ))}
          {...props}
        />
        {error && <span className="text-red-600 text-sm font-medium mt-1">{error}</span>}
      </div>
    );
  }
);

Input.displayName = 'Input';
