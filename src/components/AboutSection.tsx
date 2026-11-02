import React from 'react';
import { useApp } from '../context/AppContext';
import { BUSINESS_INFO } from '../data/initialData';
import { Store, ShieldCheck, MapPin, Truck, CheckCircle2, MessageCircle } from 'lucide-react';

export const AboutSection: React.FC = () => {
  const { setCurrentView, activeOutletInfo } = useApp();

  return (
    <section className="py-16 bg-white min-h-[85vh]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 space-y-16">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto">
          <div className="flex items-center justify-center gap-2 mb-3">
            <img
              src="/assets/aistudio/Logo_Grosir_Nusantara_Warna_Nusantara_fc818c0f.png"
              alt="Grosir Nusantara"
              className="h-12 sm:h-14 object-contain drop-shadow-xs"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src.indexOf('/public/') === -1) {
                  target.src = '/public/assets/aistudio/Logo_Grosir_Nusantara_Warna_Nusantara_fc818c0f.png';
                }
              }}
            />
          </div>
          <span className="text-xs font-bold text-amber-600 uppercase tracking-wider">
            Tentang Grosir Nusantara
          </span>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-slate-900 mt-2 leading-tight">
            Menghubungkan Sentra Grosir Tanah Abang &amp; Aur Kuning ke Seluruh Indonesia
          </h1>
          <p className="text-sm sm:text-base text-slate-600 mt-3 leading-relaxed">
            <strong>Grosir Nusantara</strong> adalah platform belanja grosir &amp; eceran terintegrasi dari dua sentra grosir tekstil dan fashion terbesar di Indonesia: <strong>Tanah Abang (DKI Jakarta)</strong> dan <strong>Pasar Aur Kuning (Bukittinggi, Sumatera Barat)</strong>. Kami membantu reseller, butik, toko, dan perorangan belanja langsung dari sentra produksi dengan harga tangan pertama.
          </p>
        </div>

        {/* 2-Column Split: Story & Packaging Photo */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-center">
          <div className="space-y-4 text-xs sm:text-sm text-slate-600 leading-relaxed">
            <h2 className="text-xl sm:text-2xl font-bold text-slate-900">
              Dua Sentra Grosir Terbesar, Satu Akses Pemesanan
            </h2>
            <p>
              Sentra <strong>Tanah Abang (Jakarta)</strong> dikenal sebagai pusat perputaran fashion modern, gamis plisket/silk, kemeja impor, kaos distro, dan garmen terbesar se-Asia Tenggara. Sementara <strong>Pasar Aur Kuning (Bukittinggi)</strong> adalah sentra legendaris mukena bordir kerancang tangan, daster rayon bordir, songket Minang, dan busana muslim khas Sumatera.
            </p>
            <p>
              Dengan <strong>Grosir Nusantara</strong>, Anda tidak perlu mengeluarkan jutaan rupiah untuk tiket pesawat, hotel, dan waktu berhari-hari. Tim kami beroperasi langsung di lapangan setiap hari: mendatangi lapak pedagang, memeriksa jahitan dan fisik barang, serta mengantarkannya langsung ke kargo hemat langganan Anda.
            </p>
            <p>
              Outlet aktif Anda saat ini: <strong className="text-amber-600 font-bold">{activeOutletInfo.name}</strong> ({activeOutletInfo.city}). Seluruh proses belanja dikerjakan transparan dengan nota fisik toko.
            </p>

            <div className="pt-2 grid grid-cols-2 gap-3 text-xs font-semibold text-slate-800">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Tanpa markup rahasia</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Nota fisik asli dari toko</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Bisa request model &amp; foto pasar</span>
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>Packing kargo rapih &amp; aman</span>
              </div>
            </div>
          </div>

          <div className="relative rounded-2xl overflow-hidden shadow-lg border border-slate-200 aspect-4/3 bg-slate-100">
            <img
              src="/src/assets/images/about_aur_kuning_packing_1793527996506.jpg"
              alt="Pengemasan kargo belanja grosir Grosir Nusantara"
              className="w-full h-full object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-0 inset-x-0 bg-gradient-to-t from-slate-950/80 via-slate-950/40 to-transparent p-4 text-white text-xs">
              <div className="font-bold">Proses Pengecekan & Pengemasan Kargo</div>
              <div className="text-slate-300 text-[11px]">Setiap kardus/karung disegel rapat dengan label ekspedisi jelas</div>
            </div>
          </div>
        </div>

        {/* Operational Info Card */}
        <div className="bg-slate-50 rounded-2xl border border-slate-200 p-6 sm:p-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-xs sm:text-sm">
            <div>
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-900 flex items-center justify-center mb-3">
                <MapPin className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1">Alamat Operasional</h3>
              <p className="text-slate-600 leading-relaxed">
                {BUSINESS_INFO.address}
              </p>
            </div>

            <div>
              <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center mb-3">
                <Store className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1">Jadwal Hari Pasar</h3>
              <p className="text-slate-600 leading-relaxed">
                {BUSINESS_INFO.marketDays}
              </p>
              <p className="text-slate-500 text-[11px] mt-1">
                (Toko tetap melayani belanja setiap hari kerja)
              </p>
            </div>

            <div>
              <div className="w-10 h-10 rounded-xl bg-emerald-100 text-emerald-700 flex items-center justify-center mb-3">
                <MessageCircle className="w-5 h-5" />
              </div>
              <h3 className="font-bold text-slate-900 mb-1">Layanan CS Online</h3>
              <p className="text-slate-600 leading-relaxed">
                WhatsApp: <strong>{BUSINESS_INFO.whatsappDisplay}</strong>
              </p>
              <p className="text-slate-500 text-[11px] mt-1">
                {BUSINESS_INFO.serviceDays}
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};
