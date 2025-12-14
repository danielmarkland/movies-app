"use client"

import { useState } from "react"
import { SearchBar } from "./search-bar"
import { GenreFilter } from "./genre-filter"
import { MovieCard } from "./movie-card"
import { PaginationControls } from "./pagination-controls"
import { Loader2 } from "lucide-react"
import type { GenreSummary, Movie, MovieListResponse } from "@/lib/movies-api"

interface MovieSearchProps {
  initialMovies: Movie[]
  initialPage: number
  initialTotalPages: number
  initialTotal: number
  genres: GenreSummary[]
  initialSearch?: string
  initialGenre?: string
}

export function MovieSearch({
  initialMovies,
  initialPage,
  initialTotalPages,
  initialTotal,
  genres,
  initialSearch = "",
  initialGenre = "",
}: MovieSearchProps) {
  const [movies, setMovies] = useState<Movie[]>(initialMovies)
  const [currentPage, setCurrentPage] = useState(initialPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [totalResults, setTotalResults] = useState(initialTotal)
  const [searchQuery, setSearchQuery] = useState(initialSearch)
  const [selectedGenre, setSelectedGenre] = useState<string | null>(initialGenre || null)
  const [isLoading, setIsLoading] = useState(false)

  const fetchMovies = async (page: number, search: string, genre: string | null) => {
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: "12",
      })

      if (search.trim()) {
        queryParams.set("search", search.trim())
      }

      if (genre) {
        queryParams.set("genre", genre)
      }

      const response = await fetch(`/api/movies?${queryParams.toString()}`)

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Failed to fetch movies")
      }

      const resp: MovieListResponse = await response.json()

      setMovies(resp.data)
      setCurrentPage(resp.page)
      setTotalPages(resp.totalPages)
      setTotalResults(resp.totalMovies)
    } catch (error) {
      console.error("Error fetching movies:", error)
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearch = (query: string) => {
    setSearchQuery(query)
    fetchMovies(1, query, selectedGenre)
  }

  const handleGenreSelect = (genre: string | null) => {
    setSelectedGenre(genre)
    fetchMovies(1, searchQuery, genre)
  }

  const handlePageChange = (page: number) => {
    fetchMovies(page, searchQuery, selectedGenre)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <SearchBar onSearch={handleSearch} defaultValue={searchQuery} />
        <GenreFilter genres={genres} selectedGenre={selectedGenre} onGenreSelect={handleGenreSelect} />
      </div>

      <div className="space-y-6">
        {isLoading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : movies.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-lg text-muted-foreground">No movies found</p>
            <p className="text-sm text-muted-foreground mt-2">Try adjusting your search or filter criteria</p>
          </div>
        ) : (
          <>
            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalResults={totalResults}
              onPageChange={handlePageChange}
            />

            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
              {movies.map((movie) => (
                <MovieCard key={movie.id} movie={movie} />
              ))}
            </div>

            <PaginationControls
              currentPage={currentPage}
              totalPages={totalPages}
              totalResults={totalResults}
              onPageChange={handlePageChange}
            />
          </>
        )}
      </div>
    </div>
  )
}
