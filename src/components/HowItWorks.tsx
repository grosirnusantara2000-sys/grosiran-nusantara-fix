import React from 'react';
import { useApp } from '../context/AppContext';
import { ShoppingCart, SearchCheck, CheckSquare, PackageCheck, ArrowRight } from 'lucide-react';

export const HowItWorks: React.FC = () => {
  const { setCurrentView } = useApp();

  const steps = [
    {
      num: '01',
      title: 'Pilih / Request Barang',
      desc: 'Pilih produk grosir siap order di katalog kami atau upload foto referensi pakaian/mukena yang Anda cari melalui form Request Barang.',
      icon: ShoppingCart,
    },
    {
      num: '02',
      title: 'Kami Carikan ke Lapak',
      desc: 'Tim sourcing lapangan mendatangi sentra grosir (Tanah Abang & Aur Kuning), membandingkan harga antar-pedagang, dan memastikan stok barang tangan pertama.',
      icon: SearchCheck,
    },
    {
      num: '03',
      title: 'Konfirmasi Foto & Biaya',
      desc: 'Kami memotretkan sampel barang langsung di toko lapak ke WhatsApp Anda. Anda menyetujui total rincian transparan sebelum pembayaran diproses.',
      icon: CheckSquare,
    },
    {
      num: '04',
      title: 'Quality Check & Kirim Kargo',
      desc: 'Barang dicek jahitan dan jumlah serinya, dikemas rapat dengan karung/plastik kargo, lalu dikirim via ekspedisi langganan grosir langsung ke kota Anda.',
      icon: PackageCheck,
    },
  ];

  return (
    <section className="py-16 bg-slate-50 border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
            Alur Belanja Praktis
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Cara Belanja Grosir &amp; Eceran di Grosir Nusantara
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Hanya 4 langkah mudah untuk kulakan barang dari pusat grosir tanpa perlu meninggalkan toko atau rumah Anda
          </p>
        </div>

        {/* 4 Steps Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {steps.map((step) => {
            const Icon = step.icon;
            return (
              <div
                key={step.num}
                className="bg-white p-6 rounded-2xl border border-slate-200/90 shadow-2xs relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-2xl font-black font-mono-nums text-orange-600/30">
                      {step.num}
                    </span>
                    <div className="w-10 h-10 rounded-xl bg-blue-50 text-blue-900 flex items-center justify-center">
                      <Icon className="w-5 h-5 text-blue-900" />
                    </div>
                  </div>
                  <h3 className="text-sm font-bold text-slate-900 mb-2">
                    {step.title}
                  </h3>
                  <p className="text-xs text-slate-600 leading-relaxed">
                    {step.desc}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center text-[11px] font-semibold text-blue-900">
                  <span>Grosir Nusantara Express Sourcing</span>
                </div>
              </div>
            );
          })}
        </div>

        <div className="mt-10 text-center">
          <button
            onClick={() => {
              setCurrentView('request');
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center gap-2 px-6 py-3 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-xl transition-colors shadow-sm cursor-pointer"
          >
            <span>Mulai Buat Request Barang Sekarang</span>
            <ArrowRight className="w-4 h-4 text-orange-400" />
          </button>
        </div>
      </div>
    </section>
  );
};
