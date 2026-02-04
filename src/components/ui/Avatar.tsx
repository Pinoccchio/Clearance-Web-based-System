"use client";

import { forwardRef } from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { cn, getInitials } from "@/lib/utils";

const avatarVariants = cva(
  "inline-flex items-center justify-center font-semibold rounded-full flex-shrink-0",
  {
    variants: {
      size: {
        xs: "w-6 h-6 text-[10px]",
        sm: "w-8 h-8 text-xs",
        md: "w-10 h-10 text-sm",
        lg: "w-12 h-12 text-base",
        xl: "w-16 h-16 text-lg",
      },
      variant: {
        default: "bg-gray-200 text-gray-600",
        primary: "bg-cjc-navy text-white",
        secondary: "bg-cjc-blue/10 text-cjc-blue",
        gold: "bg-cjc-gold/20 text-cjc-gold",
        success: "bg-green-100 text-green-600",
      },
    },
    defaultVariants: {
      size: "md",
      variant: "default",
    },
  }
);

export interface AvatarProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof avatarVariants> {
  name?: string;
  src?: string;
  alt?: string;
}

const Avatar = forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, size, variant, name, src, alt, ...props }, ref) => {
    if (src) {
      return (
        <div
          ref={ref}
          className={cn(avatarVariants({ size, variant, className }), "overflow-hidden")}
          {...props}
        >
          <img
            src={src}
            alt={alt || name || "Avatar"}
            className="w-full h-full object-cover"
          />
        </div>
      );
    }

    return (
      <div
        ref={ref}
        className={cn(avatarVariants({ size, variant, className }))}
        {...props}
      >
        {name ? getInitials(name) : "?"}
      </div>
    );
  }
);

Avatar.displayName = "Avatar";

export { Avatar, avatarVariants };
