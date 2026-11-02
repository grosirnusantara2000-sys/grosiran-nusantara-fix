import React from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { ShoppingBag, Eye, MessageCircle, Tag } from 'lucide-react';
import { BUSINESS_INFO } from '../data/initialData';

interface ProductCardProps {
  product: Product;
  onOpenDetail: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenDetail }) => {
  const { addToCart, isAdmin, setQuickPriceEditProduct, activeOutletInfo } = useApp();

  const formatRupiah = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const handleWhatsAppAsk = (e: React.MouseEvent) => {
    e.stopPropagation();
    const wa = (activeOutletInfo.whatsappNumber || '081298765432').replace(/^0/, '');
    const message = `Halo Admin Grosir Nusantara (${activeOutletInfo.shortName}), saya mau tanya ketersediaan stok & harga grosir produk: *${product.name}* (Min Order ${product.minOrder} ${product.unit}). Apakah ready di sentra ${activeOutletInfo.shortName}?`;
    const url = `https://wa.me/62${wa}?text=${encodeURIComponent(message)}`;
    window.open(url, '_blank');
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, product.minOrder);
  };

  return (
    <div
      onClick={() => onOpenDetail(product)}
      className="group bg-white rounded-xl border border-slate-200/90 hover:border-slate-300 hover:shadow-lg transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer"
    >
      {/* Product Image (Lead with Imagery - 65% height of container) */}
      <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-104 transition-transform duration-300"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            // Stylized CSS fallback if image fails
            (e.target as HTMLElement).style.display = 'none';
          }}
        />

        {/* Minimal Subtle Metadata */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className="text-[10px] font-semibold tracking-wider uppercase bg-white/90 backdrop-blur-xs text-slate-800 px-2 py-0.5 rounded shadow-2xs">
            Min. {product.minOrder} {product.unit}
          </span>
          {!product.inStock && (
            <span className="text-[10px] font-bold uppercase bg-red-600 text-white px-2 py-0.5 rounded shadow-2xs">
              Habis
            </span>
          )}
        </div>

        {isAdmin && (
          <div className="absolute top-2.5 right-2.5 z-10">
            <button
              onClick={(e) => {
                e.stopPropagation();
                setQuickPriceEditProduct(product);
              }}
              className="px-2 py-1 bg-amber-400 hover:bg-amber-300 text-slate-900 rounded-md shadow-sm text-[10px] font-extrabold flex items-center gap-1 cursor-pointer transition-transform hover:scale-105"
              title="Ubah harga produk ini sebagai owner"
            >
              <Tag className="w-3 h-3 text-slate-900" />
              <span>Ubah Harga</span>
            </button>
          </div>
        )}

        {/* Hover Quick Action Overlay */}
        <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 p-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(product);
            }}
            className="p-2.5 bg-white text-slate-800 hover:text-blue-900 rounded-lg shadow-md hover:scale-105 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="Lihat Detail Produk"
          >
            <Eye className="w-4 h-4" />
            <span className="hidden sm:inline">Detail</span>
          </button>
          <button
            onClick={handleQuickAdd}
            className="p-2.5 bg-orange-600 text-white hover:bg-orange-700 rounded-lg shadow-md hover:scale-105 transition-all text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
            title="Tambah ke Keranjang"
          >
            <ShoppingBag className="w-4 h-4" />
            <span className="hidden sm:inline">Beli Min.</span>
          </button>
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4 flex flex-col justify-between flex-1">
        <div>
          <div className="text-[11px] font-medium text-slate-500 uppercase tracking-wider mb-1">
            {product.categoryName}
          </div>
          <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-900 transition-colors line-clamp-2 leading-snug">
            {product.name}
          </h3>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-100">
          {/* Transparent Wholesale Pricing Breakdown */}
          <div className="flex items-baseline justify-between">
            <div>
              <div className="text-xs text-slate-500">Harga Grosir Lapak</div>
              <div className="text-base font-extrabold text-slate-900 font-mono-nums">
                {formatRupiah(product.wholesalePrice)}
                <span className="text-xs font-normal text-slate-500 font-sans"> /{product.unit}</span>
              </div>
            </div>
            <div className="text-right">
              <div className="text-[11px] text-slate-500">Harga Eceran</div>
              <div className="text-xs font-semibold text-emerald-700 font-mono-nums">
                {formatRupiah(product.retailPrice || product.price)}
              </div>
            </div>
          </div>

          {/* Quick Buttons Footer */}
          <div className="mt-3 grid grid-cols-2 gap-2 pt-2">
            <button
              onClick={handleWhatsAppAsk}
              className="py-1.5 px-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <MessageCircle className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tanya WA</span>
            </button>
            <button
              onClick={handleQuickAdd}
              className="py-1.5 px-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 rounded-lg flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
            >
              <ShoppingBag className="w-3.5 h-3.5" />
              <span>+ Keranjang</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
