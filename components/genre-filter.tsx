"use client"

import { Badge } from "@/components/ui/badge"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import type { GenreSummary } from "@/lib/movies-api"

interface GenreFilterProps {
  genres: GenreSummary[]
  selectedGenre: string | null
  onGenreSelect: (genre: string | null) => void
}

export function GenreFilter({ genres, selectedGenre, onGenreSelect }: GenreFilterProps) {
  return (
    <div className="space-y-3">
      <h3 className="text-sm font-medium text-muted-foreground">Filter by Genre</h3>
      <ScrollArea className="w-full">
        <div className="flex gap-2 pb-2">
          <Badge
            variant={selectedGenre === null ? "default" : "outline"}
            className="cursor-pointer whitespace-nowrap"
            onClick={() => onGenreSelect(null)}
          >
            All Movies
          </Badge>
          {genres.map((genre) => (
            <Badge
              key={genre.id}
              variant={selectedGenre === genre.title ? "default" : "outline"}
              className="cursor-pointer whitespace-nowrap"
              onClick={() => onGenreSelect(genre.title)}
            >
              {genre.title}
            </Badge>
          ))}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
