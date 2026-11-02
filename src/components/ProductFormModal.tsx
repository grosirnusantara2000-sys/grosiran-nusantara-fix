import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { saveProduct } from '../services/dataService';
import { Product, Category } from '../types';
import { X, Upload, Plus, Trash2, Image as ImageIcon, Save, Check, Sparkles } from 'lucide-react';

interface ProductFormModalProps {
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

const PRESET_AUR_KUNING_IMAGES = [
  { label: 'Mukena Bordir', url: '/src/assets/images/product_mukena_bordir_1793527995244.jpg' },
  { label: 'Pakaian & Kaos', url: '/src/assets/images/product_grosir_fashion_1793527996022.jpg' },
  { label: 'Hijab & Voal', url: '/src/assets/images/product_hijab_segiempat_1793527997536.jpg' },
  { label: 'Pasar Aur Kuning', url: '/src/assets/images/hero_pasar_aur_kuning_1793527995583.jpg' },
  { label: 'Gudang & Kargo', url: '/src/assets/images/about_aur_kuning_packing_1793527996506.jpg' },
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  categories,
  isOpen,
  onClose,
  productToEdit,
}) => {
  const { showToast, triggerRefresh } = useApp();

  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState(categories[0]?.id || 'cat-pakaian-wanita');
  const [description, setDescription] = useState('');
  const [wholesalePrice, setWholesalePrice] = useState<number>(35000);
  const [retailPrice, setRetailPrice] = useState<number>(50000);
  const [minOrder, setMinOrder] = useState<number>(3);
  const [unit, setUnit] = useState('pcs');
  const [imageUrl, setImageUrl] = useState('/src/assets/images/product_grosir_fashion_1793527996022.jpg');
  const [inStock, setInStock] = useState(true);
  const [colors, setColors] = useState<string[]>(['Seri Warna']);
  const [newColorInput, setNewColorInput] = useState('');
  const [sizes, setSizes] = useState<string[]>(['All Size']);
  const [newSizeInput, setNewSizeInput] = useState('');
  const [estimatedShoppingDay, setEstimatedShoppingDay] = useState('Hari Pasar (Selasa & Jumat)');
  const [featured, setFeatured] = useState(false);
  const [bestSeller, setBestSeller] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setCategoryId(productToEdit.categoryId);
      setDescription(productToEdit.description);
      setWholesalePrice(productToEdit.wholesalePrice);
      setRetailPrice(productToEdit.price);
      setMinOrder(productToEdit.minOrder);
      setUnit(productToEdit.unit || 'pcs');
      setImageUrl(productToEdit.imageUrl);
      setInStock(productToEdit.inStock);
      setColors(productToEdit.colors || []);
      setSizes(productToEdit.sizes || []);
      setEstimatedShoppingDay(productToEdit.estimatedShoppingDay || 'Hari Pasar');
      setFeatured(!!productToEdit.featured);
      setBestSeller(!!productToEdit.bestSeller);
    } else {
      // Reset for new product
      setName('');
      setCategoryId(categories[0]?.id || 'cat-pakaian-wanita');
      setDescription('');
      setWholesalePrice(35000);
      setRetailPrice(50000);
      setMinOrder(3);
      setUnit('pcs');
      setImageUrl(PRESET_AUR_KUNING_IMAGES[0].url);
      setInStock(true);
      setColors(['Seri 6 Warna']);
      setSizes(['All Size']);
      setEstimatedShoppingDay('Hari Pasar (Selasa & Jumat)');
      setFeatured(false);
      setBestSeller(false);
    }
  }, [productToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const handleImageFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Ukuran foto maksimal 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = (event) => {
      if (event.target?.result) {
        setImageUrl(event.target.result as string);
        showToast('Foto berhasil dimuat!', 'success');
      }
    };
    reader.readAsDataURL(file);
  };

  const handleAddColor = () => {
    if (newColorInput.trim() && !colors.includes(newColorInput.trim())) {
      setColors([...colors, newColorInput.trim()]);
      setNewColorInput('');
    }
  };

  const handleRemoveColor = (col: string) => {
    setColors(colors.filter((c) => c !== col));
  };

  const handleAddSize = () => {
    if (newSizeInput.trim() && !sizes.includes(newSizeInput.trim())) {
      setSizes([...sizes, newSizeInput.trim()]);
      setNewSizeInput('');
    }
  };

  const handleRemoveSize = (sz: string) => {
    setSizes(sizes.filter((s) => s !== sz));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama produk wajib diisi', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedCategory = categories.find((c) => c.id === categoryId);
      const productPayload: Product = {
        id: productToEdit ? productToEdit.id : `prod_${Date.now()}`,
        name: name.trim(),
        categoryId,
        categoryName: selectedCategory?.name || 'Grosir Aur Kuning',
        description: description.trim() || 'Produk grosir original berkualitas tangan pertama.',
        price: retailPrice || wholesalePrice,
        wholesalePrice: Number(wholesalePrice),
        jokiFee: 0,
        minOrder: Number(minOrder),
        unit,
        imageUrl,
        inStock,
        colors: colors.length > 0 ? colors : ['Seri Standar'],
        sizes: sizes.length > 0 ? sizes : ['All Size'],
        estimatedShoppingDay,
        featured,
        bestSeller,
        createdAt: productToEdit ? productToEdit.createdAt : new Date().toISOString(),
      };

      await saveProduct(productPayload);
      showToast(
        productToEdit
          ? `Produk "${productPayload.name}" berhasil diperbarui!`
          : `Produk "${productPayload.name}" berhasil ditambahkan ke katalog!`,
        'success'
      );
      triggerRefresh();
      onClose();
    } catch (err: any) {
      showToast('Gagal menyimpan produk: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl relative my-6 max-h-[90vh] overflow-y-auto border border-slate-200">
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4" />
          <span>Panel Owner · Manajemen Produk Grosir</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mb-6">
          {productToEdit ? 'Edit Rincian & Harga Produk' : 'Tambah Produk Grosir Baru'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5 text-xs">
          {/* Product Name */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Nama Produk <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Mukena Bordir Kerancang Bukittinggi Sutra Silky"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white text-xs font-medium"
            />
          </div>

          {/* Category & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block font-bold text-slate-800 mb-1">Kategori Produk</label>
              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 text-xs"
              >
                {categories.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block font-bold text-slate-800 mb-1">Satuan Penjualan</label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900 text-xs"
              >
                <option value="pcs">pcs (buah)</option>
                <option value="lusin">lusin (12 pcs)</option>
                <option value="kodi">kodi (20 pcs)</option>
                <option value="seri">seri (paket motif/ukuran)</option>
              </select>
            </div>
          </div>

          {/* Pricing Grid */}
          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 space-y-3">
            <span className="font-bold text-slate-900 block text-xs">
              Pengaturan Harga Produk
            </span>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Harga Lapak / Grosir (Rp) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  step="500"
                  required
                  value={wholesalePrice}
                  onChange={(e) => setWholesalePrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono-nums font-bold text-slate-900"
                />
                <span className="text-[10px] text-slate-500">Harga kulakan grosir</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Harga Eceran (Rp)
                </label>
                <input
                  type="number"
                  step="500"
                  value={retailPrice}
                  onChange={(e) => setRetailPrice(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono-nums font-bold text-emerald-700"
                />
                <span className="text-[10px] text-slate-500">Patokan harga eceran</span>
              </div>

              <div>
                <label className="block font-bold text-slate-700 mb-1">
                  Minimal Order ({unit}) <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  required
                  min="1"
                  value={minOrder}
                  onChange={(e) => setMinOrder(Number(e.target.value))}
                  className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono-nums font-bold text-slate-900"
                />
                <span className="text-[10px] text-slate-500">Syarat minimal pembelian</span>
              </div>
            </div>

            <div className="pt-2 border-t border-slate-200 flex justify-between items-center text-xs">
              <span className="font-medium text-slate-600">Harga Grosir Tampil ke Pembeli:</span>
              <span className="font-extrabold font-mono-nums text-sm text-blue-900">
                Rp {wholesalePrice.toLocaleString('id-ID')} /{unit}
              </span>
            </div>
          </div>

          {/* Image Upload & Presets */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Foto Produk Lapak
            </label>
            <div className="flex gap-4 items-start">
              <img
                src={imageUrl}
                alt="Preview"
                className="w-20 h-20 object-cover rounded-xl border border-slate-200 bg-slate-100 shrink-0"
              />
              <div className="flex-1 space-y-2">
                <div className="flex items-center gap-2">
                  <input
                    type="file"
                    id="product-photo-upload"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                  />
                  <label
                    htmlFor="product-photo-upload"
                    className="px-3 py-1.5 bg-blue-900 text-white rounded-lg text-xs font-semibold cursor-pointer hover:bg-blue-800 flex items-center gap-1.5 transition-colors"
                  >
                    <Upload className="w-3.5 h-3.5" />
                    Pilih Foto dari Perangkat
                  </label>
                </div>
                <input
                  type="text"
                  placeholder="Atau masukkan URL gambar..."
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="w-full px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono"
                />
              </div>
            </div>

            {/* Quick Presets */}
            <div className="mt-2 flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] text-slate-500">Gunakan preset pasar:</span>
              {PRESET_AUR_KUNING_IMAGES.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => setImageUrl(preset.url)}
                  className={`text-[10px] px-2 py-0.5 rounded border transition-colors ${
                    imageUrl === preset.url
                      ? 'bg-blue-900 text-white border-blue-900 font-bold'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color Variants Editor */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Pilihan Seri Warna / Motif
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Tambah warna (misal: Navy, Hitam, Mocca, Mustard)..."
                value={newColorInput}
                onChange={(e) => setNewColorInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddColor();
                  }
                }}
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={handleAddColor}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                + Tambah
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {colors.map((c) => (
                <span
                  key={c}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-800"
                >
                  {c}
                  <button
                    type="button"
                    onClick={() => handleRemoveColor(c)}
                    className="text-slate-400 hover:text-red-600"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Sizes Variants Editor */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Pilihan Seri Ukuran / Size
            </label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                placeholder="Tambah ukuran (misal: M, L, XL / All Size LD 120cm)..."
                value={newSizeInput}
                onChange={(e) => setNewSizeInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddSize();
                  }
                }}
                className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs"
              />
              <button
                type="button"
                onClick={handleAddSize}
                className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold"
              >
                + Tambah
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {sizes.map((s) => (
                <span
                  key={s}
                  className="inline-flex items-center gap-1 px-2.5 py-1 bg-slate-100 rounded-lg text-xs font-medium text-slate-800"
                >
                  {s}
                  <button
                    type="button"
                    onClick={() => handleRemoveSize(s)}
                    className="text-slate-400 hover:text-red-600"
                  >
                    &times;
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Description */}
          <div>
            <label className="block font-bold text-slate-800 mb-1">
              Deskripsi & Spesifikasi Bahan Lapak
            </label>
            <textarea
              rows={3}
              placeholder="Jelaskan kualitas kain, jahitan, asal pengrajin, atau karakteristik bahan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg text-xs focus:bg-white"
            />
          </div>

          {/* Toggles: Ready Lapak, Featured */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="rounded text-blue-900"
              />
              <span className="font-semibold text-slate-800">Ready di Lapak</span>
            </label>
            <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="rounded text-blue-900"
              />
              <span className="font-semibold text-slate-800">Produk Unggulan</span>
            </label>
            <label className="flex items-center gap-2 p-2.5 bg-slate-50 border border-slate-200 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={bestSeller}
                onChange={(e) => setBestSeller(e.target.checked)}
                className="rounded text-blue-900"
              />
              <span className="font-semibold text-slate-800">Best Seller</span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-200 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSubmitting ? 'Menyimpan...' : productToEdit ? 'Simpan Perubahan' : 'Tambahkan ke Katalog'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
