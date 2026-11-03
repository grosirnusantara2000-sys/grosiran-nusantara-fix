import React, { useState } from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { X, ShoppingBag, MessageCircle, ShieldCheck, Truck, Store, Plus, Minus, ArrowRight, Tag, Edit, ChevronLeft, ChevronRight, Layers } from 'lucide-react';
import { getWhatsappChatUrl, getEffectiveWhatsapp } from '../utils/whatsapp';
import { getSafeImageUrl, DEFAULT_PRODUCT_IMAGE } from '../utils/imageUtils';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  if (!product) return null;

  const { addToCart, setIsCartOpen, setCurrentView, isAdmin, setQuickPriceEditProduct, setEditingProductModal, activeOutletInfo, storeSettings } = useApp();
  const [quantity, setQuantity] = useState(product.minOrder);
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || '');
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '');
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

  const subtotalItem = product.wholesalePrice * quantity;
  const grandTotal = subtotalItem;

  const handleIncrement = () => setQuantity((prev) => prev + 1);
  const handleDecrement = () => setQuantity((prev) => Math.max(product.minOrder, prev - 1));

  const handleAddToCart = () => {
    addToCart(product, quantity, selectedColor, selectedSize);
    onClose();
  };

  const handleBuyNow = () => {
    addToCart(product, quantity, selectedColor, selectedSize);
    onClose();
    setCurrentView('checkout');
  };

  const handleWhatsAppChat = () => {
    const effectiveWa = getEffectiveWhatsapp(storeSettings, 'tanya_admin', activeOutletInfo.whatsappNumber);
    const text = `Halo Admin Grosir Nusantara (${activeOutletInfo.shortName}), saya tertarik order produk:\n*${product.name}*\nJumlah: ${quantity} ${product.unit}\nWarna: ${selectedColor || '-'}\nUkuran: ${selectedSize || '-'}\nTotal: ${formatRupiah(grandTotal)}\nMohon info ketersediaan di sentra ${activeOutletInfo.name}. Terima kasih!`;
    const url = getWhatsappChatUrl(effectiveWa, text);
    window.open(url, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="bg-white rounded-2xl max-w-4xl w-full overflow-hidden shadow-2xl my-6 flex flex-col md:flex-row relative max-h-[90vh]">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-3 right-3 z-10 p-2 rounded-full bg-white/80 hover:bg-white text-slate-700 hover:text-slate-900 shadow-md transition-all cursor-pointer"
          aria-label="Tutup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Left Column: Multi-Image Gallery */}
        <div className="md:w-1/2 bg-slate-50 relative flex flex-col justify-between p-5 border-b md:border-b-0 md:border-r border-slate-200">
          {/* Main Featured Photo */}
          <div className="relative w-full aspect-4/3 sm:aspect-square max-h-[360px] md:max-h-[420px] rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center shadow-xs">
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
                  className="absolute left-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 hover:bg-black/75 text-white backdrop-blur-xs transition-colors cursor-pointer"
                  title="Foto Sebelumnya"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                <button
                  type="button"
                  onClick={() => setActiveImageIndex((prev) => (prev < allImages.length - 1 ? prev + 1 : 0))}
                  className="absolute right-2 top-1/2 -translate-y-1/2 p-1.5 rounded-full bg-black/50 hover:bg-black/75 text-white backdrop-blur-xs transition-colors cursor-pointer"
                  title="Foto Selanjutnya"
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <div className="absolute top-2.5 right-2.5 bg-black/60 backdrop-blur-xs text-white text-[10px] font-bold px-2 py-0.5 rounded-md">
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
                  className={`relative w-14 h-14 rounded-lg overflow-hidden border-2 shrink-0 transition-all cursor-pointer ${
                    activeImageIndex === idx
                      ? 'border-amber-500 ring-2 ring-amber-400/30 scale-102'
                      : 'border-slate-200 opacity-70 hover:opacity-100'
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
                    <span className="absolute bottom-0 inset-x-0 bg-slate-900/80 text-[8px] text-center font-bold text-amber-300 py-0.2">
                      Utama
                    </span>
                  )}
                </button>
              ))}
            </div>
          )}

          {/* Sourcing Badge */}
          <div className="mt-3 bg-white/95 backdrop-blur-xs p-2 rounded-lg border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
            <Store className="w-4 h-4 text-orange-600 shrink-0" />
            <span className="truncate">Tangan pertama langsung di {activeOutletInfo.name}</span>
          </div>
        </div>

        {/* Right Column: Contiguous Purchase Module */}
        <div className="md:w-1/2 p-6 overflow-y-auto flex flex-col justify-between">
          <div>
            {isAdmin && (
              <div className="mb-3 p-2.5 bg-amber-50 border border-amber-200 rounded-xl flex items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
                  <Tag className="w-3.5 h-3.5 text-amber-600" />
                  <span>Aksi Owner:</span>
                </div>
                <div className="flex items-center gap-1.5">
                  <button
                    onClick={() => {
                      onClose();
                      setQuickPriceEditProduct(product);
                    }}
                    className="px-2.5 py-1 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-lg text-xs font-bold flex items-center gap-1 cursor-pointer"
                  >
                    <Tag className="w-3 h-3" />
                    Ubah Harga
                  </button>
                  <button
                    onClick={() => {
                      onClose();
                      setEditingProductModal(product);
                    }}
                    className="px-2.5 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold flex items-center gap-1 cursor-pointer"
                  >
                    <Edit className="w-3 h-3" />
                    Edit Lengkap
                  </button>
                </div>
              </div>
            )}

            <div className="text-xs font-bold text-orange-600 uppercase tracking-wider">
              {product.categoryName}
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 leading-snug">
              {product.name}
            </h2>

            {/* Transparent Pricing Box */}
            <div className="mt-4 p-4 bg-slate-50 rounded-xl border border-slate-200/80">
              <div className="flex items-baseline justify-between mb-2">
                <span className="text-xs text-slate-600">Harga Grosir Lapak:</span>
                <span className="text-lg font-bold text-slate-900 font-mono-nums">
                  {formatRupiah(product.wholesalePrice)}
                  <span className="text-xs font-normal text-slate-500 font-sans"> /{product.unit}</span>
                </span>
              </div>
              <div className="flex items-baseline justify-between mb-2 text-xs">
                <span className="text-slate-600">Harga Eceran Toko:</span>
                <span className="font-semibold text-emerald-700 font-mono-nums">
                  {formatRupiah(product.retailPrice || product.price)} /{product.unit}
                </span>
              </div>
              <div className="pt-2 border-t border-slate-200 flex items-baseline justify-between">
                <span className="text-xs font-bold text-slate-800">Harga per {product.unit}:</span>
                <span className="text-base font-extrabold text-blue-900 font-mono-nums">
                  {formatRupiah(product.wholesalePrice)}
                </span>
              </div>
              <div className="mt-2 text-[11px] text-slate-500">
                * Minimal pembelian grosir: <strong className="text-slate-800 font-mono-nums">{product.minOrder} {product.unit}</strong> (Tanpa biaya perantara)
              </div>
            </div>

            {/* Colors Variant Selector */}
            {product.colors && product.colors.length > 0 && (
              <div className="mt-4">
                <label className="text-xs font-bold text-slate-800 block mb-2">
                  Pilih Seri Warna / Motif:
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.colors.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setSelectedColor(color)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-all cursor-pointer ${
                        selectedColor === color
                          ? 'border-blue-900 bg-blue-900 text-white font-semibold'
                          : 'border-slate-200 text-slate-700 bg-white hover:border-slate-300'
                      }`}
                    >
                      {color}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Sizes Variant Selector */}
            {product.sizes && product.sizes.length > 0 && (
              <div className="mt-4">
                <label className="text-xs font-bold text-slate-800 block mb-2">
                  Pilih Ukuran / Seri Size:
                </label>
                <div className="flex flex-wrap gap-2">
                  {product.sizes.map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => setSelectedSize(size)}
                      className={`px-3 py-1.5 text-xs rounded-lg border transition-all cursor-pointer ${
                        selectedSize === size
                          ? 'border-blue-900 bg-blue-900 text-white font-semibold'
                          : 'border-slate-200 text-slate-700 bg-white hover:border-slate-300'
                      }`}
                    >
                      {size}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Quantity Stepper */}
            <div className="mt-4 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Jumlah Pesanan ({product.unit}):
              </span>
              <div className="flex items-center border border-slate-300 rounded-lg overflow-hidden bg-white">
                <button
                  onClick={handleDecrement}
                  disabled={quantity <= product.minOrder}
                  className="p-2 text-slate-600 hover:bg-slate-100 disabled:opacity-40 transition-colors"
                >
                  <Minus className="w-3.5 h-3.5" />
                </button>
                <span className="px-4 text-xs font-bold font-mono-nums text-slate-900">
                  {quantity}
                </span>
                <button
                  onClick={handleIncrement}
                  className="p-2 text-slate-600 hover:bg-slate-100 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Total Calculation Strip */}
            <div className="mt-4 p-3 bg-blue-50/70 border border-blue-100 rounded-lg flex items-center justify-between text-xs">
              <span className="text-blue-950 font-medium">Subtotal ({quantity} {product.unit}):</span>
              <span className="text-sm font-extrabold text-blue-900 font-mono-nums">
                {formatRupiah(grandTotal)}
              </span>
            </div>

            {/* Description */}
            <div className="mt-4 text-xs text-slate-600 leading-relaxed">
              <div className="font-bold text-slate-800 mb-1">Deskripsi & Spesifikasi Lapak:</div>
              <p>{product.description}</p>
            </div>

            {/* Extra trust info */}
            <div className="mt-4 pt-3 border-t border-slate-100 grid grid-cols-2 gap-2 text-[11px] text-slate-500">
              <div className="flex items-center gap-1.5">
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Foto nota lapak asli</span>
              </div>
              <div className="flex items-center gap-1.5">
                <Truck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                <span>Kirim via kargo murah</span>
              </div>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="mt-6 pt-4 border-t border-slate-200 space-y-2">
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={handleAddToCart}
                className="py-2.5 px-3 text-xs font-semibold text-slate-800 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors flex items-center justify-center gap-1.5 cursor-pointer"
              >
                <ShoppingBag className="w-4 h-4" />
                + Keranjang
              </button>
              <button
                onClick={handleBuyNow}
                className="py-2.5 px-3 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors shadow-xs flex items-center justify-center gap-1.5 cursor-pointer"
              >
                Beli Sekarang
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            </div>
            <button
              onClick={handleWhatsAppChat}
              className="w-full py-2.5 px-3 text-xs font-medium text-emerald-800 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200 rounded-xl transition-colors flex items-center justify-center gap-2 cursor-pointer"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              Konsultasi Stok & Nego via WhatsApp
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
