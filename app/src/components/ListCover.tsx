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
  
  // Resetar estados quando imageUrl mudar para forçar recarregamento
  useEffect(() => {
    if (imageUrl) {
      setImageLoaded(false);
      setImageError(false);
    } else {
      setImageLoaded(false);
      setImageError(false);
    }
  }, [imageUrl]);

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
      try {
        // Remover query string se existir
        const urlWithoutQuery = url.split("?")[0];
        // Extrair o caminho base (remover /w\d+)
        const baseUrl = urlWithoutQuery.replace(/\/w\d+/, "");
        // Preservar query string se existir
        const queryString = url.includes("?") ? url.split("?")[1] : "";
        const query = queryString ? `?${queryString}` : "";
        return `${baseUrl}/w640${query} 640w, ${baseUrl}/w1280${query} 1280w, ${baseUrl}/w1920${query} 1920w`;
      } catch (error) {
        console.error("[ListCover] Erro ao gerar srcSet:", error);
        return undefined;
      }
    }
    
    return undefined;
  };

  // hasImage deve ser true se imageUrl existe, independente de imageError inicial
  const hasImage = !!imageUrl; // Simplificar: se tem URL, tem imagem
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
      {/* Skeleton durante carregamento - apenas se não houver imageUrl */}
      {!imageUrl && !imageLoaded && !showMosaic && !imageError && (
        <div className="absolute inset-0 bg-slate-300 dark:bg-slate-700 animate-pulse z-0" />
      )}

      {/* Imagem da capa - abordagem diferente */}
      {imageUrl && (
        <div 
          className="absolute inset-0 z-0"
          style={{
            backgroundImage: `url(${imageUrl})`,
            backgroundSize: 'cover',
            backgroundPosition: getObjectPosition(),
            backgroundRepeat: 'no-repeat',
            opacity: imageLoaded ? 1 : 0.95,
            transition: 'opacity 0.3s ease-in-out'
          }}
        >
          {/* Imagem invisível para forçar carregamento e detectar onLoad/onError */}
          <img
            key={imageUrl}
            ref={imgRef}
            src={imageUrl}
            alt=""
            className="absolute opacity-0 pointer-events-none"
            style={{ width: '1px', height: '1px' }}
            loading="eager"
            onLoad={() => {
              setImageLoaded(true);
              setImageError(false);
            }}
            onError={() => {
              setImageError(true);
              setImageLoaded(true);
            }}
          />
        </div>
      )}
      

      {/* Mosaico 2x2 */}
      {showMosaic && generateMosaic()}

      {/* Placeholder melhorado quando não há imagem nem mosaico */}
      {!hasImage && !showMosaic && (
        <div className="absolute inset-0 flex flex-col items-center justify-center bg-gradient-to-br from-slate-100 via-slate-200 to-slate-300 dark:from-slate-800 dark:via-slate-900 dark:to-slate-950">
          {/* Padrão decorativo de fundo */}
          <div className="absolute inset-0 opacity-10 dark:opacity-5">
            <div className="absolute inset-0" style={{
              backgroundImage: `repeating-linear-gradient(45deg, transparent, transparent 10px, rgba(0,0,0,0.1) 10px, rgba(0,0,0,0.1) 20px)`,
            }} />
          </div>
          {/* Ícone central com gradiente */}
          <div className="relative z-10 flex flex-col items-center gap-3">
            <div className="p-4 rounded-2xl bg-white/50 dark:bg-slate-800/50 backdrop-blur-sm shadow-lg">
              <ListIcon
                size={mode === "hero" ? 64 : 48}
                className="text-slate-400 dark:text-slate-500"
                aria-hidden="true"
              />
            </div>
            {mode === "grid" && (
              <p className="text-xs font-medium text-slate-500 dark:text-slate-400 text-center px-4">
                Escolha uma capa
              </p>
            )}
          </div>
        </div>
      )}

      {/* Overlay de gradiente - mais sutil para destacar a capa */}
      {showOverlay && (
        <>
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/20 to-transparent z-10" />
        </>
      )}

      {/* Conteúdo (título, metadados, ações) */}
      {showOverlay && mode === "grid" && (
        <div className="absolute inset-0 flex flex-col justify-end p-3 sm:p-4 z-20">
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
function toPosterUrl(posterPath?: string | null, size: "w500" | "w780" | "w1280" | "w1920" = "w780"): string | undefined {
  if (!posterPath) return undefined;
  if (posterPath.startsWith("http")) return posterPath;
  // Para capas de listas, usar w780 (melhor para 16:9, mais rápido que w1280)
  return `https://image.tmdb.org/t/p/${size}${posterPath}`;
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
    const keyFn = mediaKey || ((m: MovieT) => `${m.media || "movie"}:${m.id}`);
    const coverItemId = list.cover.itemId;
    
    // Tentar encontrar o item usando diferentes formatos de comparação
    const coverItem = list.items.find((m) => {
      const itemKey = keyFn(m);
      
      // Comparação direta (formato "movie:123")
      if (itemKey === coverItemId) {
        return true;
      }
      
      // Extrair ID do coverItemId se estiver no formato "movie:123" ou "tv:456"
      if (coverItemId.includes(":")) {
        const [, id] = coverItemId.split(":");
        // Comparar ID e tipo de mídia
        if (String(m.id) === id) {
          const coverMedia = coverItemId.split(":")[0];
          const itemMedia = m.media || "movie";
          if (coverMedia === itemMedia) {
            return true;
          }
        }
      }
      
      // Comparação apenas por ID (fallback)
      if (String(m.id) === coverItemId) {
        return true;
      }
      
      return false;
    });

    if (coverItem) {
      const posterPath = coverItem.poster_path || coverItem.image;
      let imageUrl: string | undefined;
      
      if (toPosterPath) {
        // toPosterPath retorna apenas o caminho relativo, precisamos converter para URL completa
        const relativePath = toPosterPath(posterPath);
        if (relativePath) {
          // Converter caminho relativo para URL completa usando w780 (melhor para 16:9)
          imageUrl = toPosterUrl(relativePath, "w780");
        } else if (posterPath) {
          // Se toPosterPath não conseguiu extrair, tentar usar o posterPath diretamente
          imageUrl = toPosterUrl(posterPath, "w780");
        }
      } else {
        // Para capas de listas, usar w780 (melhor para 16:9, mais rápido que w1280)
        imageUrl = toPosterUrl(posterPath, "w780");
      }
      
      // Adicionar cache busting usando updatedAt da lista (sempre adicionar timestamp)
      let finalImageUrl: string | undefined;
      if (imageUrl) {
        const separator = imageUrl.includes("?") ? "&" : "?";
        const timestamp = list.updatedAt 
          ? new Date(list.updatedAt).getTime() 
          : Date.now();
        finalImageUrl = `${imageUrl}${separator}v=${timestamp}`;
      } else {
        finalImageUrl = imageUrl;
      }
      
      return finalImageUrl;
    } else {
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

