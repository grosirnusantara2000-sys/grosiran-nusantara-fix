import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { Category } from '../types';
import {
  Sparkles,
  Shirt,
  UserCheck,
  Smile,
  ShoppingBag,
  Footprints,
  Layers,
  Home,
  Package,
  ArrowRight,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

interface CategoryGridProps {
  categories: Category[];
  initialLimit?: number;
}

export const CategoryGrid: React.FC<CategoryGridProps> = ({ categories, initialLimit = 3 }) => {
  const { setSelectedCategorySlug, setCurrentView, activeOutletInfo } = useApp();
  const [showAll, setShowAll] = useState(false);

  const getIcon = (iconName: string) => {
    switch (iconName) {
      case 'Sparkles':
        return <Sparkles className="w-5 h-5 text-orange-600" />;
      case 'Shirt':
        return <Shirt className="w-5 h-5 text-blue-900" />;
      case 'UserCheck':
        return <UserCheck className="w-5 h-5 text-slate-800" />;
      case 'Smile':
        return <Smile className="w-5 h-5 text-pink-600" />;
      case 'ShoppingBag':
        return <ShoppingBag className="w-5 h-5 text-amber-600" />;
      case 'Footprints':
        return <Footprints className="w-5 h-5 text-emerald-700" />;
      case 'Layers':
        return <Layers className="w-5 h-5 text-purple-700" />;
      case 'Home':
        return <Home className="w-5 h-5 text-teal-700" />;
      default:
        return <Package className="w-5 h-5 text-slate-700" />;
    }
  };

  const handleSelectCategory = (slug: string) => {
    setSelectedCategorySlug(slug);
    setCurrentView('catalog');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const displayedCategories = showAll ? categories : categories.slice(0, initialLimit);
  const remainingCount = Math.max(0, categories.length - initialLimit);

  return (
    <section className="py-10 sm:py-12 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-7 gap-4">
          <div>
            <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
              Kategori Grosir Populer – {activeOutletInfo.shortName}
            </span>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Pilihan Komoditas {activeOutletInfo.name}
            </h2>
            <p className="text-sm text-slate-600 mt-1">
              Pilih aneka kategori produk grosir tangan pertama langsung dari sentra {activeOutletInfo.shortName} ({activeOutletInfo.city}).
            </p>
          </div>
          <button
            onClick={() => {
              setSelectedCategorySlug(null);
              setCurrentView('catalog');
            }}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-900 hover:text-orange-600 transition-colors cursor-pointer group self-start md:self-auto"
          >
            Lihat Semua Kategori
            <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" />
          </button>
        </div>

        {/* 3 Main Category Cards (Spacious & Clean Layout) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
          {displayedCategories.map((cat) => (
            <div
              key={cat.id}
              onClick={() => handleSelectCategory(cat.slug)}
              className="group p-5 bg-white hover:bg-slate-50/70 rounded-2xl border border-slate-200/90 hover:border-blue-900/40 hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between"
            >
              <div>
                <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-150 flex items-center justify-center mb-4 shadow-2xs group-hover:scale-105 transition-transform">
                  {getIcon(cat.iconName)}
                </div>
                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-900 transition-colors">
                  {cat.name}
                </h3>
                <p className="text-xs text-slate-500 mt-1.5 line-clamp-2 leading-relaxed">
                  {cat.description}
                </p>
              </div>

              <div className="mt-5 pt-3.5 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                <span className="font-mono-nums font-semibold text-slate-600">
                  {cat.productCount || 30}+ Item
                </span>
                <span className="text-orange-600 font-bold group-hover:translate-x-1 transition-transform inline-flex items-center gap-1">
                  Pilih &rarr;
                </span>
              </div>
            </div>
          ))}
        </div>

        {/* "More" / "Lihat Kategori Lainnya" Clean Button Toggle */}
        {remainingCount > 0 && (
          <div className="mt-7 flex flex-col items-center justify-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 hover:text-blue-900 text-xs font-bold transition-all shadow-2xs cursor-pointer active:scale-95"
            >
              {showAll ? (
                <>
                  <ChevronUp className="w-4 h-4 text-slate-500" />
                  <span>Sembunyikan (Tampilkan 3 Kategori Utama Saja)</span>
                </>
              ) : (
                <>
                  <ChevronDown className="w-4 h-4 text-orange-600" />
                  <span>Lihat Kategori Lainnya (More)</span>
                  <span className="px-2 py-0.5 rounded-full bg-orange-100 text-orange-700 text-[10px] font-extrabold">
                    +{remainingCount} Kategori
                  </span>
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-400 mt-2">
              {showAll
                ? 'Menampilkan semua 9 kategori komoditas grosir Aur Kuning'
                : 'Tampilan disederhanakan untuk pengalaman belanja yang lebih cepat'}
            </p>
          </div>
        )}
      </div>
    </section>
  );
};

