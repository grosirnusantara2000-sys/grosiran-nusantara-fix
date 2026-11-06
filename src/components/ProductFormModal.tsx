import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { saveProduct, addCategory } from '../services/dataService';
import { Product, Category } from '../types';
import {
  X,
  Upload,
  Plus,
  Trash2,
  Image as ImageIcon,
  Save,
  Check,
  Sparkles,
  Star,
  Layers,
  Loader2,
  MessageCircle,
  FolderPlus,
} from 'lucide-react';
import { compressMultipleImageFiles, getSafeImageUrl, DEFAULT_PRODUCT_IMAGE } from '../utils/imageUtils';

interface ProductFormModalProps {
  categories: Category[];
  isOpen: boolean;
  onClose: () => void;
  productToEdit?: Product | null;
  onCategoryAdded?: (newCat: Category) => void;
}

const PRESET_AUR_KUNING_IMAGES = [
  { label: 'Mukena Bordir', url: '/assets/images/product_mukena_bordir_1793527995244.jpg' },
  { label: 'Pakaian & Kaos', url: '/assets/images/product_grosir_fashion_1793527996022.jpg' },
  { label: 'Hijab & Voal', url: '/assets/images/product_hijab_segiempat_1793527997536.jpg' },
  { label: 'Pasar Aur Kuning', url: '/assets/images/hero_pasar_aur_kuning_1793527995583.jpg' },
  { label: 'Gudang & Kargo', url: '/assets/images/about_aur_kuning_packing_1793527996506.jpg' },
];

