const BASE_URL = "https://0kadddxyh3.execute-api.us-east-1.amazonaws.com"
const AUTH_TOKEN_URL = `${BASE_URL}/auth/token`
const GRAPHQL_URL = `${BASE_URL}/graphql`
export const DEFAULT_PAGE_SIZE = 12
export const TOKEN_TTL_MS = 30 * 60 * 1000

let cachedToken: string | null = null
let tokenExpiry = 0

export interface Movie {
  id: string
  title: string
  year?: number
  runtime?: number
  genres: string[]
  director?: string
  actors?: string
  plot?: string
  posterUrl?: string
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
  data: Genre[]
  totalPages: number
}

async function getAuthToken(): Promise<string|null> {
  if (cachedToken && Date.now() < tokenExpiry) {
    return cachedToken
  }

  try {
    const response = await fetch(AUTH_TOKEN_URL)

    if (!response.ok) {
      const errorText = await response.text()
      throw new Error(`Failed to fetch auth token: ${response.status} ${errorText}`)
    }

    const data = await response.json()
    cachedToken = data.token
    tokenExpiry = Date.now() + TOKEN_TTL_MS

    return cachedToken
  } catch (error) {
    console.error("Auth token error:", error)
    throw error
  }
}

async function fetchWithAuth(
  input: RequestInfo | URL,
  init: RequestInit = {},
) {
  //
  const buildRequestInit = async () => {
    const headers = new Headers(init.headers)
    const token = await getAuthToken()

    if (token) {
      headers.set("Authorization", `Bearer ${token}`)
    }

    return {
      ...init,
      headers,
    }
  }

  try {
    const response = await fetch(input, await buildRequestInit())

    if (response.status === 401) {
      cachedToken = null
      tokenExpiry = 0
      const retryResponse = await fetch(input, await buildRequestInit())

      if (retryResponse.status === 401) {
        throw new Error("Authentication failed after token refresh")
      }

      return retryResponse
    }

    return response
  } catch (error) {
    console.error("Authentication error:", error)
    throw error
  }
}

interface GraphQLResponse<T> {
  data?: T
  errors?: { message: string }[]
}

interface GraphQLPagination {
  page: number
  perPage: number
  totalPages: number
}

interface GraphQLGenreConnection {
  nodes: Genre[]
  pagination: GraphQLPagination
}

interface GraphQLMovieGenre {
  id: string
  title: string
}

interface GraphQLMovie {
  id: string
  title: string
  posterUrl: string | null
  summary: string | null
  duration: string | null
  directors: string[] | null
  mainActors: string[] | null
  datePublished: string | null
  ratingValue: number | null
  genres: GraphQLMovieGenre[] | null
}

interface GraphQLMovieConnection {
  nodes: GraphQLMovie[]
  pagination: GraphQLPagination
}

async function executeGraphQL<T>(
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  try {
    const cleanedVariables =
      variables && Object.keys(variables).length > 0 ? variables : undefined

    const response = await fetchWithAuth(GRAPHQL_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        query,
        variables: cleanedVariables,
      }),
    })

    const result = (await response.json()) as GraphQLResponse<T>

    if (!response.ok || result.errors?.length) {
      const messages =
        result.errors?.map((error) => error.message).join(", ") ?? response.statusText
      throw new Error(`GraphQL request failed: ${messages}`)
    }

    if (!result.data) {
      throw new Error("GraphQL response was missing data")
    }

    return result.data
  } catch (error) {
    console.error("GraphQL request error:", error)
    throw error
  }
}

const MOVIE_LIST_QUERY = `
  query SearchMovies($pagination: PaginationInput, $where: MovieFilterInput) {
    movies(pagination: $pagination, where: $where) {
      pagination {
        page
        perPage
        totalPages
      }
      nodes {
        id
        title
        posterUrl
        summary
        duration
        directors
        mainActors
        datePublished
        ratingValue
        genres {
          id
          title
        }
      }
    }
  }
`

const GENRES_QUERY = `
  query Genres($pagination: PaginationInput) {
    genres(pagination: $pagination) {
      pagination {
        page
        perPage
        totalPages
      }
      nodes {
        id
        title
        movies {
          id
        }
      }
    }
  }
`

function buildMovieQueryVariables(params: {
  page?: number
  limit?: number
  search?: string
  genre?: string
}) {
  const pagination: Record<string, number> = {}
  const where: Record<string, string> = {}

  if (typeof params.page === "number") {
    pagination.page = params.page
  }
  if (typeof params.limit === "number") {
    pagination.perPage = params.limit
  }
  if (params.search) {
    where.search = params.search
  }
  if (params.genre) {
    where.genre = params.genre
  }

  return {
    ...(Object.keys(pagination).length > 0 ? { pagination } : {}),
    ...(Object.keys(where).length > 0 ? { where } : {}),
  }
}

