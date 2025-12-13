"use client"

import { useEffect, useState } from "react"

type ImageOrFallbackProps = {
  src: string
  alt: string
  fallbackText?: string
  className?: string
}

export function ImageWithFallback({
  src,
  alt,
  fallbackText = "Image unavailable",
  className
}: ImageOrFallbackProps) {
  const [hasError, setHasError] = useState(false)

  useEffect(() => {
    setHasError(false)
  }, [src])

  if (!src || hasError) {
    return (
      <div className="w-full h-full flex items-center justify-center text-muted-foreground">
        Image unavailable
      </div>
    )
  }
  return (
    <img
      src={src}
      alt={alt}
      className={className}
      onError={() => setHasError(true)}
    />
  )
}