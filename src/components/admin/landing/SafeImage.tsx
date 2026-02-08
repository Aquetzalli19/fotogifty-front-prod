"use client";

import { useState } from "react";
import { ImageIcon } from "lucide-react";

interface SafeImageProps {
  src: string | null | undefined;
  alt: string;
  fill?: boolean;
  width?: number;
  height?: number;
  className?: string;
  sizes?: string;
  priority?: boolean;
}

function isValidUrl(url: string | null | undefined): url is string {
  if (!url) return false;
  if (url.startsWith("blob:")) return false;
  if (url.trim() === "") return false;
  return true;
}

export function SafeImage({
  src,
  alt,
  fill,
  width,
  height,
  className = "",
  sizes,
}: SafeImageProps) {
  const [hasError, setHasError] = useState(false);

  if (!isValidUrl(src) || hasError) {
    return (
      <div
        className={`flex flex-col items-center justify-center bg-muted/80 text-muted-foreground ${
          fill ? "absolute inset-0" : ""
        }`}
        style={!fill ? { width, height } : undefined}
      >
        <ImageIcon className="h-6 w-6 mb-1 opacity-50" />
        <span className="text-[10px] opacity-50 text-center px-1 leading-tight">
          Sin imagen
        </span>
      </div>
    );
  }

  /* eslint-disable @next/next/no-img-element */
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      sizes={sizes}
      onError={() => setHasError(true)}
      style={
        fill
          ? { position: "absolute", inset: 0, width: "100%", height: "100%" }
          : { width, height }
      }
    />
  );
}
