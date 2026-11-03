import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { createOrder } from '../services/dataService';
import { BUSINESS_INFO, COURIER_OPTIONS, BANK_ACCOUNTS } from '../data/initialData';
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
  const [shippingNotes, setShippingNotes] = useState('Mohon packing karung & lapis plastik anti air');

  // Dynamic Couriers & Payment Methods from StoreSettings
  const activeCouriers = (storeSettings.courierOptions && storeSettings.courierOptions.length > 0)
    ? storeSettings.courierOptions.filter((c) => c.active !== false)
    : COURIER_OPTIONS;

  const activeBankAccounts = (storeSettings.bankAccounts && storeSettings.bankAccounts.length > 0)
    ? storeSettings.bankAccounts.filter((b) => b.active !== false)
    : BANK_ACCOUNTS.map((b, i) => ({ id: 'bank-' + i, ...b, active: true }));

  const [selectedCourierId, setSelectedCourierId] = useState(activeCouriers[0]?.id || 'indah-cargo');
  const [paymentMethod, setPaymentMethod] = useState(activeBankAccounts[0]?.bankName || 'Transfer BCA');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [createdOrder, setCreatedOrder] = useState<Order | null>(null);
  const [copiedInvoice, setCopiedInvoice] = useState(false);

  const selectedCourier = activeCouriers.find((c) => c.id === selectedCourierId) || activeCouriers[0] || COURIER_OPTIONS[0];

  // Rough estimation: 1 order item package ~ 5kg minimum cargo
  const totalWeightKg = Math.max(
    selectedCourier.minWeight || 5,
    Math.ceil(cart.reduce((sum, item) => sum + item.quantity * 0.35, 0))
  );
  const shippingCost = (selectedCourier.ratePerKg || 6500) * totalWeightKg;
  const grandTotal = cartSubtotal + shippingCost;

  const formatRupiah = (num: number) => 'Rp ' + num.toLocaleString('id-ID');

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
        color: item.selectedColor || '',
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
        shippingCost,
        totalAmount: grandTotal,
        courier: selectedCourier.name,
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
              <span className="text-slate-500">Ekspedisi:</span>
              <span className="font-semibold text-slate-800">{createdOrder.courier}</span>
            </div>
            <div className="flex justify-between pt-2 border-t border-slate-200 text-sm font-bold text-slate-900">
              <span>Total Tagihan:</span>
              <span className="text-blue-900 font-mono-nums">{formatRupiah(createdOrder.totalAmount)}</span>
            </div>
          </div>

          {/* Bank Instructions */}
          <div className="p-4 bg-amber-50 rounded-xl border border-amber-200 text-left mb-6 text-xs text-amber-900">
            <div className="font-bold mb-1">Informasi Rekening Pembayaran ({createdOrder.paymentMethod}):</div>
            <p className="mb-2">Silakan transfer nominal pas ke salah satu rekening resmi kami:</p>
            {BANK_ACCOUNTS.map((acc) => (
              <div key={acc.bankName} className="font-mono-nums text-[11px] py-0.5">
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
            Form Checkout & Pengiriman
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-1">
            Lengkapi alamat pengiriman dan pilih ekspedisi kargo pilihan Anda untuk pengiriman langsung dari sentra grosir
          </p>
        </div>

        <form onSubmit={handleSubmitOrder} className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Customer & Shipping Details (7 cols) */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Customer Contact */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                <span className="w-6 h-6 rounded-full bg-blue-900 text-white text-xs flex items-center justify-center">1</span>
                <span>Data Pemesan & Kontak WhatsApp</span>
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

            {/* Step 3: Courier Selection */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                <span className="w-6 h-6 rounded-full bg-blue-900 text-white text-xs flex items-center justify-center">3</span>
                <span>Pilih Layanan Ekspedisi Kargo</span>
              </div>

              <div className="space-y-2.5 text-xs">
                {activeCouriers.map((c) => (
                  <label
                    key={c.id}
                    className={`flex items-center justify-between p-3.5 rounded-xl border cursor-pointer transition-all ${
                      selectedCourierId === c.id
                        ? 'border-blue-900 bg-blue-50/50 shadow-2xs'
                        : 'border-slate-200 hover:border-slate-300 bg-white'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <input
                        type="radio"
                        name="courier"
                        checked={selectedCourierId === c.id}
                        onChange={() => setSelectedCourierId(c.id)}
                        className="text-blue-900 focus:ring-blue-900"
                      />
                      <div>
                        <div className="font-bold text-slate-900">{c.name}</div>
                        <div className="text-[11px] text-slate-500">
                          Estimasi sampai: {c.estimatedDays} · Min. {c.minWeight} kg {c.type ? `(${c.type})` : ''}
                        </div>
                      </div>
                    </div>
                    <div className="text-right font-mono-nums font-bold text-slate-800">
                      Rp {c.ratePerKg.toLocaleString('id-ID')}/kg
                    </div>
                  </label>
                ))}
              </div>
            </div>

            {/* Step 4: Payment Method */}
            <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
              <div className="flex items-center gap-2 text-sm font-bold text-slate-900 mb-4 pb-2 border-b border-slate-100">
                <span className="w-6 h-6 rounded-full bg-blue-900 text-white text-xs flex items-center justify-center">4</span>
                <span>Metode Pembayaran (Transfer Bank &amp; E-Wallet)</span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 text-xs">
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
                  <span>Subtotal Barang Grosir:</span>
                  <span className="font-mono-nums font-semibold text-slate-900">{formatRupiah(cartSubtotal)}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Estimasi Ongkir ({totalWeightKg} kg):</span>
                  <span className="font-mono-nums font-semibold text-slate-900">+{formatRupiah(shippingCost)}</span>
                </div>

                <div className="pt-3 border-t border-slate-200 flex justify-between text-sm font-extrabold text-slate-900">
                  <span>Total Tagihan:</span>
                  <span className="font-mono-nums text-lg text-blue-900 font-extrabold">
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
