import React, { useState } from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { X, ShoppingBag, MessageCircle, ShieldCheck, Truck, Store, Plus, Minus, ArrowRight, Tag, Edit } from 'lucide-react';
import { BUSINESS_INFO } from '../data/initialData';

interface ProductDetailModalProps {
  product: Product | null;
  onClose: () => void;
}

export const ProductDetailModal: React.FC<ProductDetailModalProps> = ({ product, onClose }) => {
  if (!product) return null;

  const { addToCart, setIsCartOpen, setCurrentView, isAdmin, setQuickPriceEditProduct, setEditingProductModal, activeOutletInfo } = useApp();
  const [quantity, setQuantity] = useState(product.minOrder);
  const [selectedColor, setSelectedColor] = useState(product.colors?.[0] || '');
  const [selectedSize, setSelectedSize] = useState(product.sizes?.[0] || '');

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
    const wa = (activeOutletInfo.whatsappNumber || '081298765432').replace(/^0/, '');
    const text = `Halo Admin Grosir Nusantara (${activeOutletInfo.shortName}), saya tertarik order produk:\n*${product.name}*\nJumlah: ${quantity} ${product.unit}\nWarna: ${selectedColor || '-'}\nUkuran: ${selectedSize || '-'}\nTotal: ${formatRupiah(grandTotal)}\nMohon info ketersediaan di sentra ${activeOutletInfo.name}. Terima kasih!`;
    const url = `https://wa.me/62${wa}?text=${encodeURIComponent(text)}`;
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

        {/* Left Column: Image */}
        <div className="md:w-1/2 bg-slate-50 relative flex items-center justify-center p-6 border-b md:border-b-0 md:border-r border-slate-200">
          <img
            src={product.imageUrl}
            alt={product.name}
            className="w-full h-auto max-h-[360px] md:max-h-[500px] object-cover rounded-xl shadow-xs"
            referrerPolicy="no-referrer"
          />
          <div className="absolute bottom-4 left-4 right-4 bg-white/90 backdrop-blur-xs p-2.5 rounded-lg border border-slate-200 text-xs text-slate-700 flex items-center gap-2">
            <Store className="w-4 h-4 text-orange-600 shrink-0" />
            <span>Belanja tangan pertama langsung di {activeOutletInfo.name}</span>
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
