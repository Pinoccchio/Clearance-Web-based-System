"use client";

import { forwardRef } from "react";
import { cn } from "@/lib/utils";
import { FileText } from "lucide-react";

export interface EmptyStateProps extends React.HTMLAttributes<HTMLDivElement> {
  icon?: React.ReactNode;
  title: string;
  description?: string;
  action?: React.ReactNode;
}

const EmptyState = forwardRef<HTMLDivElement, EmptyStateProps>(
  ({ className, icon, title, description, action, ...props }, ref) => {
    return (
      <div
        ref={ref}
        className={cn(
          "flex flex-col items-center justify-center py-12 px-4 text-center",
          className
        )}
        {...props}
      >
        <div className="w-16 h-16 rounded-full bg-gray-100 flex items-center justify-center mb-4">
          {icon || <FileText className="w-8 h-8 text-gray-400" />}
        </div>
        <h3 className="text-lg font-semibold text-cjc-navy mb-1">{title}</h3>
        {description && (
          <p className="text-sm text-gray-500 max-w-sm mb-4">{description}</p>
        )}
        {action && <div className="mt-2">{action}</div>}
      </div>
    );
  }
);

EmptyState.displayName = "EmptyState";

export { EmptyState };
