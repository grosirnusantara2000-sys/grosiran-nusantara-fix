import React, { useState, useMemo } from 'react';
import { Product, Category } from '../types';
import { ProductCard } from './ProductCard';
import { useApp } from '../context/AppContext';
import { Search, Filter, SlidersHorizontal, ArrowUpDown, FilePlus2, Sparkles } from 'lucide-react';

interface ProductGridProps {
  products: Product[];
  categories: Category[];
  onOpenDetail: (product: Product) => void;
}

export const ProductGrid: React.FC<ProductGridProps> = ({ products, categories, onOpenDetail }) => {
  const {
    searchQuery,
    setSearchQuery,
    selectedCategorySlug,
    setSelectedCategorySlug,
    setCurrentView,
    activeOutletInfo,
  } = useApp();

  const [sortBy, setSortBy] = useState<'featured' | 'price-low' | 'price-high' | 'newest'>('featured');
  const [maxPriceFilter, setMaxPriceFilter] = useState<number>(0);
  const [showFiltersMobile, setShowFiltersMobile] = useState(false);

  // Filtered & Sorted products
  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // Search matching
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        const matchesName = prod.name.toLowerCase().includes(q);
        const matchesDesc = prod.description.toLowerCase().includes(q);
        const matchesCat = prod.categoryName.toLowerCase().includes(q);
        if (!matchesName && !matchesDesc && !matchesCat) return false;
      }

      // Category matching
      if (selectedCategorySlug) {
        const cat = categories.find((c) => c.slug === selectedCategorySlug);
        if (cat && prod.categoryId !== cat.id) return false;
      }

      // Price filter
      if (maxPriceFilter > 0 && prod.wholesalePrice > maxPriceFilter) {
        return false;
      }

      return true;
    }).sort((a, b) => {
      if (sortBy === 'price-low') return a.wholesalePrice - b.wholesalePrice;
      if (sortBy === 'price-high') return b.wholesalePrice - a.wholesalePrice;
      if (sortBy === 'newest') return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
      return (b.featured ? 1 : 0) - (a.featured ? 1 : 0);
    });
  }, [products, categories, searchQuery, selectedCategorySlug, maxPriceFilter, sortBy]);

  const activeCategoryName = categories.find((c) => c.slug === selectedCategorySlug)?.name || 'Semua Produk';

  return (
    <section id="catalog-section" className="py-12 bg-slate-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-6 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider">
              <Sparkles className="w-3.5 h-3.5" />
              <span>Katalog Grosir Resmi – {activeOutletInfo.shortName}</span>
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              {selectedCategorySlug ? activeCategoryName : `Pilihan Komoditas Grosir ${activeOutletInfo.name}`}
            </h2>
            <p className="text-xs sm:text-sm text-slate-500 mt-1">
              Harga partai besar langsung dari toko &amp; konveksi {activeOutletInfo.name} ({activeOutletInfo.city}) dengan jaminan transparansi nota lapak asli.
            </p>
          </div>

          {/* Quick Category Pill Tabs / Filter Controls */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setShowFiltersMobile(!showFiltersMobile)}
              className="md:hidden px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-200 rounded-lg flex items-center gap-1.5 shadow-2xs"
            >
              <SlidersHorizontal className="w-3.5 h-3.5" />
              Filter & Urutkan
            </button>
          </div>
        </div>

        {/* Filter & Search Toolbar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs mb-8">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Search Input */}
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Cari nama barang, mukena, daster, celana..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white text-slate-900"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              {searchQuery && (
                <button
                  onClick={() => setSearchQuery('')}
                  className="absolute right-3 top-2 text-xs text-slate-400 hover:text-slate-600"
                >
                  &times;
                </button>
              )}
            </div>

            {/* Category Select */}
            <div className="flex items-center gap-3">
              <select
                value={selectedCategorySlug || ''}
                onChange={(e) => setSelectedCategorySlug(e.target.value || null)}
                className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900"
              >
                <option value="">Semua Kategori</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.slug}>
                    {c.name}
                  </option>
                ))}
              </select>

              {/* Sort By Select */}
              <div className="flex items-center gap-1.5">
                <ArrowUpDown className="w-3.5 h-3.5 text-slate-400 hidden sm:inline" />
                <select
                  value={sortBy}
                  onChange={(e) => setSortBy(e.target.value as any)}
                  className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900"
                >
                  <option value="featured">Rekomendasi / Unggulan</option>
                  <option value="price-low">Harga Grosir: Terendah</option>
                  <option value="price-high">Harga Grosir: Tertinggi</option>
                  <option value="newest">Produk Terbaru</option>
                </select>
              </div>
            </div>
          </div>

          {/* Active Filter summary */}
          {(selectedCategorySlug || searchQuery || maxPriceFilter > 0) && (
            <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
              <div className="flex items-center gap-2 flex-wrap">
                <span>Filter aktif:</span>
                {selectedCategorySlug && (
                  <span className="text-slate-800 font-semibold">
                    Kategori: {activeCategoryName}
                  </span>
                )}
                {searchQuery && (
                  <span className="text-slate-800 font-semibold">
                    Kata kunci: "{searchQuery}"
                  </span>
                )}
              </div>
              <button
                onClick={() => {
                  setSelectedCategorySlug(null);
                  setSearchQuery('');
                  setMaxPriceFilter(0);
                }}
                className="text-xs text-orange-600 hover:underline font-medium"
              >
                Reset Semua
              </button>
            </div>
          )}
        </div>

        {/* Product Cards Grid */}
        {filteredProducts.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
            {filteredProducts.map((prod) => (
              <ProductCard
                key={prod.id}
                product={prod}
                onOpenDetail={onOpenDetail}
              />
            ))}
          </div>
        ) : (
          /* Friendly Empty State with Mandatory Request Button as per Section E */
          <div className="bg-white rounded-2xl border border-slate-200 p-8 sm:p-12 text-center max-w-2xl mx-auto shadow-sm">
            <div className="w-14 h-14 bg-orange-50 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <FilePlus2 className="w-7 h-7" />
            </div>
            <h3 className="text-lg sm:text-xl font-bold text-slate-900 mb-2">
              Barang yang Anda cari belum tersedia di katalog?
            </h3>
            <p className="text-sm text-slate-600 leading-relaxed mb-6">
              Jangan khawatir! Tim sourcing Grosir Nusantara berada langsung di sentra grosir {activeOutletInfo.name}. Kami siap membantu mencarikannya langsung ke ribuan lapak pedagang, memotretkan sampel fisik, dan mendapatkan harga grosir termurah untuk Anda.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-3">
              <button
                onClick={() => {
                  setCurrentView('request');
                  window.scrollTo({ top: 0, behavior: 'smooth' });
                }}
                className="w-full sm:w-auto px-6 py-3 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <FilePlus2 className="w-4 h-4" />
                REQUEST BARANG SEKARANG
              </button>
              <button
                onClick={() => {
                  setSearchQuery('');
                  setSelectedCategorySlug(null);
                }}
                className="w-full sm:w-auto px-5 py-3 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer"
              >
                Lihat Semua Produk
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
};
