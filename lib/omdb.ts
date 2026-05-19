export interface ExternalRatings {
  imdb: string | null;
  rottenTomatoes: string | null;
}

interface OMDBResponse {
  imdbRating?: string;
  Ratings?: Array<{ Source: string; Value: string }>;
  Response: string;
}

export async function getExternalRatings(imdbId: string): Promise<ExternalRatings> {
  const apiKey = process.env.OMDB_API_KEY;
  if (!apiKey || !imdbId) return { imdb: null, rottenTomatoes: null };

  try {
    const res = await fetch(
      `https://www.omdbapi.com/?i=${imdbId}&apikey=${apiKey}`,
      { next: { revalidate: 86400 } }
    );
    if (!res.ok) return { imdb: null, rottenTomatoes: null };
    const data: OMDBResponse = await res.json();
    if (data.Response === 'False') return { imdb: null, rottenTomatoes: null };

    const imdb = data.imdbRating && data.imdbRating !== 'N/A' ? data.imdbRating : null;
    const rt = data.Ratings?.find((r) => r.Source === 'Rotten Tomatoes')?.Value ?? null;
    return { imdb, rottenTomatoes: rt };
  } catch {
    return { imdb: null, rottenTomatoes: null };
  }
}
