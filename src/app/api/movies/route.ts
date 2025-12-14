import { type NextRequest, NextResponse } from "next/server"
import { getMovieList } from "@/lib/movies-api"

export async function GET(request: NextRequest) {
  try {
    const searchParams = request.nextUrl.searchParams
    const page = Number.parseInt(searchParams.get("page") || "1")
    const limit = Number.parseInt(searchParams.get("limit") || "12")
    const search = searchParams.get("search") || undefined
    const genre = searchParams.get("genre") || undefined

    const data = await getMovieList({ page, limit, search, genre })

    return NextResponse.json(data)
  } catch (error) {
    console.error("API Error:", error instanceof Error ? error.message : error)
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to fetch movies" },
      { status: 500 },
    )
  }
}
