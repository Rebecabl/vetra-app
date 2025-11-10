export type Movie = {
  id: number;
  media_type: "movie" | "tv";
  title: string;
  image?: string;
  rating?: number;
  year?: string;
  overview?: string;
};
