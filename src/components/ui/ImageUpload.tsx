"use client";

import { useState, useRef, useCallback } from "react";
import { Upload, X, Loader2, ImageIcon } from "lucide-react";
import { cn } from "@/lib/utils";
import { validateImageFile } from "@/lib/storage";

interface ImageUploadProps {
  value?: string | null;
  onChange: (url: string | null) => void;
  onUpload: (file: File) => Promise<string>;
  onDelete?: (url: string) => Promise<void>;
  disabled?: boolean;
  className?: string;
  label?: string;
  helperText?: string;
  error?: string;
}

export function ImageUpload({
  value,
  onChange,
  onUpload,
  onDelete,
  disabled = false,
  className,
  label,
  helperText,
  error,
}: ImageUploadProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = useCallback(
    async (file: File) => {
      if (disabled) return;

      const validation = validateImageFile(file);
      if (!validation.valid) {
        setUploadError(validation.error || "Invalid file");
        return;
      }

      setUploadError(null);
      setIsUploading(true);

      try {
        const url = await onUpload(file);
        onChange(url);
      } catch (err) {
        const errorMessage = err instanceof Error ? err.message : "Upload failed";
        setUploadError(errorMessage);
      } finally {
        setIsUploading(false);
      }
    },
    [disabled, onChange, onUpload]
  );

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
    e.target.value = "";
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setIsDragging(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    if (disabled) return;

    const file = e.dataTransfer.files?.[0];
    if (file) {
      handleFileSelect(file);
    }
  };

  const handleClick = () => {
    if (!disabled && !isUploading) {
      fileInputRef.current?.click();
    }
  };

  const handleRemove = async (e: React.MouseEvent) => {
    e.stopPropagation();
    if (disabled || isUploading) return;

    if (value && onDelete) {
      try {
        await onDelete(value);
      } catch (err) {
        console.error("Failed to delete image:", err);
      }
    }
    onChange(null);
    setUploadError(null);
  };

  const displayError = error || uploadError;

  return (
    <div className={cn("space-y-1.5", className)}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
        </label>
      )}

      {/* Upload Area */}
      <div
        onClick={handleClick}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        className={cn(
          "relative flex items-center gap-4 p-3 rounded-lg border transition-all cursor-pointer",
          isDragging
            ? "border-cjc-blue bg-cjc-blue/5 border-solid"
            : "border-gray-200 hover:border-gray-300 bg-gray-50/50",
          disabled && "opacity-50 cursor-not-allowed",
          displayError && "border-red-300 bg-red-50/50"
        )}
      >
        {/* Preview / Placeholder */}
        <div
          className={cn(
            "w-14 h-14 rounded-lg flex items-center justify-center flex-shrink-0 overflow-hidden",
            value ? "bg-white border border-gray-200" : "bg-white border-2 border-dashed border-gray-300"
          )}
        >
          {isUploading ? (
            <Loader2 className="w-5 h-5 text-cjc-blue animate-spin" />
          ) : value ? (
            <img
              src={value}
              alt="Logo preview"
              className="w-full h-full object-cover"
            />
          ) : (
            <ImageIcon className="w-5 h-5 text-gray-400" />
          )}
        </div>

        {/* Text Content */}
        <div className="flex-1 min-w-0">
          {value ? (
            <div className="flex items-center gap-2">
              <span className="text-sm text-gray-700 font-medium">Logo uploaded</span>
              <button
                type="button"
                onClick={handleRemove}
                disabled={disabled}
                className="text-xs text-red-500 hover:text-red-600 font-medium"
              >
                Remove
              </button>
            </div>
          ) : (
            <>
              <p className="text-sm text-gray-700">
                <span className="text-cjc-blue font-medium">Click to upload</span>
                {" "}or drag and drop
              </p>
              <p className="text-xs text-gray-500">
                PNG, JPG, WEBP or SVG (max 2MB)
              </p>
            </>
          )}
        </div>

        {/* Upload Icon */}
        {!value && !isUploading && (
          <Upload className="w-5 h-5 text-gray-400 flex-shrink-0" />
        )}
      </div>

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/png,image/jpeg,image/jpg,image/webp,image/svg+xml"
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {/* Helper text */}
      {helperText && !displayError && (
        <p className="text-xs text-gray-500">{helperText}</p>
      )}

      {/* Error message */}
      {displayError && (
        <p className="text-xs text-red-500">{displayError}</p>
      )}
    </div>
  );
}
