import React, { useRef } from 'react';
import { ChevronRight, ChevronLeft, Sparkles, Filter } from 'lucide-react';

export interface CategoryItem {
  id: string;
  name: string;
  image: string;
  count?: string;
}

export const CATEGORIES: CategoryItem[] = [
  { id: 'all', name: 'All Sectors', image: '/images/hero-products.jpg', count: '2.4K Brands' },
  { id: 'chocolates', name: 'Chocolates', image: '/images/cat-chocolates.jpg', count: '142 Brands' },
  { id: 'snacks', name: 'Healthy Snacks', image: '/images/cat-snacks.jpg', count: '280 Brands' },
  { id: 'beverages', name: 'Beverages', image: '/images/cat-beverages.jpg', count: '195 Brands' },
  { id: 'supplements', name: 'Supplements', image: '/images/cat-supplements.jpg', count: '310 Brands' },
  { id: 'personal-care', name: 'Personal Care', image: '/images/cat-personal-care.jpg', count: '420 Brands' },
  { id: 'home-living', name: 'Home & Living', image: '/images/cat-home.jpg', count: '160 Brands' },
  { id: 'fashion', name: 'Apparel', image: '/images/cat-fashion.jpg', count: '540 Brands' },
  { id: 'pet-care', name: 'Pet Care', image: '/images/cat-pet.jpg', count: '115 Brands' },
  { id: 'electronics', name: 'Electronics', image: '/images/cat-electronics.jpg', count: '230 Brands' },
];

export interface CategoryCarouselProps {
  selectedCategory?: string;
  onSelectCategory?: (id: string) => void;
}

export const CategoryCarousel: React.FC<CategoryCarouselProps> = ({
  selectedCategory = 'all',
  onSelectCategory,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const scroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -240 : 240;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

  return (
    <section id="categories" className="py-1">
      <div className="glass-panel rounded-2xl p-3 sm:p-3.5 border border-white/[0.08]">
        {/* Header & Controls */}
        <div className="flex items-center justify-between mb-2.5 px-1">
          <div className="flex items-center gap-2">
            <Filter className="w-3.5 h-3.5 text-indigo-400" />
            <h2 className="text-xs font-bold text-white tracking-tight uppercase tracking-wider">
              D2C Market Sectors
            </h2>
            <span className="text-[10px] text-slate-400 font-mono-nums">
              (10 Sectors Tracked)
            </span>
          </div>

          <div className="flex items-center gap-1.5">
            <button
              type="button"
              onClick={() => scroll('left')}
              className="w-6 h-6 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              onClick={() => scroll('right')}
              className="w-6 h-6 rounded-lg bg-white/[0.04] hover:bg-white/[0.1] border border-white/[0.08] text-slate-300 hover:text-white flex items-center justify-center transition-all cursor-pointer"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Streamlined Horizontal Strip */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-2.5 overflow-x-auto no-scrollbar scroll-smooth py-0.5 px-0.5"
        >
          {CATEGORIES.map((category) => {
            const isSelected = selectedCategory === category.id;
            return (
              <div
                key={category.id}
                onClick={() => onSelectCategory && onSelectCategory(category.id)}
                className={`relative shrink-0 w-28 sm:w-32 h-16 sm:h-18 rounded-xl overflow-hidden cursor-pointer group border transition-all duration-200 select-none ${
                  isSelected
                    ? 'border-indigo-500 ring-2 ring-indigo-500/40 shadow-md shadow-indigo-500/20 scale-[1.02]'
                    : 'border-white/[0.08] hover:border-white/[0.2] hover:bg-white/[0.04]'
                }`}
              >
                {/* Category Photography */}
                <img
                  src={category.image}
                  alt={category.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-500 ease-out opacity-45 group-hover:opacity-60"
                />

                {/* Ambient dark gradient vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-[#080C15] via-[#080C15]/60 to-transparent" />

                {/* Content Overlay */}
                <div className="absolute inset-0 p-2 flex flex-col justify-end">
                  <span className="text-[11px] font-bold text-white tracking-tight leading-tight block truncate">
                    {category.name}
                  </span>
                  <span className="text-[9px] text-slate-400 font-mono-nums block">
                    {category.count}
                  </span>
                </div>

                {isSelected && (
                  <span className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full bg-cyan-400 shadow-[0_0_6px_#22d3ee]" />
                )}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
