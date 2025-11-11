export type MediaT = "movie" | "tv";

export type MovieT = {
  id: number;
  media?: MediaT;
  title: string;
  rating?: number | null;
  voteCount?: number | null;
  year?: string | null;
  image: string;
  overview?: string;
  poster_path?: string | null;
};

export const mediaKey = (m: MovieT) => `${m.media || "movie"}:${m.id}`;

export type UserState = "want" | "watched" | "not_watched" | "abandoned";

export type UserStateMap = Record<
  string, // `${media}:${id}`
  { 
    state?: UserState; 
    rating?: number; 
    description?: string;
    // Cache básico do filme para exibição
    movieCache?: {
      id: number;
      title: string;
      poster_path?: string | null;
      image?: string;
      year?: string | null;
      media?: MediaT;
    };
  }
>;

export type CatState = {
  items: MovieT[];
  page: number;
  totalPages?: number;
  loading: boolean;
  error?: string;
  initialized: boolean;
};

export type UserList = { 
  id: string; 
  name: string; 
  items: MovieT[];
  cover?: {
    type: "item" | "upload" | "auto";
    itemId?: string;
    url?: string;
    focalPoint?: { x: number; y: number };
  };
  updatedAt?: string;
  isPublic?: boolean;
};

export type ApiStatus = "ok" | "falhou" | "carregando";
export type TabKey = "home" | "favorites" | "lists" | "people" | "history" | "stats" | "watchlist";

