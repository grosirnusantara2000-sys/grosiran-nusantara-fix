import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { createOrder } from '../services/dataService';
import { BUSINESS_INFO, BANK_ACCOUNTS } from '../data/initialData';
import { getWhatsappChatUrl, getEffectiveWhatsapp, formatWhatsappOrderInvoiceMessage } from '../utils/whatsapp';
import { Order, OrderItem } from '../types';
import {
  Truck,
  CreditCard,
  MapPin,
  ShieldCheck,
  CheckCircle2,
  ArrowRight,
  ShoppingBag,
  MessageCircle,
  Copy,
  Check,
} from 'lucide-react';

export const Checkout: React.FC = () => {
  const { cart, cartSubtotal, cartJokiTotal, clearCart, showToast, setCurrentView, setSelectedInvoiceId, user, storeSettings, activeOutletInfo } = useApp();

  // Customer Contact
  const [recipientName, setRecipientName] = useState(user?.displayName || '');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState(user?.email || '');

  // Address
  const [street, setStreet] = useState('');
  const [kelurahan, setKelurahan] = useState('');
  const [kecamatan, setKecamatan] = useState('');
  const [city, setCity] = useState('');
  const [province, setProvince] = useState('Sumatera Barat');
  const [postalCode, setPostalCode] = useState('');
  const [shippingNotes, setShippingNotes] = useState('Mohon konfirmasi biaya pengiriman manual via WA');

  // Dynamic Payment Methods from StoreSettings
  const activeBankAccounts = (storeSettings.bankAccounts && storeSettings.bankAccounts.length > 0)
    ? storeSettings.bankAccounts.filter((b) => b.active !== false)
    : BANK_ACCOUNTS.map((b, i) => ({ id: 'bank-' + i, ...b, active: true }));

  const [paymentMethod, setPaymentMethod] = useState(activeBankAccounts[0]?.bankName || 'Transfer BCA');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [copiedInvoice, setCopiedInvoice] = useState(false);

  // Harga yang tercantum belum termasuk biaya pengiriman (ongkir dikonfirmasi manual ke admin)
  const shippingCost = 0;
  const grandTotal = cartSubtotal;

  const formatRupiah = (num: number) => 'Rp ' + (num || 0).toLocaleString('id-ID');

  const handleAskShippingCostWhatsApp = () => {
    const effectiveWa = getEffectiveWhatsapp(storeSettings, 'tanya_admin', activeOutletInfo.whatsappNumber);
    const destination = [city, province].filter(Boolean).join(', ') || 'kota saya';
    const totalPcs = cart.reduce((sum, item) => sum + item.quantity, 0);
    const message = `Halo Admin Grosir Nusantara (${activeOutletInfo.shortName}),\nSaya sedang di halaman checkout belanja Grosir Nusantara:\n- Total Item: ${totalPcs} pcs barang grosir\n- Subtotal Produk: ${formatRupiah(cartSubtotal)}\n- Alamat Tujuan Kirim: *${destination}*\n\nMohon informasi konfirmasi pengiriman / pengambilan barang serta perhitungan ongkir ke alamat saya. Terima kasih!`;
    const url = getWhatsappChatUrl(effectiveWa, message);
    window.open(url, '_blank');
  };

  const handleSubmitOrder = async (e: React.FormEvent) => {
    e.preventDefault();

    if (cart.length === 0) {
      showToast('Keranjang belanja kosong', 'error');
      return;
    }

    if (!recipientName.trim() || !phone.trim() || !street.trim() || !city.trim()) {
      showToast('Mohon lengkapi nama penerima, nomor WhatsApp, alamat jalan, dan kota tujuan', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const orderItems: OrderItem[] = cart.map((item) => ({
        productId: item.product.id,
        productName: item.product.name,
        price: item.product.price,
        wholesalePrice: item.product.wholesalePrice,
        jokiFee: 0,
        quantity: item.quantity,
        color: [
          item.selectedColor,
          item.selectedVariants &&
            Object.entries(item.selectedVariants)
              .map(([g, v]) => `${g}: ${v}`)
              .join(', '),
        ]
          .filter(Boolean)
          .join(' | '),
        size: item.selectedSize || '',
        imageUrl: item.product.imageUrl,
      }));

      const newOrder = await createOrder({
        customerId: user?.uid || `guest_${Date.now()}`,
        customerName: recipientName.trim(),
        customerWhatsapp: phone.trim(),
        customerEmail: email.trim() || '',
        shippingAddress: {
          recipientName: recipientName.trim(),
          phone: phone.trim(),
          street: street.trim(),
          kelurahan: kelurahan.trim() || '',
          kecamatan: kecamatan.trim() || '',
          city: city.trim(),
          province: province.trim(),
          postalCode: postalCode.trim() || '',
          shippingNotes: shippingNotes.trim() || '',
        },
        items: orderItems,
        subtotal: cartSubtotal,
        jokiTotal: 0,
        shippingCost: 0,
        totalAmount: grandTotal,
        courier: 'Kargo / Ekspedisi (Ongkir Ditanggung Pembeli)',
        paymentMethod,
        notes: shippingNotes.trim() || '',
      });

      setCreatedOrder(newOrder);
      clearCart();
      showToast('Pesanan berhasil dibuat! Silakan lakukan pembayaran.', 'success');
    } catch (err: any) {
      showToast('Gagal memproses pesanan: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getWhatsAppConfirmationUrl = (order: Order) => {
    const effectiveWa = getEffectiveWhatsapp(storeSettings, 'order', activeOutletInfo.whatsappNumber);
    const message = formatWhatsappOrderInvoiceMessage(storeSettings, order);
    return getWhatsappChatUrl(effectiveWa, message);
  };

  const copyInvoiceToClipboard = (inv: string) => {
    if (navigator?.clipboard?.writeText) {
      navigator.clipboard.writeText(inv);
      setCopiedInvoice(true);
      showToast('Nomor Invoice berhasil disalin ke clipboard!', 'success');
      setTimeout(() => setCopiedInvoice(false), 2500);
    }
  };

  // If order was just placed, display Order Success & Invoice confirmation screen
  if (createdOrder) {
    return (
      <div className="py-12 bg-slate-50 min-h-[80vh] flex items-center justify-center p-4">
        <div className="bg-white rounded-2xl max-w-xl w-full p-6 sm:p-8 shadow-xl border border-slate-200 text-center">
          <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
            Pesanan Berhasil Dibuat
          </span>
          <h2 className="text-xl sm:text-2xl font-extrabold text-slate-900 mt-1 mb-2">
            Invoice #{createdOrder.invoiceNumber}
          </h2>

          {/* Copyable Invoice Number Pill */}
          <div className="flex items-center justify-center gap-2 mb-4">
            <div className="bg-slate-100 border border-slate-300 px-3.5 py-1.5 rounded-xl font-mono text-xs sm:text-sm font-bold text-blue-900 flex items-center gap-2">
              <span>{createdOrder.invoiceNumber}</span>
              <button
                type="button"
                onClick={() => copyInvoiceToClipboard(createdOrder.invoiceNumber)}
                className="p-1 hover:bg-slate-200 text-slate-600 rounded cursor-pointer transition-colors"
                title="Salin Nomor Invoice"
              >
                {copiedInvoice ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
            {copiedInvoice && <span className="text-[11px] text-emerald-600 font-semibold">Tersalin!</span>}
          </div>

          <div className="p-4 bg-slate-50 rounded-xl border border-slate-200 text-left my-4 space-y-2 text-xs">
            <div className="flex justify-between">
              <span className="text-slate-500">Penerima:</span>
              <span className="font-bold text-slate-900">{createdOrder.customerName} ({createdOrder.customerWhatsapp})</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Alamat Kirim:</span>
              <span className="font-semibold text-slate-800 text-right max-w-xs">{createdOrder.shippingAddress.city}, {createdOrder.shippingAddress.province}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-500">Pengiriman:</span>
              <span className="font-semibold text-slate-800 text-right">{createdOrder.courier || 'Dikonfirmasi ke Admin'}</span>
            </div>
            <div className="p-2.5 bg-amber-100/70 border border-amber-300 rounded-lg text-[11px] text-slate-950 font-bold leading-relaxed">
              * <strong>Toko tidak melayani pengiriman langsung.</strong> Pengiriman atau pengambilan barang wajib dikonfirmasi ke admin dahulu via WhatsApp. Biaya ongkir ditambahkan secara manual oleh admin setelah disepakati.
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
              <span>Total Tagihan Produk:</span>
              <span className="text-blue-900 font-mono-nums">{formatRupiah(createdOrder.totalAmount)}</span>
            </div>
          </div>

          {/* QRIS Toko Display if uploaded */}
          {storeSettings.qrisImageUrl && (
            <div className="p-4 bg-emerald-50/70 rounded-xl border-2 border-emerald-400 text-center mb-4">
              <div className="text-xs font-black text-slate-950 mb-1 flex items-center justify-center gap-1.5">
                <CreditCard className="w-4 h-4 text-emerald-700" />
                <span>Scan QRIS Toko Resmi</span>
              </div>
              <p className="text-[11px] text-slate-700 mb-2 font-medium">
                Bebas biaya admin · Mendukung BCA, Mandiri, BRI, BNI, GoPay, OVO, Dana, ShopeePay
              </p>
              <img
                src={storeSettings.qrisImageUrl}
                alt="QRIS Toko"
                className="max-w-[210px] max-h-[210px] object-contain mx-auto rounded-lg border border-emerald-200 p-2 bg-white shadow-sm"
              />
            </div>
          )}

          {/* Bank Instructions */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-left mb-6 text-xs text-amber-900">
            <div className="font-bold mb-1">Informasi Rekening Pembayaran ({createdOrder.paymentMethod}):</div>
            <p className="mb-2">Silakan transfer nominal pas ke salah satu rekening resmi kami:</p>
            {activeBankAccounts.map((acc) => (
              <div key={acc.id || acc.bankName} className="font-mono-nums text-[11px] py-0.5">
                • <strong>{acc.bankName}</strong>: {acc.accountNumber} a/n {acc.accountHolder}
              </div>
            ))}
          </div>

          <div className="space-y-2.5">
            <a
              href={getWhatsAppConfirmationUrl(createdOrder)}
              target="_blank"
              rel="noopener noreferrer"
              className="w-full py-3 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-xs"
            >
              <MessageCircle className="w-4 h-4" />
              Kirim Nota Invoice &amp; Bukti Transfer ke WhatsApp Admin
            </a>
            <button
              onClick={() => {
                setSelectedInvoiceId(createdOrder.invoiceNumber);
                setCurrentView('orders');
              }}
              className="w-full py-2.5 px-4 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl transition-colors cursor-pointer flex items-center justify-center gap-2"
            >
              <Truck className="w-4 h-4 text-blue-900" />
              <span>Lacak Status Pesanan Ini Sekarang</span>
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <section className="py-12 bg-slate-50 min-h-[80vh]">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900">
            Form Checkout &amp; Pengiriman
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1 font-semibold">
            Lengkapi alamat pengiriman Anda. <strong>Harga yang tercantum belum termasuk biaya ekspedisi pengiriman (ongkir ditanggung oleh pembeli).</strong>
          </p>
        </div>

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Customer & Shipping Details (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Customer Contact */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                <span className="w-6 h-6 rounded-full bg-blue-900 text-white text-xs flex items-center justify-center">1</span>
                <span>Data Pemesan &amp; Kontak WhatsApp</span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Nama Lengkap Pemesan <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Hj. Nurhayati / Toko Berkah Mode"
                    value={recipientName}
                    onChange={(e) => setRecipientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white text-slate-900"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Nomor WhatsApp <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      required
                      placeholder="081234567890"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Alamat Email (Opsional)
                    </label>
                    <input
                      type="email"
                      placeholder="email@toko.com"
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white text-slate-900"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Step 2: Shipping Destination */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                <span className="w-6 h-6 rounded-full bg-blue-900 text-white text-xs flex items-center justify-center">2</span>
                <span>Alamat Pengiriman Lengkap</span>
              </div>

              <div className="space-y-4 text-xs">
                <div>
                  <label className="block font-bold text-slate-800 mb-1">
                    Alamat Jalan / Gedung / Patokan <span className="text-red-500">*</span>
                  </label>
                  <textarea
                    rows={2}
                    required
                    placeholder="Nama jalan, nomor rumah/ruko, RT/RW, atau patokan toko Anda..."
                    value={street}
                    onChange={(e) => setStreet(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white text-slate-900"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Kota / Kabupaten <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Medan / Pekanbaru"
                      value={city}
                      onChange={(e) => setCity(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white text-slate-900"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">
                      Provinsi <span className="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="Contoh: Sumatera Utara / Riau"
                      value={province}
                      onChange={(e) => setProvince(e.target.value)}
                      className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white text-slate-900"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Kecamatan</label>
                    <input
                      type="text"
                      placeholder="Kecamatan..."
                      value={kecamatan}
                      onChange={(e) => setKecamatan(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Kelurahan</label>
                    <input
                      type="text"
                      placeholder="Kelurahan..."
                      value={kelurahan}
                      onChange={(e) => setKelurahan(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-slate-800 mb-1">Kode Pos</label>
                    <input
                      type="text"
                      placeholder="Kode pos"
                      value={postalCode}
                      onChange={(e) => setPostalCode(e.target.value)}
                      className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono-nums"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-slate-800 mb-1">Catatan Pengemasan / Ekspedisi</label>
                  <input
                    type="text"
                    value={shippingNotes}
                    onChange={(e) => setShippingNotes(e.target.value)}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs text-slate-700"
                  />
                </div>
              </div>
            </div>

            {/* Step 3: Ketentuan Pengiriman (Toko Tidak Melayani Pengiriman Langsung) */}
            <div className="bg-white p-6 rounded-2xl border-2 border-amber-300 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 text-sm font-black text-slate-950 pb-2 border-b border-amber-200">
                <span className="w-6 h-6 rounded-full bg-amber-500 text-slate-950 font-black text-xs flex items-center justify-center">3</span>
                <span>Ketentuan Pengiriman / Pengambilan Barang</span>
              </div>

              {/* Notice Banner */}
              <div className="p-4 bg-amber-50 border-2 border-amber-400 rounded-xl space-y-2">
                <div className="flex items-start gap-2.5">
                  <Truck className="w-5 h-5 text-amber-800 shrink-0 mt-0.5" />
                  <div>
                    <h4 className="text-xs sm:text-sm font-black text-slate-950 leading-snug">
                      Toko tidak melayani pengiriman langsung. Pengiriman barang wajib dikonfirmasi ke admin dahulu.
                    </h4>
                    <p className="text-xs text-slate-800 font-bold leading-relaxed mt-1">
                      Harga yang tercantum belum termasuk biaya pengiriman. Seluruh pengaturan kurir, kargo, atau pengambilan barang wajib disepakati bersama admin terlebih dahulu via WhatsApp. Biaya pengiriman manual akan ditambahkan oleh admin ke rincian pesanan.
                    </p>
                  </div>
                </div>
              </div>

              {/* Interactive WhatsApp Button for Shipping Confirmation */}
              <div className="pt-1">
                <button
                  type="button"
                  onClick={handleAskShippingCostWhatsApp}
                  className="w-full py-3 px-4 text-xs font-black text-slate-950 bg-amber-400 hover:bg-amber-300 rounded-xl flex items-center justify-center gap-2 border border-amber-500 shadow-sm cursor-pointer transition-colors"
                >
                  <MessageCircle className="w-4 h-4 text-slate-950" />
                  <span>Konfirmasi Pengiriman ke Admin via WhatsApp</span>
                </button>
                <p className="text-[11px] text-slate-700 text-center font-bold mt-1.5">
                  Hubungi admin kami untuk menyepakati pengiriman dan biaya ongkir ke kota {city || 'tujuan Anda'}.
                </p>
              </div>
            </div>

            {/* Step 4: Payment Method */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs space-y-4">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 pb-2 border-b border-slate-100">
                <span className="w-6 h-6 rounded-full bg-blue-900 text-white text-xs flex items-center justify-center">4</span>
                <span>Metode Pembayaran (Transfer Bank, E-Wallet &amp; QRIS)</span>
              </div>

              {/* QRIS Toko Card if uploaded */}
              {storeSettings.qrisImageUrl && (
                <div className="p-4 bg-emerald-50 rounded-xl border-2 border-emerald-400 flex flex-col sm:flex-row items-center gap-4">
                  <div className="shrink-0 bg-white p-2 rounded-xl border border-emerald-300 shadow-xs">
                    <img
                      src={storeSettings.qrisImageUrl}
                      alt="QRIS Toko"
                      className="w-28 h-28 object-contain"
                    />
                  </div>
                  <div className="text-center sm:text-left">
                    <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-200 text-emerald-900 font-black text-[10px] mb-1">
                      <CreditCard className="w-3 h-3" />
                      <span>QRIS TOKO RESMI TERSEDIA</span>
                    </div>
                    <h4 className="text-xs font-black text-slate-900">
                      Scan QRIS Menggunakan Semua Aplikasi Bank &amp; E-Wallet
                    </h4>
                    <p className="text-[11px] text-slate-600 font-medium mt-0.5">
                      Bisa scan lewat BCA Mobile, Livin Mandiri, BRImo, BNI Mobile, GoPay, OVO, Dana, ShopeePay. Tanpa biaya admin tambahan.
                    </p>
                    <button
                      type="button"
                      onClick={() => setPaymentMethod('QRIS Toko Resmi')}
                      className={`mt-2 px-3 py-1.5 rounded-lg text-xs font-bold transition-all cursor-pointer ${
                        paymentMethod === 'QRIS Toko Resmi'
                          ? 'bg-emerald-600 text-white shadow-xs'
                          : 'bg-white border border-emerald-400 text-emerald-800 hover:bg-emerald-100'
                      }`}
                    >
                      {paymentMethod === 'QRIS Toko Resmi' ? '✓ Dipilih sebagai Metode Pembayaran' : 'Pilih Pembayaran via QRIS'}
                    </button>
                  </div>
                </div>
              )}

              <div>
                <label className="block text-xs font-bold text-slate-800 mb-2">
                  Atau Pilih Transfer Rekening Bank / E-Wallet:
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
                  {/* QRIS Option button in grid */}
                  {storeSettings.qrisImageUrl && (
                    <label
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                        paymentMethod === 'QRIS Toko Resmi'
                          ? 'border-emerald-600 bg-emerald-50 text-emerald-950 font-bold ring-2 ring-emerald-500/20'
                          : 'border-slate-200 text-slate-700 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value="QRIS Toko Resmi"
                        checked={paymentMethod === 'QRIS Toko Resmi'}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="sr-only"
                      />
                      <div>
                        <div className="font-bold text-slate-900 flex items-center gap-1">
                          <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                          <span>QRIS Toko Resmi</span>
                        </div>
                        <div className="text-[11px] text-slate-600 mt-0.5">Scan Barcode QRIS</div>
                      </div>
                      <div className="text-[10px] text-emerald-700 font-semibold mt-2">
                        Semua Bank &amp; E-Wallet
                      </div>
                    </label>
                  )}

                  {activeBankAccounts.map((b) => (
                    <label
                      key={b.id || b.bankName}
                      className={`p-3.5 rounded-xl border text-left cursor-pointer transition-all flex flex-col justify-between ${
                        paymentMethod === b.bankName
                          ? 'border-blue-900 bg-blue-50 text-blue-900 font-bold ring-2 ring-blue-900/20'
                          : 'border-slate-200 text-slate-700 bg-white hover:border-slate-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="paymentMethod"
                        value={b.bankName}
                        checked={paymentMethod === b.bankName}
                        onChange={(e) => setPaymentMethod(e.target.value)}
                        className="sr-only"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{b.bankName}</div>
                        <div className="font-mono text-[11px] text-slate-600 mt-0.5">{b.accountNumber}</div>
                      </div>
                      <div className="text-[10px] text-slate-500 mt-2">
                        a.n. {b.accountHolder}
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Order Summary (5 cols) */}
          <div className="lg:col-span-5">
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm sticky top-24 space-y-4">
              <h3 className="text-base font-bold text-slate-900 pb-3 border-b border-slate-100">
                Ringkasan Pesanan Grosir
              </h3>

              {/* Items List */}
              <div className="max-h-60 overflow-y-auto space-y-3 pr-1 text-xs">
                {cart.map((item) => (
                  <div key={item.product.id} className="flex justify-between items-center py-1">
                    <div className="flex items-center gap-2 max-w-[70%]">
                      <img
                        src={item.product.imageUrl}
                        alt={item.product.name}
                        className="w-10 h-10 object-cover rounded-md border border-slate-200 shrink-0"
                      />
                      <div className="truncate">
                        <div className="font-semibold text-slate-900 truncate">{item.product.name}</div>
                        <div className="text-[11px] text-slate-500 font-mono-nums">
                          {item.quantity} {item.product.unit} × Rp {item.product.wholesalePrice.toLocaleString('id-ID')}
                        </div>
                      </div>
                    </div>
                    <span className="font-mono-nums font-bold text-slate-800">
                      Rp {(item.product.wholesalePrice * item.quantity).toLocaleString('id-ID')}
                    </span>
                  </div>
                ))}
              </div>

              {/* Price Breakdown */}
              <div className="pt-3 border-t border-slate-200 space-y-2 text-xs">
                <div className="flex justify-between text-slate-600">
                  <span className="font-bold text-slate-800">Subtotal Barang Grosir:</span>
                  <span className="font-mono-nums font-black text-slate-950">{formatRupiah(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between items-center text-slate-600">
                  <span className="font-bold text-slate-800">Biaya Ekspedisi / Ongkir:</span>
                  <span className="font-mono-nums font-bold text-amber-950 bg-amber-100 border border-amber-300 px-2 py-0.5 rounded text-[11px]">
                    Ditanggung Pembeli
                  </span>
                </div>

                {/* Clear Shipping Notice Banner */}
                <div className="p-2.5 bg-amber-50 rounded-xl border border-amber-300 text-[11px] text-slate-950 font-bold leading-snug">
                  * <strong>Harga yang tercantum belum termasuk biaya ekspedisi pengiriman</strong> (ongkir ditanggung oleh pembeli).
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between text-sm font-black text-slate-950">
                  <span>Total Tagihan Produk:</span>
                  <span className="font-mono-nums text-lg text-slate-950 font-black">
                    {formatRupiah(grandTotal)}
                  </span>
                </div>
              </div>

              <div className="p-3 bg-slate-50 rounded-xl text-[11px] text-slate-500 space-y-1">
                <div className="flex items-center gap-1.5 text-slate-700 font-semibold">
                  <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                  <span>Garansi Transparansi Transaksi</span>
                </div>
                <p>
                  Foto nota fisik asli dari toko lapak grosir akan kami sertakan dalam paket pengiriman Anda.
                </p>
              </div>

              <button
                type="submit"
                disabled={isSubmitting || cart.length === 0}
                className="w-full py-3.5 px-4 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
              >
                <span>{isSubmitting ? 'Memproses Pesanan...' : 'Konfirmasi & Buat Pesanan'}</span>
                <ArrowRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        </form>
      </div>
    </section>
  );
};
