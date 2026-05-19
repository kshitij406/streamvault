export interface Genre {
  id: number;
  name: string;
}

export interface Movie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: Genre[];
  runtime?: number;
  tagline?: string;
  status?: string;
  media_type?: 'movie';
  popularity?: number;
}

export interface TVShow {
  id: number;
  name: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  first_air_date: string;
  vote_average: number;
  vote_count: number;
  genre_ids?: number[];
  genres?: Genre[];
  number_of_seasons?: number;
  number_of_episodes?: number;
  seasons?: Season[];
  tagline?: string;
  status?: string;
  media_type?: 'tv';
  popularity?: number;
}

export interface Season {
  id: number;
  season_number: number;
  name: string;
  episode_count: number;
  air_date: string;
  poster_path: string | null;
  overview: string;
}

export interface Episode {
  id: number;
  episode_number: number;
  season_number: number;
  name: string;
  overview: string;
  air_date: string;
  still_path: string | null;
  vote_average: number;
  runtime: number | null;
}

export interface SeasonDetails {
  id: number;
  season_number: number;
  name: string;
  air_date: string;
  overview: string;
  poster_path: string | null;
  episodes: Episode[];
}

export interface Cast {
  id: number;
  name: string;
  character: string;
  profile_path: string | null;
  order: number;
}

export interface CrewMember {
  id: number;
  name: string;
  job: string;
  department: string;
  profile_path: string | null;
}

export interface Credits {
  cast: Cast[];
  crew: CrewMember[];
}

export type MediaItem = (Movie & { media_type: 'movie' }) | (TVShow & { media_type: 'tv' });

export interface WatchlistItem {
  id: number;
  mediaType: 'movie' | 'tv';
  title: string;
  posterPath: string | null;
  year: string;
  rating: number;
  addedAt: number;
}

export interface ProgressData {
  currentTime: number;
  duration: number;
  progress: number;
  season?: number;
  episode?: number;
  updatedAt: number;
}
