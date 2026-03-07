"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center gap-1.5 font-medium rounded-full",
  {
    variants: {
      variant: {
        default: "bg-gray-100 text-gray-700",
        pending: "bg-cjc-gold/10 text-cjc-gold",
        approved: "bg-green-50 text-green-600",
        rejected: "bg-red-50 text-red-600",
        onHold: "bg-amber-50 text-amber-600",
        info: "bg-cjc-blue/5 text-cjc-blue",
        success: "bg-green-50 text-green-600",
        warning: "bg-amber-50 text-amber-600",
        danger: "bg-red-50 text-red-600",
        neutral: "bg-gray-100 text-gray-600",
        gold: "bg-cjc-gold/10 text-cjc-gold",
      },
      size: {
        sm: "px-2 py-0.5 text-xs",
        md: "px-2.5 py-1 text-xs",
        lg: "px-3 py-1 text-sm",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "md",
    },
  }
);

export interface BadgeProps
  extends React.HTMLAttributes<HTMLSpanElement>,
    VariantProps<typeof badgeVariants> {}

const Badge = forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className, variant, size, ...props }, ref) => {
    return (
      <span
        ref={ref}
        className={cn(badgeVariants({ variant, size, className }))}
        {...props}
      />
    );
  }
);

Badge.displayName = "Badge";

export { Badge, badgeVariants };
