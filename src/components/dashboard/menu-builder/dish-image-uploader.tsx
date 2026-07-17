"use client";

import { useCallback, useRef, useState, type ClipboardEvent, type DragEvent } from "react";
import { Loader2, Upload, X } from "lucide-react";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";

const ACCEPTED_IMAGE_TYPES = ["image/png", "image/jpeg", "image/webp", "image/gif"];
const ACCEPT_ATTR = ACCEPTED_IMAGE_TYPES.join(",");

interface DishImageUploaderProps {
  imageUrl: string | null;
  onImageUrlChange: (url: string | null) => void;
  onImageUpload: (file: File) => Promise<string | null>;
  uploading?: boolean;
}

function isAcceptedImageFile(file: File): boolean {
  if (file.type.startsWith("image/")) {
    return ACCEPTED_IMAGE_TYPES.includes(file.type) || file.type === "image/jpg";
  }

  const extension = file.name.split(".").pop()?.toLowerCase();
  return extension === "png" || extension === "jpg" || extension === "jpeg" || extension === "webp";
}

export function DishImageUploader({
  imageUrl,
  onImageUrlChange,
  onImageUpload,
  uploading = false,
}: DishImageUploaderProps) {
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);

  const previewUrl = imageUrl ?? localPreviewUrl;

  const handleFile = useCallback(
    async (file: File) => {
      if (!isAcceptedImageFile(file)) {
        toast.error("Please use a PNG, JPG, or WebP image.");
        return;
      }

      const objectUrl = URL.createObjectURL(file);
      setLocalPreviewUrl(objectUrl);

      try {
        const uploadedUrl = await onImageUpload(file);
        if (uploadedUrl) {
          onImageUrlChange(uploadedUrl);
        } else {
          toast.error("Image upload failed.");
        }
      } finally {
        URL.revokeObjectURL(objectUrl);
        setLocalPreviewUrl(null);
      }
    },
    [onImageUpload, onImageUrlChange, toast]
  );

  const handlePaste = useCallback(
    (event: ClipboardEvent<HTMLDivElement>) => {
      const clipboardFiles = event.clipboardData?.files;
      if (!clipboardFiles?.length) return;

      const imageFile = Array.from(clipboardFiles).find((file) => file.type.startsWith("image/"));
      if (!imageFile) return;

      event.preventDefault();
      void handleFile(imageFile);
    },
    [handleFile]
  );

  const handleDrop = useCallback(
    (event: DragEvent<HTMLDivElement>) => {
      event.preventDefault();
      setDragOver(false);

      const droppedFile = event.dataTransfer.files?.[0];
      if (droppedFile) {
        void handleFile(droppedFile);
      }
    },
    [handleFile]
  );

  return (
    <div className="flex flex-col space-y-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (!uploading) fileInputRef.current?.click();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!uploading) fileInputRef.current?.click();
          }
        }}
        onPaste={handlePaste}
        onDragOver={(event) => {
          event.preventDefault();
          setDragOver(true);
        }}
        onDragLeave={(event) => {
          event.preventDefault();
          setDragOver(false);
        }}
        onDrop={handleDrop}
        className={cn(
          "flex min-h-[9.5rem] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border-2 border-dashed px-4 py-6 text-center outline-none transition-colors",
          dragOver
            ? "border-sky-400 bg-sky-50/70"
            : "border-neutral-200/70 bg-neutral-50/50 hover:border-neutral-300 hover:bg-neutral-50",
          "focus-visible:border-neutral-400 focus-visible:ring-2 focus-visible:ring-neutral-900/10",
          uploading && "pointer-events-none opacity-70"
        )}
      >
        {previewUrl ? (
          <div className="relative">
            <img
              src={previewUrl}
              alt=""
              className="mx-auto h-28 w-28 object-contain"
              style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.08))" }}
            />
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onImageUrlChange(null);
              }}
              disabled={uploading}
              className="absolute -right-2 -top-2 inline-flex min-h-8 min-w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-sm"
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            {uploading ? (
              <Loader2 className="h-7 w-7 animate-spin text-neutral-400" />
            ) : (
              <Upload className="h-7 w-7 text-neutral-400" />
            )}
            <p className="text-sm font-medium text-neutral-600">
              {uploading ? "Uploading…" : "Click or drag to upload dish photo"}
            </p>
          </>
        )}
      </div>

      <input
        ref={fileInputRef}
        type="file"
        accept={ACCEPT_ATTR}
        className="hidden"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) void handleFile(file);
          event.target.value = "";
        }}
      />
    </div>
  );
}
