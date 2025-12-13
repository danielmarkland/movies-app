import { searchMovies, getGenres, getGenreSummary, getMovieList } from "@/lib/movies-api"
import { MovieSearch } from "@/components/movie-search"
import { Film } from "lucide-react"

export default async function Home() {
  const [moviesData, genres] = await Promise.all([getMovieList({ page: 1, limit: 3 }), getGenreSummary()])
  
  return (
    <div className="min-h-screen">
      <header className="border-b border-border bg-card/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-3">
            <div className="flex items-center justify-center w-10 h-10 rounded-lg bg-primary text-primary-foreground">
              <Film className="w-6 h-6" />
            </div>
            <div>
              <h1 className="text-2xl font-bold tracking-tight text-balance">Movie Search</h1>
              <p className="text-sm text-muted-foreground">Discover your next favorite film</p>
            </div>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <MovieSearch
          initialMovies={moviesData.data}
          initialPage={moviesData.page}
          initialTotalPages={moviesData.totalPages}
          initialTotal={moviesData.totalMovies}
          genres={genres}
        />
      </main>

      <footer className="border-t border-border mt-16">
        <div className="container mx-auto px-4 py-6">
          <p className="text-sm text-muted-foreground text-center">&copy; Movie Data Inc</p>
        </div>
      </footer>
    </div>
  )
}
