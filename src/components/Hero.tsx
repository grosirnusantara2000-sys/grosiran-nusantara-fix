import React from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingBag, FilePlus2, CheckCircle2, MapPin, Truck, Building2, RefreshCw } from 'lucide-react';

export const Hero: React.FC = () => {
  const { setCurrentView, activeOutlet, activeOutletInfo, setIsOutletSelectorOpen } = useApp();

  return (
    <section className="relative overflow-hidden bg-[#0e1726] text-white">
      {/* Background Image with Scrim */}
      <div className="absolute inset-0 z-0">
        <img
          src="/src/assets/images/hero_pasar_aur_kuning_1793527995583.jpg"
          alt="Grosir Nusantara - Tanah Abang & Aur Kuning"
          className="w-full h-full object-cover object-center opacity-25 filter brightness-75 contrast-110"
          referrerPolicy="no-referrer"
        />
        <div className="absolute inset-0 bg-gradient-to-r from-[#0a111c] via-[#0e1726]/90 to-[#0e1726]/75" />
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-14 sm:py-20 lg:py-24">
        <div className="max-w-2xl">
          {/* Active Outlet Pill / Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-slate-800/80 border border-slate-700/80 text-xs font-semibold text-amber-400 mb-4 backdrop-blur-xs">
            <MapPin className="w-4 h-4 text-amber-400 shrink-0" />
            <span>Outlet Terpilih: <b>{activeOutletInfo.name}</b></span>
            <span className="text-slate-500">·</span>
            <button
              onClick={() => setIsOutletSelectorOpen(true)}
              className="text-white hover:text-amber-300 underline font-bold cursor-pointer"
            >
              Ganti Outlet
            </button>
          </div>

          <h1 className="text-3xl sm:text-5xl lg:text-5xl font-black tracking-tight text-white leading-tight mb-4">
            NUSANTARA <span className="text-amber-400">GROSIR</span>
          </h1>

          <p className="text-xl sm:text-2xl font-bold text-slate-200 mb-4 leading-snug">
            Belanja Grosir &amp; Eceran: <span className="text-amber-400">Tanah Abang (Jakarta)</span> &amp; <span className="text-amber-400">Aur Kuning (Bukittinggi)</span>
          </p>

          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed mb-8 max-w-xl">
            {activeOutletInfo.description} Belanja barang grosir &amp; eceran langsung tangan pertama dari pusat grosir terbesar. Kami bantu carikan barang, foto fisik langsung dari pasar, dan kirimkan kargo hemat ke toko atau rumah Anda di seluruh Indonesia.
          </p>

          {/* Action Buttons */}
          <div className="flex flex-wrap items-center gap-4 mb-10">
            <button
              onClick={() => {
                setCurrentView('catalog');
                window.scrollTo({ top: 500, behavior: 'smooth' });
              }}
              className="px-6 py-3 text-xs sm:text-sm font-bold text-slate-950 bg-amber-400 hover:bg-amber-300 active:bg-amber-500 rounded-xl transition-all shadow-md flex items-center gap-2 cursor-pointer"
            >
              <ShoppingBag className="w-4 h-4" />
              <span>Katalog Grosir {activeOutletInfo.shortName}</span>
            </button>
            <button
              onClick={() => {
                setCurrentView('request');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-6 py-3 text-xs sm:text-sm font-bold text-slate-100 bg-slate-800/90 hover:bg-slate-700 hover:text-white border border-slate-700 rounded-xl transition-all flex items-center gap-2 cursor-pointer backdrop-blur-xs"
            >
              <FilePlus2 className="w-4 h-4 text-amber-400" />
              <span>Request Cari Barang Grosir</span>
            </button>
          </div>

          {/* 4 Trust Highlights Below Hero */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 pt-6 border-t border-slate-800 text-xs text-slate-300">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Harga Grosir Asli Lapak</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Foto Fisik &amp; Video Unboxing</span>
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Nota Fisik Toko Transparan</span>
            </div>
            <div className="flex items-center gap-2">
              <Truck className="w-4 h-4 text-emerald-400 shrink-0" />
              <span>Ekspedisi Kargo Se-Indonesia</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
