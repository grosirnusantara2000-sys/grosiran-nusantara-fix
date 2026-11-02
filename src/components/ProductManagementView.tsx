import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import { fetchProducts, fetchCategories, removeProduct, quickUpdateProductPrice, toggleProductStock } from '../services/dataService';
import { Product, Category } from '../types';
import {
  Package,
  Plus,
  Search,
  Filter,
  Edit,
  Trash2,
  Tag,
  CheckCircle2,
  XCircle,
  Save,
  ArrowUpDown,
  Sparkles,
  RefreshCw,
} from 'lucide-react';

export const ProductManagementView: React.FC = () => {
  const {
    showToast,
    triggerRefresh,
    dataVersion,
    setQuickPriceEditProduct,
    setEditingProductModal,
    setIsAddProductModalOpen,
  } = useApp();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'ready' | 'empty'>('all');

  // Inline editing state: { [productId]: { wholesalePrice: number, retailPrice: number } }
  const [inlinePriceMap, setInlinePriceMap] = useState<Record<string, { wholesalePrice: number; retailPrice: number }>>({});
  const [savingId, setSavingId] = useState<string | null>(null);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [prods, cats] = await Promise.all([fetchProducts(), fetchCategories()]);
      setProducts(prods);
      setCategories(cats);

      // Initialize inline price map
      const initialMap: Record<string, { wholesalePrice: number; retailPrice: number }> = {};
      prods.forEach((p) => {
        initialMap[p.id] = { wholesalePrice: p.wholesalePrice, retailPrice: p.retailPrice || p.price };
      });
      setInlinePriceMap(initialMap);
    } catch (err) {
      console.error('Error loading products:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dataVersion]);

  const filteredProducts = useMemo(() => {
    return products.filter((prod) => {
      // Search
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase();
        if (
          !prod.name.toLowerCase().includes(q) &&
          !prod.categoryName.toLowerCase().includes(q) &&
          !prod.description.toLowerCase().includes(q)
        ) {
          return false;
        }
      }

      // Category filter
      if (selectedCategory !== 'all' && prod.categoryId !== selectedCategory) {
        return false;
      }

      // Stock filter
      if (stockFilter === 'ready' && !prod.inStock) return false;
      if (stockFilter === 'empty' && prod.inStock) return false;

      return true;
    });
  }, [products, searchQuery, selectedCategory, stockFilter]);

  const formatRupiah = (num: number) => 'Rp ' + (num || 0).toLocaleString('id-ID');

  // Handle inline price change input
  const handlePriceChange = (productId: string, field: 'wholesalePrice' | 'retailPrice', val: number) => {
    setInlinePriceMap((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || { wholesalePrice: 0, retailPrice: 0 }),
        [field]: val,
      },
    }));
  };

  // Save inline price
  const handleSaveInlinePrice = async (prod: Product) => {
    const prices = inlinePriceMap[prod.id];
    if (!prices) return;

    if (prices.wholesalePrice <= 0) {
      showToast('Harga grosir harus lebih dari 0', 'error');
      return;
    }

    setSavingId(prod.id);
    try {
      await quickUpdateProductPrice(prod.id, prices.wholesalePrice, 0, prices.retailPrice);
      showToast(`Harga "${prod.name}" berhasil diubah!`, 'success');
      triggerRefresh();
    } catch (err: any) {
      showToast('Gagal update harga: ' + err.message, 'error');
    } finally {
      setSavingId(null);
    }
  };

  // Toggle stock
  const handleToggleStock = async (prod: Product) => {
    const nextState = !prod.inStock;
    try {
      await toggleProductStock(prod.id, nextState);
      showToast(`Status stok "${prod.name}" diubah jadi ${nextState ? 'Ready' : 'Habis'}`, 'info');
      triggerRefresh();
    } catch (err: any) {
      showToast('Gagal mengubah stok', 'error');
    }
  };

  // Delete product
  const handleDelete = async (prod: Product) => {
    if (!window.confirm(`Hapus produk "${prod.name}" dari katalog?`)) return;
    try {
      await removeProduct(prod.id);
      showToast(`Produk "${prod.name}" berhasil dihapus`, 'info');
      triggerRefresh();
    } catch (err: any) {
      showToast('Gagal menghapus produk', 'error');
    }
  };

  const totalProducts = products.length;
  const readyProducts = products.filter((p) => p.inStock).length;
  const averageWholesale = products.length > 0 ? Math.round(products.reduce((s, p) => s + p.wholesalePrice, 0) / products.length) : 0;

  return (
    <section className="py-10 bg-slate-50 min-h-[90vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b border-slate-200 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-wider">
              <Tag className="w-4 h-4" />
              <span>Panel Manajemen Produk Owner</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
              Kelola &amp; Ubah Harga Produk Grosir
            </h1>
            <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
              Atur harga grosir dan eceran, perbarui ketersediaan stok, atau tambahkan komoditas baru ke katalog Grosir Nusantara
            </p>
          </div>

          <div className="flex items-center gap-2.5">
            <button
              onClick={() => setIsAddProductModalOpen(true)}
              className="px-4 py-2.5 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-xl flex items-center gap-2 shadow-sm cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4" />
              <span>Tambah Produk Baru</span>
            </button>
            <button
              onClick={loadData}
              className="p-2.5 text-slate-600 hover:text-slate-900 bg-white border border-slate-200 rounded-xl shadow-2xs cursor-pointer hover:bg-slate-50 transition-colors"
              title="Segarkan Data"
            >
              <RefreshCw className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Total Produk Katalog
            </span>
            <div className="text-xl font-extrabold font-mono-nums text-slate-900 mt-1">
              {totalProducts} <span className="text-xs font-normal text-slate-500 font-sans">Item</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Ready Stok
            </span>
            <div className="text-xl font-extrabold font-mono-nums text-emerald-600 mt-1">
              {readyProducts} <span className="text-xs font-normal text-slate-500 font-sans">Item</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Stok Kosong
            </span>
            <div className="text-xl font-extrabold font-mono-nums text-red-600 mt-1">
              {totalProducts - readyProducts} <span className="text-xs font-normal text-slate-500 font-sans">Item</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider block">
              Rata-rata Harga Grosir
            </span>
            <div className="text-xl font-extrabold font-mono-nums text-blue-900 mt-1">
              {formatRupiah(averageWholesale)} <span className="text-xs font-normal text-slate-500 font-sans">/pcs</span>
            </div>
          </div>
        </div>

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Cari nama produk, mukena, daster, celana..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-4 py-2 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white text-slate-900"
            />
            <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
          </div>

          <div className="flex items-center gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="all">Semua Kategori</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="py-2 px-3 text-xs bg-slate-50 border border-slate-200 rounded-lg text-slate-800 focus:outline-none focus:ring-2 focus:ring-blue-900"
            >
              <option value="all">Semua Status Stok</option>
              <option value="ready">Ready Lapak</option>
              <option value="empty">Stok Kosong</option>
            </select>
          </div>
        </div>

        {/* Products Table with Inline Price Editing */}
        <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-600 uppercase text-[10px] font-bold">
                <tr>
                  <th className="py-3 px-4">Foto</th>
                  <th className="py-3 px-4">Nama Produk</th>
                  <th className="py-3 px-4">Kategori & Min.</th>
                  <th className="py-3 px-4 w-44">Harga Grosir Lapak</th>
                  <th className="py-3 px-4 w-36">Harga Eceran</th>
                  <th className="py-3 px-4">Harga Grosir Tampil</th>
                  <th className="py-3 px-4 text-center">Status Stok</th>
                  <th className="py-3 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-800">
                {filteredProducts.map((prod) => {
                  const currentPrices = inlinePriceMap[prod.id] || {
                    wholesalePrice: prod.wholesalePrice,
                    retailPrice: prod.retailPrice || prod.price,
                  };
                  const isModified =
                    currentPrices.wholesalePrice !== prod.wholesalePrice ||
                    currentPrices.retailPrice !== (prod.retailPrice || prod.price);
                  const isSavingThis = savingId === prod.id;

                  return (
                    <tr key={prod.id} className="hover:bg-slate-50/70 transition-colors">
                      {/* Image Thumbnail */}
                      <td className="py-3 px-4">
                        <img
                          src={prod.imageUrl}
                          alt={prod.name}
                          className="w-12 h-12 object-cover rounded-lg border border-slate-200 bg-slate-100 shrink-0"
                          referrerPolicy="no-referrer"
                        />
                      </td>

                      {/* Name & Unit */}
                      <td className="py-3 px-4 max-w-56">
                        <div className="font-bold text-slate-900 line-clamp-2 leading-snug">
                          {prod.name}
                        </div>
                        <div className="text-[11px] text-slate-400 mt-0.5">
                          Satuan: {prod.unit} · {prod.estimatedShoppingDay || 'Sentra Grosir'}
                        </div>
                      </td>

                      {/* Category & Min Order */}
                      <td className="py-3 px-4">
                        <div className="text-slate-700 font-medium">{prod.categoryName}</div>
                        <div className="text-slate-400 font-mono-nums text-[11px]">
                          Min: {prod.minOrder} {prod.unit}
                        </div>
                      </td>

                      {/* Inline Wholesale Price Edit */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-medium text-[11px]">Rp</span>
                          <input
                            type="number"
                            step="500"
                            value={currentPrices.wholesalePrice}
                            onChange={(e) =>
                              handlePriceChange(prod.id, 'wholesalePrice', Number(e.target.value))
                            }
                            className={`w-28 px-2 py-1 bg-white border rounded font-mono-nums font-bold text-slate-900 text-xs focus:outline-none focus:ring-1 focus:ring-blue-900 ${
                              isModified ? 'border-orange-500 bg-orange-50/20' : 'border-slate-300'
                            }`}
                          />
                        </div>
                      </td>

                      {/* Inline Retail Price Edit */}
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-400 font-medium text-[11px]">Rp</span>
                          <input
                            type="number"
                            step="500"
                            value={currentPrices.retailPrice}
                            onChange={(e) =>
                              handlePriceChange(prod.id, 'retailPrice', Number(e.target.value))
                            }
                            className={`w-24 px-2 py-1 bg-white border rounded font-mono-nums font-bold text-emerald-700 text-xs focus:outline-none focus:ring-1 focus:ring-blue-900 ${
                              isModified ? 'border-orange-500 bg-orange-50/20' : 'border-slate-300'
                            }`}
                          />
                        </div>
                      </td>

                      {/* Wholesale Price to Customer */}
                      <td className="py-3 px-4 font-mono-nums font-extrabold text-blue-900 whitespace-nowrap">
                        {formatRupiah(currentPrices.wholesalePrice)}
                      </td>

                      {/* Stock Toggle Button */}
                      <td className="py-3 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStock(prod)}
                          className={`px-2.5 py-1 rounded-full text-[10px] font-bold cursor-pointer transition-colors ${
                            prod.inStock
                              ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200'
                              : 'bg-red-50 text-red-700 hover:bg-red-100 border border-red-200'
                          }`}
                        >
                          {prod.inStock ? '● Ready' : '✕ Habis'}
                        </button>
                      </td>

                      {/* Action Buttons */}
                      <td className="py-3 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {/* Save Inline Price button if changed */}
                          {isModified && (
                            <button
                              onClick={() => handleSaveInlinePrice(prod)}
                              disabled={isSavingThis}
                              className="px-2 py-1 bg-orange-600 hover:bg-orange-700 text-white rounded text-xs font-bold flex items-center gap-1 cursor-pointer shadow-2xs"
                              title="Simpan perubahan harga"
                            >
                              <Save className="w-3 h-3" />
                              <span>{isSavingThis ? '...' : 'Simpan'}</span>
                            </button>
                          )}

                          {/* Quick Price Modal */}
                          <button
                            onClick={() => setQuickPriceEditProduct(prod)}
                            className="p-1.5 text-slate-600 hover:text-blue-900 hover:bg-blue-50 rounded cursor-pointer"
                            title="Kalkulator Ubah Harga Cepat"
                          >
                            <Tag className="w-3.5 h-3.5" />
                          </button>

                          {/* Full Edit Modal */}
                          <button
                            onClick={() => setEditingProductModal(prod)}
                            className="p-1.5 text-blue-900 hover:bg-blue-50 rounded cursor-pointer"
                            title="Edit Lengkap Rincian Produk"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>

                          {/* Delete */}
                          <button
                            onClick={() => handleDelete(prod)}
                            className="p-1.5 text-red-600 hover:bg-red-50 rounded cursor-pointer"
                            title="Hapus Produk"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {filteredProducts.length === 0 && (
            <div className="p-8 text-center text-xs text-slate-500">
              Tidak ada produk yang cocok dengan pencarian atau filter.
            </div>
          )}
        </div>
      </div>
    </section>
  );
};
