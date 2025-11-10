export type CatKey = "trending" | "popular" | "top_rated" | "now_playing" | "upcoming";

export const CAT_META: Record<CatKey, { title_key: string }> = {
  trending: { title_key: "cat_trending" },
  popular: { title_key: "cat_popular" },
  top_rated: { title_key: "cat_top_rated" },
  now_playing: { title_key: "cat_now_playing" },
  upcoming: { title_key: "cat_upcoming" },
};

export function poster(posterPath: string | null, size: string = "w500"): string {
  if (!posterPath) {
    return "data:image/svg+xml;utf8,\
<svg xmlns='http://www.w3.org/2000/svg' width='500' height='750'>\
<rect width='100%' height='100%' fill='%231f2937'/>\
<text x='50%' y='50%' dominant-baseline='middle' text-anchor='middle' fill='%239ca3af' font-family='sans-serif' font-size='24'>Sem imagem</text>\
</svg>";
  }
  return `https://image.tmdb.org/t/p/${size}${posterPath}`;
}

export const toPosterPath = (url?: string | null): string | null => {
  if (!url) return null;
  const m = String(url).match(/image\.tmdb\.org\/t\/p\/(?:w\d+|original)(\/[^?]+)/);
  return m ? m[1] : null;
};



export function backdrop(backdropPath: string | null, size: string = "w1280"): string {
  if (!backdropPath) {
    return "https://via.placeholder.com/1280x720?text=Sem+imagem";
  }
  return `https://image.tmdb.org/t/p/${size}${backdropPath}`;
}

export function profile(profilePath: string | null, size: string = "w185"): string {
  if (!profilePath) {
    return "https://via.placeholder.com/185x278?text=Sem+foto";
  }
  return `https://image.tmdb.org/t/p/${size}${profilePath}`;
}

export function formatRuntime(minutes: number | null): string {
  if (!minutes || minutes === 0) return "—";
  
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  
  if (hours > 0) {
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  }
  return `${mins}m`;
}


export function extractYear(date: string | null): string | null {
  if (!date) return null;
  return date.slice(0, 4) || null;
}

export function formatDate(date: string | null, locale: string = "pt-BR"): string {
  if (!date) return "—";
  
  try {
    return new Date(date).toLocaleDateString(locale, {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  } catch {
    return date;
  }
}

export function formatCurrency(amount: number | null): string {
  if (!amount || amount === 0) return "—";
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "USD",
    minimumFractionDigits: 0,
  }).format(amount);
}

