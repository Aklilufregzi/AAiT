import { Movie as TMovie } from "../api/movie/Movie";

export const MOVIE_TITLE_FIELD = "id";

export const MovieTitle = (record: TMovie): string => {
  return record.id || record.id;
};
