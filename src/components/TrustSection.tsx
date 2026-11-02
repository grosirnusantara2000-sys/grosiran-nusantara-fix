import React from 'react';
import { useApp } from '../context/AppContext';
import {
  ShieldCheck,
  Receipt,
  Camera,
  CheckCircle2,
  FileCheck,
  Truck,
  MessageCircle,
  Clock,
  ArrowRight,
} from 'lucide-react';
import { BUSINESS_INFO } from '../data/initialData';

export const TrustSection: React.FC = () => {
  const { setCurrentView } = useApp();

  const handleWhatsAppCS = () => {
    const text = `Halo Admin Grosir Nusantara, saya ingin konsultasi mengenai sistem belanja grosir tangan pertama dan ekspedisi kargo.`;
    const url = `https://wa.me/62${BUSINESS_INFO.whatsapp.replace(/^0/, '')}?text=${encodeURIComponent(text)}`;
    window.open(url, '_blank');
  };

  return (
    <section className="py-16 bg-white border-b border-slate-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center max-w-2xl mx-auto mb-12">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
            Fondasi Kepercayaan Bisnis
          </span>
          <h2 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Belanja Grosir Lebih Mudah, Aman, dan Transparan
          </h2>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Kami membangun platform belanja grosir &amp; eceran profesional tanpa mark-up harga tersembunyi. Semua transaksi diverifikasi dengan bukti riil dari sentra grosir Tanah Abang &amp; Aur Kuning.
          </p>
        </div>

        {/* 4 Core Pillars Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {/* Pillar 1 */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/90 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center mb-4 shadow-sm">
              <Receipt className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              1. Transparansi Harga 100%
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Harga barang ditampilkan jujur langsung sesuai harga modal lapak grosir dan ongkos kirim kargo terjangkau. Tidak ada biaya siluman.
            </p>
          </div>

          {/* Pillar 2 */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/90 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center mb-4 shadow-sm">
              <Camera className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              2. Dokumentasi Pembelian Riil
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Tim lapangan memotretkan fisik barang langsung saat berbelanja di lapak sentra grosir beserta nota toko fisik sebagai bukti otentik.
            </p>
          </div>

          {/* Pillar 3 */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/90 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center mb-4 shadow-sm">
              <CheckCircle2 className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              3. Konfirmasi Sebelum Pelunasan
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Untuk pesanan custom atau request khusus, Anda menerima rincian penawaran harga dan foto sampel sebelum menyetujui transaksi final.
            </p>
          </div>

          {/* Pillar 4 */}
          <div className="p-6 bg-slate-50 rounded-2xl border border-slate-200/90 hover:shadow-md transition-shadow">
            <div className="w-12 h-12 rounded-xl bg-blue-900 text-white flex items-center justify-center mb-4 shadow-sm">
              <Truck className="w-6 h-6 text-orange-400" />
            </div>
            <h3 className="text-base font-bold text-slate-900 mb-2">
              4. Tracking Resi & Kargo Murah
            </h3>
            <p className="text-xs text-slate-600 leading-relaxed">
              Bekerjasama dengan kargo terpercaya (Indah Cargo, Baraka, Dakota, JTR) dengan tarif grosir kiloan murah dan no. resi yang dapat dilacak online.
            </p>
          </div>
        </div>

        {/* Trust Action Bar */}
        <div className="bg-gradient-to-r from-slate-900 via-blue-950 to-slate-900 rounded-2xl p-6 sm:p-8 text-white flex flex-col md:flex-row items-center justify-between gap-6 shadow-lg">
          <div className="max-w-xl">
            <div className="text-xs font-semibold text-orange-400 uppercase tracking-wider mb-1">
              Konsultasi Tanpa Syarat
            </div>
            <h4 className="text-lg sm:text-xl font-bold">
              Mau tanya harga lapak grosir atau butuh bantuan request barang?
            </h4>
            <p className="text-xs text-slate-300 mt-1">
              Admin kami standby di Bukittinggi untuk menjawab pertanyaan seputar jenis bahan, harga partai besar, dan rute kargo tercepat ke kota Anda.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={handleWhatsAppCS}
              className="px-5 py-3 text-xs font-bold text-slate-900 bg-white hover:bg-slate-100 rounded-xl transition-colors flex items-center gap-2 cursor-pointer shadow-xs"
            >
              <MessageCircle className="w-4 h-4 text-emerald-600" />
              Chat WhatsApp CS
            </button>
            <button
              onClick={() => {
                setCurrentView('request');
                window.scrollTo({ top: 0, behavior: 'smooth' });
              }}
              className="px-5 py-3 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 rounded-xl transition-colors flex items-center gap-2 cursor-pointer"
            >
              Kirim Request Barang
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </section>
  );
};
