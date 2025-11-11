import React, { useState, useRef, useEffect } from "react";
import { Share2, MoreVertical, List as ListIcon, Image as ImageIcon } from "lucide-react";

// Tipo MovieT usado nas listas (compatível com App.tsx)
export interface MovieT {
  id: number;
  media?: "movie" | "tv" | "person";
  title: string;
  image?: string;
  poster_path?: string | null;
  rating?: number | null;
  year?: string | null;
  overview?: string;
  voteCount?: number | null;
  [key: string]: any;
}

export interface ListCoverProps {
  /** Nome da lista */
  title: string;
  /** Quantidade de itens na lista */
  itemsCount: number;
  /** URL da imagem da capa (se houver) */
  imageUrl?: string;
  /** Array de posters para gerar mosaico (primeiros 4 itens) */
  fallbackPosters?: Array<{ url: string; alt?: string }>;
  /** Se o usuário pode editar a capa */
  canEdit?: boolean;
  /** Callback quando a capa é alterada */
  onChangeCover?: () => void;
  /** Callback para compartilhar */
  onShare?: () => void;
  /** Callback para mais opções */
  onMore?: () => void;
  /** Focal point da imagem (0-1) */
  focalPoint?: { x: number; y: number };
  /** Modo: 'grid' para card em grid, 'hero' para página de detalhe */
  mode?: "grid" | "hero";
  /** Classe CSS adicional */
  className?: string;
  /** Callback quando a capa é clicada */
  onClick?: () => void;
  /** Se deve mostrar overlay e ações */
  showOverlay?: boolean;
}

/**
 * Componente para exibir capas de listas de forma responsiva e performática
 */
