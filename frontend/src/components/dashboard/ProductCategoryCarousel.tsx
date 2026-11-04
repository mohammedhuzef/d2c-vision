import React, { useRef } from 'react';
import { ChevronRight, ChevronLeft, ArrowRight } from 'lucide-react';

export interface CategoryData {
  id: string;
  name: string;
  tags: string;
  image: string;
  count: string;
  growth: string;
}

export const CATEGORIES: CategoryData[] = [
  {
    id: 'chocolates',
    name: 'Chocolates',
    tags: 'Indulgence, Healthy',
    image: '/images/cat-chocolates.jpg',
    count: '142 Brands',
    growth: '+28%',
  },
  {
    id: 'snacks',
    name: 'Snacks',
    tags: 'Makhana, Nuts, Granola',
    image: '/images/cat-snacks.jpg',
    count: '280 Brands',
    growth: '+35%',
  },
  {
    id: 'beverages',
    name: 'Beverages',
    tags: 'Protein Drink, Herbal Tea',
    image: '/images/cat-beverages.jpg',
    count: '195 Brands',
    growth: '+22%',
  },
  {
    id: 'supplements',
    name: 'Supplements',
    tags: 'Vitamins, Gummies',
    image: '/images/cat-supplements.jpg',
    count: '310 Brands',
    growth: '+41%',
  },
  {
    id: 'personal-care',
    name: 'Personal Care',
    tags: 'Skincare, Haircare',
    image: '/images/cat-personal-care.jpg',
    count: '420 Brands',
    growth: '+32%',
  },
  {
    id: 'home-living',
    name: 'Home & Living',
    tags: 'Aromas, Essentials',
    image: '/images/cat-home.jpg',
    count: '160 Brands',
    growth: '+18%',
  },
  {
    id: 'fashion',
    name: 'Fashion & Apparel',
    tags: 'Clothing, Accessories',
    image: '/images/cat-fashion.jpg',
    count: '540 Brands',
    growth: '+15%',
  },
  {
    id: 'pet-care',
    name: 'Pet Care',
    tags: 'Nutrition, Grooming',
    image: '/images/cat-pet.jpg',
    count: '115 Brands',
    growth: '+46%',
  },
  {
    id: 'electronics',
    name: 'Electronics',
    tags: 'Smart Devices',
    image: '/images/cat-electronics.jpg',
    count: '230 Brands',
    growth: '+27%',
  },
  {
    id: 'stationery',
    name: 'Stationery',
    tags: 'Notebooks, Desk',
    image: '/images/cat-stationery.jpg',
    count: '95 Brands',
    growth: '+12%',
  },
];

export interface ProductCategoryCarouselProps {
  selectedCategory?: string;
  onSelectCategory?: (id: string) => void;
  onViewAll?: () => void;
}

export const ProductCategoryCarousel: React.FC<ProductCategoryCarouselProps> = ({
  selectedCategory = 'chocolates',
  onSelectCategory,
  onViewAll,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollOffset = direction === 'left' ? -280 : 280;
      scrollContainerRef.current.scrollBy({ left: scrollOffset, behavior: 'smooth' });
    }
  };

  return (
    <section className="w-full">
      <div className="rounded-2xl p-4 sm:p-5 bg-white border border-slate-200/90 shadow-xs relative overflow-hidden">
        {/* Carousel Header: Heading & View All Button & Navigation Arrows */}
        <div className="flex items-center justify-between mb-3.5 relative z-10 px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <h2 className="text-sm sm:text-base font-bold text-slate-900 tracking-tight">
              Explore Product Categories
            </h2>
            <span className="hidden sm:inline-block text-[11px] text-slate-500 font-mono-nums">
              (10 Sectors Available)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* View All Action */}
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs font-semibold text-emerald-600 hover:text-emerald-700 transition-colors flex items-center gap-1 cursor-pointer group"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* Scroll Navigation Arrows */}
            <div className="flex items-center gap-1 pl-2 border-l border-slate-200">
              <button
                type="button"
                onClick={() => handleScroll('left')}
                className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer"
                aria-label="Scroll categories left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                className="w-7 h-7 rounded-lg bg-slate-50 hover:bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 flex items-center justify-center transition-all cursor-pointer"
                aria-label="Scroll categories right"
              >
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </div>

        {/* Horizontal Category Cards Strip */}
        <div
          ref={scrollContainerRef}
          className="flex items-center gap-3 overflow-x-auto no-scrollbar scroll-smooth py-1 px-1 relative z-10"
        >
          {CATEGORIES.map((cat) => {
            const isSelected = selectedCategory === cat.id;

            return (
              <div
                key={cat.id}
                onClick={() => onSelectCategory?.(cat.id)}
                className={`relative shrink-0 w-44 sm:w-48 h-28 rounded-xl overflow-hidden cursor-pointer group border transition-all duration-200 select-none shadow-2xs ${
                  isSelected
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20 shadow-sm scale-[1.01]'
                    : 'border-slate-200 hover:border-slate-300 hover:shadow-xs'
                }`}
              >
                {/* Category Photography */}
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300 ease-out brightness-[0.8] group-hover:brightness-[0.9]"
                />

                {/* Growth Badge Top Right */}
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-white/95 backdrop-blur-xs border border-slate-200/80 text-[10px] font-bold text-emerald-700 font-mono-nums shadow-xs">
                  {cat.growth}
                </div>

                {/* Translucent Label Area at Bottom */}
                <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-slate-950/90 via-slate-950/60 to-transparent">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-white tracking-tight truncate">
                      {cat.name}
                    </h3>
                  </div>
                  <p className="text-[10px] text-slate-300 truncate leading-tight font-medium">
                    {cat.tags}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};
