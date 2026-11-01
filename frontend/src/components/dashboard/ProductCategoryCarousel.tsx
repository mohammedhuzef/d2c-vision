import React, { useRef } from 'react';
import { ChevronRight, ChevronLeft, ArrowRight, Sparkles, Layers } from 'lucide-react';

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
      <div className="rounded-2xl p-4 sm:p-5 bg-[rgba(20,39,62,0.72)] backdrop-blur-xl border border-[rgba(161,190,230,0.25)] shadow-xl relative overflow-hidden">
        {/* Subtle background ambient glow */}
        <div className="absolute top-0 right-1/3 w-64 h-32 bg-[#278BFF]/10 rounded-full blur-3xl pointer-events-none" />

        {/* Carousel Header: Heading & View All Button & Navigation Arrows */}
        <div className="flex items-center justify-between mb-3.5 relative z-10 px-1">
          <div className="flex items-center gap-2.5">
            <div className="w-2 h-2 rounded-full bg-[#7547FF] shadow-[0_0_8px_#7547FF]" />
            <h2 className="text-sm sm:text-base font-bold text-[#F8FAFF] tracking-tight">
              Explore Product Categories
            </h2>
            <span className="hidden sm:inline-block text-[11px] text-[#9EADC2] font-mono-nums">
              (10 Sectors Available)
            </span>
          </div>

          <div className="flex items-center gap-3">
            {/* View All Action */}
            <button
              type="button"
              onClick={onViewAll}
              className="text-xs font-semibold text-[#25D9E8] hover:text-[#52e7f3] transition-colors flex items-center gap-1 cursor-pointer group"
            >
              <span>View All</span>
              <ArrowRight className="w-3.5 h-3.5 transition-transform group-hover:translate-x-0.5" />
            </button>

            {/* Scroll Navigation Arrows */}
            <div className="flex items-center gap-1 pl-2 border-l border-[rgba(161,190,230,0.2)]">
              <button
                type="button"
                onClick={() => handleScroll('left')}
                className="w-7 h-7 rounded-lg bg-[rgba(8,24,44,0.7)] hover:bg-[rgba(20,39,62,0.9)] border border-[rgba(161,190,230,0.2)] text-[#9EADC2] hover:text-[#F8FAFF] flex items-center justify-center transition-all cursor-pointer"
                aria-label="Scroll categories left"
              >
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button
                type="button"
                onClick={() => handleScroll('right')}
                className="w-7 h-7 rounded-lg bg-[rgba(8,24,44,0.7)] hover:bg-[rgba(20,39,62,0.9)] border border-[rgba(161,190,230,0.2)] text-[#9EADC2] hover:text-[#F8FAFF] flex items-center justify-center transition-all cursor-pointer"
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
                className={`relative shrink-0 w-44 sm:w-48 h-28 rounded-2xl overflow-hidden cursor-pointer group border transition-all duration-300 select-none shadow-md ${
                  isSelected
                    ? 'border-[#25D9E8] ring-2 ring-[#25D9E8]/40 shadow-lg shadow-[#7547FF]/20 scale-[1.02]'
                    : 'border-[rgba(161,190,230,0.22)] hover:border-[rgba(161,190,230,0.45)] hover:scale-[1.01]'
                }`}
              >
                {/* Category Photography */}
                <img
                  src={cat.image}
                  alt={cat.name}
                  className="w-full h-full object-cover object-center group-hover:scale-108 transition-transform duration-500 ease-out brightness-[0.75] group-hover:brightness-[0.9]"
                />

                {/* Growth Badge Top Right */}
                <div className="absolute top-2 right-2 px-1.5 py-0.5 rounded-md bg-[rgba(8,24,44,0.85)] backdrop-blur-md border border-white/[0.1] text-[9.5px] font-bold text-[#28D7A0] font-mono-nums">
                  {cat.growth}
                </div>

                {/* Dark Translucent Label Area at Bottom */}
                <div className="absolute inset-x-0 bottom-0 p-2.5 bg-gradient-to-t from-[#08182C] via-[#08182C]/90 to-transparent backdrop-blur-[2px]">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xs font-bold text-[#F8FAFF] tracking-tight group-hover:text-white truncate">
                      {cat.name}
                    </h3>
                  </div>
                  <p className="text-[10px] text-[#9EADC2] truncate leading-tight font-medium">
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

