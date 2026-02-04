"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const progressVariants = cva(
  "w-full bg-gray-200 rounded-full overflow-hidden",
  {
    variants: {
      size: {
        sm: "h-1",
        md: "h-2",
        lg: "h-3",
      },
    },
    defaultVariants: {
      size: "md",
    },
  }
);

const progressFillVariants = cva(
  "h-full rounded-full transition-all duration-300",
  {
    variants: {
      variant: {
        default: "bg-cjc-blue",
        gold: "bg-cjc-gold",
        success: "bg-green-500",
        warning: "bg-amber-500",
        danger: "bg-red-500",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface ProgressBarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof progressVariants>,
    VariantProps<typeof progressFillVariants> {
  value: number;
  max?: number;
  showLabel?: boolean;
}

const ProgressBar = forwardRef<HTMLDivElement, ProgressBarProps>(
  ({ className, size, variant, value, max = 100, showLabel = false, ...props }, ref) => {
    const percentage = Math.min(Math.max((value / max) * 100, 0), 100);

    return (
      <div className={cn("w-full", className)} ref={ref} {...props}>
        {showLabel && (
          <div className="flex justify-between items-center mb-1">
            <span className="text-sm text-gray-600">Progress</span>
            <span className="text-sm font-medium text-cjc-navy">{Math.round(percentage)}%</span>
          </div>
        )}
        <div className={cn(progressVariants({ size }))}>
          <div
            className={cn(progressFillVariants({ variant }))}
            style={{ width: `${percentage}%` }}
          />
        </div>
      </div>
    );
  }
);

ProgressBar.displayName = "ProgressBar";

export { ProgressBar, progressVariants, progressFillVariants };
