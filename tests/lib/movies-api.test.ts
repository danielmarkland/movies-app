import test from "node:test"
import assert from "node:assert/strict"
import { __testables, type Movie } from "../../lib/movies-api"

const { parseDurationToMinutes, mapGraphQLMovie, buildMovieQueryVariables } = __testables

test("parseDurationToMinutes converts ISO durations to minutes", () => {
  assert.equal(parseDurationToMinutes("PT1H30M"), 90)
  assert.equal(parseDurationToMinutes("PT45M"), 45)
  assert.equal(parseDurationToMinutes("PT2H"), 120)
})

test("parseDurationToMinutes returns undefined for invalid input", () => {
  assert.equal(parseDurationToMinutes(null), undefined)
  assert.equal(parseDurationToMinutes("not-a-duration"), undefined)
})

test("mapGraphQLMovie maps optional fields safely", () => {
  const mapped = mapGraphQLMovie({
    id: "movie-1",
    title: "Example",
    posterUrl: null,
    summary: "Summary",
    duration: "PT1H",
    directors: ["Director A", "Director B"],
    mainActors: ["Actor"],
    datePublished: "2020-05-06",
    ratingValue: 7.5,
    genres: [
      { id: "g1", title: "Drama" },
      { id: "g2", title: "Thriller" },
    ],
  } as any)

  const expected: Movie = {
    id: "movie-1",
    title: "Example",
    year: 2020,
    runtime: 60,
    genres: ["Drama", "Thriller"],
    director: "Director A, Director B",
    actors: "Actor",
    plot: "Summary",
    posterUrl: undefined,
    imdbRating: 7.5,
    imdbVotes: undefined,
  }

  assert.deepEqual(mapped, expected)
})

test("buildMovieQueryVariables only includes defined filters", () => {
  const withAll = buildMovieQueryVariables({ page: 2, limit: 20, search: "alien", genre: "Sci-Fi" })
  assert.deepEqual(withAll, {
    pagination: { page: 2, perPage: 20 },
    where: { search: "alien", genre: "Sci-Fi" },
  })

  const withMinimal = buildMovieQueryVariables({ page: undefined, limit: undefined, search: "", genre: "" })
  assert.deepEqual(withMinimal, {})
})
