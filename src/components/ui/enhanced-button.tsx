import React from 'react';
import { cn } from '../../lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const buttonVariants = cva(
  "btn-base",
  {
    variants: {
      variant: {
        default: "btn-primary",
        secondary: "btn-secondary", 
        success: "btn-success",
        warning: "btn-warning",
        info: "btn-info",
        destructive: "bg-red-500 text-white hover:bg-red-600 shadow-md hover:shadow-lg",
        outline: "border border-input bg-background hover:bg-accent hover:text-accent-foreground shadow-sm hover:shadow-md",
        ghost: "hover:bg-accent hover:text-accent-foreground bg-transparent shadow-none",
        link: "text-primary underline-offset-4 hover:underline bg-transparent shadow-none",
        gradient: "bg-gradient-to-r from-primary to-primary-glow text-white hover:from-primary/90 hover:to-primary-glow/90 shadow-lg hover:shadow-xl",
      },
      size: {
        default: "h-10 px-4 py-2",
        sm: "h-8 rounded-md px-3 text-xs",
        lg: "h-12 rounded-lg px-6 text-base",
        xl: "h-14 rounded-xl px-8 text-lg",
        icon: "h-10 w-10 p-0",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
    },
  }
);

export interface ButtonProps
  extends React.ButtonHTMLAttributes<HTMLButtonElement>,
    VariantProps<typeof buttonVariants> {
  loading?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
}

const EnhancedButton = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, loading, leftIcon, rightIcon, children, disabled, ...props }, ref) => {
    return (
      <button
        className={cn(buttonVariants({ variant, size }), className)}
        ref={ref}
        disabled={disabled || loading}
        {...props}
      >
        {leftIcon && <span className="mr-2">{leftIcon}</span>}
        {loading && <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent"></span>}
        {children}
        {rightIcon && <span className="ml-2">{rightIcon}</span>}
      </button>
    );
  }
);

EnhancedButton.displayName = "EnhancedButton";

export { EnhancedButton, buttonVariants };