import React from 'react';
import { useApp } from '../context/AppContext';
import { BUSINESS_INFO } from '../data/initialData';
import { getCleanWhatsappNumber, formatWhatsappDisplay } from '../utils/whatsapp';
import { MapPin, Phone, Mail, Clock, ShieldCheck, Heart } from 'lucide-react';

export const Footer: React.FC = () => {
  const { setCurrentView, setSelectedCategorySlug, storeSettings } = useApp();

  const activeWhatsapp = storeSettings?.whatsappNumber?.trim() || BUSINESS_INFO.whatsapp;
  const cleanWhatsapp = getCleanWhatsappNumber(activeWhatsapp);
  const activeEmail = storeSettings?.email || BUSINESS_INFO.email;
  const activeAddress = storeSettings?.address || BUSINESS_INFO.address;
  const activeStoreName = storeSettings?.storeName || 'GROSIR NUSANTARA';

  return (
    <footer className="bg-slate-950 text-slate-300 pt-16 pb-12 border-t border-slate-800">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-10 pb-12 border-b border-slate-800">
          {/* Brand Info */}
          <div className="space-y-4">
            <div className="text-xl font-black text-white tracking-tight flex items-center gap-2.5">
              <img
                src="/assets/aistudio/Logo_Grosir_Nusantara_Warna_Nusantara_fc818c0f.png"
                alt="Grosir Nusantara"
                className="h-9 object-contain"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src.indexOf('/public/') === -1) {
                    target.src = '/public/assets/aistudio/Logo_Grosir_Nusantara_Warna_Nusantara_fc818c0f.png';
                  }
                }}
              />
              <span>{activeStoreName}</span>
            </div>
            <p className="text-xs text-slate-400 leading-relaxed">
              {storeSettings?.tagline || 'Platform belanja grosir dan eceran terpercaya dari sentra Tanah Abang DKI Jakarta dan Pasar Aur Kuning Bukittinggi. Belanja mudah tangan pertama dengan pengiriman ke seluruh Indonesia.'}
            </p>
            <div className="pt-2 text-xs text-slate-400 space-y-1.5">
              <div className="flex items-start gap-2">
                <MapPin className="w-4 h-4 text-orange-500 shrink-0 mt-0.5" />
                <span>{activeAddress}</span>
              </div>
              <div className="flex items-center gap-2">
                <Clock className="w-4 h-4 text-orange-500 shrink-0" />
                <span>{storeSettings?.marketDays || BUSINESS_INFO.marketDays}</span>
              </div>
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Layanan & Menu
            </h4>
            <ul className="space-y-2 text-xs text-slate-400">
              <li>
                <button
                  onClick={() => {
                    setSelectedCategorySlug(null);
                    setCurrentView('catalog');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Katalog Semua Produk
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentView('request');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Request Barang Khusus
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentView('orders');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Lacak Pesanan & Invoice
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentView('about');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Tentang Pasar Aur Kuning
                </button>
              </li>
              <li>
                <button
                  onClick={() => {
                    setCurrentView('blog');
                    window.scrollTo({ top: 0, behavior: 'smooth' });
                  }}
                  className="hover:text-white transition-colors cursor-pointer"
                >
                  Panduan Belanja & Blog SEO
                </button>
              </li>
            </ul>
          </div>

          {/* Ketentuan Pengiriman */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Ketentuan Pengiriman
            </h4>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Toko kami tidak melayani pengiriman langsung. Segala pengambilan atau pengiriman barang wajib dikonfirmasi terlebih dahulu ke Admin via WhatsApp.
            </p>
            <div className="p-2.5 bg-slate-900 border border-slate-800 rounded-lg text-[11px] text-amber-400 font-semibold">
              Biaya pengiriman akan ditambahkan secara manual oleh admin setelah disepakati bersama.
            </div>
          </div>

          {/* Kontak CS & WhatsApp */}
          <div>
            <h4 className="text-xs font-bold text-white uppercase tracking-wider mb-4">
              Customer Support
            </h4>
            <p className="text-xs text-slate-400 mb-3 leading-relaxed">
              Hubungi layanan admin untuk konfirmasi ketersediaan barang dan diskusi pengiriman:
            </p>
            <div className="space-y-2 text-xs">
              <a
                href={`https://wa.me/${cleanWhatsapp}?text=${encodeURIComponent(`Halo Admin ${activeStoreName}, saya ingin bertanya seputar layanan belanja.`)}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-600 text-white rounded-lg font-bold transition-colors"
              >
                <Phone className="w-3.5 h-3.5" />
                <span>WhatsApp: {formatWhatsappDisplay(activeWhatsapp)}</span>
              </a>
              <div className="text-[11px] text-slate-400 pt-1">
                Email: {activeEmail}
              </div>
            </div>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="pt-8 flex flex-col sm:flex-row items-center justify-between text-xs text-slate-500 gap-4">
          <div>
            © {new Date().getFullYear()} GROSIR NUSANTARA. Hak Cipta Dilindungi.
          </div>
          <div className="flex items-center gap-4 text-[11px]">
            <button
              onClick={() => setCurrentView('trust-safety')}
              className="hover:text-slate-300"
            >
              Transparansi Biaya
            </button>
            <span>·</span>
            <button
              onClick={() => setCurrentView('privacy')}
              className="hover:text-slate-300"
            >
              Kebijakan Privasi
            </button>
            <span>·</span>
            <button
              onClick={() => setCurrentView('terms')}
              className="hover:text-slate-300"
            >
              Syarat & Ketentuan
            </button>
          </div>
        </div>
      </div>
    </footer>
  );
};
