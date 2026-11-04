import React, { useState, useEffect, useMemo } from 'react';
import { useApp } from '../context/AppContext';
import {
  fetchProducts,
  fetchCategories,
  removeProduct,
  removeMultipleProducts,
  quickUpdateProductPrice,
  toggleProductStock,
  addCategory,
} from '../services/dataService';
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
  FileSpreadsheet,
  FolderPlus,
  AlertTriangle,
  X,
  CheckSquare,
  Square,
  MessageCircle,
} from 'lucide-react';
import { BulkImportModal } from './BulkImportModal';
import { DEFAULT_PRODUCT_IMAGE, getSafeImageUrl } from '../utils/imageUtils';

export const ProductManagementView: React.FC = () => {
  const {
    showToast,
    triggerRefresh,
    dataVersion,
    setQuickPriceEditProduct,
    setEditingProductModal,
    setIsAddProductModalOpen,
    activeOutlet,
  } = useApp();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [stockFilter, setStockFilter] = useState<'all' | 'ready' | 'empty'>('all');

  // Bulk Selection State
  const [selectedProductIds, setSelectedProductIds] = useState<Set<string>>(new Set());

  // In-app Confirmation Modals (replacing window.confirm)
  const [productToDelete, setProductToDelete] = useState<Product | null>(null);
  const [isBulkDeleteModalOpen, setIsBulkDeleteModalOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Bulk Import Modal
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);

  // Add Category Modal
  const [isAddCategoryModalOpen, setIsAddCategoryModalOpen] = useState(false);
  const [newCategoryName, setNewCategoryName] = useState('');
  const [newCategoryDesc, setNewCategoryDesc] = useState('');
  const [isSavingCategory, setIsSavingCategory] = useState(false);

  // Inline price editing: { [productId]: { wholesalePrice: number, retailPrice: number } }
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
          !(prod.categoryName || '').toLowerCase().includes(q) &&
          !(prod.description || '').toLowerCase().includes(q)
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

  // Selection handlers
  const handleToggleSelectProduct = (productId: string) => {
    setSelectedProductIds((prev) => {
      const next = new Set(prev);
      if (next.has(productId)) {
        next.delete(productId);
      } else {
        next.add(productId);
      }
      return next;
    });
  };

  const handleSelectAll = () => {
    if (selectedProductIds.size === filteredProducts.length && filteredProducts.length > 0) {
      setSelectedProductIds(new Set());
    } else {
      setSelectedProductIds(new Set(filteredProducts.map((p) => p.id)));
    }
  };

  const isAllSelected = filteredProducts.length > 0 && selectedProductIds.size === filteredProducts.length;

  // Single Delete Execution
  const confirmSingleDelete = async () => {
    if (!productToDelete) return;
    setIsDeleting(true);
    try {
      await removeProduct(productToDelete.id);
      showToast(`Produk "${productToDelete.name}" berhasil dihapus permanen`, 'info');
      setSelectedProductIds((prev) => {
        const next = new Set(prev);
        next.delete(productToDelete.id);
        return next;
      });
      setProductToDelete(null);
      triggerRefresh();
      loadData();
    } catch (err: any) {
      showToast('Gagal menghapus produk: ' + err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Bulk Delete Execution
  const confirmBulkDelete = async () => {
    const ids = Array.from(selectedProductIds);
    if (ids.length === 0) return;
    setIsDeleting(true);
    try {
      await removeMultipleProducts(ids);
      showToast(`${ids.length} produk berhasil dihapus dari katalog!`, 'success');
      setSelectedProductIds(new Set());
      setIsBulkDeleteModalOpen(false);
      triggerRefresh();
      loadData();
    } catch (err: any) {
      showToast('Gagal menghapus produk terpilih: ' + err.message, 'error');
    } finally {
      setIsDeleting(false);
    }
  };

  // Add Category Handler
  const handleSaveNewCategory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCategoryName.trim()) {
      showToast('Ketik nama kategori', 'error');
      return;
    }
    setIsSavingCategory(true);
    try {
      const created = await addCategory({
        name: newCategoryName.trim(),
        description: newCategoryDesc.trim() || undefined,
      });
      setCategories((prev) => [...prev, created]);
      setSelectedCategory(created.id);
      setIsAddCategoryModalOpen(false);
      setNewCategoryName('');
      setNewCategoryDesc('');
      showToast(`Kategori "${created.name}" berhasil ditambahkan dan siap digunakan!`, 'success');
      triggerRefresh();
    } catch (err: any) {
      showToast('Gagal menambah kategori: ' + err.message, 'error');
    } finally {
      setIsSavingCategory(false);
    }
  };

  // Inline price change
  const handlePriceChange = (productId: string, field: 'wholesalePrice' | 'retailPrice', val: number) => {
    setInlinePriceMap((prev) => ({
      ...prev,
      [productId]: {
        ...(prev[productId] || { wholesalePrice: 0, retailPrice: 0 }),
        [field]: val,
      },
    }));
  };

  const handleSaveInlinePrice = async (prod: Product) => {
    const prices = inlinePriceMap[prod.id];
    if (!prices) return;

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

  const totalProducts = products.length;
  const readyProducts = products.filter((p) => p.inStock).length;
  const averageWholesale =
    products.length > 0
      ? Math.round(
          products.reduce((s, p) => s + (p.wholesalePrice || 0), 0) /
            (products.filter((p) => !p.askAdminPrice && p.wholesalePrice > 0).length || 1)
        )
      : 0;

  return (
    <section className="py-8 bg-slate-100 min-h-[90vh]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header & Controls */}
        <div className="flex flex-col md:flex-row md:items-center justify-between pb-6 mb-6 border-b-2 border-slate-300 gap-4">
          <div>
            <div className="flex items-center gap-2 text-xs font-black text-amber-800 uppercase tracking-wider">
              <Tag className="w-4 h-4 text-amber-600" />
              <span>Panel Manajemen Produk Owner</span>
            </div>
            <h1 className="text-2xl sm:text-3xl font-black text-slate-950 mt-1">
              Kelola &amp; Ubah Harga Produk Grosir
            </h1>
            <p className="text-xs sm:text-sm text-slate-900 font-bold mt-0.5">
              Atur harga grosir & eceran, opsi "Tanyakan Admin", varian kustom, kategori, dan stok produk Grosir Nusantara
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5">
            {/* Bulk Import Button */}
            <button
              onClick={() => setIsImportModalOpen(true)}
              className="px-3.5 py-2.5 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-500 rounded-xl flex items-center gap-1.5 shadow-sm cursor-pointer transition-all border border-amber-500"
            >
              <FileSpreadsheet className="w-4 h-4" />
              <span>Impor Produk Massal</span>
            </button>

            {/* Add Category Button */}
            <button
              onClick={() => setIsAddCategoryModalOpen(true)}
              className="px-3.5 py-2.5 text-xs font-black text-slate-950 bg-white hover:bg-slate-50 border-2 border-slate-300 rounded-xl flex items-center gap-1.5 shadow-xs cursor-pointer transition-all"
            >
              <FolderPlus className="w-4 h-4 text-amber-700" />
              <span>+ Kategori Baru</span>
            </button>

            {/* Add Product Button */}
            <button
              onClick={() => setIsAddProductModalOpen(true)}
              className="px-4 py-2.5 text-xs font-black text-white bg-slate-950 hover:bg-black rounded-xl flex items-center gap-2 shadow-sm cursor-pointer transition-all"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>Tambah Produk Baru</span>
            </button>

            {/* Reload Data Button */}
            <button
              onClick={loadData}
              className="p-2.5 text-slate-950 hover:text-black bg-white border-2 border-slate-300 rounded-xl shadow-xs cursor-pointer hover:bg-slate-50 transition-colors"
              title="Segarkan Data"
            >
              <RefreshCw className={`w-4 h-4 ${isLoading ? 'animate-spin text-amber-600' : ''}`} />
            </button>
          </div>
        </div>

        {/* Quick Stats Strip */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
          <div className="bg-white p-4 rounded-2xl border-2 border-slate-300 shadow-xs">
            <span className="text-xs font-black text-slate-950 uppercase tracking-wider block">
              Total Produk Katalog
            </span>
            <div className="text-2xl font-black font-mono text-slate-950 mt-1">
              {totalProducts} <span className="text-xs font-bold text-slate-800 font-sans">Item</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border-2 border-slate-300 shadow-xs">
            <span className="text-xs font-black text-slate-950 uppercase tracking-wider block">
              Ready Stok di Lapak
            </span>
            <div className="text-2xl font-black font-mono text-emerald-800 mt-1">
              {readyProducts} <span className="text-xs font-bold text-slate-800 font-sans">Item</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border-2 border-slate-300 shadow-xs">
            <span className="text-xs font-black text-slate-950 uppercase tracking-wider block">
              Stok Kosong
            </span>
            <div className="text-2xl font-black font-mono text-rose-800 mt-1">
              {totalProducts - readyProducts} <span className="text-xs font-bold text-slate-800 font-sans">Item</span>
            </div>
          </div>
          <div className="bg-white p-4 rounded-2xl border-2 border-slate-300 shadow-xs">
            <span className="text-xs font-black text-slate-950 uppercase tracking-wider block">
              Rata-rata Harga Grosir
            </span>
            <div className="text-2xl font-black font-mono text-slate-950 mt-1">
              {formatRupiah(averageWholesale)}
            </div>
          </div>
        </div>

        {/* Sticky Bulk Action Floating Bar when products are selected */}
        {selectedProductIds.size > 0 && (
          <div className="sticky top-20 z-30 mb-6 p-4 bg-slate-950 text-white rounded-2xl shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-2 border-amber-400 animate-in slide-in-from-top duration-200">
            <div className="flex items-center gap-3">
              <span className="w-8 h-8 rounded-xl bg-amber-400 text-slate-950 font-black flex items-center justify-center text-sm shadow">
                {selectedProductIds.size}
              </span>
              <div>
                <span className="font-black text-sm text-white">
                  {selectedProductIds.size} Produk Telah Dipilih
                </span>
                <p className="text-xs text-slate-300 font-medium">
                  Gunakan tombol aksi di sebelah kanan untuk menghapus produk sekaligus.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setSelectedProductIds(new Set())}
                className="px-3.5 py-2 bg-slate-800 hover:bg-slate-700 text-slate-200 font-bold text-xs rounded-xl transition-colors cursor-pointer"
              >
                Batal Pilih
              </button>
              <button
                type="button"
                onClick={() => setIsBulkDeleteModalOpen(true)}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white font-black text-xs rounded-xl flex items-center gap-1.5 shadow-md cursor-pointer transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                <span>Hapus {selectedProductIds.size} Produk Terpilih</span>
              </button>
            </div>
          </div>
        )}

        {/* Search & Filter Bar */}
        <div className="bg-white p-4 rounded-2xl border-2 border-slate-300 shadow-xs mb-6 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="relative flex-1">
            <input
              type="text"
              placeholder="Cari nama produk, kategori, varian, atau spesifikasi..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-400 rounded-xl focus:outline-none focus:ring-2 focus:ring-amber-500 focus:bg-white text-slate-950 font-bold placeholder:text-slate-500"
            />
            <Search className="w-4 h-4 text-slate-700 absolute left-3.5 top-3" />
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <select
              value={selectedCategory}
              onChange={(e) => setSelectedCategory(e.target.value)}
              className="py-2.5 px-3.5 text-xs bg-slate-50 border border-slate-400 rounded-xl text-slate-950 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Semua Kategori ({categories.length})</option>
              {categories.map((c) => (
                <option key={c.id} value={c.id}>
                  {c.name}
                </option>
              ))}
            </select>

            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value as any)}
              className="py-2.5 px-3.5 text-xs bg-slate-50 border border-slate-400 rounded-xl text-slate-950 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500"
            >
              <option value="all">Semua Status Stok</option>
              <option value="ready">Ready Lapak</option>
              <option value="empty">Stok Kosong</option>
            </select>
          </div>
        </div>

        {/* Products Table with Bulk Checkbox, High Contrast & Custom Confirmation */}
        <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead className="bg-slate-200 border-b-2 border-slate-300 text-slate-950 uppercase text-[11px] font-black">
                <tr>
                  {/* Select All Checkbox */}
                  <th className="py-3.5 px-3 text-center w-10">
                    <button
                      type="button"
                      onClick={handleSelectAll}
                      className="cursor-pointer text-slate-900 hover:text-black flex items-center justify-center"
                      title={isAllSelected ? 'Batalkan pilihan semua' : 'Pilih semua produk'}
                    >
                      {isAllSelected ? (
                        <CheckSquare className="w-5 h-5 text-amber-600 fill-amber-100" />
                      ) : (
                        <Square className="w-5 h-5 text-slate-600" />
                      )}
                    </button>
                  </th>
                  <th className="py-3.5 px-3">Foto</th>
                  <th className="py-3.5 px-4">Nama Produk & Varian</th>
                  <th className="py-3.5 px-4">Kategori & Min.</th>
                  <th className="py-3.5 px-4 w-44">Harga Grosir Lapak</th>
                  <th className="py-3.5 px-4 w-36">Harga Eceran</th>
                  <th className="py-3.5 px-4">Harga Sisi Pembeli</th>
                  <th className="py-3.5 px-4 text-center">Status Stok</th>
                  <th className="py-3.5 px-4 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 text-slate-950 font-medium">
                {filteredProducts.map((prod) => {
                  const isSelected = selectedProductIds.has(prod.id);
                  const currentPrices = inlinePriceMap[prod.id] || {
                    wholesalePrice: prod.wholesalePrice,
                    retailPrice: prod.retailPrice || prod.price,
                  };
                  const isModified =
                    currentPrices.wholesalePrice !== prod.wholesalePrice ||
                    currentPrices.retailPrice !== (prod.retailPrice || prod.price);
                  const isSavingThis = savingId === prod.id;
                  const isAskAdmin = !!prod.askAdminPrice || prod.wholesalePrice <= 0;

                  return (
                    <tr
                      key={prod.id}
                      className={`transition-colors ${
                        isSelected ? 'bg-amber-100/60 font-semibold' : 'hover:bg-slate-50'
                      }`}
                    >
                      {/* Row Checkbox */}
                      <td className="py-3.5 px-3 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleSelectProduct(prod.id)}
                          className="cursor-pointer flex items-center justify-center mx-auto"
                        >
                          {isSelected ? (
                            <CheckSquare className="w-5 h-5 text-amber-600 fill-amber-100" />
                          ) : (
                            <Square className="w-5 h-5 text-slate-500 hover:text-slate-900" />
                          )}
                        </button>
                      </td>

                      {/* Image Thumbnail */}
                      <td className="py-3.5 px-3">
                        <div className="w-12 h-12 rounded-xl overflow-hidden border border-slate-300 bg-slate-100 shrink-0 relative">
                          <img
                            src={getSafeImageUrl(prod.imageUrl)}
                            alt={prod.name}
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE;
                            }}
                          />
                          {prod.images && prod.images.length > 1 && (
                            <span className="absolute bottom-0 right-0 bg-slate-950/80 text-white text-[9px] font-black px-1 rounded-tl">
                              +{prod.images.length}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Name & Variants */}
                      <td className="py-3.5 px-4 max-w-64">
                        <div className="font-black text-slate-950 text-xs line-clamp-2 leading-snug">
                          {prod.name}
                        </div>
                        <div className="text-[11px] text-slate-800 font-bold mt-0.5 flex flex-wrap gap-1 items-center">
                          <span>Satuan: <b className="text-slate-950">{prod.unit}</b></span>
                          {prod.colors && prod.colors.length > 0 && (
                            <span className="bg-slate-200 px-1.5 py-0.2 rounded text-[10px] text-slate-950 font-bold">
                              {prod.colors.slice(0, 2).join(', ')}
                            </span>
                          )}
                          {prod.customVariants && prod.customVariants.length > 0 && (
                            <span className="bg-amber-200 border border-amber-300 px-1.5 py-0.2 rounded text-[10px] text-amber-950 font-black">
                              +{prod.customVariants.length} Varian
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Category & Min Order */}
                      <td className="py-3.5 px-4">
                        <div className="text-slate-950 font-bold">{prod.categoryName || 'Grosir'}</div>
                        <div className="text-slate-800 font-mono text-[11px] font-bold">
                          Min: {prod.minOrder} {prod.unit}
                        </div>
                      </td>

                      {/* Inline Wholesale Price Edit */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-900 font-bold text-[11px]">Rp</span>
                          <input
                            type="number"
                            step="500"
                            value={currentPrices.wholesalePrice}
                            onChange={(e) =>
                              handlePriceChange(prod.id, 'wholesalePrice', Number(e.target.value))
                            }
                            className={`w-28 px-2 py-1 bg-white border-2 rounded-lg font-mono font-black text-slate-950 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                              isModified ? 'border-amber-500 bg-amber-50' : 'border-slate-300'
                            }`}
                          />
                        </div>
                      </td>

                      {/* Inline Retail Price Edit */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1">
                          <span className="text-slate-900 font-bold text-[11px]">Rp</span>
                          <input
                            type="number"
                            step="500"
                            value={currentPrices.retailPrice}
                            onChange={(e) =>
                              handlePriceChange(prod.id, 'retailPrice', Number(e.target.value))
                            }
                            className={`w-24 px-2 py-1 bg-white border-2 rounded-lg font-mono font-black text-emerald-900 text-xs focus:outline-none focus:ring-2 focus:ring-amber-500 ${
                              isModified ? 'border-amber-500 bg-amber-50' : 'border-slate-300'
                            }`}
                          />
                        </div>
                      </td>

                      {/* Customer-side Price View */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {isAskAdmin ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 bg-amber-200 border border-amber-400 text-slate-950 rounded-lg font-black text-[11px]">
                            <MessageCircle className="w-3 h-3 text-amber-800" />
                            Tanyakan Admin
                          </span>
                        ) : (
                          <span className="font-mono font-black text-slate-950 text-xs">
                            {formatRupiah(currentPrices.wholesalePrice)}
                          </span>
                        )}
                      </td>

                      {/* Stock Toggle */}
                      <td className="py-3.5 px-4 text-center">
                        <button
                          type="button"
                          onClick={() => handleToggleStock(prod)}
                          className={`px-3 py-1 rounded-xl text-[11px] font-black cursor-pointer transition-colors border shadow-2xs ${
                            prod.inStock
                              ? 'bg-emerald-100 text-emerald-950 hover:bg-emerald-200 border-emerald-300'
                              : 'bg-rose-100 text-rose-950 hover:bg-rose-200 border-rose-300'
                          }`}
                        >
                          {prod.inStock ? '● Ready Lapak' : '✕ Kosong'}
                        </button>
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center justify-center gap-1.5">
                          {isModified && (
                            <button
                              onClick={() => handleSaveInlinePrice(prod)}
                              disabled={isSavingThis}
                              className="px-2.5 py-1 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer shadow-xs"
                              title="Simpan Perubahan Harga"
                            >
                              <Save className="w-3 h-3" />
                              <span>{isSavingThis ? '...' : 'Simpan'}</span>
                            </button>
                          )}

                          <button
                            onClick={() => setQuickPriceEditProduct(prod)}
                            className="p-1.5 text-slate-900 hover:text-black hover:bg-slate-200 rounded-lg cursor-pointer transition-colors"
                            title="Kalkulator Ubah Harga Cepat"
                          >
                            <Tag className="w-4 h-4 text-slate-800" />
                          </button>

                          <button
                            onClick={() => setEditingProductModal(prod)}
                            className="p-1.5 text-slate-900 hover:text-black hover:bg-amber-100 rounded-lg cursor-pointer transition-colors"
                            title="Edit Lengkap & Varian Produk"
                          >
                            <Edit className="w-4 h-4 text-slate-950" />
                          </button>

                          {/* Delete with In-App Confirmation Modal */}
                          <button
                            onClick={() => setProductToDelete(prod)}
                            className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded-lg cursor-pointer transition-colors"
                            title="Hapus Produk Permanen"
                          >
                            <Trash2 className="w-4 h-4" />
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
            <div className="p-12 text-center text-xs text-slate-800 font-bold space-y-2">
              <Package className="w-8 h-8 text-slate-400 mx-auto" />
              <p>Tidak ada produk yang cocok dengan pencarian atau filter.</p>
            </div>
          )}
        </div>

      </div>

      {/* ================= IN-APP SINGLE DELETE MODAL ================= */}
      {productToDelete && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-slate-300 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-4 border border-rose-200">
              <AlertTriangle className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-950 text-center">
              Hapus Produk dari Katalog?
            </h3>
            <p className="text-xs text-slate-800 font-bold text-center mt-2 leading-relaxed">
              Apakah Anda yakin ingin menghapus produk <span className="text-slate-950 font-black">"{productToDelete.name}"</span>? Tindakan ini akan menghapus data dari Firestore dan etalase toko secara permanen.
            </p>

            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setProductToDelete(null)}
                className="px-4 py-2 text-xs font-black text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmSingleDelete}
                className="px-5 py-2 text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Menghapus...' : 'Ya, Hapus Produk'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= IN-APP BULK DELETE MODAL ================= */}
      {isBulkDeleteModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border-2 border-slate-300 animate-in fade-in zoom-in-95 duration-150">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-700 flex items-center justify-center mx-auto mb-4 border border-rose-200">
              <Trash2 className="w-6 h-6" />
            </div>
            <h3 className="text-lg font-black text-slate-950 text-center">
              Hapus Massal ({selectedProductIds.size} Produk)?
            </h3>
            <p className="text-xs text-slate-800 font-bold text-center mt-2 leading-relaxed">
              Anda akan menghapus <b className="text-rose-700">{selectedProductIds.size} produk</b> yang sedang dipilih dari katalog dan database secara bersamaan. Produk tidak akan muncul kembali di katalog pembeli.
            </p>

            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setIsBulkDeleteModalOpen(false)}
                className="px-4 py-2 text-xs font-black text-slate-800 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
              >
                Batal
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmBulkDelete}
                className="px-5 py-2 text-xs font-black text-white bg-red-600 hover:bg-red-700 rounded-xl transition-colors shadow-sm flex items-center gap-1.5 cursor-pointer"
              >
                <Trash2 className="w-4 h-4" />
                <span>{isDeleting ? 'Menghapus Massal...' : `Hapus ${selectedProductIds.size} Produk`}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ================= IN-APP ADD CATEGORY MODAL ================= */}
      {isAddCategoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border-2 border-slate-300 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b border-slate-200 mb-4">
              <div className="flex items-center gap-2 text-amber-800 font-black text-sm">
                <FolderPlus className="w-5 h-5 text-amber-600" />
                <span>Tambah Kategori Produk Baru</span>
              </div>
              <button
                onClick={() => setIsAddCategoryModalOpen(false)}
                className="p-1 rounded-lg text-slate-500 hover:text-slate-950"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveNewCategory} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-slate-950 mb-1">
                  Nama Kategori Baru <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="Misal: Daster Rayon, Baju Anak, Celana Kulot..."
                  value={newCategoryName}
                  onChange={(e) => setNewCategoryName(e.target.value)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-400 rounded-xl text-slate-950 font-bold text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-slate-950 mb-1">
                  Keterangan / Deskripsi Kategori
                </label>
                <textarea
                  rows={2}
                  placeholder="Koleksi busana grosir pilihan..."
                  value={newCategoryDesc}
                  onChange={(e) => setNewCategoryDesc(e.target.value)}
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-400 rounded-xl text-slate-950 font-bold text-xs focus:ring-2 focus:ring-amber-500 focus:bg-white"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddCategoryModalOpen(false)}
                  className="px-4 py-2 text-xs font-bold text-slate-800 hover:bg-slate-100 rounded-xl"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  disabled={isSavingCategory}
                  className="px-5 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black text-xs rounded-xl shadow transition-colors flex items-center gap-1.5"
                >
                  <Plus className="w-4 h-4" />
                  <span>{isSavingCategory ? 'Menyimpan...' : 'Simpan Kategori'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ================= BULK IMPORT MODAL ================= */}
      <BulkImportModal
        isOpen={isImportModalOpen}
        onClose={() => setIsImportModalOpen(false)}
        onSuccess={() => {
          showToast('Produk massal berhasil diimpor ke katalog!', 'success');
          triggerRefresh();
          loadData();
        }}
        currentOutlet={activeOutlet}
        categories={categories}
      />

    </section>
  );
};