function parseDurationToMinutes(duration: string | null): number | undefined {
  if (!duration) {
    return undefined
  }

  const match = duration.match(/^PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?$/)
  if (!match) {
    return undefined
  }

  const [, hours, minutes, seconds] = match
  const hoursInMinutes = hours ? Number.parseInt(hours, 10) * 60 : 0
  const mins = minutes ? Number.parseInt(minutes, 10) : 0
  const secs = seconds ? Number.parseInt(seconds, 10) : 0
  const totalMinutes = hoursInMinutes + mins + Math.round(secs / 60)

  return totalMinutes > 0 ? totalMinutes : undefined
}

function mapGraphQLMovie(movie: GraphQLMovie): Movie {
  const parsedYear = movie.datePublished
    ? Number.parseInt(movie.datePublished.substring(0, 4), 10)
    : undefined
  const year =
    typeof parsedYear === "number" && !Number.isNaN(parsedYear) ? parsedYear : undefined
  const runtime = parseDurationToMinutes(movie.duration)

  return {
    id: movie.id,
    title: movie.title,
    year,
    runtime,
    genres: movie.genres?.map((genre) => genre.title) ?? [],
    director: movie.directors?.length ? movie.directors.join(", ") : undefined,
    actors: movie.mainActors?.length ? movie.mainActors.join(", ") : undefined,
    plot: movie.summary ?? undefined,
    posterUrl: movie.posterUrl ?? undefined,
    imdbRating: movie.ratingValue ?? undefined,
    imdbVotes: undefined,
  }
}

async function fetchMovieConnection(params: {
  page?: number
  limit?: number
  search?: string
  genre?: string
}): Promise<GraphQLMovieConnection> {
  const variables = buildMovieQueryVariables(params)
  const { movies } = await executeGraphQL<{ movies: GraphQLMovieConnection }>(
    MOVIE_LIST_QUERY,
    variables,
  )

  return movies
}

async function calculateTotalMovies(
  params: {
    page?: number
    limit?: number
    search?: string
    genre?: string
  },
  pagination: GraphQLPagination,
  currentPageCount: number,
): Promise<number> {
  if (pagination.totalPages <= 1) {
    return currentPageCount
  }

  if (pagination.page === pagination.totalPages) {
    return (pagination.totalPages - 1) * pagination.perPage + currentPageCount
  }

  const lastPageConnection = await fetchMovieConnection({
    ...params,
    page: pagination.totalPages,
    limit: pagination.perPage,
  })

  return (
    (pagination.totalPages - 1) * pagination.perPage + lastPageConnection.nodes.length
  )
}

async function searchMovies(params: {
  page?: number
  limit?: number
  search?: string
  genre?: string
}): Promise<MovieSearchResponse> {
  try {
    const connection = await fetchMovieConnection(params)
    const movies = connection.nodes.map(mapGraphQLMovie)

    return {
      totalPages: connection.pagination.totalPages,
      data: movies,
    }
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
  try {
    const connection = await fetchMovieConnection(params)
    const movies = connection.nodes.map(mapGraphQLMovie)
    const totalMovies = await calculateTotalMovies(
      params,
      connection.pagination,
      movies.length,
    )

    return {
      page: connection.pagination.page,
      totalPages: connection.pagination.totalPages,
      totalMovies,
      data: movies,
    }
  } catch (error) {
    console.error("Get movie list error:", error)
    throw error
  }
}

async function getGenres(): Promise<GenresResponse> {
  try {
    const { genres } = await executeGraphQL<{ genres: GraphQLGenreConnection }>(
      GENRES_QUERY,
    )

    return {
      data: genres.nodes,
      totalPages: genres.pagination.totalPages,
    }
  } catch (error) {
    console.error("Get genres error:", error)
    throw error
  }
}

export async function getGenreSummary(): Promise<GenreSummary[]> {
  try {
    const genreResponse = await getGenres()

    const genreSummaries: GenreSummary[] = genreResponse.data.map(
      g => ({
        id: g.id,
        title: g.title,
        movieCount: g.movies.length
      })
    )

    return genreSummaries
  }
  catch (error) {
    console.error("Search movies error:", error)
    throw error
  }
}

export const __testables = {
  parseDurationToMinutes,
  mapGraphQLMovie,
  buildMovieQueryVariables,
}
