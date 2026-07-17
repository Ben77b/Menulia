"use client";

import { useCallback, useRef, useState, type ClipboardEvent, type DragEvent } from "react";
import { Camera, Link2, Loader2, Upload, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useDashboardLocale } from "@/contexts/dashboard-locale-context";
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

export function DishImageUploader({
  imageUrl,
  onImageUrlChange,
  onImageUpload,
  uploading = false,
}: DishImageUploaderProps) {
  const { t } = useDashboardLocale();
  const toast = useToast();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [urlInput, setUrlInput] = useState("");
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

  function handleApplyUrl() {
    const normalized = normalizeImageUrl(urlInput);
    if (!normalized) {
      toast.error("Enter a valid image URL.");
      return;
    }

    onImageUrlChange(normalized);
    setUrlInput("");
  }

  return (
    <div className="space-y-3">
      <div
        tabIndex={0}
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
          "rounded-2xl border-2 border-dashed p-4 outline-none transition-colors",
          dragOver
            ? "border-sky-400 bg-sky-50/70"
            : "border-neutral-200/70 bg-neutral-50/40 dark:border-neutral-800/70 dark:bg-neutral-900/30",
          "focus-visible:border-neutral-400 focus-visible:ring-2 focus-visible:ring-neutral-900/10"
        )}
      >
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
          <div className="flex h-24 w-24 shrink-0 items-center justify-center">
            {previewUrl ? (
              <div className="relative h-24 w-24">
                <img
                  src={previewUrl}
                  alt=""
                  className="h-full w-full object-contain"
                  style={{ filter: "drop-shadow(0 4px 6px rgba(0,0,0,0.08))" }}
                />
                <button
                  type="button"
                  onClick={() => onImageUrlChange(null)}
                  disabled={uploading}
                  className="absolute -right-2 -top-2 inline-flex min-h-8 min-w-8 items-center justify-center rounded-full bg-red-500 text-white shadow-sm"
                  aria-label="Remove image"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            ) : (
              <div className="flex h-24 w-24 items-center justify-center rounded-xl border border-neutral-200/50 bg-white/60 dark:border-neutral-800/50 dark:bg-neutral-950/40">
                <Camera className="h-7 w-7 text-neutral-400" />
              </div>
            )}
          </div>

          <div className="min-w-0 flex-1 space-y-2">
            <p className="text-sm font-medium text-neutral-800 dark:text-neutral-100">
              {t("dish.uploadHintTitle")}
            </p>
            <p className="text-xs leading-relaxed text-neutral-500">{t("dish.uploadHintBody")}</p>
            <div className="flex flex-wrap gap-2 pt-1">
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={uploading}
                onClick={() => fileInputRef.current?.click()}
                className="min-h-10 gap-2"
              >
                {uploading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
                {uploading ? t("dish.uploading") : t("dish.upload")}
              </Button>
            </div>
          </div>
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

      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative min-w-0 flex-1">
          <Link2 className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-neutral-400" />
          <input
            type="url"
            value={urlInput}
            onChange={(event) => setUrlInput(event.target.value)}
            placeholder={t("dish.imageUrlPlaceholder")}
            className="w-full rounded-xl border border-neutral-200/60 bg-white py-2.5 pl-10 pr-3 text-sm text-neutral-900 placeholder:text-neutral-400 focus:border-neutral-300 focus:outline-none focus:ring-2 focus:ring-neutral-900/10 dark:border-neutral-800/60 dark:bg-neutral-950 dark:text-neutral-100"
          />
        </div>
        <Button
          type="button"
          size="sm"
          variant="outline"
          disabled={uploading || !urlInput.trim()}
          onClick={handleApplyUrl}
          className="min-h-10 shrink-0"
        >
          {t("dish.useImageUrl")}
        </Button>
      </div>
    </div>
  );
}
