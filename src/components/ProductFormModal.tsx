import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { saveProduct } from '../services/dataService';
import { Product, Category } from '../types';
import { X, Upload, Plus, Trash2, Image as ImageIcon, Save, Check, Sparkles, Star, Layers, Loader2 } from 'lucide-react';
import { compressMultipleImageFiles, getSafeImageUrl, DEFAULT_PRODUCT_IMAGE } from '../utils/imageUtils';

interface ProductFormModalProps {
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
}

const PRESET_AUR_KUNING_IMAGES = [
  { label: 'Mukena Bordir', url: '/assets/images/product_mukena_bordir_1793527995244.jpg' },
  { label: 'Pakaian & Kaos', url: '/assets/images/product_grosir_fashion_1793527996022.jpg' },
  { label: 'Hijab & Voal', url: '/assets/images/product_hijab_segiempat_1793527997536.jpg' },
  { label: 'Pasar Aur Kuning', url: '/assets/images/hero_pasar_aur_kuning_1793527995583.jpg' },
  { label: 'Gudang & Kargo', url: '/assets/images/about_aur_kuning_packing_1793527996506.jpg' },
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
  const [imageUrl, setImageUrl] = useState('/assets/images/product_grosir_fashion_1793527996022.jpg');
  const [images, setImages] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
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
      
      const loadedImgs = productToEdit.images && productToEdit.images.length > 0
        ? productToEdit.images
        : productToEdit.imageUrl ? [productToEdit.imageUrl] : [];
      setImages(loadedImgs);
      setImageUrl(loadedImgs[0] || productToEdit.imageUrl);
      
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
      setImages([PRESET_AUR_KUNING_IMAGES[0].url]);
      setInStock(true);
      setColors(['Seri 6 Warna']);
      setSizes(['All Size']);
      setEstimatedShoppingDay('Hari Pasar (Selasa & Jumat)');
      setFeatured(false);
      setBestSeller(false);
    }
  }, [productToEdit, isOpen, categories]);

  if (!isOpen) return null;

  const handleMultipleFiles = async (files: FileList | File[]) => {
    if (!files || files.length === 0) return;
    setIsCompressing(true);
    try {
      showToast('Mengunggah & mengompresi foto produk...', 'info');
      const compressed = await compressMultipleImageFiles(files);
      setImages((prev) => {
        const updated = [...prev, ...compressed];
        if (updated.length > 0) setImageUrl(updated[0]);
        return updated;
      });
      showToast(`${compressed.length} foto berhasil diunggah!`, 'success');
    } catch (err: any) {
      showToast('Gagal memproses foto: ' + (err.message || 'File tidak didukung'), 'error');
    } finally {
      setIsCompressing(false);
    }
  };

  const handleSetPrimaryImage = (index: number) => {
    setImages((prev) => {
      const copy = [...prev];
      const [chosen] = copy.splice(index, 1);
      copy.unshift(chosen);
      setImageUrl(chosen);
      return copy;
    });
    showToast('Foto utama berhasil diganti!', 'success');
  };

  const handleRemoveImage = (index: number) => {
    setImages((prev) => {
      const copy = prev.filter((_, i) => i !== index);
      setImageUrl(copy[0] || '');
      return copy;
    });
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
        imageUrl: images[0] || imageUrl || PRESET_AUR_KUNING_IMAGES[0].url,
        images: images.length > 0 ? images : [imageUrl || PRESET_AUR_KUNING_IMAGES[0].url],
        galleryUrls: images.slice(1),
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

          {/* Image Upload & Multiple Photos Gallery */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block font-bold text-slate-800 text-xs">
                Galeri Foto Produk Lapak <span className="text-slate-400 font-normal">({images.length} foto)</span>
              </label>
              <span className="text-[10px] text-amber-700 bg-amber-50 border border-amber-200 px-2 py-0.5 rounded-full font-semibold">
                Dapat unggah beberapa foto sekaligus
              </span>
            </div>

            {/* Drag & Drop Upload Zone */}
            <div
              onDragOver={(e) => {
                e.preventDefault();
                setIsDragging(true);
              }}
              onDragLeave={() => setIsDragging(false)}
              onDrop={(e) => {
                e.preventDefault();
                setIsDragging(false);
                if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
                  handleMultipleFiles(e.dataTransfer.files);
                }
              }}
              className={`border-2 border-dashed rounded-xl p-4 text-center transition-all ${
                isDragging
                  ? 'border-amber-500 bg-amber-50/50 scale-[1.01]'
                  : 'border-slate-300 hover:border-blue-900 bg-slate-50/60'
              }`}
            >
              <input
                type="file"
                id="product-photo-upload-multi"
                accept="image/*"
                multiple
                onChange={(e) => {
                  if (e.target.files) handleMultipleFiles(e.target.files);
                }}
                className="hidden"
              />
              <div className="flex flex-col items-center justify-center gap-1.5 py-1">
                {isCompressing ? (
                  <div className="flex items-center gap-2 text-blue-900 text-xs font-semibold py-2">
                    <Loader2 className="w-5 h-5 animate-spin text-blue-900" />
                    <span>Sedang mengompresi & memproses foto...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-10 h-10 rounded-full bg-blue-50 border border-blue-150 flex items-center justify-center text-blue-900">
                      <Upload className="w-5 h-5" />
                    </div>
                    <label
                      htmlFor="product-photo-upload-multi"
                      className="px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors shadow-2xs inline-flex items-center gap-1.5"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      Pilih Foto dari Perangkat (Bisa Banyak)
                    </label>
                    <p className="text-[11px] text-slate-500">
                      atau tarik &amp; lepas (drag and drop) foto produk langsung ke sini
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Uploaded Photos Gallery Preview with Primary Badge & Remove */}
            {images.length > 0 && (
              <div className="space-y-2">
                <span className="text-[11px] font-semibold text-slate-600 block">
                  Foto yang Terunggah: (Foto pertama adalah Foto Utama pada katalog)
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2.5">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 group bg-slate-100 ${
                        idx === 0 ? 'border-amber-500 ring-2 ring-amber-400/30' : 'border-slate-200'
                      }`}
                    >
                      <img
                        src={getSafeImageUrl(img)}
                        alt={`Produk ${idx + 1}`}
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE;
                        }}
                      />

                      {/* Primary Badge */}
                      {idx === 0 ? (
                        <div className="absolute top-1 left-1 bg-amber-500 text-slate-950 text-[9px] font-extrabold px-1.5 py-0.5 rounded shadow-xs flex items-center gap-0.5">
                          <Star className="w-2.5 h-2.5 fill-current" />
                          <span>Utama</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(idx)}
                          className="absolute top-1 left-1 bg-slate-900/80 hover:bg-slate-900 text-white text-[9px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                          title="Jadikan Foto Utama"
                        >
                          Pilih Utama
                        </button>
                      )}

                      {/* Delete Button */}
                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600/90 hover:bg-red-700 text-white rounded-full opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer shadow-xs"
                        title="Hapus Foto Ini"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Presets fallback */}
            <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-1.5 items-center">
              <span className="text-[10px] text-slate-500">Preset foto pasar:</span>
              {PRESET_AUR_KUNING_IMAGES.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setImages((prev) => [...prev, preset.url]);
                    if (!imageUrl) setImageUrl(preset.url);
                  }}
                  className="text-[10px] px-2 py-0.5 rounded border bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100 cursor-pointer"
                >
                  + {preset.label}
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
