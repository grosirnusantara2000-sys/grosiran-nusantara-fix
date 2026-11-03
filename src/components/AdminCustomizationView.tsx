import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StoreSettings, CourierOption, BankAccount, OrderGuideItem } from '../types';
import {
  KeyRound,
  Truck,
  CreditCard,
  Video,
  Plus,
  Edit2,
  Trash2,
  Check,
  X,
  Save,
  AlertCircle,
  HelpCircle,
  ShieldCheck,
  Eye,
  EyeOff,
  Image as ImageIcon,
  ExternalLink,
  Upload,
  Lock,
} from 'lucide-react';
import { recordActivityLog, syncToGoogleSheets } from '../services/dataService';
import { compressImageFile } from '../utils/imageUtils';

export const AdminCustomizationView: React.FC = () => {
  const { storeSettings, updateStoreSettings, showToast } = useApp();

  const [activeTab, setActiveTab] = useState<'pin' | 'courier' | 'payment' | 'guide'>('pin');

  // PIN state
  const [currentPinInput, setCurrentPinInput] = useState('');
  const [newPin, setNewPin] = useState('');
  const [confirmPin, setConfirmPin] = useState('');
  const [showPin, setShowPin] = useState(false);
  const [isSavingPin, setIsSavingPin] = useState(false);

  // Couriers state
  const [couriers, setCouriers] = useState<CourierOption[]>(
    storeSettings.courierOptions && storeSettings.courierOptions.length > 0
      ? storeSettings.courierOptions
      : [
          { id: 'indah-cargo', name: 'Indah Cargo Logistik (Pilihan Utama Grosir)', type: 'Kargo Darat/Laut', estimatedDays: '2-4 Hari', minWeight: 5, ratePerKg: 6500, active: true },
          { id: 'baraka-cargo', name: 'Baraka Sarana Tama Cargo', type: 'Kargo Darat/Laut', estimatedDays: '2-5 Hari', minWeight: 5, ratePerKg: 7000, active: true },
          { id: 'dakota-cargo', name: 'Dakota Cargo', type: 'Kargo Darat', estimatedDays: '3-6 Hari', minWeight: 10, ratePerKg: 6000, active: true },
          { id: 'jne-trucking', name: 'JNE Trucking (JTR)', type: 'Kargo Darat', estimatedDays: '3-5 Hari', minWeight: 10, ratePerKg: 8500, active: true },
          { id: 'jnt-cargo', name: 'J&T Cargo', type: 'Kargo Kilat', estimatedDays: '2-4 Hari', minWeight: 5, ratePerKg: 8000, active: true },
          { id: 'pos-kargo', name: 'Pos Indonesia Kargo', type: 'Kargo Pos', estimatedDays: '3-6 Hari', minWeight: 3, ratePerKg: 9000, active: true },
        ]
  );
  const [editingCourier, setEditingCourier] = useState<CourierOption | null>(null);
  const [isCourierModalOpen, setIsCourierModalOpen] = useState(false);

  // Bank accounts state
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>(
    storeSettings.bankAccounts && storeSettings.bankAccounts.length > 0
      ? storeSettings.bankAccounts
      : [
          { id: 'bank-bca', bankName: 'Bank BCA', accountNumber: '032-198-4421', accountHolder: 'GROSIR NUSANTARA OFFICIAL', branch: 'KCU Jakarta', active: true },
          { id: 'bank-mandiri', bankName: 'Bank Mandiri', accountNumber: '111-00-2983741-2', accountHolder: 'GROSIR NUSANTARA OFFICIAL', branch: 'KCP Tanah Abang', active: true },
          { id: 'bank-bri', bankName: 'Bank BRI', accountNumber: '0058-01-089723-50-1', accountHolder: 'GROSIR NUSANTARA OFFICIAL', branch: 'KCP Aur Kuning', active: true },
          { id: 'bank-nagari', bankName: 'Bank Nagari (Sumbar)', accountNumber: '1001-0210-98234-1', accountHolder: 'GROSIR NUSANTARA OFFICIAL', branch: 'Cabang Bukittinggi', active: true },
          { id: 'qris-grosir', bankName: 'QRIS Nasional (Semua Bank / E-Wallet)', accountNumber: 'NMID: ID102003891823', accountHolder: 'GROSIR NUSANTARA', branch: 'Instant Scan', active: true },
        ]
  );
  const [editingBank, setEditingBank] = useState<BankAccount | null>(null);
  const [isBankModalOpen, setIsBankModalOpen] = useState(false);

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
            title: 'Langkah 2: Checkout & Pilih Ekspedisi Kargo Hemat',
            type: 'step',
            stepNumber: 2,
            description: 'Tentukan alamat pengiriman Anda ke seluruh Indonesia. Pilih ekspedisi kargo rekanan grosir (Indah Cargo, Baraka, Dakota, JTR, dsb) untuk tarif partai besar termurah.',
            mediaUrl: '/assets/images/about_aur_kuning_packing_1793527996506.jpg',
            active: true,
          },
          {
            id: 'guide-3',
            title: 'Langkah 3: Pembayaran & Konfirmasi WhatsApp Otomatis',
            type: 'step',
            stepNumber: 3,
            description: 'Lakukan pembayaran via Transfer Bank (BCA, Mandiri, BRI, Bank Nagari) atau QRIS. Tombol WhatsApp kami akan otomatis terhubung ke admin resmi untuk verifikasi nota.',
            active: true,
          },
          {
            id: 'guide-4',
            title: 'Langkah 4: Foto Fisik Lapak, Packing Karung & Resi',
            type: 'step',
            stepNumber: 4,
            description: 'Tim kami mendatangi lapak toko fisik, memotret nota asli, melakukan packing karung berisolasi anti air, dan mengirimkan nomor resi ekspedisi kargo.',
            active: true,
          },
        ]
  );
  const [editingGuide, setEditingGuide] = useState<OrderGuideItem | null>(null);
  const [isGuideModalOpen, setIsGuideModalOpen] = useState(false);
  const [isUploadingGuideMedia, setIsUploadingGuideMedia] = useState(false);

  // Keep synced with storeSettings
  React.useEffect(() => {
    if (storeSettings.courierOptions) setCouriers(storeSettings.courierOptions);
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
      const updated: StoreSettings = {
        ...storeSettings,
        adminPin: newPin.trim(),
        updatedAt: new Date().toISOString(),
      };
      await updateStoreSettings(updated);
      await recordActivityLog(
        'Ubah PIN Keamanan Admin',
        'auth',
        'Owner memperbarui PIN akses masuk admin.',
        'success'
      );
      showToast('PIN Admin berhasil diperbarui!', 'success');
      setCurrentPinInput('');
      setNewPin('');
      setConfirmPin('');
    } catch (err: any) {
      showToast('Gagal memperbarui PIN: ' + err.message, 'error');
    } finally {
      setIsSavingPin(false);
    }
  };

  // Courier Actions
  const handleSaveCourier = async (courier: CourierOption) => {
    const updated = couriers.some((c) => c.id === courier.id)
      ? couriers.map((c) => (c.id === courier.id ? courier : c))
      : [...couriers, courier];

    setCouriers(updated);
    setIsCourierModalOpen(false);
    setEditingCourier(null);

    try {
      await updateStoreSettings({
        ...storeSettings,
        courierOptions: updated,
        updatedAt: new Date().toISOString(),
      });
      await recordActivityLog('Kelola Ekspedisi', 'system', `Menyimpan ekspedisi: ${courier.name}`, 'success');
      showToast(`Ekspedisi "${courier.name}" berhasil disimpan!`, 'success');
    } catch (err: any) {
      showToast('Gagal menyimpan ekspedisi: ' + err.message, 'error');
    }
  };

  const handleDeleteCourier = async (id: string) => {
    const target = couriers.find((c) => c.id === id);
    if (!target) return;
    if (!confirm(`Hapus ekspedisi "${target.name}"?`)) return;

    const updated = couriers.filter((c) => c.id !== id);
    setCouriers(updated);
    try {
      await updateStoreSettings({
        ...storeSettings,
        courierOptions: updated,
        updatedAt: new Date().toISOString(),
      });
      showToast(`Ekspedisi "${target.name}" telah dihapus!`, 'info');
    } catch (err: any) {
      showToast('Gagal menghapus ekspedisi', 'error');
    }
  };

  // Bank Accounts Actions
  const handleSaveBank = async (bank: BankAccount) => {
    const updated = bankAccounts.some((b) => b.id === bank.id)
      ? bankAccounts.map((b) => (b.id === bank.id ? bank : b))
      : [...bankAccounts, bank];

    setBankAccounts(updated);
    setIsBankModalOpen(false);
    setEditingBank(null);

    try {
      await updateStoreSettings({
        ...storeSettings,
        bankAccounts: updated,
        updatedAt: new Date().toISOString(),
      });
      await recordActivityLog('Kelola Rekening', 'system', `Menyimpan rekening: ${bank.bankName}`, 'success');
      showToast(`Metode pembayaran "${bank.bankName}" berhasil disimpan!`, 'success');
    } catch (err: any) {
      showToast('Gagal menyimpan metode pembayaran: ' + err.message, 'error');
    }
  };

  const handleDeleteBank = async (id: string) => {
    const target = bankAccounts.find((b) => b.id === id);
    if (!target) return;
    if (!confirm(`Hapus rekening "${target.bankName}"?`)) return;

    const updated = bankAccounts.filter((b) => b.id !== id);
    setBankAccounts(updated);
    try {
      await updateStoreSettings({
        ...storeSettings,
        bankAccounts: updated,
        updatedAt: new Date().toISOString(),
      });
      showToast(`Rekening "${target.bankName}" telah dihapus!`, 'info');
    } catch (err: any) {
      showToast('Gagal menghapus rekening', 'error');
    }
  };

  // Order Guides Actions
  const handleSaveGuide = async (guide: OrderGuideItem) => {
    const updated = orderGuides.some((g) => g.id === guide.id)
      ? orderGuides.map((g) => (g.id === guide.id ? guide : g))
      : [...orderGuides, guide];

    setOrderGuides(updated);
    setIsGuideModalOpen(false);
    setEditingGuide(null);

    try {
      await updateStoreSettings({
        ...storeSettings,
        orderGuides: updated,
        updatedAt: new Date().toISOString(),
      });
      await recordActivityLog('Kelola Media Panduan', 'system', `Menyimpan panduan: ${guide.title}`, 'success');
      showToast(`Panduan "${guide.title}" berhasil disimpan!`, 'success');
    } catch (err: any) {
      showToast('Gagal menyimpan panduan: ' + err.message, 'error');
    }
  };

  const handleDeleteGuide = async (id: string) => {
    const target = orderGuides.find((g) => g.id === id);
    if (!target) return;
    if (!confirm(`Hapus panduan "${target.title}"?`)) return;

    const updated = orderGuides.filter((g) => g.id !== id);
    setOrderGuides(updated);
    try {
      await updateStoreSettings({
        ...storeSettings,
        orderGuides: updated,
        updatedAt: new Date().toISOString(),
      });
      showToast(`Panduan "${target.title}" telah dihapus!`, 'info');
    } catch (err: any) {
      showToast('Gagal menghapus panduan', 'error');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      {/* Header */}
      <div className="p-5 border-b border-slate-200 bg-slate-50 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-500" />
            <span>Pengaturan Kustomisasi Toko</span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ubah PIN keamanan, daftar ekspedisi kargo, rekening bank, dan media panduan cara belanja secara dinamis.
          </p>
        </div>

        {/* Tab Switcher */}
        <div className="flex items-center gap-1 bg-slate-200/80 p-1 rounded-xl self-start sm:self-auto text-xs font-semibold">
          <button
            type="button"
            onClick={() => setActiveTab('pin')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'pin' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <KeyRound className="w-3.5 h-3.5 text-amber-500" />
            <span>PIN Admin</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('courier')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'courier' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Truck className="w-3.5 h-3.5 text-blue-600" />
            <span>Ekspedisi Kargo</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('payment')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'payment' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
            <span>Rekening / Bayar</span>
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('guide')}
            className={`px-3 py-1.5 rounded-lg transition-all cursor-pointer flex items-center gap-1.5 ${
              activeTab === 'guide' ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Video className="w-3.5 h-3.5 text-purple-600" />
            <span>Media Panduan</span>
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* TAB 1: PIN KEAMANAN ADMIN */}
      {/* ======================================================== */}
      {activeTab === 'pin' && (
        <div className="p-6 max-w-xl">
          <div className="mb-5 bg-amber-50 border border-amber-200 rounded-xl p-4 flex items-start gap-3">
            <Lock className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="text-xs text-amber-900 leading-relaxed">
              <strong className="block mb-1">Pengaturan Keamanan Akses Owner / Admin:</strong>
              PIN ini digunakan setiap kali masuk ke menu Dashboard Admin, Profil Toko, POS Cetak Thermal, dan Sinkronisasi Sheets.
              PIN aktif saat ini: <code className="bg-white px-2 py-0.5 rounded font-mono font-bold text-slate-900 border border-amber-200">{storeSettings.adminPin || '1234'}</code>
            </div>
          </div>

          <form onSubmit={handleSavePin} className="space-y-4 text-xs">
            <div>
              <label className="font-bold text-slate-700 block mb-1">
                PIN Admin Saat Ini <span className="text-red-500">*</span>
              </label>
              <input
                type={showPin ? 'text' : 'password'}
                required
                value={currentPinInput}
                onChange={(e) => setCurrentPinInput(e.target.value)}
                placeholder="Masukkan PIN yang berlaku saat ini"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white font-mono text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                PIN Admin Baru <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <input
                  type={showPin ? 'text' : 'password'}
                  required
                  value={newPin}
                  onChange={(e) => setNewPin(e.target.value)}
                  placeholder="Minimal 4 angka (contoh: 8899)"
                  className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white font-mono text-sm pr-10 focus:ring-2 focus:ring-amber-500 focus:outline-none"
                />
                <button
                  type="button"
                  onClick={() => setShowPin(!showPin)}
                  className="absolute right-3 top-3 text-slate-400 hover:text-slate-600"
                >
                  {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label className="font-bold text-slate-700 block mb-1">
                Ulangi PIN Admin Baru <span className="text-red-500">*</span>
              </label>
              <input
                type={showPin ? 'text' : 'password'}
                required
                value={confirmPin}
                onChange={(e) => setConfirmPin(e.target.value)}
                placeholder="Ketik ulang PIN baru untuk verifikasi"
                className="w-full px-3.5 py-2.5 border border-slate-300 rounded-xl bg-white font-mono text-sm focus:ring-2 focus:ring-amber-500 focus:outline-none"
              />
            </div>

            <div className="pt-2">
              <button
                type="submit"
                disabled={isSavingPin}
                className="px-5 py-2.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl text-xs transition-colors shadow-sm flex items-center gap-2 cursor-pointer disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSavingPin ? 'Menyimpan PIN...' : 'Simpan PIN Admin Baru'}</span>
              </button>
            </div>
          </form>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 2: MITRA EKSPEDISI KARGO */}
      {/* ======================================================== */}
      {activeTab === 'courier' && (
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daftar Mitra Ekspedisi Kargo</h3>
              <p className="text-xs text-slate-500">Tarif dan ekspedisi ini otomatis tampil saat pelanggan checkout belanja.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingCourier({
                  id: `courier-${Date.now()}`,
                  name: '',
                  type: 'Kargo Darat/Laut',
                  ratePerKg: 6500,
                  minWeight: 5,
                  estimatedDays: '2-4 Hari',
                  notes: '',
                  active: true,
                });
                setIsCourierModalOpen(true);
              }}
              className="px-3.5 py-2 bg-blue-900 hover:bg-blue-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Ekspedisi</span>
            </button>
          </div>

          <div className="overflow-x-auto border border-slate-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-600 font-bold border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Nama Ekspedisi</th>
                  <th className="py-3 px-4">Jenis</th>
                  <th className="py-3 px-4">Tarif / Kg</th>
                  <th className="py-3 px-4">Min. Berat</th>
                  <th className="py-3 px-4">Estimasi</th>
                  <th className="py-3 px-4 text-center">Status</th>
                  <th className="py-3 px-4 text-right">Aksi</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {couriers.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-900">{c.name}</td>
                    <td className="py-3 px-4 text-slate-600">{c.type}</td>
                    <td className="py-3 px-4 font-mono font-bold text-blue-900">Rp {c.ratePerKg.toLocaleString('id-ID')}</td>
                    <td className="py-3 px-4 font-mono">{c.minWeight} kg</td>
                    <td className="py-3 px-4 text-slate-600">{c.estimatedDays}</td>
                    <td className="py-3 px-4 text-center">
                      <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${c.active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-150 text-slate-600'}`}>
                        {c.active !== false ? 'Aktif' : 'Non-aktif'}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          type="button"
                          onClick={() => {
                            setEditingCourier(c);
                            setIsCourierModalOpen(true);
                          }}
                          className="p-1.5 hover:bg-slate-100 text-slate-600 hover:text-blue-900 rounded-lg cursor-pointer"
                          title="Edit Ekspedisi"
                        >
                          <Edit2 className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteCourier(c.id)}
                          className="p-1.5 hover:bg-red-50 text-slate-400 hover:text-red-600 rounded-lg cursor-pointer"
                          title="Hapus Ekspedisi"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* TAB 3: REKENING & METODE PEMBAYARAN */}
      {/* ======================================================== */}
      {activeTab === 'payment' && (
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Daftar Rekening Bank &amp; E-Wallet</h3>
              <p className="text-xs text-slate-500">Pilihan pembayaran yang tersedia bagi pelanggan saat menyelesaikan pesanan.</p>
            </div>
            <button
              type="button"
              onClick={() => {
                setEditingBank({
                  id: `bank-${Date.now()}`,
                  bankName: '',
                  accountNumber: '',
                  accountHolder: 'GROSIR NUSANTARA',
                  branch: 'Kantor Cabang',
                  active: true,
                });
                setIsBankModalOpen(true);
              }}
              className="px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Rekening</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {bankAccounts.map((b) => (
              <div key={b.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/50 hover:bg-white hover:shadow-xs transition-all relative">
                <div className="flex items-start justify-between">
                  <div className="font-bold text-sm text-slate-900">{b.bankName}</div>
                  <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${b.active !== false ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-600'}`}>
                    {b.active !== false ? 'Aktif' : 'Non-aktif'}
                  </span>
                </div>
                <div className="mt-2 font-mono font-bold text-blue-900 text-base tracking-wider">
                  {b.accountNumber}
                </div>
                <div className="text-xs text-slate-600 font-semibold mt-0.5">
                  a.n. {b.accountHolder}
                </div>
                {b.branch && <div className="text-[11px] text-slate-400 mt-1">{b.branch}</div>}

                <div className="mt-4 pt-3 border-t border-slate-200/80 flex items-center justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingBank(b);
                      setIsBankModalOpen(true);
                    }}
                    className="px-2.5 py-1 text-slate-700 hover:text-blue-900 hover:bg-slate-100 rounded-md font-semibold cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteBank(b.id)}
                    className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-md font-semibold cursor-pointer"
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
      {/* TAB 4: MEDIA PANDUAN CARA ORDER */}
      {/* ======================================================== */}
      {activeTab === 'guide' && (
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="text-sm font-bold text-slate-900">Media Panduan Cara Order Pelanggan</h3>
              <p className="text-xs text-slate-500">Foto, video, atau langkah alur cara kulakan bagi pembeli baru.</p>
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
              className="px-3.5 py-2 bg-purple-700 hover:bg-purple-800 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 cursor-pointer shadow-2xs"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Tambah Panduan</span>
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {orderGuides.map((g) => (
              <div key={g.id} className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs flex flex-col justify-between">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="px-2 py-0.5 rounded bg-purple-100 text-purple-800 text-[10px] font-extrabold uppercase">
                      Langkah {g.stepNumber || 1}
                    </span>
                    <span className="text-[10px] text-slate-400 capitalize">{g.type}</span>
                  </div>
                  <h4 className="font-bold text-slate-900 text-sm">{g.title}</h4>
                  <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">{g.description}</p>

                  {g.mediaUrl && (
                    <div className="mt-3 rounded-lg overflow-hidden border border-slate-200 aspect-16/9 bg-slate-100">
                      <img src={g.mediaUrl} alt={g.title} className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-end gap-2 text-xs">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingGuide(g);
                      setIsGuideModalOpen(true);
                    }}
                    className="px-2.5 py-1 text-slate-700 hover:text-purple-800 hover:bg-slate-50 rounded-md font-semibold cursor-pointer"
                  >
                    Edit
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteGuide(g.id)}
                    className="px-2.5 py-1 text-red-600 hover:bg-red-50 rounded-md font-semibold cursor-pointer"
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
      {/* MODAL EDIT / ADD COURIER */}
      {/* ======================================================== */}
      {isCourierModalOpen && editingCourier && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingCourier.name ? 'Edit Ekspedisi' : 'Tambah Ekspedisi Kargo'}
              </h3>
              <button type="button" onClick={() => setIsCourierModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveCourier(editingCourier);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Ekspedisi</label>
                <input
                  type="text"
                  required
                  value={editingCourier.name}
                  onChange={(e) => setEditingCourier({ ...editingCourier, name: e.target.value })}
                  placeholder="Contoh: Indah Cargo Logistik"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Jenis Layanan</label>
                  <input
                    type="text"
                    value={editingCourier.type}
                    onChange={(e) => setEditingCourier({ ...editingCourier, type: e.target.value })}
                    placeholder="Kargo Darat/Laut"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tarif per Kg (Rp)</label>
                  <input
                    type="number"
                    required
                    value={editingCourier.ratePerKg}
                    onChange={(e) => setEditingCourier({ ...editingCourier, ratePerKg: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Min. Berat (kg)</label>
                  <input
                    type="number"
                    required
                    value={editingCourier.minWeight}
                    onChange={(e) => setEditingCourier({ ...editingCourier, minWeight: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Estimasi Tiba</label>
                  <input
                    type="text"
                    value={editingCourier.estimatedDays}
                    onChange={(e) => setEditingCourier({ ...editingCourier, estimatedDays: e.target.value })}
                    placeholder="2-4 Hari"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button type="submit" className="flex-1 py-2.5 bg-blue-900 hover:bg-blue-800 text-white font-bold rounded-lg text-xs cursor-pointer">
                  Simpan Ekspedisi
                </button>
                <button type="button" onClick={() => setIsCourierModalOpen(false)} className="px-4 py-2.5 bg-slate-150 text-slate-700 font-semibold rounded-lg text-xs">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL EDIT / ADD BANK */}
      {/* ======================================================== */}
      {isBankModalOpen && editingBank && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingBank.bankName ? 'Edit Metode Pembayaran' : 'Tambah Rekening Bank / QRIS'}
              </h3>
              <button type="button" onClick={() => setIsBankModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveBank(editingBank);
              }}
              className="space-y-3 text-xs"
            >
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Bank / Dompet Digital</label>
                <input
                  type="text"
                  required
                  value={editingBank.bankName}
                  onChange={(e) => setEditingBank({ ...editingBank, bankName: e.target.value })}
                  placeholder="Contoh: Bank BCA atau QRIS Grosir"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nomor Rekening / NMID</label>
                <input
                  type="text"
                  required
                  value={editingBank.accountNumber}
                  onChange={(e) => setEditingBank({ ...editingBank, accountNumber: e.target.value })}
                  placeholder="Contoh: 032-198-4421"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Atas Nama (Pemilik Rekening)</label>
                <input
                  type="text"
                  required
                  value={editingBank.accountHolder}
                  onChange={(e) => setEditingBank({ ...editingBank, accountHolder: e.target.value })}
                  placeholder="Contoh: GROSIR NUSANTARA OFFICIAL"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Keterangan / Cabang</label>
                <input
                  type="text"
                  value={editingBank.branch || ''}
                  onChange={(e) => setEditingBank({ ...editingBank, branch: e.target.value })}
                  placeholder="KCU Jakarta atau Bebas Biaya Admin"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button type="submit" className="flex-1 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-lg text-xs cursor-pointer">
                  Simpan Rekening
                </button>
                <button type="button" onClick={() => setIsBankModalOpen(false)} className="px-4 py-2.5 bg-slate-150 text-slate-700 font-semibold rounded-lg text-xs">
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL EDIT / ADD GUIDE */}
      {/* ======================================================== */}
      {isGuideModalOpen && editingGuide && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 text-sm">
                {editingGuide.title ? 'Edit Panduan Order' : 'Tambah Panduan Cara Order'}
              </h3>
              <button type="button" onClick={() => setIsGuideModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-4 h-4" />
              </button>
            </div>

            <form
              onSubmit={(e) => {
                e.preventDefault();
                handleSaveGuide(editingGuide);
              }}
              className="space-y-3 text-xs"
            >
              <div className="grid grid-cols-3 gap-2">
                <div className="col-span-1">
                  <label className="font-bold text-slate-700 block mb-1">Nomor Langkah</label>
                  <input
                    type="number"
                    value={editingGuide.stepNumber || 1}
                    onChange={(e) => setEditingGuide({ ...editingGuide, stepNumber: Number(e.target.value) })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                  />
                </div>
                <div className="col-span-2">
                  <label className="font-bold text-slate-700 block mb-1">Tipe Panduan</label>
                  <select
                    value={editingGuide.type}
                    onChange={(e) => setEditingGuide({ ...editingGuide, type: e.target.value as any })}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="step">Langkah Alur</option>
                    <option value="image">Foto / Infografis</option>
                    <option value="video">Tautan Video Tutorial</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Judul Panduan</label>
                <input
                  type="text"
                  required
                  value={editingGuide.title}
                  onChange={(e) => setEditingGuide({ ...editingGuide, title: e.target.value })}
                  placeholder="Contoh: Cara Memilih Ekspedisi Kargo Hemat"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Deskripsi &amp; Petunjuk</label>
                <textarea
                  rows={3}
                  required
                  value={editingGuide.description || ''}
                  onChange={(e) => setEditingGuide({ ...editingGuide, description: e.target.value })}
                  placeholder="Jelaskan langkah belanja ini agar pelanggan memahami dengan mudah"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Foto / Media Panduan</label>
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      id="guide-media-file"
                      accept="image/*"
                      onChange={async (e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          setIsUploadingGuideMedia(true);
                          try {
                            const compressed = await compressImageFile(file);
                            setEditingGuide({ ...editingGuide, mediaUrl: compressed });
                            showToast('Foto panduan berhasil diunggah!', 'success');
                          } catch (err: any) {
                            showToast('Gagal memproses gambar: ' + err.message, 'error');
                          } finally {
                            setIsUploadingGuideMedia(false);
                          }
                        }
                      }}
                      className="hidden"
                    />
                    <label
                      htmlFor="guide-media-file"
                      className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg text-xs font-semibold cursor-pointer flex items-center gap-1.5"
                    >
                      <Upload className="w-3.5 h-3.5" />
                      <span>{isUploadingGuideMedia ? 'Mengompresi...' : 'Upload Foto dari HP / PC'}</span>
                    </label>
                  </div>
                  <input
                    type="text"
                    value={editingGuide.mediaUrl || ''}
                    onChange={(e) => setEditingGuide({ ...editingGuide, mediaUrl: e.target.value })}
                    placeholder="Atau tautan URL video Youtube / gambar panduan..."
                    className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white font-mono text-[11px]"
                  />
                </div>
              </div>

              <div className="pt-2 flex gap-2">
                <button type="submit" className="flex-1 py-2.5 bg-purple-700 hover:bg-purple-800 text-white font-bold rounded-lg text-xs cursor-pointer">
                  Simpan Panduan
                </button>
                <button type="button" onClick={() => setIsGuideModalOpen(false)} className="px-4 py-2.5 bg-slate-150 text-slate-700 font-semibold rounded-lg text-xs">
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
