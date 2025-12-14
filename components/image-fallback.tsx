"use client"

import { useEffect, useRef, useState } from "react"

type ImageOrFallbackProps = {
  src?: string
  alt: string
  fallbackText?: string
  className?: string
}

export function ImageWithFallback({
  src,
  alt,
  fallbackText = "Image unavailable",
  className,
}: ImageOrFallbackProps) {
  const [hasError, setHasError] = useState(false)
  const [isLoading, setIsLoading] = useState(Boolean(src))
  const imgRef = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    if (src) {
      setHasError(false)
      setIsLoading(true)
      if (imgRef.current?.complete && imgRef.current.naturalWidth > 0) {
        setIsLoading(false)
      }
    } else {
      setHasError(true)
      setIsLoading(false)
    }
  }, [src])

  return (
    <div className="w-full h-full relative flex items-center justify-center bg-muted">
      {!src || hasError ? (
        <div className="w-full h-full flex items-center justify-center text-muted-foreground text-sm px-4 text-center">
          {fallbackText}
        </div>
      ) : (
        <>
          {isLoading && (
            <div className="absolute inset-0 flex items-center justify-center bg-muted/70">
              <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" aria-label="Loading image" />
            </div>
          )}
          <img
            ref={imgRef}
            src={src}
            alt={alt}
            className={`h-full w-full object-cover transition-opacity duration-200 ${isLoading ? "opacity-0" : "opacity-100"} ${className ?? ""}`}
            onLoad={() => setIsLoading(false)}
            onError={() => {
              setHasError(true)
              setIsLoading(false)
            }}
            loading="lazy"
            decoding="async"
          />
        </>
      )}
    </div>
  )
}
