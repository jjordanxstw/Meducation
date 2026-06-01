'use client';

import { forwardRef } from 'react';
import { Slot } from '@radix-ui/react-slot';
import { cva, type VariantProps } from 'class-variance-authority';
import { cn } from '@/lib/utils';

const buttonVariants = cva(
  'inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-xl text-sm font-semibold transition-all focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:shrink-0',
  {
    variants: {
      variant: {
        primary:
          'bg-brand text-white shadow-subtle hover:bg-brand-hover active:scale-[0.98]',
        secondary:
          'border border-slate-200 bg-white text-slate-700 shadow-subtle hover:border-slate-300 hover:bg-slate-50 active:scale-[0.98]',
        ghost: 'text-slate-600 hover:bg-slate-100 hover:text-slate-900',
        outline:
          'border border-brand/40 bg-transparent text-brand hover:bg-brand-subtle active:scale-[0.98]',
        danger:
          'bg-danger text-white shadow-subtle hover:bg-red-600 active:scale-[0.98]',
        link: 'text-brand underline-offset-4 hover:underline',
      },
      size: {
        sm: 'h-9 px-3 text-[13px] [&_svg]:size-4',
        md: 'h-10 px-4 [&_svg]:size-4',
        lg: 'h-12 px-6 text-[15px] [&_svg]:size-5',
        icon: 'size-10 [&_svg]:size-5',
      },
    },
    defaultVariants: {
      variant: 'primary',
      size: 'md',
    },
  },
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  /** Render the child element instead of a <button> (e.g. wrap a Next.js <Link>). */
  asChild?: boolean;
}

const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, asChild = false, ...props }, ref) => {
    const Comp = asChild ? Slot : 'button';
    return (
      <Comp
        ref={ref}
        className={cn(buttonVariants({ variant, size }), className)}
        {...props}
      />
    );
  },
);
Button.displayName = 'Button';

export { Button, buttonVariants };
