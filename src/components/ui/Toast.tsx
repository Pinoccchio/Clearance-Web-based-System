"use client";

import { createContext, useContext, useState, useCallback, ReactNode } from "react";
import { CheckCircle, XCircle, AlertCircle, Info, X } from "lucide-react";
import { cn } from "@/lib/utils";

type ToastType = "success" | "error" | "warning" | "info";

interface Toast {
  id: string;
  type: ToastType;
  title: string;
  message?: string;
}

interface ToastContextType {
  toasts: Toast[];
  showToast: (type: ToastType, title: string, message?: string) => void;
  removeToast: (id: string) => void;
}

const ToastContext = createContext<ToastContextType | undefined>(undefined);

export function useToast() {
  const context = useContext(ToastContext);
  if (!context) {
    throw new Error("useToast must be used within a ToastProvider");
  }
  return context;
}

export function ToastProvider({ children }: { children: ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);

  const showToast = useCallback((type: ToastType, title: string, message?: string) => {
    const id = Math.random().toString(36).substring(2, 9);
    const newToast: Toast = { id, type, title, message };

    setToasts((prev) => [...prev, newToast]);

    // Auto remove after 5 seconds
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 5000);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  }, []);

  return (
    <ToastContext.Provider value={{ toasts, showToast, removeToast }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  );
}

function ToastContainer({
  toasts,
  removeToast,
}: {
  toasts: Toast[];
  removeToast: (id: string) => void;
}) {
  if (toasts.length === 0) return null;

  return (
    <div className="fixed bottom-4 right-4 z-[200] flex flex-col gap-2 max-w-sm">
      {toasts.map((toast) => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onClose }: { toast: Toast; onClose: () => void }) {
  const config = {
    success: {
      icon: CheckCircle,
      bgColor: "bg-green-50",
      borderColor: "border-green-200",
      iconColor: "text-green-500",
      titleColor: "text-green-800",
      messageColor: "text-green-600",
    },
    error: {
      icon: XCircle,
      bgColor: "bg-red-50",
      borderColor: "border-red-200",
      iconColor: "text-red-500",
      titleColor: "text-red-800",
      messageColor: "text-red-600",
    },
    warning: {
      icon: AlertCircle,
      bgColor: "bg-amber-50",
      borderColor: "border-amber-200",
      iconColor: "text-amber-500",
      titleColor: "text-amber-800",
      messageColor: "text-amber-600",
    },
    info: {
      icon: Info,
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200",
      iconColor: "text-blue-500",
      titleColor: "text-blue-800",
      messageColor: "text-blue-600",
    },
  };

  const { icon: Icon, bgColor, borderColor, iconColor, titleColor, messageColor } =
    config[toast.type];

  return (
    <div
      className={cn(
        "flex items-start gap-3 p-4 rounded-lg border shadow-lg animate-slide-in",
        bgColor,
        borderColor
      )}
      role="alert"
    >
      <Icon className={cn("w-5 h-5 flex-shrink-0 mt-0.5", iconColor)} />
      <div className="flex-1 min-w-0">
        <p className={cn("text-sm font-medium", titleColor)}>{toast.title}</p>
        {toast.message && (
          <p className={cn("text-sm mt-0.5", messageColor)}>{toast.message}</p>
        )}
      </div>
      <button
        onClick={onClose}
        className={cn(
          "flex-shrink-0 p-1 rounded hover:bg-black/5 transition-colors",
          titleColor
        )}
      >
        <X className="w-4 h-4" />
      </button>
    </div>
  );
}
