"use client"

import { useMemo, useRef, useTransition, useState, useEffect } from "react"
import { usePathname, useRouter, useSearchParams } from "next/navigation"
import { SearchBar } from "./search-bar"
import { GenreFilter } from "./genre-filter"
import { MovieCard } from "./movie-card"
import { PaginationControls } from "./pagination-controls"
import { AlertCircle, Loader2 } from "lucide-react"
import type { GenreSummary, Movie, MovieListResponse } from "@/lib/movies-api"
import { DEFAULT_PAGE_SIZE } from "@/lib/movies-api"

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
  const router = useRouter()
  const searchParams = useSearchParams()
  const pathname = usePathname()

  const queryFromUrl = searchParams.get("search") ?? initialSearch
  const genreFromUrl = searchParams.get("genre") ?? initialGenre
  const pageFromUrl = Number.parseInt(searchParams.get("page") || "", 10)
  const resolvedPage = Number.isNaN(pageFromUrl) || pageFromUrl < 1 ? initialPage : pageFromUrl

  const [movies, setMovies] = useState<Movie[]>(initialMovies)
  const [currentPage, setCurrentPage] = useState(resolvedPage)
  const [totalPages, setTotalPages] = useState(initialTotalPages)
  const [totalResults, setTotalResults] = useState(initialTotal)
  const [searchQuery, setSearchQuery] = useState(queryFromUrl)
  const [selectedGenre, setSelectedGenre] = useState<string | null>(genreFromUrl || null)
  const [isLoading, setIsLoading] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [errorMessage, setErrorMessage] = useState<string | null>(null)
  const abortControllerRef = useRef<AbortController | null>(null)

  const debounceTimerRef = useRef<NodeJS.Timeout | null>(null)

  useEffect(() => {
    return () => {
      debounceTimerRef.current && clearTimeout(debounceTimerRef.current)
      abortControllerRef.current?.abort()
    }
  }, [])

  const updateQueryParams = useMemo(() => {
    return (params: { page?: number; search?: string; genre?: string | null }) => {
      const current = new URLSearchParams(searchParams.toString())

      if (typeof params.page === "number") {
        current.set("page", params.page.toString())
      }

      if (params.search !== undefined) {
        if (params.search.trim()) {
          current.set("search", params.search.trim())
        } else {
          current.delete("search")
        }
      }

      if (params.genre !== undefined) {
        if (params.genre) {
          current.set("genre", params.genre)
        } else {
          current.delete("genre")
        }
      }

      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current)

      debounceTimerRef.current = setTimeout(() => {
        router.replace(`${pathname}?${current.toString()}`, { scroll: false })
      }, 200)
    }
  }, [pathname, router, searchParams])

  const fetchMovies = async (page: number, search: string, genre: string | null) => {
    abortControllerRef.current?.abort()
    const abortController = new AbortController()
    abortControllerRef.current = abortController
    setIsLoading(true)
    try {
      const queryParams = new URLSearchParams({
        page: page.toString(),
        limit: DEFAULT_PAGE_SIZE.toString(),
      })

      if (search.trim()) {
        queryParams.set("search", search.trim())
      }

      if (genre) {
        queryParams.set("genre", genre)
      }

      const response = await fetch(`/api/movies?${queryParams.toString()}`, {
        signal: abortController.signal,
      })

      if (!response.ok) {
        const errorText = await response.text()
        throw new Error(errorText || "Failed to fetch movies")
      }

      const resp: MovieListResponse = await response.json()

      setMovies(resp.data)
      setCurrentPage(resp.page)
      setTotalPages(resp.totalPages)
      setTotalResults(resp.totalMovies)
      setErrorMessage(null)
    } catch (error) {
      if ((error as DOMException).name === "AbortError") {
        return
      }
      console.error("Error fetching movies:", error)
      setErrorMessage(error instanceof Error ? error.message : "Something went wrong")
    } finally {
      setIsLoading(false)
    }
  }

  const handleSearchInputChange = (value: string) => {
    setSearchQuery(value)
  }

  const handleSearch = (query: string) => {
    startTransition(() => {
      updateQueryParams({ page: 1, search: query })
    })
    setCurrentPage(1)
    fetchMovies(1, query, selectedGenre)
  }

  const handleGenreSelect = (genre: string | null) => {
    startTransition(() => {
      updateQueryParams({ page: 1, genre })
    })
    setSelectedGenre(genre)
    setCurrentPage(1)
    fetchMovies(1, searchQuery, genre)
  }

  const handlePageChange = (page: number) => {
    startTransition(() => {
      updateQueryParams({ page })
    })
    fetchMovies(page, searchQuery, selectedGenre)
    window.scrollTo({ top: 0, behavior: "smooth" })
  }

  const showLoader = isLoading || isPending

  return (
    <div className="space-y-8">
      <div className="space-y-6">
        <SearchBar value={searchQuery} onChange={handleSearchInputChange} onSearch={handleSearch} />
        <GenreFilter genres={genres} selectedGenre={selectedGenre} onGenreSelect={handleGenreSelect} />
      </div>

      <div className="space-y-6">
        {errorMessage && (
          <div className="flex items-start gap-3 rounded-md border border-destructive/40 bg-destructive/10 p-4 text-sm text-destructive">
            <AlertCircle className="mt-0.5 h-4 w-4" />
            <div>
              <p className="font-medium">Unable to load movies</p>
              <p className="text-destructive/80">{errorMessage}</p>
            </div>
          </div>
        )}

        {showLoader ? (
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
