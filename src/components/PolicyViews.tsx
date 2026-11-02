import React from 'react';
import { useApp } from '../context/AppContext';
import { ShieldCheck, FileText, ArrowLeft } from 'lucide-react';

interface PolicyViewProps {
  type: 'trust-safety' | 'privacy' | 'terms';
}

export const PolicyView: React.FC<PolicyViewProps> = ({ type }) => {
  const { setCurrentView } = useApp();

  return (
    <section className="py-16 bg-white min-h-[85vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <button
          onClick={() => setCurrentView('home')}
          className="inline-flex items-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-900 mb-6 cursor-pointer"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Kembali ke Beranda</span>
        </button>

        {type === 'trust-safety' && (
          <div className="prose prose-slate max-w-none space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Kebijakan Transparansi Biaya & Garansi Pembelian
            </h1>
            <p>
              Komitmen utama <strong>Grosir Nusantara</strong> adalah memberikan layanan belanja grosir dan eceran tangan pertama yang 100% jujur dan transparan kepada seluruh pengusaha toko dan pelanggan di Indonesia.
            </p>

            <h2 className="text-lg font-bold text-slate-900 mt-6">1. Transparansi Komponen Biaya</h2>
            <p>
              Di setiap transaksi, total pembayaran dihitung transparan:
            </p>
            <ul>
              <li><strong>Harga Asli Barang Toko Lapak:</strong> Sesuai harga nota tangan pertama dari sentra grosir Tanah Abang &amp; Pasar Aur Kuning.</li>
              <li><strong>Biaya Ekspedisi / Kargo:</strong> Dihitung berdasarkan berat riil timbangan kargo hemat pilihan Anda tanpa biaya perantara tambahan.</li>
            </ul>

            <h2 className="text-lg font-bold text-slate-900 mt-6">2. Dokumentasi & Pengecekan Fisik</h2>
            <p>
              Sebelum dipacking karung atau kardus, tim kami memeriksa fisik barang untuk memastikan tidak ada cacat atau robek. Foto barang dan nota fisik dikirimkan langsung ke pelanggan.
            </p>

            <h2 className="text-lg font-bold text-slate-900 mt-6">3. Kebijakan Retur & Penukaran Lapak</h2>
            <p>
              Jika terdapat cacat bawaan dari konveksi yang terlewatkan saat pengecekan, silakan kirimkan video unboxing paket dalam waktu 2x24 jam sejak barang diterima. Tim kami akan membantu menukarkan barang tersebut ke toko lapak asal.
            </p>
          </div>
        )}

        {type === 'privacy' && (
          <div className="prose prose-slate max-w-none space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Kebijakan Privasi
            </h1>
            <p>
              Kami menghargai privasi dan kerahasiaan data pribadi maupun data bisnis toko Anda.
            </p>
            <h2 className="text-lg font-bold text-slate-900 mt-6">1. Informasi yang Dikumpulkan</h2>
            <p>
              Kami mengumpulkan informasi kontak seperti Nama Lengkap, Nomor WhatsApp, Alamat Lengkap Pengiriman, serta foto referensi barang yang Anda unggah semata-mata untuk keperluan pemrosesan belanja dan pengiriman ekspedisi.
            </p>
            <h2 className="text-lg font-bold text-slate-900 mt-6">2. Penggunaan Data</h2>
            <p>
              Data pelanggan tidak akan pernah diperjualbelikan kepada pihak ketiga manapun. Data alamat hanya dibagikan kepada mitra ekspedisi kargo resmi untuk pencetakan label resi pengiriman.
            </p>
          </div>
        )}

        {type === 'terms' && (
          <div className="prose prose-slate max-w-none space-y-6 text-xs sm:text-sm text-slate-700 leading-relaxed">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
              Syarat dan Ketentuan Layanan
            </h1>
            <p>
              Dengan menggunakan layanan platform Grosir Nusantara, Anda menyetujui ketentuan berikut:
            </p>
            <h2 className="text-lg font-bold text-slate-900 mt-6">1. Ketersediaan Stok Lapak</h2>
            <p>
              Sentra grosir adalah pasar fisik dengan perputaran barang yang cepat. Ketersediaan motif atau warna tertentu dapat berubah sewaktu-waktu tergantung stok pabrikan konveksi. Tim kami akan selalu mengonfirmasi opsi alternatif kepada Anda jika stok habis.
            </p>
            <h2 className="text-lg font-bold text-slate-900 mt-6">2. Pembayaran & Pembelian</h2>
            <p>
              Pembelian barang diproses setelah bukti pembayaran berhasil dikonfirmasi. Kami melayani pembayaran instan via transfer bank dan QRIS resmi.
            </p>
          </div>
        )}
      </div>
    </section>
  );
};
