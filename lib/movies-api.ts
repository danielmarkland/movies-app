const BASE_URL = "https://0kadddxyh3.execute-api.us-east-1.amazonaws.com"

let cachedToken: string | null = null
let tokenExpiry = 0

export async function getAuthToken(): Promise<string|null> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }

  try {
    const response = await fetch(`${BASE_URL}/auth/token`)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch auth token: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    cachedToken = data.token
    tokenExpiry = Date.now() + 50 * 60 * 1000 // Cache for 50 minutes

    return cachedToken
  } catch (error) {
    console.error("Auth token error:", error)
    throw error
  }
}

export interface Movie {
  id: string
  title: string
  year: number
  runtime: number
  genres: string[]
  director: string
  actors: string
  plot: string
  posterUrl: string
  imdbRating?: number
  imdbVotes?: number
}

export interface MoviesResponse {
  page: number
  per_page: number
  total: number
  total_pages: number
  data: Movie[]
}

export interface GenreStats {
  id: string
  name: string
  count: number
}

export async function searchMovies(params: {
  page?: number
  limit?: number
  search?: string
  genre?: string
}): Promise<MoviesResponse> {
  try {
    const token = await getAuthToken()

    const queryParams = new URLSearchParams()

    if (params.page) queryParams.append("page", params.page.toString())
    if (params.limit) queryParams.append("limit", params.limit.toString())
    if (params.search) queryParams.append("search", params.search)
    if (params.genre) queryParams.append("genre", params.genre)

    const url = `${BASE_URL}/movies?${queryParams.toString()}`

    const response = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
      cache: "no-store",
    })

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch movies: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error("Search movies error:", error)
    throw error
  }
}

export async function getGenres(): Promise<GenreStats[]> {
  const token = await getAuthToken()
  const response = await fetch(`${BASE_URL}/genres/movies`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
    next: { revalidate: 3600 }, // Cache genres for 1 hour
  })

  if (!response.ok) {
    throw new Error("Failed to fetch genres")
  }

  const data = await response.json()

  // Extract unique genres with counts
  const genreMap = new Map<string, number>()

  for (const [genre, movieIds] of Object.entries(data)) {
    if (Array.isArray(movieIds)) {
      genreMap.set(genre, movieIds.length)
    }
  }

  return Array.from(genreMap.entries())
    .map(([name, count]) => ({ id: name, name, count }))
    .sort((a, b) => b.count - a.count)
}