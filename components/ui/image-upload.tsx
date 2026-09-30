"use client";

import * as React from "react";
import { Upload, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImageUploadProps {
  value?: string;
  onChange: (file: File | null) => void;
  error?: string;
}

export function ImageUpload({ value, onChange, error }: ImageUploadProps) {
  const [preview, setPreview] = React.useState<string | null>(value || null);
  const inputRef = React.useRef<HTMLInputElement>(null);

  React.useEffect(() => {
    if (value) setPreview(value);
  }, [value]);

  function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) {
      onChange(file);
      const reader = new FileReader();
      reader.onloadend = () => {
        setPreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  }

  function handleRemove() {
    setPreview(null);
    onChange(null);
    if (inputRef.current) inputRef.current.value = "";
  }

  return (
    <div className="w-full">
      <input
        ref={inputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp"
        onChange={handleFileChange}
        className="hidden"
      />

      {preview ? (
        <div className="relative aspect-square w-32 rounded-[var(--radius)] overflow-hidden border border-border group bg-muted">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={preview}
            alt="Preview Foto Varian"
            className="w-full h-full object-cover"
          />
          <button
            type="button"
            onClick={handleRemove}
            className="absolute top-1 right-1 p-1 rounded-full bg-black/60 text-white hover:bg-black/80 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className={cn(
            "flex flex-col items-center justify-center w-32 aspect-square rounded-[var(--radius)] border-2 border-dashed border-border bg-muted/30 hover:bg-muted/70 transition-colors text-center p-2",
            error && "border-destructive/60 bg-destructive/5"
          )}
        >
          <Upload className="w-5 h-5 text-muted-foreground mb-1" />
          <span className="text-[11px] font-medium text-foreground">Upload Foto *</span>
          <span className="text-[9px] text-muted-foreground mt-0.5">PNG / JPG</span>
        </button>
      )}

      {error && (
        <p className="text-xs text-destructive mt-1.5">{error}</p>
      )}
    </div>
  );
}
