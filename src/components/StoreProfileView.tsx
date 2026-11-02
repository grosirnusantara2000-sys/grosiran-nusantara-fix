import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import { StoreSettings } from '../types';
import {
  GripVertical,
  HelpCircle,
  X,
  Check,
  Edit2,
  Sliders,
  Settings,
  Store,
  Upload,
  Image as ImageIcon,
  MessageCircle,
  MapPin,
  FileText,
  Printer,
  Sparkles,
  Save,
} from 'lucide-react';
import { recordActivityLog, syncToGoogleSheets } from '../services/dataService';

export const StoreProfileView: React.FC = () => {
  const { storeSettings, updateStoreSettings, showToast, setCurrentView } = useApp();

  const [form, setForm] = useState<StoreSettings>({ ...storeSettings });
  const [activeEditingField, setActiveEditingField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Toggle helper for On/Off switches matching image_0.png style
  const handleToggle = (key: keyof StoreSettings) => {
    setForm((prev) => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      await updateStoreSettings(form);
      await recordActivityLog(
        'Update Profil Toko & Struk',
        'profile',
        `Memperbarui profil toko "${form.storeName}" dan konfigurasi nota thermal.`,
        'success'
      );

      // Auto-sync to Google Sheets if configured
      if (form.googleSheetsWebhookUrl) {
        syncToGoogleSheets('profile', form).catch(() => {});
      }

      showToast('Profil toko & pengaturan struk berhasil disimpan!', 'success');
      setActiveEditingField(null);
    } catch (err: any) {
      showToast('Gagal menyimpan profil: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const handleCancel = () => {
    setForm({ ...storeSettings });
    setActiveEditingField(null);
    showToast('Perubahan dibatalkan', 'info');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      {/* 1. Header Bar matching image_0.png "Side Widget" style */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            Profil Toko & Pengaturan Struk
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Konfigurasi identitas toko, nomor WhatsApp, alamat lapak Aur Kuning, dan layout struk thermal.
          </p>
        </div>

        {/* Top Right Icons: Help (?) and Close (X) matching image_0.png */}
        <div className="flex items-center gap-2 text-slate-400">
          <button
            type="button"
            onClick={() => setShowHelpModal(true)}
            className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Bantuan Pengaturan"
          >
            <HelpCircle className="w-5 h-5" />
          </button>
          <button
            type="button"
            onClick={() => setCurrentView('catalog')}
            className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Tutup Panel"
          >
            <X className="w-5 h-5 font-bold" />
          </button>
        </div>
      </div>

      {/* 2. List Rows: Exact "Side Widget" layout from image_0.png */}
      <div className="divide-y divide-slate-100 text-sm">
        
        {/* Row 1: Nama Toko & Slogan */}
        <div className="p-4 hover:bg-slate-50/60 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 cursor-grab hover:text-slate-600 font-bold select-none text-base">
                ⋮⋮
              </span>
              <div>
                <span className="font-semibold text-slate-800 block text-[13px]">
                  Nama Toko & Tagline
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {form.storeName} — &quot;{form.tagline}&quot;
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setActiveEditingField(
                    activeEditingField === 'storeName' ? null : 'storeName'
                  )
                }
                className="text-xs font-medium text-slate-600 hover:text-cyan-700 hover:underline cursor-pointer"
              >
                Edit text
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveEditingField(
                    activeEditingField === 'storeName' ? null : 'storeName'
                  )
                }
                className="text-xs font-medium text-slate-600 hover:text-cyan-700 hover:underline cursor-pointer"
              >
                Manage
              </button>

              {/* Toggle Box matching image_0.png */}
              <div
                className="inline-flex items-center justify-center min-w-[52px] h-7 px-2.5 rounded text-xs font-bold border uppercase tracking-wider bg-[#00acc1] text-white border-[#00acc1]"
              >
                On
              </div>
            </div>
          </div>

          {/* Inline Edit Form */}
          {activeEditingField === 'storeName' && (
            <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in duration-150">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nama Toko (Dicetak di atas Struk)
                </label>
                <input
                  type="text"
                  value={form.storeName}
                  onChange={(e) => setForm({ ...form, storeName: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-cyan-500 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Tagline / Slogan Toko
                </label>
                <input
                  type="text"
                  value={form.tagline}
                  onChange={(e) => setForm({ ...form, tagline: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-cyan-500 bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Row 2: Nomor WhatsApp & CS */}
        <div className="p-4 hover:bg-slate-50/60 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 cursor-grab hover:text-slate-600 font-bold select-none text-base">
                ⋮⋮
              </span>
              <div>
                <span className="font-semibold text-slate-800 block text-[13px]">
                  Nomor WhatsApp Toko
                </span>
                <span className="text-xs text-slate-500 font-mono">
                  {form.whatsappNumber} (Digunakan untuk notifikasi & struk WhatsApp)
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setActiveEditingField(
                    activeEditingField === 'whatsapp' ? null : 'whatsapp'
                  )
                }
                className="text-xs font-medium text-slate-600 hover:text-cyan-700 hover:underline cursor-pointer"
              >
                Edit text
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveEditingField(
                    activeEditingField === 'whatsapp' ? null : 'whatsapp'
                  )
                }
                className="text-xs font-medium text-slate-600 hover:text-cyan-700 hover:underline cursor-pointer"
              >
                Style
              </button>

              {/* On / Off switch */}
              <button
                type="button"
                onClick={() => handleToggle('showWhatsappOnReceipt')}
                className={`inline-flex items-center justify-center min-w-[52px] h-7 px-2.5 rounded text-xs font-bold border uppercase tracking-wider cursor-pointer transition-colors ${
                  form.showWhatsappOnReceipt
                    ? 'bg-[#00acc1] text-white border-[#00acc1]'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                {form.showWhatsappOnReceipt ? 'On' : 'Off'}
              </button>
            </div>
          </div>

          {activeEditingField === 'whatsapp' && (
            <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200 grid grid-cols-1 md:grid-cols-2 gap-3 animate-in fade-in duration-150">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Nomor WhatsApp (Contoh: 081267891011)
                </label>
                <input
                  type="text"
                  value={form.whatsappNumber}
                  onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-cyan-500 bg-white"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Email Toko
                </label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm({ ...form, email: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-cyan-500 bg-white"
                />
              </div>
            </div>
          )}
        </div>

        {/* Row 3: Alamat Lapak Pasar Aur Kuning */}
        <div className="p-4 hover:bg-slate-50/60 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 cursor-grab hover:text-slate-600 font-bold select-none text-base">
                ⋮⋮
              </span>
              <div>
                <span className="font-semibold text-slate-800 block text-[13px]">
                  Alamat Lapak Fisik
                </span>
                <span className="text-xs text-slate-500 line-clamp-1 max-w-md">
                  {form.address}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setActiveEditingField(
                    activeEditingField === 'address' ? null : 'address'
                  )
                }
                className="text-xs font-medium text-slate-600 hover:text-cyan-700 hover:underline cursor-pointer"
              >
                Edit text
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveEditingField(
                    activeEditingField === 'address' ? null : 'address'
                  )
                }
                className="text-xs font-medium text-slate-600 hover:text-cyan-700 hover:underline cursor-pointer"
              >
                Manage
              </button>

              <button
                type="button"
                onClick={() => handleToggle('showAddressOnReceipt')}
                className={`inline-flex items-center justify-center min-w-[52px] h-7 px-2.5 rounded text-xs font-bold border uppercase tracking-wider cursor-pointer transition-colors ${
                  form.showAddressOnReceipt
                    ? 'bg-[#00acc1] text-white border-[#00acc1]'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                {form.showAddressOnReceipt ? 'On' : 'Off'}
              </button>
            </div>
          </div>

          {activeEditingField === 'address' && (
            <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3 animate-in fade-in duration-150">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Alamat Lengkap Toko / Lapak Pasar Aur Kuning
                </label>
                <textarea
                  rows={2}
                  value={form.address}
                  onChange={(e) => setForm({ ...form, address: e.target.value })}
                  className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-cyan-500 bg-white"
                />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Hari Pasar Utama
                  </label>
                  <input
                    type="text"
                    value={form.marketDays}
                    onChange={(e) => setForm({ ...form, marketDays: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white"
                  />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    Jam Layanan Operasional
                  </label>
                  <input
                    type="text"
                    value={form.operationalHours}
                    onChange={(e) => setForm({ ...form, operationalHours: e.target.value })}
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded bg-white"
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Row 4: Logo Toko & Struk */}
        <div className="p-4 hover:bg-slate-50/60 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 cursor-grab hover:text-slate-600 font-bold select-none text-base">
                ⋮⋮
              </span>
              <div>
                <span className="font-semibold text-slate-800 block text-[13px]">
                  Logo Toko
                </span>
                <span className="text-xs text-slate-500">
                  Logo untuk tampilan website, struk digital, dan header thermal
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setActiveEditingField(
                    activeEditingField === 'logo' ? null : 'logo'
                  )
                }
                className="text-xs font-medium text-slate-600 hover:text-cyan-700 hover:underline cursor-pointer"
              >
                Style
              </button>
              <button
                type="button"
                onClick={() =>
                  setActiveEditingField(
                    activeEditingField === 'logo' ? null : 'logo'
                  )
                }
                className="text-xs font-medium text-slate-600 hover:text-cyan-700 hover:underline cursor-pointer"
              >
                Manage
              </button>

              <button
                type="button"
                onClick={() => handleToggle('showLogoOnReceipt')}
                className={`inline-flex items-center justify-center min-w-[52px] h-7 px-2.5 rounded text-xs font-bold border uppercase tracking-wider cursor-pointer transition-colors ${
                  form.showLogoOnReceipt
                    ? 'bg-[#00acc1] text-white border-[#00acc1]'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                {form.showLogoOnReceipt ? 'On' : 'Off'}
              </button>
            </div>
          </div>

          {activeEditingField === 'logo' && (
            <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3 animate-in fade-in duration-150">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-lg bg-slate-200 border border-slate-300 flex items-center justify-center overflow-hidden shrink-0">
                  {form.logoUrl ? (
                    <img
                      src={form.logoUrl}
                      alt="Logo Toko"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <Store className="w-6 h-6 text-slate-400" />
                  )}
                </div>
                <div className="flex-1">
                  <label className="text-xs font-bold text-slate-700 block mb-1">
                    URL Gambar Logo Toko
                  </label>
                  <input
                    type="text"
                    value={form.logoUrl || ''}
                    onChange={(e) => setForm({ ...form, logoUrl: e.target.value })}
                    placeholder="https://... atau /assets/..."
                    className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-cyan-500 bg-white"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Gunakan tautan gambar PNG/JPG berlatar transparan untuk hasil cetak struk terbaik.
                  </p>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Row 5: Header Struk Thermal */}
        <div className="p-4 hover:bg-slate-50/60 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 cursor-grab hover:text-slate-600 font-bold select-none text-base">
                ⋮⋮
              </span>
              <div>
                <span className="font-semibold text-slate-800 block text-[13px]">
                  Header Struk Thermal
                </span>
                <span className="text-xs text-slate-500 line-clamp-1 max-w-md font-mono">
                  {form.receiptHeader || 'Teks banner di bawah nama toko'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setActiveEditingField(
                    activeEditingField === 'receiptHeader' ? null : 'receiptHeader'
                  )
                }
                className="text-xs font-medium text-slate-600 hover:text-cyan-700 hover:underline cursor-pointer"
              >
                Edit text
              </button>

              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    receiptHeader: form.receiptHeader ? '' : '*** GROSIR NUSANTARA ***\nBelanja Grosir & Eceran Lebih Mudah',
                  })
                }
                className={`inline-flex items-center justify-center min-w-[52px] h-7 px-2.5 rounded text-xs font-bold border uppercase tracking-wider cursor-pointer transition-colors ${
                  form.receiptHeader
                    ? 'bg-[#00acc1] text-white border-[#00acc1]'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                {form.receiptHeader ? 'On' : 'Off'}
              </button>
            </div>
          </div>

          {activeEditingField === 'receiptHeader' && (
            <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200 animate-in fade-in duration-150">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Teks Header Tambahan Struk Thermal
              </label>
              <textarea
                rows={2}
                value={form.receiptHeader || ''}
                onChange={(e) => setForm({ ...form, receiptHeader: e.target.value })}
                placeholder="Contoh: *** GROSIR NUSANTARA ***"
                className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded focus:ring-1 focus:ring-cyan-500 bg-white"
              />
            </div>
          )}
        </div>

        {/* Row 6: Catatan Footer Struk & Terima Kasih */}
        <div className="p-4 hover:bg-slate-50/60 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 cursor-grab hover:text-slate-600 font-bold select-none text-base">
                ⋮⋮
              </span>
              <div>
                <span className="font-semibold text-slate-800 block text-[13px]">
                  Pesan Footer Struk & Ucapan Terima Kasih
                </span>
                <span className="text-xs text-slate-500 line-clamp-1 max-w-md">
                  {form.receiptFooter}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setActiveEditingField(
                    activeEditingField === 'receiptFooter' ? null : 'receiptFooter'
                  )
                }
                className="text-xs font-medium text-slate-600 hover:text-cyan-700 hover:underline cursor-pointer"
              >
                Edit text
              </button>

              <button
                type="button"
                onClick={() => handleToggle('showFooterOnReceipt')}
                className={`inline-flex items-center justify-center min-w-[52px] h-7 px-2.5 rounded text-xs font-bold border uppercase tracking-wider cursor-pointer transition-colors ${
                  form.showFooterOnReceipt
                    ? 'bg-[#00acc1] text-white border-[#00acc1]'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                {form.showFooterOnReceipt ? 'On' : 'Off'}
              </button>
            </div>
          </div>

          {activeEditingField === 'receiptFooter' && (
            <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200 animate-in fade-in duration-150">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Catatan Footer & Ucapan Terima Kasih
              </label>
              <textarea
                rows={2}
                value={form.receiptFooter || ''}
                onChange={(e) => setForm({ ...form, receiptFooter: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-cyan-500 bg-white"
              />
            </div>
          )}
        </div>

        {/* Row 7: Kebijakan Retur & Komplain Grosir */}
        <div className="p-4 hover:bg-slate-50/60 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 cursor-grab hover:text-slate-600 font-bold select-none text-base">
                ⋮⋮
              </span>
              <div>
                <span className="font-semibold text-slate-800 block text-[13px]">
                  Kebijakan Retur & Komplain Grosir
                </span>
                <span className="text-xs text-slate-500 line-clamp-1 max-w-md">
                  {form.receiptReturnPolicy}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setActiveEditingField(
                    activeEditingField === 'policy' ? null : 'policy'
                  )
                }
                className="text-xs font-medium text-slate-600 hover:text-cyan-700 hover:underline cursor-pointer"
              >
                Edit text
              </button>
              <span className="text-xs text-slate-400 italic">use in Footer</span>

              <button
                type="button"
                onClick={() =>
                  setForm({
                    ...form,
                    receiptReturnPolicy: form.receiptReturnPolicy
                      ? ''
                      : 'Retur wajib sertakan video unboxing & nota toko maksimal 2x24 jam sejak paket tiba.',
                  })
                }
                className={`inline-flex items-center justify-center min-w-[52px] h-7 px-2.5 rounded text-xs font-bold border uppercase tracking-wider cursor-pointer transition-colors ${
                  form.receiptReturnPolicy
                    ? 'bg-[#00acc1] text-white border-[#00acc1]'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                {form.receiptReturnPolicy ? 'On' : 'Off'}
              </button>
            </div>
          </div>

          {activeEditingField === 'policy' && (
            <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200 animate-in fade-in duration-150">
              <label className="text-xs font-bold text-slate-700 block mb-1">
                Teks Kebijakan Retur / Komplain Grosir
              </label>
              <textarea
                rows={2}
                value={form.receiptReturnPolicy || ''}
                onChange={(e) => setForm({ ...form, receiptReturnPolicy: e.target.value })}
                className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-cyan-500 bg-white"
              />
            </div>
          )}
        </div>

        {/* Row 8: Barcode & QRIS Struk */}
        <div className="p-4 hover:bg-slate-50/60 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 cursor-grab hover:text-slate-600 font-bold select-none text-base">
                ⋮⋮
              </span>
              <div>
                <span className="font-semibold text-slate-800 block text-[13px]">
                  Kode QR / QRIS Pembayaran pada Struk
                </span>
                <span className="text-xs text-slate-500">
                  Mencetak barcode / QR scan bukti struk transaksi
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400">POS Thermal</span>
              <button
                type="button"
                onClick={() => handleToggle('showQrisOnReceipt')}
                className={`inline-flex items-center justify-center min-w-[52px] h-7 px-2.5 rounded text-xs font-bold border uppercase tracking-wider cursor-pointer transition-colors ${
                  form.showQrisOnReceipt
                    ? 'bg-[#00acc1] text-white border-[#00acc1]'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                {form.showQrisOnReceipt ? 'On' : 'Off'}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Bottom Action Bar matching image_0.png: [✓ Sort] and [✕ Cancel] */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
        {/* Cyan Button matching image_0.png [✓ Sort] */}
        <button
          type="button"
          onClick={handleSaveAll}
          disabled={isSaving}
          className="px-5 py-2 rounded bg-[#00acc1] hover:bg-[#0097a7] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer disabled:opacity-60"
        >
          <Check className="w-4 h-4 stroke-[3]" />
          <span>{isSaving ? 'Menyimpan...' : 'Sort'}</span>
        </button>

        {/* Gray Button matching image_0.png [✕ Cancel] */}
        <button
          type="button"
          onClick={handleCancel}
          className="px-5 py-2 rounded bg-[#546e7a] hover:bg-[#455a64] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
        >
          <X className="w-4 h-4 stroke-[3]" />
          <span>Cancel</span>
        </button>
      </div>

      {/* Modal Help */}
      {showHelpModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 text-sm flex items-center gap-2">
                <HelpCircle className="w-4 h-4 text-cyan-600" />
                Panduan Tata Letak Side Widget
              </h3>
              <button
                onClick={() => setShowHelpModal(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Panel ini menerapkan format Side Widget. Tombol switch <b>On/Off</b> mengatur apakah elemen terkait akan dicetak pada nota thermal fisik dan struk digital WhatsApp pelanggan.
            </p>
            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Klik <b>Edit text</b> untuk mengubah teks pengaturan, lalu klik <b>✓ Sort</b> di kanan bawah untuk menyimpan seluruh perubahan ke sistem dan Google Sheets.
            </p>
            <button
              onClick={() => setShowHelpModal(false)}
              className="w-full py-2 bg-slate-800 text-white font-semibold text-xs rounded-lg hover:bg-slate-900"
            >
              Mengerti
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
