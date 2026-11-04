import React from 'react';
import { Product } from '../types';
import { useApp } from '../context/AppContext';
import { ShoppingBag, Eye, MessageCircle, Tag, Layers } from 'lucide-react';
import { getWhatsappChatUrl, getEffectiveWhatsapp, formatProductInquiryMessage } from '../utils/whatsapp';
import { getSafeImageUrl, DEFAULT_PRODUCT_IMAGE } from '../utils/imageUtils';

interface ProductCardProps {
  product: Product;
  onOpenDetail: (product: Product) => void;
}

export const ProductCard: React.FC<ProductCardProps> = ({ product, onOpenDetail }) => {
  const { addToCart, isAdmin, setQuickPriceEditProduct, activeOutletInfo, storeSettings } = useApp();

  const isAskAdmin = !!product.askAdminPrice || product.wholesalePrice <= 0;

  const formatRupiah = (num: number) => {
    return 'Rp ' + num.toLocaleString('id-ID');
  };

  const handleWhatsAppAsk = (e: React.MouseEvent) => {
    e.stopPropagation();
    const effectiveWa = getEffectiveWhatsapp(storeSettings, 'tanya_admin', activeOutletInfo.whatsappNumber);
    const customText = isAskAdmin
      ? `Halo Admin Grosir Nusantara, saya tertarik dengan produk:\n*${product.name}* (ID: ${product.id})\nBerapa harga grosir terbaik untuk produk ini? Mohon infonya ya.`
      : formatProductInquiryMessage(storeSettings, product);
    const url = getWhatsappChatUrl(effectiveWa, customText);
    window.open(url, '_blank');
  };

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.stopPropagation();
    addToCart(product, product.minOrder);
  };

  return (
    <div
      onClick={() => onOpenDetail(product)}
      className="group bg-white rounded-2xl border-2 border-slate-300 hover:border-amber-500 hover:shadow-xl transition-all duration-200 flex flex-col justify-between overflow-hidden cursor-pointer"
    >
      {/* Product Image */}
      <div className="relative aspect-4/3 w-full bg-slate-100 overflow-hidden">
        <img
          src={getSafeImageUrl(product.imageUrl || product.images?.[0])}
          alt={product.name}
          className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-300"
          loading="lazy"
          referrerPolicy="no-referrer"
          onError={(e) => {
            const target = e.currentTarget;
            if (target.src !== DEFAULT_PRODUCT_IMAGE) {
              target.src = DEFAULT_PRODUCT_IMAGE;
            }
          }}
        />

        {/* Gallery badge if product has multiple photos */}
        {((product.images && product.images.length > 1) || (product.galleryUrls && product.galleryUrls.length > 1)) && (
          <div className="absolute bottom-2.5 right-2.5 bg-slate-950/85 backdrop-blur-xs text-white text-[10px] font-black px-2 py-0.5 rounded-md flex items-center gap-1 shadow-sm">
            <Layers className="w-3 h-3 text-amber-400" />
            <span>{product.images?.length || product.galleryUrls?.length} Foto</span>
          </div>
        )}

        {/* Minimal Metadata */}
        <div className="absolute top-2.5 left-2.5 flex items-center gap-1.5">
          <span className="text-[10px] font-black uppercase bg-white/95 text-slate-950 px-2 py-0.5 rounded-md shadow-sm border border-slate-300">
            Min. {product.minOrder} {product.unit}
          </span>
          {!product.inStock && (
            <span className="text-[10px] font-black uppercase bg-red-600 text-white px-2 py-0.5 rounded-md shadow-sm">
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
              className="px-2 py-1 bg-amber-400 hover:bg-amber-300 text-slate-950 rounded-lg shadow text-[10px] font-black flex items-center gap-1 cursor-pointer transition-transform hover:scale-105 border border-amber-500"
              title="Ubah harga produk ini sebagai owner"
            >
              <Tag className="w-3 h-3 text-slate-950" />
              <span>Ubah Harga</span>
            </button>
          </div>
        )}

        {/* Hover Quick Action Overlay */}
        <div className="absolute inset-0 bg-slate-950/35 opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex items-center justify-center gap-2 p-3">
          <button
            onClick={(e) => {
              e.stopPropagation();
              onOpenDetail(product);
            }}
            className="p-2.5 bg-white text-slate-950 hover:bg-slate-100 rounded-xl shadow-lg hover:scale-105 transition-all text-xs font-black flex items-center gap-1.5 cursor-pointer"
            title="Lihat Detail Produk"
          >
            <Eye className="w-4 h-4 text-slate-950" />
            <span>Detail</span>
          </button>
          {!isAskAdmin && (
            <button
              onClick={handleQuickAdd}
              className="p-2.5 bg-amber-500 text-slate-950 hover:bg-amber-400 rounded-xl shadow-lg hover:scale-105 transition-all text-xs font-black flex items-center gap-1.5 cursor-pointer"
              title="Tambah ke Keranjang"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Beli Min.</span>
            </button>
          )}
        </div>
      </div>

      {/* Product Details */}
      <div className="p-4 flex flex-col justify-between flex-1">
        <div>
          <div className="text-[11px] font-black text-slate-800 uppercase tracking-wider mb-1">
            {product.categoryName}
          </div>
          <h3 className="text-sm font-black text-slate-950 group-hover:text-amber-800 transition-colors line-clamp-2 leading-snug">
            {product.name}
          </h3>
        </div>

        <div className="mt-3 pt-3 border-t border-slate-200">
          {/* Pricing or "Tanyakan Admin" */}
          {isAskAdmin ? (
            <div className="py-1">
              <div className="text-[11px] font-bold text-slate-700">Harga Grosir:</div>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="inline-block px-2.5 py-1 bg-amber-100 text-slate-950 border border-amber-400 rounded-lg font-black text-xs">
                  Tanyakan Admin
                </span>
                <span className="text-[11px] text-slate-700 font-bold">/{product.unit}</span>
              </div>
            </div>
          ) : (
            <div className="flex items-baseline justify-between">
              <div>
                <div className="text-[11px] font-bold text-slate-700">Harga Grosir Lapak</div>
                <div className="text-base font-black text-slate-950 font-mono">
                  {formatRupiah(product.wholesalePrice)}
                  <span className="text-xs font-bold text-slate-700 font-sans"> /{product.unit}</span>
                </div>
              </div>
              <div className="text-right">
                <div className="text-[10px] font-bold text-slate-700">Harga Eceran</div>
                <div className="text-xs font-black text-emerald-800 font-mono">
                  {formatRupiah(product.retailPrice || product.price)}
                </div>
              </div>
            </div>
          )}

          {/* Quick Buttons Footer */}
          <div className="mt-3 grid grid-cols-2 gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={handleWhatsAppAsk}
              className={`py-1.5 px-2 text-xs font-black rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer border ${
                isAskAdmin
                  ? 'col-span-2 bg-emerald-600 hover:bg-emerald-700 text-white border-emerald-700 shadow-sm py-2'
                  : 'text-slate-950 bg-slate-100 hover:bg-slate-200 border-slate-300'
              }`}
            >
              <MessageCircle className={`w-3.5 h-3.5 ${isAskAdmin ? 'text-white' : 'text-emerald-700'}`} />
              <span>{isAskAdmin ? 'Tanya Harga via WhatsApp' : 'Tanya WA'}</span>
            </button>
            
            {!isAskAdmin && (
              <button
                onClick={handleQuickAdd}
                className="py-1.5 px-2 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-500 border border-amber-500 rounded-xl flex items-center justify-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              >
                <ShoppingBag className="w-3.5 h-3.5" />
                <span>+ Keranjang</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