export const ProductFormModal: React.FC<ProductFormModalProps> = ({
  categories: initialCategories,
  isOpen,
  onClose,
  productToEdit,
  onCategoryAdded,
}) => {
  const { showToast, triggerRefresh, activeOutlet } = useApp();

  const [categoriesList, setCategoriesList] = useState<Category[]>(initialCategories);
  const [name, setName] = useState('');
  const [categoryId, setCategoryId] = useState('');
  const [description, setDescription] = useState('');
  
  // Flexible Pricing & Retail Option
  const [askAdminPrice, setAskAdminPrice] = useState(false);
  const [wholesalePrice, setWholesalePrice] = useState<number | string>(35000);
  const [allowRetail, setAllowRetail] = useState(false);
  const [minOrder, setMinOrder] = useState<number>(3);
  const [unit, setUnit] = useState('pcs');

  // Images
  const [imageUrl, setImageUrl] = useState('/assets/images/product_grosir_fashion_1793527996022.jpg');
  const [images, setImages] = useState<string[]>([]);
  const [isCompressing, setIsCompressing] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  // Standard Variants (Default empty - no dummy placeholder text)
  const [inStock, setInStock] = useState(true);
  const [colors, setColors] = useState<string[]>([]);
  const [newColorInput, setNewColorInput] = useState('');
  const [sizes, setSizes] = useState<string[]>([]);
  const [newSizeInput, setNewSizeInput] = useState('');

  // Unlimited Custom Variants
  const [customVariants, setCustomVariants] = useState<{ groupName: string; options: string[] }[]>([]);
  const [newGroupNameInput, setNewGroupNameInput] = useState('');
  const [optionInputs, setOptionInputs] = useState<Record<number, string>>({});

  // Inline Category Creator
  const [isAddingNewCat, setIsAddingNewCat] = useState(false);
  const [newCatName, setNewCatName] = useState('');
  const [isSavingCat, setIsSavingCat] = useState(false);

  const [estimatedShoppingDay, setEstimatedShoppingDay] = useState('Buka Setiap Hari');
  const [featured, setFeatured] = useState(false);
  const [bestSeller, setBestSeller] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    setCategoriesList(initialCategories);
  }, [initialCategories]);

  useEffect(() => {
    if (productToEdit) {
      setName(productToEdit.name);
      setCategoryId(productToEdit.categoryId);
      setDescription(productToEdit.description);
      
      const rawPrice = productToEdit.wholesalePrice || productToEdit.price || 0;
      const normalizedPrice = rawPrice > 0 && rawPrice < 1000 ? rawPrice * 1000 : rawPrice;
      const isAskAdmin = !!productToEdit.askAdminPrice || normalizedPrice <= 0;
      setAskAdminPrice(isAskAdmin);
      setWholesalePrice(isAskAdmin ? 0 : normalizedPrice);
      setAllowRetail(!!productToEdit.allowRetail);
      setMinOrder(productToEdit.minOrder || 1);
      setUnit(productToEdit.unit || 'pcs');
      
      const loadedImgs = productToEdit.images && productToEdit.images.length > 0
        ? productToEdit.images
        : productToEdit.imageUrl ? [productToEdit.imageUrl] : [];
      setImages(loadedImgs);
      setImageUrl(loadedImgs[0] || productToEdit.imageUrl);
      
      setInStock(productToEdit.inStock !== false);
      // Filter out empty or whitespace strings
      setColors((productToEdit.colors || []).filter((c) => c && c.trim()));
      setSizes((productToEdit.sizes || []).filter((s) => s && s.trim()));
      setCustomVariants(productToEdit.customVariants || []);
      setEstimatedShoppingDay(productToEdit.estimatedShoppingDay || 'Buka Setiap Hari');
      setFeatured(!!productToEdit.featured);
      setBestSeller(!!productToEdit.bestSeller);
    } else {
      // Reset for new product - strictly clean empty variants
      setName('');
      setCategoryId(categoriesList[0]?.id || 'cat-pakaian-wanita');
      setDescription('');
      setAskAdminPrice(false);
      setWholesalePrice(35000);
      setAllowRetail(false);
      setMinOrder(3);
      setUnit('pcs');
      setImageUrl(PRESET_AUR_KUNING_IMAGES[0].url);
      setImages([PRESET_AUR_KUNING_IMAGES[0].url]);
      setInStock(true);
      setColors([]);
      setSizes([]);
      setCustomVariants([]);
      setEstimatedShoppingDay('Buka Setiap Hari');
      setFeatured(false);
      setBestSeller(false);
    }
  }, [productToEdit, isOpen]);

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

  // Add Custom Variant Group
  const handleAddVariantGroup = () => {
    const groupName = newGroupNameInput.trim();
    if (!groupName) {
      showToast('Ketik nama grup varian (contoh: Seri Motif, Bahan, Lingkar Dada)', 'error');
      return;
    }
    if (customVariants.some((g) => g.groupName.toLowerCase() === groupName.toLowerCase())) {
      showToast('Grup varian ini sudah ada', 'error');
      return;
    }

    setCustomVariants([...customVariants, { groupName, options: [] }]);
    setNewGroupNameInput('');
  };

  const handleRemoveVariantGroup = (groupIndex: number) => {
    setCustomVariants(customVariants.filter((_, idx) => idx !== groupIndex));
  };

  const handleAddOptionToGroup = (groupIndex: number) => {
    const optVal = (optionInputs[groupIndex] || '').trim();
    if (!optVal) return;

    setCustomVariants((prev) =>
      prev.map((grp, idx) => {
        if (idx !== groupIndex) return grp;
        if (grp.options.includes(optVal)) return grp;
        return { ...grp, options: [...grp.options, optVal] };
      })
    );
    setOptionInputs({ ...optionInputs, [groupIndex]: '' });
  };

  const handleRemoveOptionFromGroup = (groupIndex: number, optionVal: string) => {
    setCustomVariants((prev) =>
      prev.map((grp, idx) => {
        if (idx !== groupIndex) return grp;
        return { ...grp, options: grp.options.filter((o) => o !== optionVal) };
      })
    );
  };

  // Inline Category Creator
  const handleCreateNewCategory = async () => {
    const trimmed = newCatName.trim();
    if (!trimmed) {
      showToast('Masukkan nama kategori baru', 'error');
      return;
    }

    setIsSavingCat(true);
    try {
      const created = await addCategory({ name: trimmed });
      setCategoriesList((prev) => {
        if (!prev.some((c) => c.id === created.id)) return [...prev, created];
        return prev;
      });
      setCategoryId(created.id);
      setIsAddingNewCat(false);
      setNewCatName('');
      if (onCategoryAdded) onCategoryAdded(created);
      showToast(`Kategori "${created.name}" berhasil dibuat dan dipilih!`, 'success');
    } catch (err: any) {
      showToast('Gagal membuat kategori baru: ' + err.message, 'error');
    } finally {
      setIsSavingCat(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      showToast('Nama produk wajib diisi', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const selectedCategory = categoriesList.find((c) => c.id === categoryId);
      let parsedPrice = askAdminPrice ? 0 : Number(wholesalePrice) || 0;
      // Auto multiply if owner wrote shorthand like 88 (meaning 88.000)
      if (parsedPrice > 0 && parsedPrice < 1000) {
        parsedPrice *= 1000;
      }

      // Filter out any blank strings
      const cleanedColors = colors.map((c) => c.trim()).filter((c) => c.length > 0);
      const cleanedSizes = sizes.map((s) => s.trim()).filter((s) => s.length > 0);

      const productPayload: Product = {
        id: productToEdit ? productToEdit.id : `prod_${Date.now()}`,
        name: name.trim(),
        categoryId,
        categoryName: selectedCategory?.name || 'Grosir Nusantara',
        description: description.trim() || 'Produk grosir original berkualitas langsung dari sentra konveksi tangan pertama.',
        price: parsedPrice,
        wholesalePrice: parsedPrice,
        retailPrice: parsedPrice,
        allowRetail: !!allowRetail,
        askAdminPrice,
        jokiFee: 0,
        minOrder: Number(minOrder) || 1,
        unit,
        imageUrl: images[0] || imageUrl || PRESET_AUR_KUNING_IMAGES[0].url,
        images: images.length > 0 ? images : [imageUrl || PRESET_AUR_KUNING_IMAGES[0].url],
        galleryUrls: images.slice(1),
        inStock,
        colors: cleanedColors,
        sizes: cleanedSizes,
        customVariants: customVariants.filter((cv) => cv.options.length > 0),
        estimatedShoppingDay,
        featured,
        bestSeller,
        outletId: productToEdit?.outletId || activeOutlet,
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
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-3xl w-full p-6 sm:p-8 shadow-2xl relative my-6 max-h-[92vh] overflow-y-auto border border-slate-300">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-slate-100 text-slate-800 hover:text-black cursor-pointer transition-colors"
        >
          <X className="w-5 h-5 text-slate-900" />
        </button>

        {/* Modal Badge & Heading */}
        <div className="flex items-center gap-2 text-xs font-black text-amber-800 uppercase tracking-wider mb-1">
          <Sparkles className="w-4 h-4 text-amber-600" />
          <span>Panel Owner · Manajemen Produk Grosir</span>
        </div>
        <h2 className="text-xl sm:text-2xl font-black text-slate-950 mb-6">
          {productToEdit ? 'Edit Rincian & Harga Produk' : 'Tambah Produk Grosir Baru'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-6 text-xs">
          
          {/* Product Name */}
          <div>
            <label className="block text-sm font-black text-slate-950 mb-1.5">
              Nama Produk <span className="text-red-600">*</span>
            </label>
            <input
              type="text"
              required
              placeholder="Contoh: Mukena Bordir Kerancang Bukittinggi Sutra Silky"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-xl text-slate-950 font-bold placeholder:text-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm shadow-xs"
            />
          </div>

          {/* Category Selector with Inline Creator & Unit */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="block text-sm font-black text-slate-950">
                  Kategori Produk <span className="text-red-600">*</span>
                </label>
                <button
                  type="button"
                  onClick={() => setIsAddingNewCat(!isAddingNewCat)}
                  className="text-xs font-black text-amber-800 hover:text-amber-950 flex items-center gap-1 hover:underline cursor-pointer"
                >
                  <FolderPlus className="w-3.5 h-3.5" />
                  + Kategori Baru
                </button>
              </div>

              {isAddingNewCat ? (
                <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl space-y-2 mb-2">
                  <label className="block font-black text-slate-950 text-xs">
                    Tambah Nama Kategori Kustom:
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      placeholder="Misal: Daster Rayon, Baju Anak, Celana Jeans..."
                      value={newCatName}
                      onChange={(e) => setNewCatName(e.target.value)}
                      className="flex-1 px-3 py-1.5 bg-white border border-slate-300 rounded-lg text-slate-950 font-bold text-xs"
                    />
                    <button
                      type="button"
                      disabled={isSavingCat}
                      onClick={handleCreateNewCategory}
                      className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-lg text-xs transition-colors"
                    >
                      {isSavingCat ? 'Menyimpan...' : 'Simpan'}
                    </button>
                    <button
                      type="button"
                      onClick={() => setIsAddingNewCat(false)}
                      className="px-2 py-1.5 text-slate-700 hover:text-slate-950 font-bold text-xs"
                    >
                      Batal
                    </button>
                  </div>
                </div>
              ) : null}

              <select
                value={categoryId}
                onChange={(e) => setCategoryId(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-xl text-slate-950 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm shadow-xs"
              >
                {categoriesList.map((cat) => (
                  <option key={cat.id} value={cat.id} className="text-slate-950 font-bold">
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-black text-slate-950 mb-1.5">
                Satuan Penjualan <span className="text-red-600">*</span>
              </label>
              <select
                value={unit}
                onChange={(e) => setUnit(e.target.value)}
                className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-xl text-slate-950 font-bold focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm shadow-xs"
              >
                <option value="pcs">pcs (buah)</option>
                <option value="lusin">lusin (12 pcs)</option>
                <option value="kodi">kodi (20 pcs)</option>
                <option value="seri">seri (paket motif/warna)</option>
                <option value="pasang">pasang</option>
                <option value="set">set / stel</option>
              </select>
            </div>
          </div>

          {/* Pricing Grid with "Tanyakan Admin" Flexible Option */}
          <div className="p-4 bg-slate-50 rounded-2xl border-2 border-slate-300 space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-200">
              <div>
                <span className="font-black text-slate-950 block text-sm">
                  Pengaturan Harga Produk
                </span>
                <span className="text-xs text-slate-800 font-bold">
                  Bisa tentukan harga pasti atau pilih opsi "Tanyakan Admin" jika harga fluktuatif/nego.
                </span>
              </div>

              {/* Tanyakan Admin Toggle */}
              <label className="inline-flex items-center gap-2 px-3 py-1.5 bg-amber-100 hover:bg-amber-200 border-2 border-amber-400 rounded-xl cursor-pointer transition-colors shrink-0">
                <input
                  type="checkbox"
                  checked={askAdminPrice}
                  onChange={(e) => {
                    const checked = e.target.checked;
                    setAskAdminPrice(checked);
                    if (checked) {
                      setWholesalePrice(0);
                    } else if (wholesalePrice === 0) {
                      setWholesalePrice(35000);
                    }
                  }}
                  className="w-4 h-4 rounded text-amber-600 accent-amber-600 cursor-pointer"
                />
                <span className="font-black text-slate-950 text-xs flex items-center gap-1">
                  <MessageCircle className="w-3.5 h-3.5 text-amber-700" />
                  Opsi: "Tanyakan Admin"
                </span>
              </label>
            </div>

            {askAdminPrice ? (
              <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-xl space-y-1">
                <div className="flex items-center gap-2 text-amber-900 font-black text-sm">
                  <MessageCircle className="w-5 h-5 text-amber-700 shrink-0" />
                  <span>Mode Harga Fleksibel Aktif</span>
                </div>
                <p className="text-xs text-slate-950 font-bold leading-relaxed">
                  Pada etalase katalog dan halaman rincian produk, nominal harga akan otomatis digantikan dengan tulisan <span className="bg-amber-200 text-slate-950 px-2 py-0.5 rounded font-black border border-amber-400">"Tanyakan Admin"</span> lengkap dengan tombol WhatsApp langsung untuk menanyakan harga ke admin toko.
                </p>
              </div>
            ) : (
              <div className="space-y-3">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-xs font-black text-slate-950 mb-1">
                      Harga (Rp) <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      step="500"
                      required={!askAdminPrice}
                      value={wholesalePrice}
                      onChange={(e) => setWholesalePrice(e.target.value === '' ? '' : Number(e.target.value))}
                      onBlur={() => {
                        const val = Number(wholesalePrice);
                        if (val > 0 && val < 1000) {
                          setWholesalePrice(val * 1000);
                        }
                      }}
                      className="w-full px-3 py-2 bg-white border border-slate-400 rounded-xl font-mono text-sm font-black text-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="text-[11px] text-slate-800 font-bold block mt-0.5">
                      Ketik angka (misal <strong className="text-slate-950">88</strong> otomatis menjadi <strong className="text-slate-950">88.000</strong>)
                    </span>
                  </div>

                  <div>
                    <label className="block text-xs font-black text-slate-950 mb-1">
                      Minimal Order ({unit}) <span className="text-red-600">*</span>
                    </label>
                    <input
                      type="number"
                      required
                      min="1"
                      value={minOrder}
                      onChange={(e) => setMinOrder(Number(e.target.value))}
                      className="w-full px-3 py-2 bg-white border border-slate-400 rounded-xl font-mono text-sm font-black text-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
                    />
                    <span className="text-[11px] text-slate-800 font-bold block mt-0.5">
                      Syarat minimal pembelian grosir
                    </span>
                  </div>
                </div>

                {/* Checkbox Opsi Bisa Eceran */}
                <div className="flex items-center justify-between p-3 bg-amber-50 rounded-xl border border-amber-300">
                  <div>
                    <label htmlFor="modal-allow-retail" className="text-xs font-black text-slate-950 block cursor-pointer">
                      Bisa Eceran
                    </label>
                    <span className="text-[11px] text-slate-800 font-bold block">
                      Centang jika produk ini boleh dibeli eceran / satuan oleh pembeli
                    </span>
                  </div>
                  <input
                    type="checkbox"
                    id="modal-allow-retail"
                    checked={allowRetail}
                    onChange={(e) => setAllowRetail(e.target.checked)}
                    className="w-5 h-5 rounded text-amber-600 accent-amber-600 cursor-pointer"
                  />
                </div>
              </div>
            )}

            <div className="pt-2 border-t border-slate-300 flex justify-between items-center text-xs">
              <span className="font-black text-slate-950">Tampilan Harga di Sisi Pembeli:</span>
              {askAdminPrice ? (
                <span className="font-black px-3 py-1 bg-amber-400 text-slate-950 rounded-lg text-xs shadow-xs border border-amber-500">
                  Tanyakan Admin
                </span>
              ) : (
                <div className="flex items-center gap-2">
                  <span className="font-black font-mono text-sm text-slate-950">
                    Rp {((Number(wholesalePrice) > 0 && Number(wholesalePrice) < 1000 ? Number(wholesalePrice) * 1000 : Number(wholesalePrice)) || 0).toLocaleString('id-ID')} /{unit}
                  </span>
                  {allowRetail && (
                    <span className="text-[10px] bg-emerald-100 text-emerald-950 border border-emerald-300 px-2 py-0.5 rounded font-black">
                      Bisa Eceran
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Image Upload & Multiple Photos Gallery */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <label className="block font-black text-slate-950 text-sm">
                Galeri Foto Produk Lapak <span className="text-slate-800 font-bold">({images.length} foto)</span>
              </label>
              <span className="text-xs text-slate-950 bg-amber-300 border border-amber-500 px-2.5 py-0.5 rounded-full font-black">
                Unggah beberapa foto sekaligus
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
              className={`border-2 border-dashed rounded-2xl p-5 text-center transition-all ${
                isDragging
                  ? 'border-amber-500 bg-amber-50 scale-[1.01]'
                  : 'border-slate-400 hover:border-amber-500 bg-slate-50'
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
              <div className="flex flex-col items-center justify-center gap-2 py-2">
                {isCompressing ? (
                  <div className="flex items-center gap-2 text-slate-950 text-xs font-black py-2">
                    <Loader2 className="w-5 h-5 animate-spin text-amber-600" />
                    <span>Sedang mengompresi & memproses foto...</span>
                  </div>
                ) : (
                  <>
                    <div className="w-12 h-12 rounded-2xl bg-amber-100 border border-amber-300 flex items-center justify-center text-amber-800 shadow-xs">
                      <Upload className="w-6 h-6" />
                    </div>
                    <label
                      htmlFor="product-photo-upload-multi"
                      className="px-4 py-2 bg-slate-950 hover:bg-black text-white rounded-xl text-xs font-black cursor-pointer transition-colors shadow-sm inline-flex items-center gap-2"
                    >
                      <Plus className="w-4 h-4 text-amber-400" />
                      Pilih Foto dari Perangkat (Bisa Banyak)
                    </label>
                    <p className="text-xs text-slate-800 font-bold">
                      atau tarik &amp; lepas (drag & drop) foto produk langsung ke sini
                    </p>
                  </>
                )}
              </div>
            </div>

            {/* Uploaded Photos Gallery Preview */}
            {images.length > 0 && (
              <div className="space-y-2">
                <span className="text-xs font-black text-slate-950 block">
                  Daftar Foto Terunggah (Foto bertanda "Utama" akan menjadi foto sampul):
                </span>
                <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-3">
                  {images.map((img, idx) => (
                    <div
                      key={idx}
                      className={`relative aspect-square rounded-xl overflow-hidden border-2 group bg-slate-100 ${
                        idx === 0 ? 'border-amber-500 ring-2 ring-amber-400' : 'border-slate-300'
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

                      {idx === 0 ? (
                        <div className="absolute top-1 left-1 bg-amber-500 text-slate-950 text-[10px] font-black px-1.5 py-0.5 rounded shadow flex items-center gap-0.5">
                          <Star className="w-3 h-3 fill-current" />
                          <span>Utama</span>
                        </div>
                      ) : (
                        <button
                          type="button"
                          onClick={() => handleSetPrimaryImage(idx)}
                          className="absolute top-1 left-1 bg-slate-950/90 hover:bg-black text-white text-[10px] font-bold px-1.5 py-0.5 rounded opacity-0 group-hover:opacity-100 transition-opacity cursor-pointer shadow"
                        >
                          Pilih Utama
                        </button>
                      )}

                      <button
                        type="button"
                        onClick={() => handleRemoveImage(idx)}
                        className="absolute top-1 right-1 p-1 bg-red-600 hover:bg-red-700 text-white rounded-full opacity-80 group-hover:opacity-100 transition-opacity cursor-pointer shadow"
                      >
                        <Trash2 className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Quick Presets fallback */}
            <div className="pt-2 border-t border-slate-200 flex flex-wrap gap-2 items-center">
              <span className="text-xs text-slate-950 font-bold">Preset foto grosir:</span>
              {PRESET_AUR_KUNING_IMAGES.map((preset) => (
                <button
                  key={preset.label}
                  type="button"
                  onClick={() => {
                    setImages((prev) => [...prev, preset.url]);
                    if (!imageUrl) setImageUrl(preset.url);
                  }}
                  className="text-xs px-2.5 py-1 rounded-lg border bg-white text-slate-950 font-bold border-slate-300 hover:bg-slate-100 cursor-pointer shadow-xs"
                >
                  + {preset.label}
                </button>
              ))}
            </div>
          </div>

          {/* Color & Size Standard Variants */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            
            {/* Color Variants */}
            <div>
              <label className="block font-black text-slate-950 mb-1.5 text-xs">
                Pilihan Seri Warna / Motif
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Ketik warna (misal: Navy, Hitam, Mocca)..."
                  value={newColorInput}
                  onChange={(e) => setNewColorInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddColor();
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-white border border-slate-400 rounded-xl text-xs font-bold text-slate-950"
                />
                <button
                  type="button"
                  onClick={handleAddColor}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black transition-colors"
                >
                  + Tambah
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[30px]">
                {colors.map((c) => (
                  <span
                    key={c}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-200 border border-slate-300 rounded-lg text-xs font-bold text-slate-950"
                  >
                    {c}
                    <button
                      type="button"
                      onClick={() => handleRemoveColor(c)}
                      className="text-slate-600 hover:text-red-600 font-black text-sm"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Size Variants */}
            <div>
              <label className="block font-black text-slate-950 mb-1.5 text-xs">
                Pilihan Seri Ukuran / Size
              </label>
              <div className="flex gap-2 mb-2">
                <input
                  type="text"
                  placeholder="Ketik ukuran (misal: M, L, XL, XXL, Seri Ukuran)..."
                  value={newSizeInput}
                  onChange={(e) => setNewSizeInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSize();
                    }
                  }}
                  className="flex-1 px-3 py-2 bg-white border border-slate-400 rounded-xl text-xs font-bold text-slate-950"
                />
                <button
                  type="button"
                  onClick={handleAddSize}
                  className="px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-xl text-xs font-black transition-colors"
                >
                  + Tambah
                </button>
              </div>
              <div className="flex flex-wrap gap-1.5 min-h-[30px]">
                {sizes.map((s) => (
                  <span
                    key={s}
                    className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-slate-200 border border-slate-300 rounded-lg text-xs font-bold text-slate-950"
                  >
                    {s}
                    <button
                      type="button"
                      onClick={() => handleRemoveSize(s)}
                      className="text-slate-600 hover:text-red-600 font-black text-sm"
                    >
                      &times;
                    </button>
                  </span>
                ))}
              </div>
            </div>

          </div>

          {/* Fitur Input Varian Kustom Manual Tanpa Batas (Unlimited Custom Variants) */}
          <div className="p-4 bg-slate-50 border-2 border-slate-300 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 pb-2 border-b border-slate-200">
              <div>
                <span className="font-black text-slate-950 block text-sm">
                  Varian Kustom Tambahan (Tanpa Batas)
                </span>
                <span className="text-xs text-slate-800 font-bold">
                  Tambahkan grup varian manual lainnya sebanyak yang Anda butuhkan (contoh: Seri Motif, Bahan Kain, Ukuran Lingkar Dada, Paket Koli).
                </span>
              </div>
            </div>

            {/* Add New Variant Group Input */}
            <div className="flex gap-2">
              <input
                type="text"
                placeholder="Nama Grup Varian Baru (misal: Seri Motif, Bahan, Paket)..."
                value={newGroupNameInput}
                onChange={(e) => setNewGroupNameInput(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    handleAddVariantGroup();
                  }
                }}
                className="flex-1 px-3 py-2 bg-white border border-slate-400 rounded-xl text-xs font-bold text-slate-950 placeholder:text-slate-500"
              />
              <button
                type="button"
                onClick={handleAddVariantGroup}
                className="px-4 py-2 bg-amber-500 hover:bg-amber-600 text-slate-950 font-black rounded-xl text-xs shadow-xs transition-colors shrink-0 flex items-center gap-1.5"
              >
                <Plus className="w-4 h-4" />
                + Tambah Grup Varian
              </button>
            </div>

            {/* Render Existing Custom Variant Groups */}
            {customVariants.length > 0 && (
              <div className="space-y-3 pt-2">
                {customVariants.map((grp, gIdx) => (
                  <div key={gIdx} className="p-3.5 bg-white border border-slate-300 rounded-xl space-y-2">
                    <div className="flex items-center justify-between">
                      <span className="font-black text-slate-950 text-xs uppercase tracking-wide">
                        Grup {gIdx + 1}: {grp.groupName}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleRemoveVariantGroup(gIdx)}
                        className="text-xs text-red-600 hover:text-red-800 font-bold hover:underline"
                      >
                        Hapus Grup
                      </button>
                    </div>

                    {/* Add option to this group */}
                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder={`Ketik pilihan untuk ${grp.groupName}...`}
                        value={optionInputs[gIdx] || ''}
                        onChange={(e) => setOptionInputs({ ...optionInputs, [gIdx]: e.target.value })}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            handleAddOptionToGroup(gIdx);
                          }
                        }}
                        className="flex-1 px-3 py-1.5 bg-slate-50 border border-slate-300 rounded-lg text-xs font-bold text-slate-950"
                      />
                      <button
                        type="button"
                        onClick={() => handleAddOptionToGroup(gIdx)}
                        className="px-3 py-1.5 bg-slate-900 text-white font-black rounded-lg text-xs hover:bg-black"
                      >
                        + Tambah Opsi
                      </button>
                    </div>

                    {/* Options list */}
                    <div className="flex flex-wrap gap-1.5">
                      {grp.options.length === 0 ? (
                        <span className="text-[11px] text-slate-500 italic">Belum ada pilihan varian</span>
                      ) : (
                        grp.options.map((opt, oIdx) => (
                          <span
                            key={oIdx}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-amber-50 border border-amber-300 rounded-lg text-xs font-black text-slate-950"
                          >
                            {opt}
                            <button
                              type="button"
                              onClick={() => handleRemoveOptionFromGroup(gIdx, opt)}
                              className="text-slate-600 hover:text-red-600 font-black text-sm"
                            >
                              &times;
                            </button>
                          </span>
                        ))
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-black text-slate-950 mb-1.5">
              Deskripsi & Spesifikasi Produk Lapak
            </label>
            <textarea
              rows={3}
              placeholder="Jelaskan kualitas kain, jahitan, asal pengrajin, atau karakteristik bahan..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full px-4 py-2.5 bg-white border border-slate-400 rounded-xl text-xs font-bold text-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500 shadow-xs"
            />
          </div>

          {/* Toggles: Ready Lapak, Featured, Best Seller */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2">
            <label className="flex items-center gap-2 p-3 bg-slate-100 border border-slate-300 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={inStock}
                onChange={(e) => setInStock(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 accent-amber-600"
              />
              <span className="font-black text-slate-950 text-xs">Ready di Lapak</span>
            </label>
            <label className="flex items-center gap-2 p-3 bg-slate-100 border border-slate-300 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={featured}
                onChange={(e) => setFeatured(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 accent-amber-600"
              />
              <span className="font-black text-slate-950 text-xs">Produk Unggulan</span>
            </label>
            <label className="flex items-center gap-2 p-3 bg-slate-100 border border-slate-300 rounded-xl cursor-pointer">
              <input
                type="checkbox"
                checked={bestSeller}
                onChange={(e) => setBestSeller(e.target.checked)}
                className="w-4 h-4 rounded text-amber-600 accent-amber-600"
              />
              <span className="font-black text-slate-950 text-xs">Best Seller</span>
            </label>
          </div>

          {/* Form Actions */}
          <div className="pt-4 border-t border-slate-300 flex justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 text-slate-800 hover:text-black font-black hover:bg-slate-100 rounded-xl cursor-pointer text-xs"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-black flex items-center gap-2 cursor-pointer shadow-md disabled:opacity-50 text-xs transition-colors"
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
