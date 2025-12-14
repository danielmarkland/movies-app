"use client"

import { useEffect, useRef } from "react"
import { Input } from "@/components/ui/input"
import { Search, X } from "lucide-react"

interface SearchBarProps {
  value: string
  onChange: (value: string) => void
  onSearch?: (query: string) => void
}

export function SearchBar({ value, onChange, onSearch }: SearchBarProps) {
  const onSearchRef = useRef(onSearch)

  useEffect(() => {
    onSearchRef.current = onSearch
  }, [onSearch])

  useEffect(() => {
    if (!onSearchRef.current) {
      return
    }
    const timer = setTimeout(() => {
      onSearchRef.current?.(value)
    }, 500)

    return () => clearTimeout(timer)
  }, [value])

  return (
    <div className="relative">
      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground pointer-events-none" />
      <Input
        type="text"
        placeholder="Search for movies..."
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="pl-10 pr-10 h-12 text-base"
      />
      {value && (
        <button
          type="button"
          aria-label="Clear search"
          onClick={() => onChange("")}
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      )}
    </div>
  )
}
