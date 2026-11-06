import React, { useState } from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import {
  X,
  ShoppingBag,
  MessageCircle,
  ShieldCheck,
  Truck,
  Store,
  Plus,
  Minus,
  ArrowRight,
  Tag,
  Edit,
  ChevronLeft,
  ChevronRight,
  Layers,
  HelpCircle,
} from 'lucide-react';
import { getWhatsappChatUrl, getEffectiveWhatsapp } from '../utils/whatsapp';
import { getSafeImageUrl, DEFAULT_PRODUCT_IMAGE } from '../utils/imageUtils';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  if (!product) return null;

  const {
    addToCart,
    setIsCartOpen,
    setCurrentView,
    isAdmin,
    setQuickPriceEditProduct,
    setEditingProductModal,
    activeOutletInfo,
    storeSettings,
  } = useApp();

  const isAskAdmin = !!product.askAdminPrice || product.wholesalePrice <= 0;
  const effectiveMinOrder = product.allowRetail ? 1 : (product.minOrder || 1);

  const [quantity, setQuantity] = useState(effectiveMinOrder);
  const validColors = React.useMemo(() => (product.colors || []).filter((c) => c && c.trim()), [product.colors]);
  const validSizes = React.useMemo(() => (product.sizes || []).filter((s) => s && s.trim()), [product.sizes]);
  const [selectedColor, setSelectedColor] = useState(validColors[0] || '');
  const [selectedSize, setSelectedSize] = useState(validSizes[0] || '');
  
  // Custom Variants Selection: { [groupName]: option }
  const [selectedCustomVariants, setSelectedCustomVariants] = useState<Record<string, string>>(() => {
    const initial: Record<string, string> = {};
    if (product.customVariants && Array.isArray(product.customVariants)) {
      product.customVariants.forEach((group) => {
        if (group.options && group.options.length > 0) {
          initial[group.groupName] = group.options[0];
        }
      });
    }
    return initial;
  });

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  // Normalize all available images for this product
  const allImages = React.useMemo(() => {
    const list: string[] = [];
    if (product.images && product.images.length > 0) {
      list.push(...product.images);
    } else if (product.imageUrl) {
      list.push(product.imageUrl);
    }
    if (product.galleryUrls && product.galleryUrls.length > 0) {
      product.galleryUrls.forEach((url) => {
        if (!list.includes(url)) list.push(url);
      });
    }
    return list.length > 0 ? list : [DEFAULT_PRODUCT_IMAGE];
  }, [product]);

  const activeImage = allImages[activeImageIndex] || allImages[0] || DEFAULT_PRODUCT_IMAGE;

  const formatRupiah = (num: number) => 'Rp ' + num.toLocaleString('id-ID');

  const normalizedWholesale = product.wholesalePrice > 0 && product.wholesalePrice < 1000 ? product.wholesalePrice * 1000 : product.wholesalePrice;
  const subtotalItem = normalizedWholesale * quantity;
  const grandTotal = subtotalItem;

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () => setQuantity((prev) => Math.max(effectiveMinOrder, prev - 1));

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedColor, selectedSize, selectedCustomVariants);
    onClose();
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedColor, selectedSize, selectedCustomVariants);
    onClose();
    setCurrentView('checkout');
  };

  // WhatsApp chat to inquire about this product price / stock
  const handleWhatsAppChat = () => {
    const effectiveWa = getEffectiveWhatsapp(storeSettings, 'tanya_admin', activeOutletInfo.whatsappNumber);
    let variantSummary = '';
    if (selectedColor) variantSummary += `\nWarna/Motif: ${selectedColor}`;
    if (selectedSize) variantSummary += `\nUkuran: ${selectedSize}`;
    Object.entries(selectedCustomVariants).forEach(([grp, opt]) => {
      variantSummary += `\n${grp}: ${opt}`;
    });

    const priceText = isAskAdmin
      ? 'Harga: *Tanyakan Admin*'
      : `Harga Grosir: ${formatRupiah(product.wholesalePrice)} / ${product.unit}\nTotal Estimasi: ${formatRupiah(grandTotal)}`;

    const text = `Halo Admin Grosir Nusantara (${activeOutletInfo.shortName}), saya ingin menanyakan produk:\n*${product.name}* (ID: ${product.id})\nJumlah: ${quantity} ${product.unit}${variantSummary}\n${priceText}\n\nMohon informasi stok & harga grosirnya ya. Terima kasih!`;
    const url = getWhatsappChatUrl(effectiveWa, text);
    window.open(url, '_blank');
  };

  // Dedicated button: "Tanya Varian / Warna / Seri Lain via WhatsApp"
  const handleAskOtherVariantsWhatsApp = () => {
    const effectiveWa = getEffectiveWhatsapp(storeSettings, 'tanya_admin', activeOutletInfo.whatsappNumber);
    const text = `Halo Admin Grosir Nusantara (${activeOutletInfo.shortName}),\nSaya tertarik dengan produk *${product.name}* (ID: ${product.id}).\n\nApakah ada pilihan *Varian, Seri Warna, Ukuran, atau Seri Motif lain* yang ready di lapak/gudang? Mohon foto katalog seri lainnya ya. Terima kasih!`;
    const url = getWhatsappChatUrl(effectiveWa, text);
    window.open(url, '_blank');
  };

  // Dedicated button: "Konfirmasi Pengiriman ke Admin via WhatsApp"
  const handleAskShippingCostWhatsApp = () => {
    const effectiveWa = getEffectiveWhatsapp(storeSettings, 'tanya_admin', activeOutletInfo.whatsappNumber);
    const text = `Halo Admin Grosir Nusantara (${activeOutletInfo.shortName}),\nSaya tertarik dengan produk:\n*${product.name}* (ID: ${product.id})\nJumlah: ${quantity} ${product.unit}\n\nSaya ingin menanyakan ketersediaan dan konfirmasi opsi pengiriman/pengambilan barang ini ke kota saya. Mohon informasinya. Terima kasih!`;
    const url = getWhatsappChatUrl(effectiveWa, text);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-3xl max-w-4xl w-full overflow-hidden shadow-2xl my-6 flex flex-col md:flex-row relative max-h-[92vh] border-2 border-slate-300">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/95 hover:bg-white text-slate-900 hover:text-black shadow-md transition-all cursor-pointer border border-slate-300"
          aria-label="Tutup"
        >
          <X className="w-5 h-5 text-slate-950" />
        </button>

        {/* Left Column: Multi-Image Gallery */}
        <div className="md:w-1/2 bg-slate-100 relative flex flex-col justify-between p-5 border-b md:border-b-0 md:border-r-2 border-slate-300">
          {/* Main Featured Photo */}
          <div className="relative w-full aspect-4/3 sm:aspect-square max-h-[360px] md:max-h-[420px] rounded-2xl overflow-hidden bg-slate-200 border-2 border-slate-300 flex items-center justify-center shadow-xs">
            <img
              src={getSafeImageUrl(activeImage)}
              alt={`${product.name} - Foto ${activeImageIndex + 1}`}
              className="w-full h-full object-cover object-center"
              referrerPolicy="no-referrer"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src !== DEFAULT_PRODUCT_IMAGE) {
                  target.src = DEFAULT_PRODUCT_IMAGE;
                }
              }}
            />

            {/* Gallery Navigation Arrows */}
            {allImages.length > 1 && (
              <>
                <button
                  type="button"
                  onClick={() => setActiveImageIndex((prev) => (prev > 0 ? prev - 1 : allImages.length - 1))}
                  className="absolute left-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/70 hover:bg-black text-white backdrop-blur-xs transition-colors cursor-pointer shadow-md"
                  title="Foto Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 p-2 rounded-full bg-slate-950/70 hover:bg-black text-white backdrop-blur-xs transition-colors cursor-pointer shadow-md"
                  title="Foto Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute top-3 right-3 bg-slate-950/80 backdrop-blur-xs text-white text-[10px] font-black px-2.5 py-0.5 rounded-lg shadow-sm">
                  {activeImageIndex + 1} / {allImages.length}
                </div>
              </>
            )}
          </div>

          {/* Multiple Image Thumbnails Strip */}
          {allImages.length > 1 && (
            <div className="mt-3 flex items-center gap-2 overflow-x-auto pb-1 scrollbar-thin">
              {allImages.map((imgUrl, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => setActiveImageIndex(idx)}
                  className={`relative w-14 h-14 rounded-xl overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    activeImageIndex === idx
                      ? 'border-amber-500 ring-2 ring-amber-400 scale-105'
                      : 'border-slate-300 opacity-70 hover:opacity-100 bg-white'
                  }`}
                >
                  <img
                    src={getSafeImageUrl(imgUrl)}
                    alt={`Thumbnail ${idx + 1}`}
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = DEFAULT_PRODUCT_IMAGE;
                    }}
                  />
                  {idx === 0 && (
                    <span className="absolute bottom-0 inset-x-0 bg-slate-950/90 text-[8px] text-center font-black text-amber-300 py-0.2">
                      Utama
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Sourcing Badge */}
          <div className="mt-3 bg-white p-2.5 rounded-xl border border-slate-300 text-xs text-slate-950 font-bold flex items-center gap-2 shadow-2xs">
            <Store className="w-4 h-4 text-amber-700 shrink-0" />
            <span className="truncate">Tangan pertama langsung di sentra {activeOutletInfo.name}</span>
          </div>
        </div>

        {/* Right Column: Contiguous Purchase Module */}
        <div className="md:w-1/2 p-6 overflow-y-auto flex flex-col justify-between space-y-4">
          <div>
            {isAdmin && (
              <div className="mb-3 p-3 bg-amber-50 border-2 border-amber-300 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-black text-slate-950">
                  <Tag className="w-4 h-4 text-amber-700" />
                  <span>Aksi Owner:</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => {
                      onClose();
                      setQuickPriceEditProduct(product);
                    }}
                    className="px-3 py-1 bg-amber-400 hover:bg-amber-500 text-slate-950 rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer border border-amber-500"
                  >
                    <Tag className="w-3 h-3" />
                    Ubah Harga
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      setEditingProductModal(product);
                    }}
                    className="px-3 py-1 bg-slate-950 hover:bg-black text-white rounded-lg text-xs font-black flex items-center gap-1 cursor-pointer"
                  >
                    <Edit className="w-3 h-3" />
                    Edit Lengkap
                  </button>
                </div>
              </div>
            )}

            <div className="text-xs font-black text-amber-800 uppercase tracking-wider">
              {product.categoryName}
            </div>
            <h2 className="text-xl sm:text-2xl font-black text-slate-950 mt-1 leading-snug">
              {product.name}
            </h2>

            {/* Pricing Box: Supports "Tanyakan Admin" */}
            <div className="mt-4 p-4 bg-slate-50 rounded-2xl border-2 border-slate-300 space-y-2">
              {isAskAdmin ? (
                <div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-black text-slate-950">Harga:</span>
                    <span className="px-3 py-1 bg-amber-300 text-slate-950 border border-amber-500 rounded-xl font-black text-sm shadow-xs">
                      Tanyakan Admin
                    </span>
                  </div>
                  <p className="text-xs text-slate-800 font-bold mt-2 leading-relaxed">
                    Harga produk ini fleksibel / dapat dinegosiasikan langsung dengan admin toko berdasarkan jumlah pesanan dan ketersediaan kain.
                  </p>
                </div>
              ) : (
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <span className="text-xs font-black text-slate-950">Harga:</span>
                    {product.allowRetail && (
                      <span className="text-[11px] bg-emerald-100 text-emerald-950 border border-emerald-300 px-2.5 py-0.5 rounded-md font-black">
                        ✓ Bisa Beli Eceran
                      </span>
                    )}
                  </div>
                  <div className="text-2xl font-black text-slate-950 font-mono">
                    {formatRupiah(normalizedWholesale)}
                    <span className="text-xs font-bold text-slate-700 font-sans"> /{product.unit}</span>
                  </div>
                </div>
              )}

              <div className="mt-2 text-[11px] text-slate-800 font-bold pt-1.5 border-t border-slate-200">
                {product.allowRetail ? (
                  <span>✓ <strong className="text-emerald-900 font-black">Bisa beli eceran / satuan</strong> (1 {product.unit}) maupun grosir partai.</span>
                ) : (
                  <span>* Minimal pembelian grosir: <strong className="text-slate-950 font-mono font-black">{product.minOrder} {product.unit}</strong></span>
                )}
              </div>
            </div>

            {/* Notice Pengiriman Dikonfirmasi ke Admin */}
            <div className="mt-3 p-3 bg-amber-50/90 rounded-2xl border-2 border-amber-300 space-y-2">
              <div className="flex items-start gap-2">
                <Truck className="w-4 h-4 text-amber-800 shrink-0 mt-0.5" />
                <p className="text-xs text-slate-950 font-bold leading-relaxed">
                  <strong>Toko tidak melayani pengiriman langsung.</strong> Pengiriman atau pengambilan barang wajib dikonfirmasi terlebih dahulu ke admin toko via WhatsApp.
                </p>
              </div>
              <button
                type="button"
                onClick={handleAskShippingCostWhatsApp}
                className="w-full py-2 px-3 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl flex items-center justify-center gap-1.5 border border-amber-500 shadow-2xs cursor-pointer transition-colors"
              >
                <MessageCircle className="w-3.5 h-3.5 text-slate-950" />
                <span>Konfirmasi Pengiriman ke Admin via WhatsApp</span>
              </button>
            </div>

            {/* Colors Variant Selector - Only rendered if colors are entered */}
            {validColors.length > 0 && (
              <div className="mt-4">
                <label className="text-xs font-black text-slate-950 block mb-2">
                  Pilihan Seri Warna / Motif:
                </label>
                <div className="flex flex-wrap gap-2">
                  {validColors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-1.5 text-xs rounded-xl border-2 transition-all cursor-pointer font-black ${
                        selectedColor === color
                          ? 'border-slate-950 bg-slate-950 text-white shadow-xs'
                          : 'border-slate-300 text-slate-950 bg-white hover:border-slate-400'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes Variant Selector - Only rendered if sizes are entered */}
            {validSizes.length > 0 && (
              <div className="mt-4">
                <label className="text-xs font-black text-slate-950 block mb-2">
                  Pilihan Seri Ukuran / Size:
                </label>
                <div className="flex flex-wrap gap-2">
                  {validSizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1.5 text-xs rounded-xl border-2 transition-all cursor-pointer font-black ${
                        selectedSize === size
                          ? 'border-slate-950 bg-slate-950 text-white shadow-xs'
                          : 'border-slate-300 text-slate-950 bg-white hover:border-slate-400'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Unlimited Custom Variants Interactive Display - Only rendered if custom groups exist */}
            {product.customVariants && product.customVariants.filter((cv) => cv.groupName && cv.options && cv.options.length > 0).length > 0 && (
              <div className="mt-4 space-y-3 pt-2 border-t border-slate-200">
                {product.customVariants
                  .filter((cv) => cv.groupName && cv.options && cv.options.length > 0)
                  .map((grp, gIdx) => (
                  <div key={gIdx}>
                    <label className="text-xs font-black text-slate-950 block mb-2">
                      Pilihan {grp.groupName}:
                    </label>
                    <div className="flex flex-wrap gap-2">
                      {grp.options.map((opt) => (
                        <button
                          key={opt}
                          type="button"
                          onClick={() =>
                            setSelectedCustomVariants({
                              ...selectedCustomVariants,
                              [grp.groupName]: opt,
                            })
                          }
                          className={`px-3 py-1.5 text-xs rounded-xl border-2 transition-all cursor-pointer font-black ${
                            selectedCustomVariants[grp.groupName] === opt
                              ? 'border-amber-600 bg-amber-400 text-slate-950 shadow-xs'
                              : 'border-slate-300 text-slate-950 bg-white hover:border-slate-400'
                          }`}
                        >
                          {opt}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* User Requested WhatsApp Button for other variants */}
            <div className="mt-4 pt-2">
              <button
                type="button"
                onClick={handleAskOtherVariantsWhatsApp}
                className="w-full py-2 px-3 text-xs font-black text-slate-950 bg-amber-100 hover:bg-amber-200 border-2 border-amber-400 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
              >
                <MessageCircle className="w-4 h-4 text-amber-700" />
                <span>Tanya Varian / Warna / Seri Lain via WhatsApp</span>
              </button>
            </div>

            {/* Quantity Stepper */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-black text-slate-950">
                Jumlah Pesanan ({product.unit}):
              </span>
              <div className="flex items-center border-2 border-slate-400 rounded-xl overflow-hidden bg-white shadow-xs">
                <button
                  onClick={handleDecrement}
                  disabled={quantity <= product.minOrder}
                  className="p-2 text-slate-950 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-4 text-xs font-black font-mono text-slate-950">
                  {quantity}
                </span>
                <button
                  onClick={handleIncrement}
                  className="p-2 text-slate-950 hover:bg-slate-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Total Calculation Strip */}
            <div className="mt-4 p-3 bg-slate-100 border-2 border-slate-300 rounded-xl flex items-center justify-between text-xs">
              <span className="text-slate-950 font-black">
                Subtotal ({quantity} {product.unit}):
              </span>
              <span className="text-sm font-black text-slate-950 font-mono">
                {isAskAdmin ? 'Tanyakan Admin' : formatRupiah(grandTotal)}
              </span>
            </div>

            {/* Description */}
            <div className="mt-4 text-xs text-slate-900 leading-relaxed font-bold">
              <div className="font-black text-slate-950 mb-1">Deskripsi & Spesifikasi Produk:</div>
              <p>{product.description}</p>
            </div>

            {/* Extra Trust Info */}
            <div className="mt-4 pt-3 border-t border-slate-200 grid grid-cols-2 gap-2 text-xs text-slate-900 font-bold">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Foto nota lapak asli</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-4 h-4 text-emerald-700 shrink-0" />
                <span>Kirim via kargo murah</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-4 border-t-2 border-slate-300 space-y-2">
            {isAskAdmin ? (
              <button
                onClick={handleWhatsAppChat}
                className="w-full py-3 px-4 text-xs font-black text-white bg-emerald-600 hover:bg-emerald-700 rounded-2xl transition-colors shadow-md flex items-center justify-center gap-2 cursor-pointer"
              >
                <MessageCircle className="w-4 h-4 text-white" />
                <span>Tanyakan Harga &amp; Stok Produk Ini ke WhatsApp Admin</span>
              </button>
            ) : (
              <div className="grid grid-cols-2 gap-2.5">
                <button
                  onClick={handleAddToCart}
                  className="py-3 px-3 text-xs font-black text-slate-950 bg-slate-100 hover:bg-slate-200 border-2 border-slate-300 rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs"
                >
                  <ShoppingBag className="w-4 h-4 text-slate-950" />
                  + Keranjang
                </button>
                <button
                  onClick={handleBuyNow}
                  className="py-3 px-3 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-500 border-2 border-amber-500 rounded-2xl transition-colors shadow-sm flex items-center justify-center gap-2 cursor-pointer"
                >
                  <span>Beli Sekarang</span>
                  <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            )}

            <button
              onClick={handleWhatsAppChat}
              className="w-full py-2.5 px-3 text-xs font-black text-emerald-950 bg-emerald-50 hover:bg-emerald-100 border border-emerald-300 rounded-2xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-700" />
              <span>Konsultasi Stok & Nego via WhatsApp</span>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
};
