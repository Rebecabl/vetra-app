import React, { useRef, useState, useEffect } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HorizontalCarouselProps {
  title: string;
  subtitle?: string;
  items: any[];
  renderItem: (item: any, index: number) => React.ReactNode;
  loading?: boolean;
  className?: string;
  showViewAll?: boolean;
  onViewAll?: () => void;
  limit?: number;
  ariaLabel?: string;
}

export const HorizontalCarousel: React.FC<HorizontalCarouselProps> = ({
  title,
  subtitle,
  items,
  renderItem,
  loading = false,
  className = "",
  showViewAll = false,
  onViewAll,
  limit,
  ariaLabel,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [startX, setStartX] = useState(0);
  const [scrollLeft, setScrollLeft] = useState(0);

  const checkScrollButtons = () => {
    if (!scrollContainerRef.current) return;
    const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
    setCanScrollLeft(scrollLeft > 0);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 10);
  };

  useEffect(() => {
    checkScrollButtons();
    const container = scrollContainerRef.current;
    if (!container) return;

    container.addEventListener("scroll", checkScrollButtons);
    window.addEventListener("resize", checkScrollButtons);

    return () => {
      container.removeEventListener("scroll", checkScrollButtons);
      window.removeEventListener("resize", checkScrollButtons);
    };
  }, [items]);

  const scroll = (direction: "left" | "right") => {
    if (!scrollContainerRef.current) return;
    const container = scrollContainerRef.current;
    const scrollAmount = container.clientWidth * 0.8;
    const targetScroll = direction === "left" 
      ? container.scrollLeft - scrollAmount
      : container.scrollLeft + scrollAmount;
    
    container.scrollTo({
      left: targetScroll,
      behavior: "smooth",
    });
  };

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!scrollContainerRef.current) return;
    setIsDragging(true);
    setStartX(e.pageX - scrollContainerRef.current.offsetLeft);
    setScrollLeft(scrollContainerRef.current.scrollLeft);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !scrollContainerRef.current) return;
    e.preventDefault();
    const x = e.pageX - scrollContainerRef.current.offsetLeft;
    const walk = (x - startX) * 2;
    scrollContainerRef.current.scrollLeft = scrollLeft - walk;
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleMouseLeave = () => {
    setIsDragging(false);
  };

  if (loading && items.length === 0) {
    return (
      <section className={`mb-8 ${className}`}>
        <div className="mb-4">
          <h2 className="text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>
          {subtitle && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{subtitle}</p>}
        </div>
        <div className="flex gap-4 overflow-x-auto scrollbar-hide snap-x snap-mandatory -mx-2 px-2">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="flex-shrink-0 w-32 sm:w-40 md:w-44 lg:w-48 snap-start">
              <div className="aspect-[2/3] bg-slate-200 dark:bg-slate-800 animate-pulse rounded-lg" />
            </div>
          ))}
        </div>
      </section>
    );
  }

  if (items.length === 0) {
    return null;
  }

  const displayItems = limit ? items.slice(0, limit) : items;

  return (
    <section className={`mb-8 ${className}`}>
      {(title || subtitle) && (
        <div className="mb-4">
          {title && <h2 className="text-xl sm:text-2xl font-bold text-slate-900 dark:text-white">{title}</h2>}
          {subtitle && <p className="text-sm text-slate-600 dark:text-slate-400 mt-1">{subtitle}</p>}
        </div>
      )}
      
      <div className="relative group/carousel">
        {/* Botão esquerdo */}
        {canScrollLeft && (
          <button
            onClick={() => scroll("left")}
            className="hidden md:flex absolute left-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white dark:hover:bg-slate-800 transition-all opacity-0 group-hover/carousel:opacity-100"
            aria-label="Scroll left"
          >
            <ChevronLeft size={24} className="text-slate-900 dark:text-white" />
          </button>
        )}

        {/* Container scrollável */}
      <div
        ref={scrollContainerRef}
        className="flex gap-3 md:gap-4 overflow-x-auto scrollbar-hide scroll-smooth pb-4 -mx-2 px-2 snap-x snap-mandatory"
        style={{
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          cursor: isDragging ? "grabbing" : "grab",
          scrollPaddingLeft: "8px",
          scrollPaddingRight: "8px",
        }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseLeave}
        role="region"
        aria-label={ariaLabel || `Carrossel: ${title || "Conteúdo"}`}
      >
          {displayItems.map((item, index) => (
            <div 
              key={`${item.media || "movie"}-${item.id}-${index}`} 
              className="flex-shrink-0 w-32 sm:w-40 md:w-44 lg:w-48 snap-start"
              style={{
                paddingRight: index < items.length - 1 ? "0" : "0",
              }}
            >
              {renderItem(item, index)}
            </div>
          ))}
        </div>

        {/* Botão direito */}
        {canScrollRight && (
          <button
            onClick={() => scroll("right")}
            className="hidden md:flex absolute right-0 top-1/2 -translate-y-1/2 z-10 bg-white/90 dark:bg-slate-800/90 backdrop-blur-sm rounded-full p-2 shadow-lg hover:bg-white dark:hover:bg-slate-800 transition-all opacity-0 group-hover/carousel:opacity-100"
            aria-label="Scroll right"
          >
            <ChevronRight size={24} className="text-slate-900 dark:text-white" />
          </button>
        )}
      </div>

      <style>{`
        .scrollbar-hide::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </section>
  );
};

