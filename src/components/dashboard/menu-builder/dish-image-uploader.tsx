"use client";

import { useCallback, useRef, useState, type ClipboardEvent, type DragEvent } from "react";
import { Link2, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useToast } from "@/components/ui/toast";
import { cn } from "@/lib/utils";
import { normalizeImageUrl } from "@/lib/public-menu-utils";

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

function extensionFromMime(mime: string): string {
  if (mime.includes("png")) return "png";
  if (mime.includes("webp")) return "webp";
  if (mime.includes("gif")) return "gif";
  return "jpg";
}

function getClipboardImageFile(clipboardData: DataTransfer | null): File | null {
  if (!clipboardData) return null;

  const fromFiles = Array.from(clipboardData.files ?? []).find((file) =>
    file.type.startsWith("image/")
  );
  if (fromFiles) return fromFiles;

  for (const item of Array.from(clipboardData.items ?? [])) {
    if (item.kind === "file" && item.type.startsWith("image/")) {
      const file = item.getAsFile();
      if (file) return file;
    }
  }

  return null;
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
  const [urlInput, setUrlInput] = useState("");
  const [localPreviewUrl, setLocalPreviewUrl] = useState<string | null>(null);
  const [fetchingUrl, setFetchingUrl] = useState(false);

  const previewUrl = imageUrl ?? localPreviewUrl;
  const busy = uploading || fetchingUrl;

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
      const imageFile = getClipboardImageFile(event.clipboardData);
      if (!imageFile) return;

      event.preventDefault();
      event.stopPropagation();
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

  async function handleApplyUrl() {
    const normalized = normalizeImageUrl(urlInput);
    if (!normalized) {
      toast.error("Enter a valid image URL.");
      return;
    }

    setFetchingUrl(true);
    try {
      const response = await fetch(normalized);
      if (!response.ok) {
        throw new Error("Could not fetch image");
      }

      const blob = await response.blob();
      if (!blob.type.startsWith("image/")) {
        throw new Error("URL is not an image");
      }

      const file = new File([blob], `dish-photo.${extensionFromMime(blob.type)}`, {
        type: blob.type || "image/jpeg",
      });
      await handleFile(file);
      setUrlInput("");
    } catch {
      // CORS or remote fetch failures: still accept a direct hosted URL.
      onImageUrlChange(normalized);
      setUrlInput("");
      toast.success("Image URL applied");
    } finally {
      setFetchingUrl(false);
    }
  }

  return (
    <div className="flex flex-col space-y-3">
      <div
        role="button"
        tabIndex={0}
        onClick={() => {
          if (!busy) fileInputRef.current?.click();
        }}
        onKeyDown={(event) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            if (!busy) fileInputRef.current?.click();
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
          "flex min-h-[10rem] cursor-pointer flex-col items-center justify-center gap-3 rounded-2xl border border-dashed px-4 py-6 text-center outline-none transition-all",
          "bg-neutral-50/50 shadow-sm",
          dragOver
            ? "border-sky-400 bg-sky-50/60 shadow-md"
            : "border-neutral-200/80 hover:border-neutral-300 hover:bg-neutral-50 hover:shadow",
          "focus-visible:border-neutral-400 focus-visible:ring-2 focus-visible:ring-neutral-900/10",
          busy && "pointer-events-none opacity-70"
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
              disabled={busy}
              className="absolute -right-2 -top-2 inline-flex min-h-8 min-w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-sm"
              aria-label="Remove image"
            >
              <X className="h-3.5 w-3.5" />
            </button>
          </div>
        ) : (
          <>
            {busy ? (
              <Loader2 className="h-7 w-7 animate-spin text-neutral-400" />
            ) : (
              <Upload className="h-7 w-7 text-neutral-400" />
            )}
            <p className="text-sm font-medium text-neutral-600">
              {busy ? "Uploading…" : "Click or drag to upload dish photo"}
            </p>
            <p className="text-xs text-neutral-400">Paste stickers with Cmd/Ctrl+V</p>
          </>
        )}
      </div>

      <div className="flex flex-col gap-2">
        <div className="relative">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="url"
            value={urlInput}
            onChange={(event) => setUrlInput(event.target.value)}
            onPaste={(event) => {
              // Allow normal URL text paste into this field.
              event.stopPropagation();
            }}
            placeholder="Or paste an image link..."
            className="w-full rounded-xl border border-neutral-200/80 bg-white py-2.5 pl-10 pr-3 text-sm text-neutral-800 shadow-sm placeholder:text-neutral-400 focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/5"
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="light"
          disabled={busy || !urlInput.trim()}
          onClick={() => void handleApplyUrl()}
          className="min-h-10 w-full border border-neutral-200/80 bg-white shadow-sm"
        >
          {fetchingUrl ? "Fetching…" : "Use image link"}
        </Button>
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
