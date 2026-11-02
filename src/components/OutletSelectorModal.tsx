import React from 'react';
import { useApp } from '../context/AppContext';
import { OutletId } from '../types';
import { OUTLETS_DATA } from '../data/initialData';
import {
  Store,
  CheckCircle2,
  ArrowRight,
  MapPin,
  Clock,
  Sparkles,
  ShieldCheck,
  X,
  Building2,
} from 'lucide-react';

interface OutletSelectorModalProps {
  forceOpen?: boolean;
}

export const OutletSelectorModal: React.FC<OutletSelectorModalProps> = ({ forceOpen }) => {
  const {
    activeOutlet,
    setActiveOutlet,
    isOutletSelectorOpen,
    setIsOutletSelectorOpen,
  } = useApp();

  const isOpen = forceOpen !== undefined ? forceOpen : isOutletSelectorOpen;

  if (!isOpen) return null;

  const handleSelect = (outletId: OutletId) => {
    setActiveOutlet(outletId);
    setIsOutletSelectorOpen(false);
  };

  const hasChosenBefore = !!localStorage.getItem('grosir_nusantara_active_outlet');

  return (
    <div className="fixed inset-0 z-50 bg-slate-950/80 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 overflow-y-auto animate-in fade-in duration-200">
      <div className="relative bg-white rounded-3xl shadow-2xl max-w-4xl w-full border border-slate-200 overflow-hidden my-auto">
        
        {/* Top Close Button (only if user has chosen an outlet previously) */}
        {hasChosenBefore && (
          <button
            type="button"
            onClick={() => setIsOutletSelectorOpen(false)}
            className="absolute top-4 right-4 z-10 p-2 text-slate-400 hover:text-slate-700 bg-white/80 hover:bg-slate-100 rounded-full transition-colors cursor-pointer shadow-xs"
            title="Tutup Pilihan Outlet"
          >
            <X className="w-5 h-5" />
          </button>
        )}

        {/* Modal Header with Logo from Image Attachment */}
        <div className="pt-8 pb-6 px-6 sm:px-10 text-center bg-radial from-slate-50 to-white border-b border-slate-100">
          <div className="inline-flex items-center justify-center mb-3">
            <img
              src="/assets/aistudio/Logo_Grosir_Nusantara_Warna_Nusantara_fc818c0f.png"
              alt="Grosir Nusantara"
              className="h-16 sm:h-20 object-contain drop-shadow-sm"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src.indexOf('/public/') === -1) {
                  target.src = '/public/assets/aistudio/Logo_Grosir_Nusantara_Warna_Nusantara_fc818c0f.png';
                }
              }}
            />
          </div>

          <h2 className="text-2xl sm:text-3xl font-black text-slate-900 tracking-tight">
            GROSIR <span className="text-amber-500">NUSANTARA</span>
          </h2>
          <p className="text-xs sm:text-sm font-medium text-slate-600 mt-1 max-w-xl mx-auto leading-relaxed">
            Platform Belanja Grosir &amp; Eceran Terpercaya Tangan Pertama dari Dua Sentra Grosir Terbesar di Indonesia
          </p>

          <div className="mt-3 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-600 text-xs font-semibold">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>Silakan pilih pasar / outlet belanja yang ingin Anda tuju:</span>
          </div>
        </div>

        {/* 2 Big Elegant Outlet Selection Cards (Matching attached image style) */}
        <div className="p-6 sm:p-10 grid grid-cols-1 md:grid-cols-2 gap-6 bg-slate-50/60">
          
          {/* Card 1: TANAH ABANG (JAKARTA) - Deep Navy */}
          <div
            onClick={() => handleSelect('TANAH_ABANG')}
            className={`group relative rounded-2xl p-6 transition-all duration-200 cursor-pointer border-2 flex flex-col justify-between overflow-hidden ${
              activeOutlet === 'TANAH_ABANG'
                ? 'border-[#0f2744] bg-[#0f2744] text-white shadow-xl scale-[1.01]'
                : 'border-slate-200 bg-white hover:border-[#0f2744] hover:shadow-xl hover:-translate-y-1 text-slate-800'
            }`}
          >
            {/* Background Landmark Graphic */}
            <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
              <Building2 className="w-48 h-48" />
            </div>

            <div>
              {/* Top Tag & Landmark */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase ${
                    activeOutlet === 'TANAH_ABANG'
                      ? 'bg-amber-400 text-slate-900'
                      : 'bg-blue-50 text-[#0f2744] border border-blue-200'
                  }`}
                >
                  {/* Monas Icon Silhouette */}
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M11 2h2v4h-2zm-1 5h4l1 7h-6zm-3 8h10l2 7H4z" />
                  </svg>
                  <span>DKI JAKARTA</span>
                </span>

                {activeOutlet === 'TANAH_ABANG' && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-amber-400">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aktif</span>
                  </span>
                )}
              </div>

              {/* Title & Slogan */}
              <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
                Tanah Abang <span className="text-amber-400">(Jakarta)</span>
              </h3>
              <p
                className={`text-xs mt-1 font-semibold ${
                  activeOutlet === 'TANAH_ABANG' ? 'text-slate-200' : 'text-[#0f2744]'
                }`}
              >
                Pusat Grosir Tekstil &amp; Fashion Terbesar Asia Tenggara
              </p>

              {/* Description & Specialties */}
              <p
                className={`text-xs mt-3 leading-relaxed ${
                  activeOutlet === 'TANAH_ABANG' ? 'text-slate-300' : 'text-slate-600'
                }`}
              >
                Katalog ribuan konveksi Blok A, Blok B, Blok F, &amp; Pasar Pagi. Gamis silk plisket, kemeja oxford, kaos combed distro, celana chino, busana impor, dan bahan tekstil langsung dari gudang.
              </p>

              {/* Badges / Highlights */}
              <div className="mt-4 pt-3 border-t border-slate-200/20 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  <span>Kawasan Pasar Tanah Abang, Jl. KH. Wahid Hasyim</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 shrink-0 text-amber-400" />
                  <span>Buka Setiap Hari (08.00 - 16.00 WIB)</span>
                </div>
              </div>
            </div>

            {/* Action CTA Button */}
            <div className="mt-6 pt-3">
              <button
                type="button"
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md ${
                  activeOutlet === 'TANAH_ABANG'
                    ? 'bg-amber-400 hover:bg-amber-300 text-slate-900 font-extrabold'
                    : 'bg-[#0f2744] hover:bg-[#1a385f] text-white'
                }`}
              >
                <span>Masuk Outlet Tanah Abang</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

          {/* Card 2: AUR KUNING (BUKITTINGGI) - Golden Amber */}
          <div
            onClick={() => handleSelect('AUR_KUNING')}
            className={`group relative rounded-2xl p-6 transition-all duration-200 cursor-pointer border-2 flex flex-col justify-between overflow-hidden ${
              activeOutlet === 'AUR_KUNING'
                ? 'border-amber-500 bg-amber-500 text-slate-950 shadow-xl scale-[1.01]'
                : 'border-slate-200 bg-white hover:border-amber-500 hover:shadow-xl hover:-translate-y-1 text-slate-800'
            }`}
          >
            {/* Background Landmark Graphic */}
            <div className="absolute -right-6 -bottom-6 opacity-10 group-hover:opacity-20 transition-opacity pointer-events-none">
              <Store className="w-48 h-48" />
            </div>

            <div>
              {/* Top Tag & Landmark */}
              <div className="flex items-center justify-between mb-4">
                <span
                  className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-extrabold tracking-wide uppercase ${
                    activeOutlet === 'AUR_KUNING'
                      ? 'bg-slate-900 text-amber-400'
                      : 'bg-amber-50 text-amber-800 border border-amber-200'
                  }`}
                >
                  {/* Rumah Gadang Icon Silhouette */}
                  <svg className="w-3.5 h-3.5 fill-current" viewBox="0 0 24 24">
                    <path d="M12 3l3 4h4l-3 4 5 7h-6l-3-4-3 4H3l5-7-3-4h4z" />
                  </svg>
                  <span>BUKITTINGGI, SUMBAR</span>
                </span>

                {activeOutlet === 'AUR_KUNING' && (
                  <span className="inline-flex items-center gap-1 text-xs font-bold text-slate-900">
                    <CheckCircle2 className="w-4 h-4" />
                    <span>Aktif</span>
                  </span>
                )}
              </div>

              {/* Title & Slogan */}
              <h3 className="text-xl sm:text-2xl font-black tracking-tight leading-snug">
                Pasar Aur Kuning <span className="text-slate-900">(Bukittinggi)</span>
              </h3>
              <p
                className={`text-xs mt-1 font-semibold ${
                  activeOutlet === 'AUR_KUNING' ? 'text-slate-900 font-bold' : 'text-amber-700'
                }`}
              >
                Pusat Grosir Pakaian &amp; Tekstil Terbesar Sumatera
              </p>

              {/* Description & Specialties */}
              <p
                className={`text-xs mt-3 leading-relaxed ${
                  activeOutlet === 'AUR_KUNING' ? 'text-slate-900' : 'text-slate-600'
                }`}
              >
                Kulakan langsung mukena bordir kerancang Bukittinggi asli pengrajin, daster katun rayon adem super, gamis Minang bordir timbul, songket Silungkang, dan pakaian anak grosiran.
              </p>

              {/* Badges / Highlights */}
              <div className="mt-4 pt-3 border-t border-slate-900/15 space-y-1.5 text-[11px]">
                <div className="flex items-center gap-2">
                  <MapPin className="w-3.5 h-3.5 shrink-0 text-slate-900" />
                  <span>Kawasan Pasar Grosir Aur Kuning, Blok B No. 14, Tarok Dipo</span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="w-3.5 h-3.5 shrink-0 text-slate-900" />
                  <span>Hari Pasar Utama: Selasa &amp; Jumat (07.30 - 17.00 WIB)</span>
                </div>
              </div>
            </div>

            {/* Action CTA Button */}
            <div className="mt-6 pt-3">
              <button
                type="button"
                className={`w-full py-3.5 px-4 rounded-xl font-bold text-xs uppercase tracking-wider flex items-center justify-center gap-2 transition-all shadow-md ${
                  activeOutlet === 'AUR_KUNING'
                    ? 'bg-slate-900 hover:bg-black text-amber-400 font-extrabold'
                    : 'bg-amber-600 hover:bg-amber-700 text-white'
                }`}
              >
                <span>Masuk Outlet Aur Kuning</span>
                <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
              </button>
            </div>
          </div>

        </div>

        {/* Modal Footer Notes */}
        <div className="py-3 px-6 bg-slate-100 border-t border-slate-200 text-center text-xs text-slate-500 flex flex-col sm:flex-row items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-emerald-600" />
            <span>Katalog &amp; produk disesuaikan langsung dengan sentra pasar yang Anda pilih.</span>
          </div>
          <span className="text-[11px] font-mono text-slate-400">
            Anda dapat berpindah outlet kapan saja melalui tombol di navigasi atas.
          </span>
        </div>

      </div>
    </div>
  );
};
