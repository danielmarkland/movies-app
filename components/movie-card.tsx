import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Clock, Star } from "lucide-react"
import type { Movie } from "@/lib/movies-api"
import { ImageWithFallback } from "./image-fallback"
import { Tooltip, TooltipContent, TooltipTrigger } from "@radix-ui/react-tooltip"

interface MovieCardProps {
  movie: Movie
}

export function MovieCard({ movie }: MovieCardProps) {
  const formatRuntime = (minutes: number) => {
    const hours = Math.floor(minutes / 60)
    const mins = minutes % 60
    return `${hours}h ${mins}m`
  }

  return (
    <Card className="overflow-hidden hover:ring-2 hover:ring-primary hover:cursor-pointer transition-all duration-200 group">
      <div className="aspect-[2/3] relative overflow-hidden bg-muted">
        <ImageWithFallback
          src={movie.posterUrl}
          alt={`${movie.title} poster`}
        />
      </div>
      <CardContent className="p-4">
        <h3 className="font-semibold text-lg leading-tight mb-2 line-clamp-2 text-balance">{movie.title}</h3>

        <div className="flex items-center gap-3 mb-3 text-sm text-muted-foreground">
          {movie.year && <span className="font-medium">{movie.year}</span>}
          {movie.runtime && (
            <div className="flex items-center gap-1">
              <Clock className="w-3.5 h-3.5" />
              <span>{formatRuntime(movie.runtime)}</span>
            </div>
          )}
          {movie.imdbRating && (
            <div className="flex items-center gap-1 text-primary">
              <Star className="w-3.5 h-3.5 fill-primary" />
              <span className="font-medium">{movie.imdbRating.toFixed(1)}</span>
            </div>
          )}
        </div>

        {movie.genres && movie.genres.length > 0 && (
          <div className="flex flex-wrap gap-1.5 mb-3">
            {movie.genres.slice(0, 3).map((genre) => (
              <Badge key={genre} variant="secondary" className="text-xs">
                {genre}
              </Badge>
            ))}
          </div>
        )}

        {movie.plot && (
          <Tooltip>
            <TooltipTrigger asChild>
              <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">{movie.plot}</p>
            </TooltipTrigger>
            <TooltipContent
              side="top"
              align="start"
              className="max-w-sm bg-background text-foreground border border-border p-3 rounded-md shadow-lg"
            >
              {movie.plot}
            </TooltipContent>
          </Tooltip>
        )}
      </CardContent>
    </Card>
  )
}
