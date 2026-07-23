"use client"

import * as React from "react"
import { cn } from "../../lib/utils"

type GalleryProps = {
  images: string[]
  onImageClick: (index: number) => void
  className?: string
  maxHeight?: string
}

export function PostImageGallery({ images, onImageClick, className, maxHeight = "600px" }: GalleryProps) {
  if (images.length === 0) return null

  if (images.length === 1) {
    return (
      <button
        type="button"
        onClick={() => onImageClick(0)}
        className={cn(
          "block w-full rounded-lg overflow-hidden border border-slate-200 bg-slate-100 cursor-zoom-in",
          className,
        )}
        aria-label="Phóng to ảnh"
      >
        <img
          src={images[0]}
          alt=""
          className="w-full object-contain"
          style={{ maxHeight }}
          loading="lazy"
        />
      </button>
    )
  }

  const gridClass = cn(
    "grid gap-1 rounded-lg overflow-hidden border border-slate-200 bg-slate-100",
    images.length === 2 && "grid-cols-2",
    images.length === 3 && "grid-cols-2",
    images.length === 4 && "grid-cols-2",
    images.length >= 5 && "grid-cols-3",
    className,
  )
  const tileHeight = images.length === 2 ? "h-72" : images.length === 3 ? "h-56" : "h-40"
  const mainTileHeight = images.length === 3 ? "row-span-2 h-full" : ""

  return (
    <div className={gridClass} style={{ maxHeight }}>
      {images.slice(0, 9).map((src, i) => {
        const remaining = images.length - 9
        const isLastVisible = i === 8 && images.length > 9
        return (
          <button
            type="button"
            key={i}
            onClick={() => onImageClick(i)}
            className={cn(
              "relative group overflow-hidden bg-slate-100 cursor-zoom-in",
              tileHeight,
              images.length === 3 && i === 0 && mainTileHeight,
            )}
            aria-label={`Phóng to ảnh ${i + 1}`}
          >
            <img
              src={src}
              alt=""
              className="w-full h-full object-cover group-hover:scale-[1.02] transition-transform duration-200"
              loading="lazy"
            />
            {isLastVisible && (
              <div className="absolute inset-0 bg-black/50 flex items-center justify-center text-white text-lg font-bold">
                +{remaining}
              </div>
            )}
          </button>
        )
      })}
    </div>
  )
}
