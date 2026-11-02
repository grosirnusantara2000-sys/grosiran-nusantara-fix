import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { submitProductRequest, fetchRequestByIdOrTicket, updateRequestStatus } from '../services/dataService';
import { ProductRequest } from '../types';
import {
  FilePlus2,
  Upload,
  X,
  CheckCircle2,
  Clock,
  MessageCircle,
  Search,
  Check,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Image as ImageIcon,
  Sparkles,
} from 'lucide-react';
import { BUSINESS_INFO } from '../data/initialData';

export const RequestForm: React.FC = () => {
  const { user, showToast, setCurrentView, activeOutlet, activeOutletInfo } = useApp();

  const [activeTab, setActiveTab] = useState<'form' | 'tracking'>('form');

  // Form Fields
  const [customerName, setCustomerName] = useState(user?.displayName || '');
  const [customerWhatsapp, setCustomerWhatsapp] = useState('');
  const [itemName, setItemName] = useState('');
  const [category, setCategory] = useState('Hijab & Muslim Fashion');
  const [description, setDescription] = useState('');
  const [quantity, setQuantity] = useState('');
  const [targetBudget, setTargetBudget] = useState('');
  const [notes, setNotes] = useState('');
  const [photoUrls, setPhotoUrls] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<ProductRequest | null>(null);

  // Tracking tab fields
  const [trackingQuery, setTrackingQuery] = useState('');
  const [searchedRequest, setSearchedRequest] = useState<ProductRequest | null>(null);
  const [isSearchingTracking, setIsSearchingTracking] = useState(false);
  const [trackingNotFound, setTrackingNotFound] = useState(false);

  // Photo Upload Handler (converts to base64 Data URL so it saves safely without external upload server)
  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    if (photoUrls.length + files.length > 5) {
      showToast('Maksimal 5 foto referensi barang', 'error');
      return;
    }

    Array.from(files).forEach((file) => {
      if (file.size > 2 * 1024 * 1024) {
        showToast(`File ${file.name} melebihi batas 2MB`, 'error');
        return;
      }
      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          setPhotoUrls((prev) => [...prev, event.target!.result as string]);
        }
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setPhotoUrls((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!customerName.trim() || !customerWhatsapp.trim() || !itemName.trim()) {
      showToast('Mohon lengkapi nama, nomor WhatsApp, dan nama barang', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const created = await submitProductRequest({
        customerId: user?.uid,
        customerName: customerName.trim(),
        customerWhatsapp: customerWhatsapp.trim(),
        itemName: itemName.trim(),
        category,
        description: description.trim(),
        quantity: quantity.trim() || '1 lusin',
        targetBudget: targetBudget.trim() || 'Menyesuaikan lapak',
        notes: notes.trim(),
        photoUrls,
        outletId: activeOutlet,
      });

      setSubmittedTicket(created);
      showToast(`Request berhasil dikirim ke tim ${activeOutletInfo.shortName}!`, 'success');

      // Reset form
      setItemName('');
      setDescription('');
      setQuantity('');
      setTargetBudget('');
      setNotes('');
      setPhotoUrls([]);
    } catch (err: any) {
      showToast('Gagal mengirim request: ' + err.message, 'error');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSearchTracking = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!trackingQuery.trim()) return;

    setIsSearchingTracking(true);
    setTrackingNotFound(false);
    try {
      const result = await fetchRequestByIdOrTicket(trackingQuery.trim());
      if (result) {
        setSearchedRequest(result);
      } else {
        setSearchedRequest(null);
        setTrackingNotFound(true);
      }
    } catch (err) {
      showToast('Gagal melacak tiket request', 'error');
    } finally {
      setIsSearchingTracking(false);
    }
  };

  const handleCustomerApproveOffer = async (request: ProductRequest) => {
    try {
      await updateRequestStatus(request.id, 'Disetujui Customer');
      setSearchedRequest({ ...request, status: 'Disetujui Customer' });
      showToast('Penawaran harga disetujui! Tim Grosir Nusantara akan membelikan barang Anda di lapak.', 'success');
    } catch (err) {
      showToast('Gagal menyetujui penawaran', 'error');
    }
  };

  const generateWhatsAppUrl = (ticket: ProductRequest) => {
    const text = `Halo Admin Grosir Nusantara (${activeOutletInfo.shortName}), saya sudah membuat Request Barang dengan No. Tiket: *${ticket.ticketNumber}*.\n\nNama: ${ticket.customerName}\nBarang: *${ticket.itemName}*\nJumlah: ${ticket.quantity}\nTarget Budget: ${ticket.targetBudget}\n\nMohon bantuannya untuk dicarikan di sentra ${activeOutletInfo.name}. Terima kasih!`;
    return `https://wa.me/62${BUSINESS_INFO.whatsapp.replace(/^0/, '')}?text=${encodeURIComponent(text)}`;
  };

  return (
    <section className="py-12 bg-slate-50 min-h-[80vh]">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Header & Description */}
        <div className="text-center max-w-2xl mx-auto mb-8">
          <div className="inline-flex items-center gap-2 text-xs font-bold text-amber-600 uppercase tracking-wider mb-2">
            <FilePlus2 className="w-4 h-4" />
            <span>Layanan Prioritas Sourcing – {activeOutletInfo.shortName}</span>
          </div>
          <h1 className="text-2xl sm:text-4xl font-extrabold text-slate-900 leading-tight">
            Request Belanja Grosir {activeOutletInfo.name}
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2">
            Punya foto model pakaian, gamis, mukena, kaos, celana, atau tas yang dicari? Kirimkan fotonya, tim sourcing Grosir Nusantara di sentra <strong>{activeOutletInfo.shortName} ({activeOutletInfo.city})</strong> akan mencarikannya langsung ke ribuan lapak konveksi dengan harga grosir termurah!
          </p>
        </div>

        {/* Tab Controls (Clean Segmented Control) */}
        <div className="flex items-center justify-center mb-8">
          <div className="bg-white p-1 rounded-xl border border-slate-200 shadow-2xs flex gap-1">
            <button
              onClick={() => setActiveTab('form')}
              className={`px-5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'form'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Form Request Baru
            </button>
            <button
              onClick={() => setActiveTab('tracking')}
              className={`px-5 py-2 text-xs font-semibold rounded-lg transition-all cursor-pointer ${
                activeTab === 'tracking'
                  ? 'bg-blue-900 text-white shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Lacak Status Request
            </button>
          </div>
        </div>

        {/* Tab 1: Form Request */}
        {activeTab === 'form' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Customer Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nama Lengkap Anda <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Hj. Nurlela / Budi Santoso"
                    value={customerName}
                    onChange={(e) => setCustomerName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nomor WhatsApp Aktif <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="tel"
                    required
                    placeholder="Contoh: 081234567890"
                    value={customerWhatsapp}
                    onChange={(e) => setCustomerWhatsapp(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white"
                  />
                  <span className="text-[10px] text-slate-500">
                    Admin akan mengirimkan foto barang langsung dari lapak ke nomor ini.
                  </span>
                </div>
              </div>

              {/* Item Details */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Nama Barang yang Dicari <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="Contoh: Mukena Bordir Padang Panjang / Kaos Polos Combed 24s"
                    value={itemName}
                    onChange={(e) => setItemName(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Kategori Barang
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900"
                  >
                    <option value="Hijab & Muslim Fashion">Hijab & Muslim Fashion</option>
                    <option value="Pakaian Wanita">Pakaian Wanita</option>
                    <option value="Pakaian Pria">Pakaian Pria</option>
                    <option value="Pakaian Anak">Pakaian Anak</option>
                    <option value="Tas & Dompet">Tas & Dompet</option>
                    <option value="Sepatu & Sandal">Sepatu & Sandal</option>
                    <option value="Aksesori & Tekstil">Aksesori & Tekstil</option>
                    <option value="Perlengkapan Rumah Tangga">Perlengkapan Rumah Tangga</option>
                    <option value="Produk Grosir Lainnya">Produk Grosir Lainnya</option>
                  </select>
                </div>
              </div>

              {/* Description & Specifications */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Deskripsi & Spesifikasi Detail
                </label>
                <textarea
                  rows={3}
                  placeholder="Sebutkan detail bahan, warna yang diinginkan, motif, ukuran, atau ciri khusus barang..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white"
                />
              </div>

              {/* Quantity & Budget */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Jumlah yang Diinginkan
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: 1 lusin (12 pcs) / 1 kodi (20 pcs)"
                    value={quantity}
                    onChange={(e) => setQuantity(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-slate-800 mb-1">
                    Estimasi Budget / Kisaran Harga per Pcs
                  </label>
                  <input
                    type="text"
                    placeholder="Contoh: Rp 30.000 - Rp 50.000 / pcs"
                    value={targetBudget}
                    onChange={(e) => setTargetBudget(e.target.value)}
                    className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white"
                  />
                </div>
              </div>

              {/* Upload Reference Photos */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Upload Foto Referensi Barang (Maks. 5 Foto)
                </label>
                <div className="border-2 border-dashed border-slate-200 hover:border-blue-900 rounded-xl p-4 sm:p-6 text-center transition-colors bg-slate-50">
                  <input
                    type="file"
                    id="photo-upload"
                    multiple
                    accept="image/*"
                    onChange={handlePhotoUpload}
                    className="hidden"
                  />
                  <label
                    htmlFor="photo-upload"
                    className="cursor-pointer flex flex-col items-center justify-center gap-2"
                  >
                    <div className="w-10 h-10 rounded-full bg-blue-50 text-blue-900 flex items-center justify-center">
                      <Upload className="w-5 h-5" />
                    </div>
                    <span className="text-xs font-bold text-slate-800">
                      Klik untuk Pilih Foto dari Galeri / Kamera
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Format JPG, PNG, WEBP (Maksimal 2MB per gambar)
                    </span>
                  </label>
                </div>

                {/* Photo Previews */}
                {photoUrls.length > 0 && (
                  <div className="grid grid-cols-3 sm:grid-cols-5 gap-3 mt-3">
                    {photoUrls.map((url, idx) => (
                      <div key={idx} className="relative aspect-square rounded-lg overflow-hidden border border-slate-200 bg-slate-100 group">
                        <img
                          src={url}
                          alt={`Foto referensi ${idx + 1}`}
                          className="w-full h-full object-cover"
                        />
                        <button
                          type="button"
                          onClick={() => removePhoto(idx)}
                          className="absolute top-1 right-1 p-1 bg-red-600 text-white rounded-full hover:bg-red-700 shadow-sm cursor-pointer"
                        >
                          <X className="w-3 h-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Additional Notes */}
              <div>
                <label className="block text-xs font-bold text-slate-800 mb-1">
                  Catatan Tambahan
                </label>
                <input
                  type="text"
                  placeholder="Contoh: Tolong cari di lapak Blok B lantai 2 atau pastikan bordirnya rapat"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  className="w-full px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 focus:bg-white"
                />
              </div>

              {/* Submit Button */}
              <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-4">
                <div className="flex items-center gap-2 text-xs text-slate-500">
                  <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>Gratis konsultasi & pencarian harga lapak</span>
                </div>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="w-full sm:w-auto px-8 py-3 text-xs font-bold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-xl transition-all shadow-md disabled:opacity-50 flex items-center justify-center gap-2 cursor-pointer"
                >
                  <FilePlus2 className="w-4 h-4" />
                  {isSubmitting ? 'Mengirim Data...' : 'Kirim Request Barang'}
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Success Modal / Ticket Output after submitting */}
        {submittedTicket && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
            <div className="bg-white rounded-2xl max-w-lg w-full p-6 sm:p-8 shadow-2xl relative text-center">
              <button
                onClick={() => setSubmittedTicket(null)}
                className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-500 cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>

              <div className="w-16 h-16 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-4">
                <CheckCircle2 className="w-8 h-8" />
              </div>

              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider">
                Request Berhasil Diterima!
              </span>
              <h3 className="text-xl font-extrabold text-slate-900 mt-1 mb-2">
                Nomor Tiket Anda
              </h3>

              <div className="p-3 bg-slate-100 rounded-xl font-mono-nums font-bold text-base sm:text-lg text-blue-900 tracking-wider mb-4 border border-slate-200">
                {submittedTicket.ticketNumber}
              </div>

              <p className="text-xs text-slate-600 leading-relaxed mb-6">
                Tim Grosir Nusantara telah menerima rincian barang: <strong>{submittedTicket.itemName}</strong>. Kami akan segera mendatangi sentra grosir dan mengirimkan foto sampel serta penawaran harga terbaik.
              </p>

              <div className="space-y-2">
                <a
                  href={generateWhatsAppUrl(submittedTicket)}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="w-full py-3 px-4 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-xl transition-colors flex items-center justify-center gap-2 shadow-sm"
                >
                  <MessageCircle className="w-4 h-4" />
                  Hubungi Admin via WhatsApp Sekarang
                </a>
                <button
                  onClick={() => {
                    setSubmittedTicket(null);
                    setTrackingQuery(submittedTicket.ticketNumber);
                    setActiveTab('tracking');
                  }}
                  className="w-full py-2.5 px-4 text-xs font-semibold text-slate-700 hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
                >
                  Lihat Halaman Status Request
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Tab 2: Lacak Status Request */}
        {activeTab === 'tracking' && (
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm p-6 sm:p-8">
            <h3 className="text-base font-bold text-slate-900 mb-2">
              Cek Progres & Penawaran Harga Barang
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Masukkan Nomor Tiket Request Anda (contoh: REQ-AK-20261101-1234)
            </p>

            <form onSubmit={handleSearchTracking} className="flex gap-2 mb-6">
              <input
                type="text"
                placeholder="Nomor Tiket Request..."
                value={trackingQuery}
                onChange={(e) => setTrackingQuery(e.target.value)}
                className="flex-1 px-3.5 py-2.5 text-xs bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-900 font-mono-nums"
              />
              <button
                type="submit"
                disabled={isSearchingTracking}
                className="px-5 py-2.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg transition-colors cursor-pointer flex items-center gap-1.5"
              >
                <Search className="w-3.5 h-3.5" />
                {isSearchingTracking ? 'Mencari...' : 'Lacak Tiket'}
              </button>
            </form>

            {trackingNotFound && (
              <div className="p-4 bg-amber-50 text-amber-900 rounded-xl border border-amber-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>
                  Nomor tiket tidak ditemukan. Pastikan format nomor sudah benar atau hubungi admin via WhatsApp untuk bantuan.
                </span>
              </div>
            )}

            {searchedRequest && (
              <div className="p-6 bg-slate-50 rounded-xl border border-slate-200 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-4 border-b border-slate-200 gap-2">
                  <div>
                    <span className="text-[11px] font-bold text-slate-500">Nomor Tiket</span>
                    <div className="text-base font-mono-nums font-extrabold text-blue-900">
                      {searchedRequest.ticketNumber}
                    </div>
                  </div>
                  <div className="text-left sm:text-right">
                    <span className="text-[11px] font-bold text-slate-500 block">Status Saat Ini</span>
                    <span className="inline-block px-3 py-1 rounded-full text-xs font-bold bg-blue-900 text-white shadow-2xs mt-1">
                      {searchedRequest.status}
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-slate-500">Barang yang Dicari:</span>
                    <div className="font-bold text-slate-900 mt-0.5">{searchedRequest.itemName}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Kategori:</span>
                    <div className="font-semibold text-slate-800 mt-0.5">{searchedRequest.category}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Jumlah Diminta:</span>
                    <div className="font-semibold text-slate-800 mt-0.5">{searchedRequest.quantity}</div>
                  </div>
                  <div>
                    <span className="text-slate-500">Estimasi Budget:</span>
                    <div className="font-semibold text-slate-800 mt-0.5">{searchedRequest.targetBudget}</div>
                  </div>
                </div>

                {/* Photos Submitted */}
                {searchedRequest.photoUrls && searchedRequest.photoUrls.length > 0 && (
                  <div className="pt-3 border-t border-slate-200">
                    <span className="text-xs font-bold text-slate-700 block mb-2">Foto Referensi Anda:</span>
                    <div className="flex gap-2 overflow-x-auto pb-2">
                      {searchedRequest.photoUrls.map((p, i) => (
                        <img
                          key={i}
                          src={p}
                          alt="Referensi"
                          className="w-16 h-16 object-cover rounded-lg border border-slate-200"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Admin Price Offer Box (If Available) */}
                {searchedRequest.adminOffer && (
                  <div className="mt-4 p-5 bg-white rounded-xl border border-orange-200 shadow-xs">
                    <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-wider mb-2">
                      <Sparkles className="w-4 h-4" />
                      <span>Penawaran Resmi dari Tim Grosir Nusantara</span>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 my-3 text-xs">
                      <div className="p-2.5 bg-slate-50 rounded-lg">
                        <span className="text-slate-500 block">Harga Lapak per Unit</span>
                        <span className="font-bold font-mono-nums text-slate-900">
                          Rp {searchedRequest.adminOffer.itemPricePerUnit.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg">
                        <span className="text-slate-500 block">Jumlah Diminta</span>
                        <span className="font-bold font-mono-nums text-blue-900">
                          {searchedRequest.quantity}
                        </span>
                      </div>
                      <div className="p-2.5 bg-slate-50 rounded-lg">
                        <span className="text-slate-500 block">Estimasi Ongkir</span>
                        <span className="font-bold font-mono-nums text-slate-900">
                          Rp {searchedRequest.adminOffer.estimatedShipping.toLocaleString('id-ID')}
                        </span>
                      </div>
                      <div className="p-2.5 bg-blue-50 text-blue-900 rounded-lg">
                        <span className="text-blue-700 block font-medium">Total Penawaran</span>
                        <span className="font-extrabold font-mono-nums text-sm">
                          Rp {searchedRequest.adminOffer.totalOffer.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>

                    {searchedRequest.adminOffer.adminNotes && (
                      <div className="text-xs text-slate-600 mb-3 p-3 bg-slate-50 rounded-lg">
                        <strong>Catatan Admin Lapak:</strong> {searchedRequest.adminOffer.adminNotes}
                      </div>
                    )}

                    {searchedRequest.status === 'Menunggu Persetujuan Harga' && (
                      <div className="flex gap-2 mt-3">
                        <button
                          onClick={() => handleCustomerApproveOffer(searchedRequest)}
                          className="px-4 py-2 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg flex items-center gap-1.5 cursor-pointer shadow-xs"
                        >
                          <Check className="w-4 h-4" />
                          Setujui Penawaran Harga
                        </button>
                        <a
                          href={generateWhatsAppUrl(searchedRequest)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="px-4 py-2 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg flex items-center gap-1.5"
                        >
                          <MessageCircle className="w-4 h-4 text-emerald-600" />
                          Diskusi / Nego di WA
                        </a>
                      </div>
                    )}
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
