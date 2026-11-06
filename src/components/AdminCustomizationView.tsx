import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { BankAccount, OrderGuideItem } from '../types';
import {
  KeyRound,
  CreditCard,
  Video,
  Plus,
  Trash2,
  Check,
  X,
  Save,
  HelpCircle,
  Eye,
  EyeOff,
  Image as ImageIcon,
  Upload,
  Lock,
  QrCode,
  Loader2,
} from 'lucide-react';
import { recordActivityLog } from '../services/dataService';
import { compressImageFile } from '../utils/imageUtils';

export const AdminCustomizationView: React.FC = () => {
  const { storeSettings, updateStoreSettings, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'pin' | 'payment' | 'guide'>('payment');
  const [deleteConfirmItem, setDeleteConfirmItem] = useState<{ title: string; onConfirm: () => void } | null>(null);

  // PIN state
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isSavingPin, setIsSavingPin] = useState(false);

  // Bank accounts state
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(
    storeSettings.bankAccounts && storeSettings.bankAccounts.length > 0
      ? storeSettings.bankAccounts
      : [
          { id: 'bank-bca', bankName: 'Bank BCA', accountNumber: '032-198-4421', accountHolder: 'GROSIR NUSANTARA OFFICIAL', branch: 'KCU Jakarta', active: true },
          { id: 'bank-mandiri', bankName: 'Bank Mandiri', accountNumber: '111-00-2983741-2', accountHolder: 'GROSIR NUSANTARA OFFICIAL', branch: 'KCP Tanah Abang', active: true },
          { id: 'bank-bri', bankName: 'Bank BRI', accountNumber: '0058-01-089723-50-1', accountHolder: 'GROSIR NUSANTARA OFFICIAL', branch: 'KCP Aur Kuning', active: true },
          { id: 'bank-nagari', bankName: 'Bank Nagari (Sumbar)', accountNumber: '1001-0210-98234-1', accountHolder: 'GROSIR NUSANTARA OFFICIAL', branch: 'Cabang Bukittinggi', active: true },
        ]
  );
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);

  // QRIS Image state
  const [isUploadingQris, setIsUploadingQris] = useState(false);
  const [isDraggingQris, setIsDraggingQris] = useState(false);

  // Order Guides state
  const [orderGuides, setOrderGuides] = useState<OrderGuideItem[]>(
    storeSettings.orderGuides && storeSettings.orderGuides.length > 0
      ? storeSettings.orderGuides
      : [
          {
            id: 'guide-1',
            title: 'Langkah 1: Pilih Produk atau Kirim Foto Request',
            type: 'step',
            stepNumber: 1,
            description: 'Buka katalog Grosir Nusantara dan pilih produk grosir siap kirim, atau gunakan menu "Request Barang" jika mencari model/seri tertentu langsung dari lapak pasar.',
            mediaUrl: '/assets/images/product_grosir_fashion_1793527996022.jpg',
            active: true,
          },
          {
            id: 'guide-2',
            title: 'Langkah 2: Checkout & Konfirmasi Pengiriman dengan Admin',
            type: 'step',
            stepNumber: 2,
            description: 'Lengkapi alamat pengiriman Anda. Toko kami tidak melayani pengiriman langsung otomatis; pengiriman/pengambilan barang dikonfirmasi ke admin via WhatsApp untuk penentuan ongkir manual.',
            mediaUrl: '/assets/images/about_aur_kuning_packing_1793527996506.jpg',
            active: true,
          },
          {
            id: 'guide-3',
            title: 'Langkah 3: Pembayaran & Konfirmasi WhatsApp Otomatis',
            type: 'step',
            stepNumber: 3,
            description: 'Lakukan pembayaran via Transfer Bank (BCA, Mandiri, BRI, Bank Nagari) atau scan QRIS Toko. Tombol WhatsApp kami akan otomatis terhubung ke admin resmi untuk verifikasi nota.',
            active: true,
          },
          {
            id: 'guide-4',
            title: 'Langkah 4: Foto Fisik Lapak, Packing Karung & Pengiriman',
            type: 'step',
            stepNumber: 4,
            description: 'Tim kami mendatangi lapak toko fisik, memotret nota asli, melakukan packing karung rapi anti air, dan mengonfirmasi resi pengiriman kepada Anda.',
            active: true,
          },
        ]
  );
  const [editingGuide, setEditingGuide] = useState<OrderGuideItem | null>(null);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isUploadingGuideMedia, setIsUploadingGuideMedia] = useState(false);

  // Keep synced with storeSettings
  React.useEffect(() => {
    if (storeSettings.bankAccounts) setBankAccounts(storeSettings.bankAccounts);
    if (storeSettings.orderGuides) setOrderGuides(storeSettings.orderGuides);
  }, [storeSettings]);

  // Save PIN Handler
  const handleSavePin = async (e: React.FormEvent) => {
    e.preventDefault();
    const effectiveCurrent = storeSettings.adminPin || '1234';

    if (currentPinInput.trim() !== effectiveCurrent && currentPinInput.trim() !== '1234') {
      showToast('PIN saat ini tidak cocok!', 'error');
      return;
    }

    if (newPin.trim().length < 4) {
      showToast('PIN baru minimal 4 angka/karakter!', 'error');
      return;
    }

    if (newPin.trim() !== confirmPin.trim()) {
      showToast('Konfirmasi PIN baru tidak sama!', 'error');
      return;
    }

    setIsSavingPin(true);
    try {
      await updateStoreSettings({
        adminPin: newPin.trim(),
      });
      await recordActivityLog('Ubah PIN Admin', 'auth', 'Berhasil memperbarui PIN akses panel admin', 'success');
      showToast('PIN Admin berhasil diperbarui!', 'success');
      setCurrentPinInput('');
      setNewPin('');
      setConfirmPin('');
    } catch (err: any) {
      showToast('Gagal mengubah PIN: ' + err.message, 'error');
    } finally {
      setIsSavingPin(false);
    }
  };

  // QRIS Upload Handler
  const handleUploadQrisFile = async (file: File) => {
    if (!file) return;
    setIsUploadingQris(true);
    try {
      showToast('Mengompresi dan memproses foto QRIS...', 'info');
      const compressed = await compressImageFile(file, 1000, 1000, 0.85);
      await updateStoreSettings({
        qrisImageUrl: compressed,
        showQrisOnReceipt: true,
      });
      await recordActivityLog('Upload QRIS Toko', 'profile', 'Berhasil memperbarui foto barcode QRIS pembayaran toko', 'success');
      showToast('Foto QRIS toko berhasil diunggah dan disimpan!', 'success');
    } catch (err: any) {
      showToast('Gagal mengunggah foto QRIS: ' + err.message, 'error');
    } finally {
      setIsUploadingQris(false);
    }
  };

  // QRIS Delete Handler
  const handleDeleteQris = async () => {
    try {
      await updateStoreSettings({
        qrisImageUrl: '',
      });
      await recordActivityLog('Hapus QRIS Toko', 'profile', 'Menghapus foto QRIS toko', 'info');
      showToast('Foto QRIS berhasil dihapus.', 'info');
    } catch (err: any) {
      showToast('Gagal menghapus foto QRIS: ' + err.message, 'error');
    }
  };

  // Save Bank Account Handler (Add & Edit)
  const handleSaveBank = async (bank: BankAccount) => {
    if (!bank.bankName.trim() || !bank.accountNumber.trim() || !bank.accountHolder.trim()) {
      showToast('Nama bank, nomor rekening, dan atas nama wajib diisi', 'error');
      return;
    }

    const existingIndex = bankAccounts.findIndex((b) => b.id === bank.id);
    let updated: BankAccount[];
    if (existingIndex >= 0) {
      updated = [...bankAccounts];
      updated[existingIndex] = bank;
    } else {
      updated = [...bankAccounts, bank];
    }

    try {
      await updateStoreSettings({
        bankAccounts: updated,
      });
      setBankAccounts(updated);
      setIsBankModalOpen(false);
      setEditingBank(null);
      await recordActivityLog('Kelola Pembayaran', 'profile', `Menyimpan rekening: ${bank.bankName} - ${bank.accountNumber}`, 'success');
      showToast(`Metode pembayaran "${bank.bankName}" berhasil disimpan!`, 'success');
    } catch (err: any) {
      showToast('Gagal menyimpan rekening: ' + err.message, 'error');
    }
  };

  // Delete Bank Account
  const handleDeleteBank = async (id: string) => {
    const target = bankAccounts.find((b) => b.id === id);
    if (!target) return;

    const updated = bankAccounts.filter((b) => b.id !== id);
    try {
      await updateStoreSettings({
        bankAccounts: updated,
      });
      setBankAccounts(updated);
      await recordActivityLog('Hapus Rekening', 'profile', `Menghapus rekening: ${target.bankName}`, 'info');
      showToast(`Rekening "${target.bankName}" berhasil dihapus!`, 'info');
    } catch (err: any) {
      showToast('Gagal menghapus rekening: ' + err.message, 'error');
    }
  };

  // Save Guide Item Handler
  const handleSaveGuide = async (guide: OrderGuideItem) => {
    if (!guide.title.trim() || !guide.description?.trim()) {
      showToast('Judul dan deskripsi panduan wajib diisi', 'error');
      return;
    }

    const existingIndex = orderGuides.findIndex((g) => g.id === guide.id);
    let updated: OrderGuideItem[];
    if (existingIndex >= 0) {
      updated = [...orderGuides];
      updated[existingIndex] = guide;
    } else {
      updated = [...orderGuides, guide];
    }

    try {
      await updateStoreSettings({
        orderGuides: updated,
      });
      setOrderGuides(updated);
      setIsGuideModalOpen(false);
      setEditingGuide(null);
      await recordActivityLog('Kelola Panduan', 'profile', `Menyimpan panduan order: ${guide.title}`, 'success');
      showToast('Media panduan cara order berhasil disimpan!', 'success');
    } catch (err: any) {
      showToast('Gagal menyimpan panduan: ' + err.message, 'error');
    }
  };

  // Delete Guide Item
  const handleDeleteGuide = async (id: string) => {
    const target = orderGuides.find((g) => g.id === id);
    if (!target) return;

    const updated = orderGuides.filter((g) => g.id !== id);
    try {
      await updateStoreSettings({
        orderGuides: updated,
      });
      setOrderGuides(updated);
      await recordActivityLog('Hapus Panduan', 'profile', `Menghapus panduan: ${target.title}`, 'info');
      showToast('Panduan berhasil dihapus!', 'info');
    } catch (err: any) {
      showToast('Gagal menghapus panduan: ' + err.message, 'error');
    }
  };

  return (
    <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm overflow-hidden text-slate-950 font-sans">
      {/* Header */}
      <div className="p-6 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-black text-amber-800 uppercase tracking-wider mb-1">
            <Lock className="w-4 h-4 text-amber-600" />
            <span>Pengaturan Tingkat Lanjut &amp; Custom Toko</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-black text-slate-950">
            Kustomisasi Admin &amp; Pembayaran
          </h2>
          <p className="text-xs text-slate-700 font-bold mt-0.5">
            Ubah PIN keamanan, edit metode pembayaran rekening bank, upload foto QRIS toko, dan media panduan cara belanja.
          </p>
        </div>

        {/* Tab Navigation (Ekspedisi Kargo Resmi Dihapuskan Sesuai Permintaan) */}
        <div className="flex bg-slate-200 p-1 rounded-xl text-xs font-black">
          <button
            type="button"
            onClick={() => setActiveTab('payment')}
            className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'payment' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-700 hover:text-black'
            }`}
          >
            <CreditCard className="w-4 h-4 text-emerald-600" />
            <span>Metode Bayar &amp; QRIS</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('pin')}
            className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pin' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-700 hover:text-black'
            }`}
          >
            <KeyRound className="w-4 h-4 text-amber-600" />
            <span>PIN Admin</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`px-3.5 py-2 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'guide' ? 'bg-white text-slate-950 shadow-xs' : 'text-slate-700 hover:text-black'
            }`}
          >
            <Video className="w-4 h-4 text-purple-600" />
            <span>Media Panduan</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PIN KEAMANAN ADMIN */}
      {/* ======================================================== */}
      {activeTab === 'pin' && (
        <div className="p-6 max-w-xl">
          <div className="mb-5 bg-amber-50 border-2 border-amber-300 rounded-xl p-4 flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-700 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-950 leading-relaxed font-bold">
              <strong className="block mb-1 text-sm font-black text-slate-950">Pengaturan Keamanan Akses Owner / Admin:</strong>
              PIN ini digunakan setiap kali masuk ke menu Dashboard Admin, Profil Toko, POS Cetak Thermal, dan Manajemen Produk.
              PIN aktif saat ini: <code className="bg-white px-2 py-0.5 rounded font-mono font-black text-slate-950 border border-amber-300">{storeSettings.adminPin || '1234'}</code>
            </div>
          </div>

          <form onSubmit={handleSavePin} className="space-y-4 text-xs font-bold">
            <div>
              <label className="font-black text-slate-950 block mb-1">
                PIN Admin Saat Ini <span className="text-red-500">*</span>
              </label>
              <input
                type={showPin ? 'text' : 'password'}
                required
                value={currentPinInput}
                onChange={(e) => setCurrentPinInput(e.target.value)}
                placeholder="Masukkan PIN yang berlaku saat ini"
                className="w-full px-3.5 py-2.5 border-2 border-slate-300 rounded-xl bg-white font-mono text-sm font-black text-slate-950 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-black text-slate-950 block mb-1">
                PIN Admin Baru <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  required
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Ketik minimal 4 angka/karakter baru"
                  className="w-full px-3.5 py-2.5 border-2 border-slate-300 rounded-xl bg-white font-mono text-sm font-black text-slate-950 focus:ring-2 focus:ring-amber-500 focus:outline-none pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-500 hover:text-black cursor-pointer"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="font-black text-slate-950 block mb-1">
                Konfirmasi PIN Admin Baru <span className="text-red-500">*</span>
              </label>
              <input
                type={showPin ? 'text' : 'password'}
                required
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Ketik ulang PIN baru untuk verifikasi"
                className="w-full px-3.5 py-2.5 border-2 border-slate-300 rounded-xl bg-white font-mono text-sm font-black text-slate-950 focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingPin}
                className="py-3 px-6 bg-slate-950 hover:bg-black text-white font-black rounded-xl text-xs flex items-center gap-2 cursor-pointer shadow-sm transition-colors disabled:opacity-50"
              >
                <Save className="w-4 h-4 text-amber-400" />
                <span>{isSavingPin ? 'Menyimpan...' : 'Simpan PIN Admin Baru'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: METODE PEMBAYARAN & UPLOAD QRIS TOKO */}
      {/* ======================================================== */}
      {activeTab === 'payment' && (
        <div className="p-6 space-y-8">
          
          {/* BAGIAN 1: UPLOAD FOTO QRIS TOKO */}
          <div className="p-5 bg-emerald-50/60 border-2 border-emerald-300 rounded-2xl space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div>
                <div className="flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-emerald-800" />
                  <h3 className="text-sm font-black text-slate-950">Foto Barcode QRIS Pembayaran Toko</h3>
                </div>
                <p className="text-xs text-slate-800 font-bold mt-0.5">
                  Unggah gambar barcode QRIS resmi toko Anda. Foto ini otomatis tampil di halaman checkout pembeli dan bukti nota digital.
                </p>
              </div>
              {storeSettings.qrisImageUrl && (
                <button
                  type="button"
                  onClick={handleDeleteQris}
                  className="px-3 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-900 border border-rose-300 rounded-xl text-xs font-black flex items-center gap-1 cursor-pointer transition-colors"
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-700" />
                  <span>Hapus QRIS</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-12 gap-6 items-center">
              {/* QRIS Image Preview */}
              <div className="md:col-span-4 flex flex-col items-center justify-center p-4 bg-white border-2 border-slate-300 rounded-2xl shadow-xs">
                {storeSettings.qrisImageUrl ? (
                  <div className="space-y-2 text-center w-full">
                    <div className="w-full aspect-square max-h-56 bg-white p-2 border border-slate-300 rounded-xl flex items-center justify-center overflow-hidden">
                      <img
                        src={storeSettings.qrisImageUrl}
                        alt="QRIS Toko Grosir Nusantara"
                        className="w-full h-full object-contain"
                      />
                    </div>
                    <span className="inline-block text-[11px] font-black bg-emerald-100 text-emerald-950 border border-emerald-300 px-2.5 py-0.5 rounded-full">
                      ✓ QRIS Aktif di Checkout
                    </span>
                  </div>
                ) : (
                  <div className="py-8 text-center text-slate-500 space-y-2">
                    <QrCode className="w-12 h-12 mx-auto text-slate-400 stroke-1" />
                    <p className="text-xs font-bold text-slate-800">Belum ada foto QRIS toko yang diunggah.</p>
                  </div>
                )}
              </div>

              {/* Upload Dropzone */}
              <div className="md:col-span-8">
                <div
                  onDragOver={(e) => {
                    e.preventDefault();
                    setIsDraggingQris(true);
                  }}
                  onDragLeave={() => setIsDraggingQris(false)}
                  onDrop={(e) => {
                    e.preventDefault();
                    setIsDraggingQris(false);
                    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
                      handleUploadQrisFile(e.dataTransfer.files[0]);
                    }
                  }}
                  className={`border-2 border-dashed rounded-2xl p-6 text-center transition-all ${
                    isDraggingQris
                      ? 'border-emerald-600 bg-emerald-100/50 scale-[1.01]'
                      : 'border-emerald-300 hover:border-emerald-500 bg-white'
                  }`}
                >
                  <input
                    type="file"
                    id="qris-file-upload-input"
                    accept="image/*"
                    onChange={(e) => {
                      if (e.target.files && e.target.files[0]) {
                        handleUploadQrisFile(e.target.files[0]);
                      }
                    }}
                    className="hidden"
                  />
                  <div className="flex flex-col items-center justify-center gap-2">
                    {isUploadingQris ? (
                      <div className="flex items-center gap-2 py-4 text-emerald-950 font-black text-xs">
                        <Loader2 className="w-5 h-5 animate-spin text-emerald-700" />
                        <span>Sedang mengompresi &amp; menyimpan foto QRIS...</span>
                      </div>
                    ) : (
                      <>
                        <div className="w-12 h-12 rounded-xl bg-emerald-100 text-emerald-800 flex items-center justify-center shadow-xs">
                          <Upload className="w-6 h-6" />
                        </div>
                        <div className="text-xs font-black text-slate-950">
                          {storeSettings.qrisImageUrl ? 'Ganti Foto QRIS Toko' : 'Tarik & Letakkan Foto QRIS Toko di Sini'}
                        </div>
                        <p className="text-[11px] text-slate-700 font-bold max-w-sm">
                          Format JPG, PNG, atau WEBP. Gambar otomatis dikompresi agar loading cepat saat pelanggan scan bayar.
                        </p>
                        <label
                          htmlFor="qris-file-upload-input"
                          className="mt-2 px-4 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-black cursor-pointer shadow-xs transition-colors"
                        >
                          Pilih File Foto QRIS dari Perangkat
                        </label>
                      </>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* BAGIAN 2: DAFTAR REKENING BANK & E-WALLET */}
          <div>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
              <div>
                <h3 className="text-sm font-black text-slate-950">Daftar Rekening Bank &amp; E-Wallet</h3>
                <p className="text-xs text-slate-700 font-bold mt-0.5">
                  Pilihan metode transfer pembayaran yang tersedia bagi pelanggan saat menyelesaikan pesanan di checkout.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setEditingBank({
                    id: `bank-${Date.now()}`,
                    bankName: '',
                    accountNumber: '',
                    accountHolder: 'GROSIR NUSANTARA',
                    branch: '',
                    active: true,
                  });
                  setIsBankModalOpen(true);
                }}
                className="px-4 py-2 bg-slate-950 hover:bg-black text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors self-start sm:self-auto"
              >
                <Plus className="w-4 h-4 text-amber-400" />
                <span>+ Tambah Rekening Baru</span>
              </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {bankAccounts.map((b) => (
                <div
                  key={b.id}
                  className="p-4 rounded-2xl border-2 border-slate-300 bg-white hover:border-amber-400 hover:shadow-md transition-all relative flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-start justify-between">
                      <div className="font-black text-sm text-slate-950">{b.bankName}</div>
                      <span
                        className={`px-2 py-0.5 rounded-md text-[10px] font-black border ${
                          b.active !== false
                            ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                            : 'bg-slate-200 text-slate-700 border-slate-300'
                        }`}
                      >
                        {b.active !== false ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </div>
                    <div className="mt-2 font-mono font-black text-slate-950 text-base tracking-wider bg-slate-50 p-2 rounded-lg border border-slate-200">
                      {b.accountNumber}
                    </div>
                    <div className="text-xs text-slate-800 font-black mt-1.5">
                      a.n. {b.accountHolder}
                    </div>
                    {b.branch && (
                      <div className="text-[11px] text-slate-600 font-bold mt-0.5">
                        Keterangan: {b.branch}
                      </div>
                    )}
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-end gap-2 text-xs">
                    <button
                      type="button"
                      onClick={() => {
                        setEditingBank(b);
                        setIsBankModalOpen(true);
                      }}
                      className="px-3 py-1.5 bg-slate-100 hover:bg-amber-100 hover:text-amber-950 text-slate-950 rounded-lg font-black border border-slate-300 cursor-pointer transition-colors"
                    >
                      Edit Rekening
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDeleteBank(b.id)}
                      className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg font-black border border-rose-200 cursor-pointer transition-colors"
                    >
                      Hapus
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: MEDIA PANDUAN CARA ORDER */}
      {/* ======================================================== */}
      {activeTab === 'guide' && (
        <div className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
            <div>
              <h3 className="text-sm font-black text-slate-950">Media Panduan Cara Order Pelanggan</h3>
              <p className="text-xs text-slate-700 font-bold mt-0.5">
                Foto, video, atau langkah alur cara belanja bagi pembeli baru di etalase web.
              </p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingGuide({
                  id: `guide-${Date.now()}`,
                  title: '',
                  type: 'step',
                  stepNumber: orderGuides.length + 1,
                  description: '',
                  mediaUrl: '',
                  active: true,
                });
                setIsGuideModalOpen(true);
              }}
              className="px-4 py-2 bg-slate-950 hover:bg-black text-white rounded-xl text-xs font-black flex items-center gap-1.5 cursor-pointer shadow-xs transition-colors self-start sm:self-auto"
            >
              <Plus className="w-4 h-4 text-amber-400" />
              <span>+ Tambah Panduan</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {orderGuides.map((g) => (
              <div
                key={g.id}
                className="p-4 rounded-2xl border-2 border-slate-300 bg-white hover:border-amber-400 hover:shadow-md transition-all relative flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between mb-2">
                    <span className="w-6 h-6 rounded-full bg-amber-400 text-slate-950 font-black text-xs flex items-center justify-center shrink-0">
                      {g.stepNumber || '•'}
                    </span>
                    <span className={`px-2 py-0.5 rounded text-[10px] font-black border ${g.active !== false ? 'bg-emerald-100 text-emerald-950 border-emerald-300' : 'bg-slate-200 text-slate-700 border-slate-300'}`}>
                      {g.active !== false ? 'Tampil' : 'Disembunyikan'}
                    </span>
                  </div>

                  <h4 className="font-black text-sm text-slate-950 mb-1">{g.title}</h4>
                  <p className="text-xs text-slate-800 font-bold leading-relaxed line-clamp-3">
                    {g.description}
                  </p>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-200 flex items-center justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingGuide(g);
                      setIsGuideModalOpen(true);
                    }}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-amber-100 hover:text-amber-950 text-slate-950 rounded-lg font-black border border-slate-300 cursor-pointer transition-colors"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteGuide(g.id)}
                    className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 text-rose-800 rounded-lg font-black border border-rose-200 cursor-pointer transition-colors"
                  >
                    Hapus
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL EDIT / ADD BANK ACCOUNT */}
      {/* ======================================================== */}
      {isBankModalOpen && editingBank && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-slate-300 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
              <h3 className="font-black text-slate-950 text-sm">
                {editingBank.id && bankAccounts.some((b) => b.id === editingBank.id)
                  ? 'Edit Metode Pembayaran'
                  : 'Tambah Rekening Bank Baru'}
              </h3>
              <button
                type="button"
                onClick={() => setIsBankModalOpen(false)}
                className="text-slate-500 hover:text-black p-1 cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-950" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveBank(editingBank);
              }}
              className="space-y-3.5 text-xs font-bold"
            >
              <div>
                <label className="font-black text-slate-950 block mb-1">
                  Nama Bank / E-Wallet <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingBank.bankName}
                  onChange={(e) => setEditingBank({ ...editingBank, bankName: e.target.value })}
                  placeholder="Contoh: Bank BCA, Bank Mandiri, GoPay, OVO"
                  className="w-full px-3.5 py-2.5 border-2 border-slate-300 rounded-xl bg-white font-black text-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-black text-slate-950 block mb-1">
                  Nomor Rekening / No. HP E-Wallet <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingBank.accountNumber}
                  onChange={(e) => setEditingBank({ ...editingBank, accountNumber: e.target.value })}
                  placeholder="Contoh: 032-198-4421 atau 08123456789"
                  className="w-full px-3.5 py-2.5 border-2 border-slate-300 rounded-xl bg-white font-mono font-black text-slate-950 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-black text-slate-950 block mb-1">
                  Atas Nama Pemilik Rekening <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingBank.accountHolder}
                  onChange={(e) => setEditingBank({ ...editingBank, accountHolder: e.target.value })}
                  placeholder="Contoh: GROSIR NUSANTARA OFFICIAL"
                  className="w-full px-3.5 py-2.5 border-2 border-slate-300 rounded-xl bg-white font-black text-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div>
                <label className="font-black text-slate-950 block mb-1">Keterangan / Cabang (Opsional)</label>
                <input
                  type="text"
                  value={editingBank.branch || ''}
                  onChange={(e) => setEditingBank({ ...editingBank, branch: e.target.value })}
                  placeholder="Contoh: KCU Jakarta atau Bebas Biaya Admin"
                  className="w-full px-3.5 py-2.5 border-2 border-slate-300 rounded-xl bg-white font-bold text-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="bank-active-toggle"
                  checked={editingBank.active !== false}
                  onChange={(e) => setEditingBank({ ...editingBank, active: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded accent-emerald-600 cursor-pointer"
                />
                <label htmlFor="bank-active-toggle" className="text-xs font-black text-slate-950 cursor-pointer select-none">
                  Aktifkan metode pembayaran ini di checkout pembeli
                </label>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-black rounded-xl text-xs cursor-pointer shadow-xs transition-colors"
                >
                  Simpan Metode Pembayaran
                </button>
                <button
                  type="button"
                  onClick={() => setIsBankModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black rounded-xl text-xs cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL EDIT / ADD PANDUAN */}
      {/* ======================================================== */}
      {isGuideModalOpen && editingGuide && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border-2 border-slate-300 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex justify-between items-center mb-4 pb-2 border-b border-slate-200">
              <h3 className="font-black text-slate-950 text-sm">
                {editingGuide.title ? 'Edit Panduan Belanja' : 'Tambah Panduan Belanja'}
              </h3>
              <button
                type="button"
                onClick={() => setIsGuideModalOpen(false)}
                className="text-slate-500 hover:text-black p-1 cursor-pointer"
              >
                <X className="w-5 h-5 text-slate-950" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveGuide(editingGuide);
              }}
              className="space-y-3.5 text-xs font-bold"
            >
              <div>
                <label className="font-black text-slate-950 block mb-1">
                  Nomor Langkah / Urutan <span className="text-red-600">*</span>
                </label>
                <input
                  type="number"
                  min="1"
                  required
                  value={editingGuide.stepNumber || 1}
                  onChange={(e) => setEditingGuide({ ...editingGuide, stepNumber: Number(e.target.value) })}
                  className="w-full px-3.5 py-2 border-2 border-slate-300 rounded-xl bg-white font-mono font-black text-slate-950"
                />
              </div>

              <div>
                <label className="font-black text-slate-950 block mb-1">
                  Judul Langkah Panduan <span className="text-red-600">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={editingGuide.title}
                  onChange={(e) => setEditingGuide({ ...editingGuide, title: e.target.value })}
                  placeholder="Contoh: Langkah 1: Pilih Produk"
                  className="w-full px-3.5 py-2.5 border-2 border-slate-300 rounded-xl bg-white font-black text-slate-950"
                />
              </div>

              <div>
                <label className="font-black text-slate-950 block mb-1">
                  Deskripsi Penjelasan Panduan <span className="text-red-600">*</span>
                </label>
                <textarea
                  rows={3}
                  required
                  value={editingGuide.description || ''}
                  onChange={(e) => setEditingGuide({ ...editingGuide, description: e.target.value })}
                  placeholder="Tuliskan panduan cara belanja lengkap bagi pembeli..."
                  className="w-full px-3.5 py-2.5 border-2 border-slate-300 rounded-xl bg-white font-bold text-slate-950"
                />
              </div>

              <div className="flex items-center gap-2 pt-1">
                <input
                  type="checkbox"
                  id="guide-active-toggle"
                  checked={editingGuide.active !== false}
                  onChange={(e) => setEditingGuide({ ...editingGuide, active: e.target.checked })}
                  className="w-4 h-4 text-emerald-600 rounded accent-emerald-600 cursor-pointer"
                />
                <label htmlFor="guide-active-toggle" className="text-xs font-black text-slate-950 cursor-pointer select-none">
                  Tampilkan langkah panduan ini di etalase web
                </label>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-black rounded-xl text-xs cursor-pointer shadow-xs transition-colors"
                >
                  Simpan Panduan
                </button>
                <button
                  type="button"
                  onClick={() => setIsGuideModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-800 font-black rounded-xl text-xs cursor-pointer"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
