"use client";

import { useEffect, useCallback } from "react";
import { AlertTriangle, AlertCircle, Info, X } from "lucide-react";
import { Button } from "./Button";
import { cn } from "@/lib/utils";

interface ConfirmDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  title: string;
  message: string;
  confirmText?: string;
  cancelText?: string;
  variant?: "danger" | "warning" | "info";
  isLoading?: boolean;
}

export function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title,
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  isLoading = false,
}: ConfirmDialogProps) {
  // Handle escape key
  const handleEscape = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Escape" && !isLoading) {
        onClose();
      }
    },
    [onClose, isLoading]
  );

  // Handle enter key to confirm
  const handleEnter = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === "Enter" && !isLoading) {
        onConfirm();
      }
    },
    [onConfirm, isLoading]
  );

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("keydown", handleEnter);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("keydown", handleEnter);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, handleEscape, handleEnter]);

  if (!isOpen) return null;

  const iconConfig = {
    danger: {
      icon: AlertTriangle,
      bgColor: "bg-red-100",
      iconColor: "text-red-600",
      buttonVariant: "danger" as const,
    },
    warning: {
      icon: AlertCircle,
      bgColor: "bg-amber-100",
      iconColor: "text-amber-600",
      buttonVariant: "gold" as const,
    },
    info: {
      icon: Info,
      bgColor: "bg-blue-100",
      iconColor: "text-blue-600",
      buttonVariant: "primary" as const,
    },
  };

  const config = iconConfig[variant];
  const Icon = config.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/60 backdrop-blur-sm"
        onClick={!isLoading ? onClose : undefined}
        aria-hidden="true"
      />

      {/* Dialog Content */}
      <div
        className="relative z-10 bg-white rounded-2xl shadow-2xl w-full max-w-md animate-slide-in"
        role="alertdialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        aria-describedby="confirm-dialog-description"
      >
        {/* Close button */}
        <button
          onClick={onClose}
          disabled={isLoading}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors disabled:opacity-50"
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="p-6">
          {/* Icon */}
          <div className="flex justify-center mb-4">
            <div
              className={cn(
                "w-12 h-12 rounded-full flex items-center justify-center",
                config.bgColor
              )}
            >
              <Icon className={cn("w-6 h-6", config.iconColor)} />
            </div>
          </div>

          {/* Title */}
          <h3
            id="confirm-dialog-title"
            className="text-lg font-semibold text-cjc-navy text-center mb-2"
          >
            {title}
          </h3>

          {/* Message */}
          <p
            id="confirm-dialog-description"
            className="text-sm text-gray-600 text-center mb-6"
          >
            {message}
          </p>

          {/* Actions */}
          <div className="flex gap-3">
            <Button
              variant="secondary"
              className="flex-1"
              onClick={onClose}
              disabled={isLoading}
            >
              {cancelText}
            </Button>
            <Button
              variant={config.buttonVariant}
              className="flex-1"
              onClick={onConfirm}
              isLoading={isLoading}
            >
              {confirmText}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
