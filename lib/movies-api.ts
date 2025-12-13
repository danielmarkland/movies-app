const BASE_URL = "https://0kadddxyh3.execute-api.us-east-1.amazonaws.com"

let cachedToken: string | null = null
let tokenExpiry = 0

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

export interface MovieSearchResponse {
  totalPages: number
  data: Movie[]
}

export interface MovieListResponse {
  page: number
  totalPages: number
  totalMovies: number
  data: Movie[]
}

export interface Genre {
  id: string
  title: string
  movies: GenreMovie[]
}

export interface GenreMovie {
  id: string
}

export interface GenreSummary {
  id: string
  title: string
  movieCount: number
}

export interface GenresResponse {
  data: Genre[];
  totalPages: number;
}

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

export async function searchMovies(params: {
  page?: number
  limit?: number
  search?: string
  genre?: string
}): Promise<MovieSearchResponse> {
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

export async function getMovieList(params: {
  page?: number
  limit?: number
  search?: string
  genre?: string
}) : Promise<MovieListResponse> {
  const movieSearch = await searchMovies(params);

  //Get total count
  const countParams = params;
  countParams.page = movieSearch.totalPages;

  const movieCountSearch = await searchMovies(countParams);
  const totalMovies = ((movieSearch.totalPages - 1) * params.limit!) + movieCountSearch.data.length;

  return {
    page: params.page!,
    totalPages: movieSearch.totalPages,
    totalMovies: totalMovies,
    data: movieSearch.data
  };
}

export async function getGenres(): Promise<GenresResponse> {
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

  return await response.json()
}

export async function getGenreSummary(): Promise<GenreSummary[]> {
  try {
    const genreResponse = await getGenres();

    const genreSummaries: GenreSummary[] = genreResponse.data.map(
      g => ({
        id: g.id,
        title: g.title,
        movieCount: g.movies.length
      })
    )

    return genreSummaries;
  }
  catch (error) {
    console.error("Search movies error:", error)
    throw error
  }
}