export const ListCover: React.FC<ListCoverProps> = ({
  title,
  itemsCount,
  imageUrl,
  fallbackPosters = [],
  canEdit = false,
  onChangeCover,
  onShare,
  onMore,
  focalPoint,
  mode = "grid",
  className = "",
  onClick,
  showOverlay = true,
}) => {
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const [isInView, setIsInView] = useState(false);
  const imgRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // Lazy loading com IntersectionObserver
  useEffect(() => {
    if (!containerRef.current || imageUrl) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setIsInView(true);
            observer.disconnect();
          }
        });
      },
      { rootMargin: "50px" }
    );

    observer.observe(containerRef.current);

    return () => {
      observer.disconnect();
    };
  }, [imageUrl]);

  // Gerar mosaico 2x2 se não houver imagem e houver posters
  const generateMosaic = () => {
    if (fallbackPosters.length === 0) return null;

    const posters = fallbackPosters.slice(0, 4);
    const gridCols = posters.length <= 2 ? 1 : 2;
    const gridRows = posters.length <= 2 ? 1 : 2;

    return (
      <div
        className="absolute inset-0 grid"
        style={{
          gridTemplateColumns: `repeat(${gridCols}, 1fr)`,
          gridTemplateRows: `repeat(${gridRows}, 1fr)`,
          gap: "1px",
        }}
      >
        {posters.map((poster, idx) => (
          <div
            key={idx}
            className="relative overflow-hidden bg-slate-200 dark:bg-slate-800"
          >
            {isInView || idx === 0 ? (
              <img
                src={poster.url}
                alt={poster.alt || `Poster ${idx + 1}`}
                className="w-full h-full object-cover"
                loading={idx === 0 ? "eager" : "lazy"}
                onError={(e) => {
                  (e.target as HTMLImageElement).style.display = "none";
                }}
              />
            ) : (
              <div className="w-full h-full bg-slate-300 dark:bg-slate-700" />
            )}
          </div>
        ))}
        {/* Preencher espaços vazios se houver menos de 4 posters */}
        {Array.from({ length: 4 - posters.length }).map((_, idx) => (
          <div
            key={`empty-${idx}`}
            className="bg-slate-200 dark:bg-slate-800"
          />
        ))}
      </div>
    );
  };

  // Determinar altura máxima baseado no breakpoint
  const getMaxHeight = () => {
    if (mode === "hero") {
      // Hero: altura máxima responsiva
      return "clamp(240px, 32vh, 320px)";
    }
    // Para grid, altura é controlada pelo aspect-ratio (16:9)
    return undefined;
  };

  // Determinar object-position
  const getObjectPosition = () => {
    if (focalPoint) {
      return `${focalPoint.x * 100}% ${focalPoint.y * 100}%`;
    }
    return "center";
  };

  // Gerar srcset para diferentes resoluções
  const getSrcSet = (url: string) => {
    if (!url || url.startsWith("data:")) return undefined;
    
    // Para TMDb, podemos usar diferentes tamanhos
    if (url.includes("image.tmdb.org")) {
      const baseUrl = url.replace(/\/w\d+/, "");
      return `${baseUrl}/w640 640w, ${baseUrl}/w1280 1280w, ${baseUrl}/w1920 1920w`;
    }
    
    return undefined;
  };

  const hasImage = imageUrl && !imageError;
  const showMosaic = !hasImage && fallbackPosters.length > 0;

  const maxHeight = getMaxHeight();
  
  return (
    <div
      ref={containerRef}
      className={`relative overflow-hidden rounded-xl sm:rounded-2xl bg-gradient-to-br from-slate-200 to-slate-300 dark:from-slate-800 dark:to-slate-900 ${className}`}
      style={{
        aspectRatio: mode === "hero" ? undefined : "16 / 9",
        maxHeight: maxHeight,
        height: mode === "hero" ? maxHeight : undefined,
        width: "100%",
      }}
      onClick={onClick}
      role={onClick ? "button" : "img"}
      aria-label={`Capa da lista "${title}"`}
      tabIndex={onClick ? 0 : undefined}
      onKeyDown={(e) => {
        if (onClick && (e.key === "Enter" || e.key === " ")) {
          e.preventDefault();
          onClick();
        }
      }}
    >
      {/* Skeleton durante carregamento */}
      {!imageLoaded && !showMosaic && !imageError && (
        <div className="absolute inset-0 bg-slate-300 dark:bg-slate-700 animate-pulse" />
      )}

      {/* Imagem da capa */}
      {hasImage && (
        <img
          ref={imgRef}
          src={imageUrl}
          srcSet={getSrcSet(imageUrl)}
          sizes={
            mode === "hero"
              ? "100vw"
              : "(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
          }
          alt={`Capa da lista "${title}"`}
          className={`absolute inset-0 w-full h-full object-cover transition-opacity duration-300 ${
            imageLoaded ? "opacity-100" : "opacity-0"
          }`}
          style={{
            objectPosition: getObjectPosition(),
          }}
          loading={mode === "hero" ? "eager" : "lazy"}
          onLoad={() => setImageLoaded(true)}
          onError={() => {
            setImageError(true);
            setImageLoaded(true);
          }}
        />
      )}

      {/* Mosaico 2x2 */}
      {showMosaic && generateMosaic()}

      {/* Placeholder quando não há imagem nem mosaico */}
      {!hasImage && !showMosaic && (
        <div className="absolute inset-0 flex items-center justify-center">
          <ListIcon
            size={mode === "hero" ? 64 : 48}
            className="text-slate-400 dark:text-slate-600"
            aria-hidden="true"
          />
        </div>
      )}

      {/* Overlay de gradiente - mais sutil para destacar a capa */}
      {showOverlay && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent" />
        </>
      )}

      {/* Conteúdo (título, metadados, ações) */}
      {showOverlay && mode === "grid" && (
        <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4">
          {/* Apenas ações (título e metadados agora estão abaixo da capa) */}
          {(onShare || onMore) && (
            <div className="flex items-center gap-2 justify-end">
              {onShare && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onShare();
                  }}
                  className="p-2 sm:p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full border border-white/20 text-white transition-all focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black/50 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label={`Compartilhar lista "${title}"`}
                  title="Compartilhar"
                >
                  <Share2 size={18} className="sm:w-5 sm:h-5" aria-hidden="true" />
                </button>
              )}
              {onMore && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onMore();
                  }}
                  className="p-2 sm:p-2.5 bg-white/10 hover:bg-white/20 backdrop-blur-sm rounded-full border border-white/20 text-white transition-all focus:outline-none focus:ring-2 focus:ring-white/50 focus:ring-offset-2 focus:ring-offset-black/50 min-w-[44px] min-h-[44px] flex items-center justify-center"
                  aria-label={`Mais opções da lista "${title}"`}
                  title="Mais opções"
                >
                  <MoreVertical size={18} className="sm:w-5 sm:h-5" aria-hidden="true" />
                </button>
              )}
            </div>
          )}
        </div>
      )}
      
      {/* Para modo hero, overlay mínimo (conteúdo será renderizado externamente) */}
      {showOverlay && mode === "hero" && (
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/40 to-transparent pointer-events-none" />
      )}
    </div>
  );
};

