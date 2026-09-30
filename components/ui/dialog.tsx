"use client";

import * as React from "react";
import { X } from "lucide-react";
import { Button } from "./button";

interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  description?: string;
  children?: React.ReactNode;
  confirmLabel?: string;
  onConfirm?: () => void;
  isDestructive?: boolean;
  isLoading?: boolean;
}

export function Dialog({
  isOpen,
  onClose,
  title,
  description,
  children,
  confirmLabel,
  onConfirm,
  isDestructive = false,
  isLoading = false,
}: DialogProps) {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="w-full max-w-md bg-card rounded-[var(--radius)] border border-border shadow-lg p-6 relative">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-muted-foreground hover:text-foreground transition-colors"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="mb-4">
          <h3 className="text-lg font-semibold text-foreground">{title}</h3>
          {description && (
            <p className="text-xs text-muted-foreground mt-1 leading-relaxed">
              {description}
            </p>
          )}
        </div>

        {children && <div className="mb-6">{children}</div>}

        <div className="flex justify-end gap-2 mt-6">
          <Button variant="outline" size="sm" onClick={onClose} disabled={isLoading}>
            Batal
          </Button>
          {confirmLabel && onConfirm && (
            <Button
              size="sm"
              variant={isDestructive ? "destructive" : "primary"}
              onClick={onConfirm}
              disabled={isLoading}
            >
              {isLoading ? "Memproses..." : confirmLabel}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
