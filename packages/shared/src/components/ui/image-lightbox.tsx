"use client"

import * as React from "react"
import { Button } from './button';
import { ChevronLeft, ChevronRight, X } from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogTitle,
} from "./dialog"
import { cn } from "../../lib/utils"

type ImageItem = string | { src: string; alt?: string; caption?: React.ReactNode }

type ImageLightboxProps = {
  open: boolean
  images: ImageItem[]
  index: number
  onIndexChange: (next: number) => void
  onClose: () => void
}

function normalize(item: ImageItem): { src: string; alt?: string; caption?: React.ReactNode } {
  return typeof item === "string" ? { src: item } : item
}

export function ImageLightbox({ open, images, index, onIndexChange, onClose }: ImageLightboxProps) {
  const total = images.length
  const safeIndex = total > 0 ? Math.min(Math.max(index, 0), total - 1) : 0
  const current = total > 0 ? normalize(images[safeIndex]) : null

  const goPrev = React.useCallback(() => {
    if (total <= 1) return
    onIndexChange((safeIndex - 1 + total) % total)
  }, [onIndexChange, safeIndex, total])
  const goNext = React.useCallback(() => {
    if (total <= 1) return
    onIndexChange((safeIndex + 1) % total)
  }, [onIndexChange, safeIndex, total])

  React.useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") goPrev()
      else if (e.key === "ArrowRight") goNext()
    }
    window.addEventListener("keydown", onKey)
    return () => window.removeEventListener("keydown", onKey)
  }, [open, goPrev, goNext])

  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent
        showCloseButton={false}
        className="w-full max-w-[calc(100%-2rem)] sm:max-w-5xl p-0 gap-0 bg-black/95 border-none overflow-hidden"
      >
        <DialogTitle className="sr-only">
          {current?.alt || "Image preview"}
        </DialogTitle>
        <Button
          type="button"
          onClick={onClose}
          className="absolute top-3 right-3 z-20 w-9 h-9 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
          aria-label="Đóng"
        >
          <X className="size-4" />
        </Button>

        {total > 1 && (
          <>
            <Button
              type="button"
              onClick={goPrev}
              className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              aria-label="Ảnh trước"
            >
              <ChevronLeft className="size-5" />
            </Button>
            <Button
              type="button"
              onClick={goNext}
              className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-white/10 hover:bg-white/20 text-white flex items-center justify-center"
              aria-label="Ảnh sau"
            >
              <ChevronRight className="size-5" />
            </Button>
          </>
        )}

        {current && (
          <div className="flex flex-col items-center">
            <img
              src={current.src}
              alt={current.alt || ""}
              className="max-h-[85vh] w-auto max-w-full object-contain"
            />
            <div className="px-5 py-3 text-white text-center w-full flex items-center justify-center gap-3">
              {current.caption && (
                <div className="flex-1 min-w-0">
                  {typeof current.caption === "string" ? (
                    <p className="text-sm font-semibold">{current.caption}</p>
                  ) : (
                    current.caption
                  )}
                </div>
              )}
              {total > 1 && (
                <span className="text-xs font-semibold text-white/70 shrink-0">
                  {safeIndex + 1} / {total}
                </span>
              )}
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  )
}

type UseImageLightboxReturn = {
  open: (images: ImageItem[], index?: number) => void
  close: () => void
  element: React.ReactNode
  state: { open: boolean; images: ImageItem[]; index: number }
}

export function useImageLightbox(): UseImageLightboxReturn {
  const [state, setState] = React.useState<{ open: boolean; images: ImageItem[]; index: number }>({
    open: false,
    images: [],
    index: 0,
  })

  const open = React.useCallback((images: ImageItem[], index = 0) => {
    setState({ open: true, images, index })
  }, [])
  const close = React.useCallback(() => {
    setState((s) => ({ ...s, open: false }))
  }, [])
  const setIndex = React.useCallback((index: number) => {
    setState((s) => ({ ...s, index }))
  }, [])

  const element = (
    <ImageLightbox
      open={state.open}
      images={state.images}
      index={state.index}
      onIndexChange={setIndex}
      onClose={close}
    />
  )

  return { open, close, element, state }
}

// ── Simple single-image wrapper for backward compat ─────────────────────────

type SingleImageLightboxProps = {
  src: string | null
  alt?: string
  caption?: React.ReactNode
  onClose: () => void
  className?: string
}

export function SingleImageLightbox({ src, alt, caption, onClose, className }: SingleImageLightboxProps) {
  if (!src) return null
  return (
    <ImageLightbox
      open={true}
      images={[{ src, alt, caption }]}
      index={0}
      onIndexChange={() => {}}
      onClose={onClose}
    />
  )
}

// ── Helper: extract all images from a Post-like object (legacy + new) ──────

export function getPostImages(post: { image_url?: string; image_urls?: string[] }): string[] {
  const list: string[] = []
  if (Array.isArray(post.image_urls)) list.push(...post.image_urls.filter(Boolean))
  if (post.image_url && !list.includes(post.image_url)) list.push(post.image_url)
  return list
}
