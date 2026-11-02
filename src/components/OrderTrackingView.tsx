import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { fetchOrderByIdOrInvoice, updateOrderDetails } from '../services/dataService';
import { Order, OrderStatus } from '../types';
import {
  Search,
  CheckCircle2,
  Clock,
  Truck,
  Package,
  Store,
  CreditCard,
  FileText,
  Upload,
  AlertCircle,
  ExternalLink,
  Printer,
  ShieldCheck,
} from 'lucide-react';

export const OrderTrackingView: React.FC = () => {
  const { selectedInvoiceId, setSelectedInvoiceId, showToast, user } = useApp();

  const [searchInvoice, setSearchInvoice] = useState(selectedInvoiceId || '');
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [notFound, setNotFound] = useState(false);
  const [paymentProofInput, setPaymentProofInput] = useState('');
  const [isUploadingProof, setIsUploadingProof] = useState(false);

  useEffect(() => {
    if (selectedInvoiceId) {
      handleSearch(selectedInvoiceId);
    }
  }, [selectedInvoiceId]);

  const handleSearch = async (invNumber: string) => {
    if (!invNumber.trim()) return;
    setIsLoading(true);
    setNotFound(false);
    try {
      const order = await fetchOrderByIdOrInvoice(invNumber.trim());
      if (order) {
        setCurrentOrder(order);
      } else {
        setCurrentOrder(null);
        setNotFound(true);
      }
    } catch (err) {
      showToast('Gagal memuat status pesanan', 'error');
    } finally {
      setIsLoading(false);
    }
  };

  const handleProofUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      showToast('Ukuran file maksimal 2MB', 'error');
      return;
    }

    const reader = new FileReader();
    reader.onload = async (event) => {
      if (event.target?.result && currentOrder) {
        const proofUrl = event.target.result as string;
        setIsUploadingProof(true);
        try {
          await updateOrderDetails(currentOrder.id, {
            paymentProofUrl: proofUrl,
            paymentStatus: 'Menunggu Verifikasi',
          });
          setCurrentOrder({
            ...currentOrder,
            paymentProofUrl: proofUrl,
            paymentStatus: 'Menunggu Verifikasi',
          });
          showToast('Bukti transfer berhasil diunggah! Admin akan segera memverifikasi.', 'success');
        } catch (err) {
          showToast('Gagal menyimpan bukti transfer', 'error');
        } finally {
          setIsUploadingProof(false);
        }
      }
    };
    reader.readAsDataURL(file);
  };

  const formatRupiah = (num: number) => 'Rp ' + num.toLocaleString('id-ID');

  const ORDER_STEPS: OrderStatus[] = [
    'Menunggu Pembayaran',
    'Pembayaran Dikonfirmasi',
    'Pesanan Diproses',
    'Barang Sedang Dibelikan',
    'Barang Sedang Dikemas',
    'Pesanan Dikirim',
    'Selesai',
  ];

  const getStepIndex = (status: OrderStatus) => {
    return ORDER_STEPS.indexOf(status);
  };

  return (
    <section className="py-12 bg-slate-50 min-h-[85vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Title */}
        <div className="text-center max-w-xl mx-auto mb-8">
          <span className="text-xs font-bold text-orange-600 uppercase tracking-wider">
            Transparansi Transaksi
          </span>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 mt-1">
            Lacak Status Pesanan & Bukti Belanja
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Cek progres belanja langsung dari lapak grosir, nota fisik asli, serta nomor resi &amp; tautan pelacakan ekspedisi Anda
          </p>
        </div>

        {/* Search Bar */}
        <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-sm mb-8">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSearch(searchInvoice);
            }}
            className="flex gap-2"
          >
            <div className="relative flex-1">
              <input
                type="text"
                placeholder="Masukkan Nomor Invoice (contoh: INV-AK-20261101-1234)..."
                value={searchInvoice}
                onChange={(e) => setSearchInvoice(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 font-mono-nums text-slate-900"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3" />
            </div>
            <button
              type="submit"
              disabled={isLoading}
              className="px-6 py-2.5 text-xs font-bold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5 shadow-2xs"
            >
              {isLoading ? 'Mencari...' : 'Lacak Invoice'}
            </button>
          </form>

          {notFound && (
            <div className="mt-3 p-3 bg-red-50 text-red-900 rounded-lg border border-red-200 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
              <span>
                Nomor invoice <strong>{searchInvoice}</strong> tidak ditemukan. Mohon pastikan ejaan nomor invoice sudah sesuai.
              </span>
            </div>
          )}
        </div>

        {/* Order Details View */}
        {currentOrder && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8 space-y-6">
            {/* Top Bar Info */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-3">
              <div>
                <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  Nomor Invoice Resmi
                </span>
                <div className="text-xl font-mono-nums font-extrabold text-blue-900">
                  {currentOrder.invoiceNumber}
                </div>
                <div className="text-xs text-slate-500 mt-0.5">
                  Tanggal Pemesanan: {new Date(currentOrder.createdAt).toLocaleDateString('id-ID', { dateStyle: 'long' })}
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button
                  onClick={() => window.print()}
                  className="px-3 py-1.5 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5 cursor-pointer"
                >
                  <Printer className="w-3.5 h-3.5" />
                  Cetak Invoice
                </button>
              </div>
            </div>

            {/* Pipeline Status Progress */}
            <div>
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-4">
                Perkembangan Proses Pesanan Anda:
              </div>

              <div className="overflow-x-auto pb-2">
                <div className="min-w-[550px] flex items-center justify-between relative">
                  <div className="absolute top-3 left-4 right-4 h-1 bg-slate-200 -z-0" />
                  {ORDER_STEPS.map((step, idx) => {
                    const currentIdx = getStepIndex(currentOrder.orderStatus);
                    const isDone = idx <= currentIdx;
                    const isCurrent = idx === currentIdx;

                    return (
                      <div key={step} className="flex flex-col items-center relative z-10 text-center flex-1">
                        <div
                          className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                            isCurrent
                              ? 'bg-orange-600 text-white ring-4 ring-orange-100 shadow-sm'
                              : isDone
                              ? 'bg-blue-900 text-white'
                              : 'bg-slate-200 text-slate-500'
                          }`}
                        >
                          {isDone ? <CheckCircle2 className="w-4 h-4" /> : idx + 1}
                        </div>
                        <span
                          className={`text-[10px] mt-1.5 max-w-20 leading-tight ${
                            isCurrent
                              ? 'font-bold text-orange-600'
                              : isDone
                              ? 'font-semibold text-slate-900'
                              : 'text-slate-400'
                          }`}
                        >
                          {step}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Shipping & Courier Info */}
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div>
                <span className="text-slate-500 block">Ekspedisi Logistik</span>
                <span className="font-bold text-slate-900">{currentOrder.courier}</span>
                {currentOrder.trackingNumber ? (
                  <div className="mt-1">
                    <span className="text-slate-500">Nomor Resi: </span>
                    <strong className="font-mono-nums text-blue-900">{currentOrder.trackingNumber}</strong>
                  </div>
                ) : (
                  <div className="text-slate-400 text-[11px] mt-1">
                    Nomor resi akan muncul setelah barang diserahkan ke kargo
                  </div>
                )}
              </div>
              <div>
                <span className="text-slate-500 block">Alamat Tujuan Pengiriman</span>
                <div className="font-semibold text-slate-800">
                  {currentOrder.shippingAddress.recipientName} ({currentOrder.shippingAddress.phone})
                </div>
                <div className="text-slate-600 text-[11px]">
                  {currentOrder.shippingAddress.street}, {currentOrder.shippingAddress.city}, {currentOrder.shippingAddress.province}
                </div>
              </div>
            </div>

            {/* Direct Seller Tracking Link Button (Langsung Ditekan Pelanggan) */}
            {currentOrder.trackingLink && (
              <div className="p-4 bg-gradient-to-r from-blue-900 via-slate-900 to-indigo-950 text-white rounded-xl shadow-md border border-blue-800/50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-lg bg-amber-400/20 text-amber-400 flex items-center justify-center shrink-0">
                    <ExternalLink className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <span className="text-[11px] font-bold text-amber-400 block uppercase tracking-wider">
                      Tautan Pelacakan Resmi Penjual
                    </span>
                    <span className="text-xs text-slate-200 block truncate max-w-xs sm:max-w-md font-mono">
                      {currentOrder.trackingLink}
                    </span>
                  </div>
                </div>

                <a
                  href={
                    currentOrder.trackingLink.startsWith('http://') || currentOrder.trackingLink.startsWith('https://')
                      ? currentOrder.trackingLink
                      : `https://${currentOrder.trackingLink}`
                  }
                  target="_blank"
                  rel="noopener noreferrer"
                  className="px-4 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-black text-xs rounded-lg transition-all flex items-center justify-center gap-2 shadow-sm shrink-0 cursor-pointer"
                >
                  <span>Tekan untuk Buka Tautan Lacak</span>
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            )}

            {/* Store Purchase Proof Photos (Evidence from Stall) */}
            <div className="pt-2">
              <div className="flex items-center gap-2 text-xs font-bold text-slate-900 mb-2">
                <Store className="w-4 h-4 text-orange-600" />
                <span>Dokumentasi Pembelian &amp; Nota Fisik Asli Lapak Grosir:</span>
              </div>

              {currentOrder.storeProofPhotos && currentOrder.storeProofPhotos.length > 0 ? (
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                  {currentOrder.storeProofPhotos.map((photo, i) => (
                    <div key={i} className="aspect-4/3 rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group">
                      <img
                        src={photo}
                        alt="Bukti lapak"
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-500 flex items-center gap-2">
                  <Clock className="w-4 h-4 text-slate-400 shrink-0" />
                  <span>
                    Tim kami akan memotret barang &amp; nota fisik langsung di lapak toko saat berbelanja dan mengunggahnya ke sini.
                  </span>
                </div>
              )}
            </div>

            {/* Itemized Products */}
            <div className="pt-2">
              <div className="text-xs font-bold text-slate-800 uppercase tracking-wider mb-3">
                Rincian Barang yang Dibelanjakan:
              </div>
              <div className="divide-y divide-slate-100 border border-slate-200 rounded-xl overflow-hidden text-xs">
                {currentOrder.items.map((item, idx) => (
                  <div key={idx} className="p-3 bg-white flex items-center justify-between gap-3">
                    <div className="flex items-center gap-3">
                      <img
                        src={item.imageUrl}
                        alt={item.productName}
                        className="w-12 h-12 object-cover rounded-lg border border-slate-200 shrink-0"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{item.productName}</div>
                        <div className="text-[11px] text-slate-500 font-mono-nums">
                          {item.quantity} pcs · Rp {item.wholesalePrice.toLocaleString('id-ID')}/pcs
                          {item.color && ` · Warna: ${item.color}`}
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono-nums font-bold text-slate-900">
                      Rp {(item.wholesalePrice * item.quantity).toLocaleString('id-ID')}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Financial Summary */}
            <div className="pt-4 border-t border-slate-200 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
              <div className="text-xs text-slate-600 space-y-1">
                <div>Metode Pembayaran: <strong>{currentOrder.paymentMethod}</strong></div>
                <div>
                  Status Pembayaran:{' '}
                  <span
                    className={`font-bold ${
                      currentOrder.paymentStatus === 'Lunas' ? 'text-emerald-600' : 'text-amber-600'
                    }`}
                  >
                    {currentOrder.paymentStatus}
                  </span>
                </div>
              </div>

              <div className="w-full sm:w-64 space-y-1 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Barang Grosir:</span>
                  <span className="font-mono-nums">{formatRupiah(currentOrder.subtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Ongkos Kirim Kargo:</span>
                  <span className="font-mono-nums">+{formatRupiah(currentOrder.shippingCost)}</span>
                </div>
                <div className="pt-2 border-t border-slate-200 flex justify-between font-extrabold text-sm text-slate-900">
                  <span>Total Tagihan:</span>
                  <span className="font-mono-nums text-blue-900 font-extrabold">{formatRupiah(currentOrder.totalAmount)}</span>
                </div>
              </div>
            </div>

            {/* Payment Proof Upload Form (if pending payment) */}
            {currentOrder.paymentStatus !== 'Lunas' && (
              <div className="p-4 bg-blue-50/70 border border-blue-200 rounded-xl space-y-3">
                <div className="flex items-center gap-2 text-xs font-bold text-blue-950">
                  <CreditCard className="w-4 h-4 text-blue-800" />
                  <span>Upload Bukti Pembayaran / Struk Transfer</span>
                </div>
                <p className="text-[11px] text-blue-900">
                  Sudah melakukan transfer? Unggah foto bukti transfer di bawah ini agar pesanan dapat segera diproses oleh tim di Aur Kuning.
                </p>

                {currentOrder.paymentProofUrl ? (
                  <div className="flex items-center gap-3">
                    <img
                      src={currentOrder.paymentProofUrl}
                      alt="Bukti Transfer"
                      className="w-16 h-16 object-cover rounded-lg border border-blue-300"
                    />
                    <span className="text-xs font-semibold text-emerald-700">
                      Bukti transfer sudah diunggah. Menunggu verifikasi admin.
                    </span>
                  </div>
                ) : (
                  <div>
                    <input
                      type="file"
                      id="upload-proof"
                      accept="image/*"
                      onChange={handleProofUpload}
                      className="hidden"
                    />
                    <label
                      htmlFor="upload-proof"
                      className="inline-flex items-center gap-2 px-4 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-lg text-xs font-bold cursor-pointer transition-colors"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      {isUploadingProof ? 'Mengunggah...' : 'Pilih Foto Struk Transfer'}
                    </label>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
};
