import { Movie, TVShow, Credits, SeasonDetails, MediaItem } from '@/types';

const BASE_URL = process.env.NEXT_PUBLIC_TMDB_BASE_URL;
const TOKEN = process.env.NEXT_PUBLIC_TMDB_TOKEN;
const IMAGE_BASE = process.env.NEXT_PUBLIC_IMAGE_BASE;
const VIDKING_BASE = process.env.NEXT_PUBLIC_VIDKING_BASE;

async function fetchTMDB<T>(
  endpoint: string,
  params?: Record<string, string>,
  revalidate = 3600
): Promise<T> {
  const url = new URL(`${BASE_URL}${endpoint}`);
  if (params) {
    Object.entries(params).forEach(([k, v]) => url.searchParams.set(k, v));
  }

  const res = await fetch(url.toString(), {
    headers: {
      Authorization: `Bearer ${TOKEN}`,
      'Content-Type': 'application/json',
    },
    next: { revalidate },
  });

  if (!res.ok) throw new Error(`TMDB ${res.status}: ${endpoint}`);
  return res.json();
}

export async function getTrendingMovies(): Promise<Movie[]> {
  const data = await fetchTMDB<{ results: Movie[] }>('/trending/movie/week');
  return data.results;
}

export async function getTrendingTV(): Promise<TVShow[]> {
  const data = await fetchTMDB<{ results: TVShow[] }>('/trending/tv/week');
  return data.results;
}

export async function getTopRatedMovies(): Promise<Movie[]> {
  const data = await fetchTMDB<{ results: Movie[] }>('/movie/top_rated');
  return data.results;
}

export async function getPopularTV(): Promise<TVShow[]> {
  const data = await fetchTMDB<{ results: TVShow[] }>('/tv/popular');
  return data.results;
}

export async function searchMulti(query: string): Promise<MediaItem[]> {
  const data = await fetchTMDB<{ results: MediaItem[] }>(
    '/search/multi',
    { query },
    0
  );
  return data.results.filter(
    (item) => item.media_type === 'movie' || item.media_type === 'tv'
  );
}

export async function getMovie(id: number): Promise<Movie> {
  return fetchTMDB<Movie>(`/movie/${id}`);
}

export async function getMovieCredits(id: number): Promise<Credits> {
  return fetchTMDB<Credits>(`/movie/${id}/credits`);
}

export async function getSimilarMovies(id: number): Promise<Movie[]> {
  const data = await fetchTMDB<{ results: Movie[] }>(`/movie/${id}/similar`);
  return data.results;
}

export async function getTVShow(id: number): Promise<TVShow> {
  return fetchTMDB<TVShow>(`/tv/${id}`);
}

export async function getTVCredits(id: number): Promise<Credits> {
  return fetchTMDB<Credits>(`/tv/${id}/credits`);
}

export async function getTVSeason(
  id: number,
  seasonNumber: number
): Promise<SeasonDetails> {
  return fetchTMDB<SeasonDetails>(`/tv/${id}/season/${seasonNumber}`);
}

export async function getSimilarTV(id: number): Promise<TVShow[]> {
  const data = await fetchTMDB<{ results: TVShow[] }>(`/tv/${id}/similar`);
  return data.results;
}

export function getImageUrl(path: string | null, size = 'w500'): string {
  if (!path) return '';
  return `${IMAGE_BASE}${size}${path}`;
}

export function getPlayerUrl(
  type: 'movie' | 'tv',
  id: number,
  season?: number,
  episode?: number
): string {
  const params = '?color=e50914&autoPlay=true&nextEpisode=true&episodeSelector=true';
  if (type === 'movie') return `${VIDKING_BASE}/movie/${id}${params}`;
  return `${VIDKING_BASE}/tv/${id}/${season}/${episode}${params}`;
}