/**
 * Função helper para converter poster_path em URL completa do TMDb
 */
function toPosterUrl(posterPath?: string | null): string | undefined {
  if (!posterPath) return undefined;
  if (posterPath.startsWith("http")) return posterPath;
  return `https://image.tmdb.org/t/p/w500${posterPath}`;
}

/**
 * Função helper para obter a URL da capa de uma lista
 */
export function getListCoverImageUrl(
  list: {
    cover?: {
      type: "item" | "upload" | "auto";
      itemId?: string;
      url?: string;
      focalPoint?: { x: number; y: number };
    };
    items: MovieT[];
    updatedAt?: string;
  },
  mediaKey?: (item: MovieT) => string,
  toPosterPath?: (path: string | null | undefined) => string | null
): string | undefined {
  if (!list.cover) {
    // Sem capa definida, retornar undefined para usar mosaico
    return undefined;
  }

  if (list.cover.type === "upload" && list.cover.url) {
    // Adicionar cache busting para uploads também
    const separator = list.cover.url.includes("?") ? "&" : "?";
    const timestamp = list.updatedAt 
      ? new Date(list.updatedAt).getTime() 
      : Date.now();
    return `${list.cover.url}${separator}v=${timestamp}`;
  }

  if (list.cover.type === "item" && list.cover.itemId && list.items.length > 0) {
    const keyFn = mediaKey || ((m: MovieT) => `${m.media || "movie"}-${m.id}`);
    const coverItem = list.items.find(
      (m) => keyFn(m) === list.cover!.itemId || String(m.id) === list.cover!.itemId
    );

    if (coverItem) {
      const posterPath = coverItem.poster_path || coverItem.image;
      let imageUrl: string | undefined;
      
      if (toPosterPath) {
        imageUrl = toPosterPath(posterPath) || undefined;
      } else {
        imageUrl = toPosterUrl(posterPath);
      }

      // Adicionar cache busting usando updatedAt da lista
      if (imageUrl && list.updatedAt) {
        const separator = imageUrl.includes("?") ? "&" : "?";
        const timestamp = new Date(list.updatedAt).getTime();
        return `${imageUrl}${separator}v=${timestamp}`;
      }
      
      return imageUrl;
    }
  }

  // Fallback: melhor avaliado ou primeiro item com poster
  if (list.items.length > 0) {
    const bestRated = list.items
      .filter((m) => m.rating && m.rating >= 7 && (m.poster_path || m.image))
      .sort((a, b) => (b.rating || 0) - (a.rating || 0))[0];

    if (bestRated) {
      const posterPath = bestRated.poster_path || bestRated.image;
      let imageUrl: string | undefined;
      
      if (toPosterPath) {
        imageUrl = toPosterPath(posterPath) || undefined;
      } else {
        imageUrl = toPosterUrl(posterPath);
      }
      
      return imageUrl;
    }

    const firstWithPoster = list.items.find((m) => m.poster_path || m.image);
    if (firstWithPoster) {
      const posterPath = firstWithPoster.poster_path || firstWithPoster.image;
      let imageUrl: string | undefined;
      
      if (toPosterPath) {
        imageUrl = toPosterPath(posterPath) || undefined;
      } else {
        imageUrl = toPosterUrl(posterPath);
      }
      
      return imageUrl;
    }
  }

  return undefined;
}

/**
 * Função helper para obter posters de fallback (primeiros 4 itens)
 */
export function getListFallbackPosters(
  list: { items: MovieT[] },
  maxItems: number = 4,
  toPosterPath?: (path: string | null | undefined) => string | null
): Array<{ url: string; alt?: string }> {
  return list.items
    .slice(0, maxItems)
    .map((item) => {
      const posterPath = item.poster_path || item.image;
      let url = "";
      if (toPosterPath) {
        url = toPosterPath(posterPath) || "";
      } else {
        url = toPosterUrl(posterPath) || "";
      }
      return {
        url,
        alt: item.title,
      };
    })
    .filter((poster) => poster.url);
}

