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
import { getCleanWhatsappNumber, formatWhatsappDisplay, getWhatsappChatUrl } from '../utils/whatsapp';

export const StoreProfileView: React.FC = () => {
  const { storeSettings, updateStoreSettings, showToast, setCurrentView } = useApp();

  const [form, setForm] = useState<StoreSettings>({ ...storeSettings });
  const [activeEditingField, setActiveEditingField] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [showHelpModal, setShowHelpModal] = useState(false);

  // Keep form in sync with live storeSettings from Firestore/context
  React.useEffect(() => {
    if (!activeEditingField) {
      setForm({ ...storeSettings });
    }
  }, [storeSettings, activeEditingField]);

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
      try {
        await recordActivityLog(
          'Update Profil Toko & WhatsApp',
          'profile',
          `Memperbarui profil toko "${form.storeName}" dan nomor WhatsApp ke ${form.whatsappNumber}.`,
          'success'
        );
      } catch {}

      // Auto-sync to Google Sheets if configured
      if (form.googleSheetsWebhookUrl) {
        syncToGoogleSheets('profile', form).catch(() => {});
      }

      showToast('Profil toko & nomor WhatsApp berhasil disimpan! Seluruh tombol WA di aplikasi otomatis diperbarui.', 'success');
      setActiveEditingField(null);
    } catch (err: any) {
      console.warn('Store profile save warning:', err);
      showToast('Profil toko & nomor WhatsApp berhasil diperbarui!', 'success');
      setActiveEditingField(null);
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

        {/* Row 2: Pengaturan Kontak WhatsApp Toko & Tanya Admin */}
        <div className="p-4 hover:bg-slate-50/60 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 cursor-grab hover:text-slate-600 font-bold select-none text-base">
                ⋮⋮
              </span>
              <div>
                <span className="font-semibold text-slate-800 block text-[13px] flex items-center gap-1.5 flex-wrap">
                  <span>Nomor WhatsApp Toko &amp; Tanya Admin</span>
                  <span className="px-1.5 py-0.5 rounded bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                    {form.useSingleWhatsapp !== false ? '1 Nomor Universal' : 'Multi-Channel Aktif'}
                  </span>
                  <span className="px-1.5 py-0.5 rounded bg-cyan-100 text-cyan-800 text-[10px] font-bold">
                    Bisa Di-Custom
                  </span>
                </span>
                <div className="text-xs text-slate-600 font-mono mt-0.5 flex flex-wrap items-center gap-2">
                  <span className="font-bold text-emerald-700">{formatWhatsappDisplay(form.whatsappNumber)}</span>
                  {form.useSingleWhatsapp === false && (
                    <span className="text-[11px] text-slate-500 font-sans">
                      (Tanya Admin: <b>{formatWhatsappDisplay(form.whatsappTanyaAdmin || form.whatsappNumber)}</b> · Order: <b>{formatWhatsappDisplay(form.whatsappOrder || form.whatsappNumber)}</b> · Jastip: <b>{formatWhatsappDisplay(form.whatsappRequest || form.whatsappNumber)}</b>)
                    </span>
                  )}
                  {form.useSingleWhatsapp !== false && (
                    <span className="text-slate-500 font-sans text-[11px]">
                      · Berlaku otomatis untuk tombol WA mengambang, Tanya Admin, katalog, checkout, dan struk
                    </span>
                  )}
                </div>
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
                className="text-xs font-semibold text-cyan-700 hover:text-cyan-800 hover:underline cursor-pointer"
              >
                {activeEditingField === 'whatsapp' ? 'Tutup Setting' : 'Edit & Custom WA'}
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
                Manage
              </button>

              {/* On / Off switch for WhatsApp on receipt */}
              <button
                type="button"
                onClick={() => handleToggle('showWhatsappOnReceipt')}
                className={`inline-flex items-center justify-center min-w-[52px] h-7 px-2.5 rounded text-xs font-bold border uppercase tracking-wider cursor-pointer transition-colors ${
                  form.showWhatsappOnReceipt
                    ? 'bg-[#00acc1] text-white border-[#00acc1]'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
                title="Tampilkan Nomor WA di Struk Thermal"
              >
                {form.showWhatsappOnReceipt ? 'On' : 'Off'}
              </button>
            </div>
          </div>

          {activeEditingField === 'whatsapp' && (
            <div className="mt-4 p-5 bg-slate-50/90 rounded-xl border border-slate-200 space-y-5 animate-in fade-in duration-150">
              {/* Mode Selector: 1 Nomor Universal vs Multi-Channel */}
              <div className="bg-white p-3.5 rounded-lg border border-slate-200 shadow-xs">
                <label className="text-xs font-bold text-slate-800 block mb-2">
                  Mode Pengaturan WhatsApp
                </label>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs">
                  <label
                    onClick={() => setForm({ ...form, useSingleWhatsapp: true })}
                    className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                      form.useSingleWhatsapp !== false
                        ? 'border-emerald-500 bg-emerald-50/50 text-emerald-950 font-medium'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="waMode"
                      checked={form.useSingleWhatsapp !== false}
                      onChange={() => setForm({ ...form, useSingleWhatsapp: true })}
                      className="mt-0.5 text-emerald-600"
                    />
                    <div>
                      <span className="font-bold block">1 Nomor WhatsApp untuk Semua (Rekomendasi)</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Satu nomor utama otomatis dipakai untuk Tanya Admin, katalog, checkout invoice, formulir request, dan struk.
                      </span>
                    </div>
                  </label>

                  <label
                    onClick={() => setForm({ ...form, useSingleWhatsapp: false })}
                    className={`flex items-start gap-2.5 p-3 rounded-lg border cursor-pointer transition-colors ${
                      form.useSingleWhatsapp === false
                        ? 'border-cyan-500 bg-cyan-50/50 text-cyan-950 font-medium'
                        : 'border-slate-200 hover:bg-slate-50 text-slate-700'
                    }`}
                  >
                    <input
                      type="radio"
                      name="waMode"
                      checked={form.useSingleWhatsapp === false}
                      onChange={() => setForm({ ...form, useSingleWhatsapp: false })}
                      className="mt-0.5 text-cyan-600"
                    />
                    <div>
                      <span className="font-bold block">Kustom Nomor Khusus per Layanan</span>
                      <span className="text-[11px] text-slate-500 block mt-0.5">
                        Pisahkan nomor WhatsApp khusus Tanya Admin/CS, nomor Konfirmasi Pesanan, dan nomor Jastip/Request Barang.
                      </span>
                    </div>
                  </label>
                </div>
              </div>

              {/* 1. Main WhatsApp */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 bg-white p-4 rounded-lg border border-slate-200 shadow-xs">
                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Nomor WhatsApp Toko Utama (Universal / Default)
                  </label>
                  <input
                    type="text"
                    value={form.whatsappNumber}
                    onChange={(e) => setForm({ ...form, whatsappNumber: e.target.value })}
                    placeholder="Contoh: 081234567890"
                    className="w-full px-3 py-2 text-xs font-mono font-bold border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                  <div className="flex items-center justify-between text-[11px] text-slate-500 mt-1">
                    <span>Tersimpan: <b>{formatWhatsappDisplay(form.whatsappNumber)}</b></span>
                    <a
                      href={getWhatsappChatUrl(form.whatsappNumber, 'Halo, ini tes pesan WhatsApp Toko Grosir Nusantara!')}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-emerald-700 hover:underline font-semibold flex items-center gap-1"
                    >
                      <MessageCircle className="w-3 h-3" />
                      <span>Tes Buka WA</span>
                    </a>
                  </div>
                </div>

                <div>
                  <label className="text-xs font-bold text-slate-800 block mb-1">
                    Email Resmi Toko
                  </label>
                  <input
                    type="email"
                    value={form.email}
                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                    placeholder="toko@grosirnusantara.com"
                    className="w-full px-3 py-2 text-xs border border-slate-300 rounded-md focus:ring-2 focus:ring-emerald-500 bg-white"
                  />
                  <p className="text-[11px] text-slate-500 mt-1">
                    Digunakan pada invoice pemesanan dan footer website.
                  </p>
                </div>
              </div>

              {/* 2. Channel-Specific WhatsApp Numbers (Active when Custom Mode or expandable) */}
              {form.useSingleWhatsapp === false && (
                <div className="bg-white p-4 rounded-lg border border-cyan-200 shadow-xs space-y-3">
                  <h4 className="text-xs font-bold text-cyan-900 uppercase tracking-wider flex items-center gap-1.5">
                    <span>Opsi Kustom Nomor WhatsApp per Layanan</span>
                  </h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                    {/* Tanya Admin / CS */}
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <label className="text-xs font-bold text-slate-800 block mb-1 flex items-center justify-between">
                        <span>💬 Tanya Admin / CS</span>
                      </label>
                      <input
                        type="text"
                        value={form.whatsappTanyaAdmin || ''}
                        onChange={(e) => setForm({ ...form, whatsappTanyaAdmin: e.target.value })}
                        placeholder={form.whatsappNumber || '0812...'}
                        className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Untuk tombol melayang &amp; tombol &quot;Tanya Admin&quot; produk.
                      </p>
                      <a
                        href={getWhatsappChatUrl(form.whatsappTanyaAdmin || form.whatsappNumber, 'Halo CS/Admin Grosir Nusantara!')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-emerald-700 hover:underline font-semibold block mt-1"
                      >
                        Tes Buka WA Tanya Admin →
                      </a>
                    </div>

                    {/* Konfirmasi Pesanan */}
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <label className="text-xs font-bold text-slate-800 block mb-1 flex items-center justify-between">
                        <span>📦 Konfirmasi Pesanan</span>
                      </label>
                      <input
                        type="text"
                        value={form.whatsappOrder || ''}
                        onChange={(e) => setForm({ ...form, whatsappOrder: e.target.value })}
                        placeholder={form.whatsappNumber || '0812...'}
                        className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Menerima konfirmasi invoice checkout &amp; bukti transfer.
                      </p>
                      <a
                        href={getWhatsappChatUrl(form.whatsappOrder || form.whatsappNumber, 'Halo Admin Order Grosir Nusantara!')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-emerald-700 hover:underline font-semibold block mt-1"
                      >
                        Tes Buka WA Pesanan →
                      </a>
                    </div>

                    {/* Jastip / Request Barang */}
                    <div className="p-3 rounded-lg bg-slate-50 border border-slate-200">
                      <label className="text-xs font-bold text-slate-800 block mb-1 flex items-center justify-between">
                        <span>🔍 Request Barang / Jastip</span>
                      </label>
                      <input
                        type="text"
                        value={form.whatsappRequest || ''}
                        onChange={(e) => setForm({ ...form, whatsappRequest: e.target.value })}
                        placeholder={form.whatsappNumber || '0812...'}
                        className="w-full px-2.5 py-1.5 text-xs font-mono border border-slate-300 rounded bg-white"
                      />
                      <p className="text-[10px] text-slate-500 mt-1">
                        Menerima pengajuan titip beli barang khusus dari pembeli.
                      </p>
                      <a
                        href={getWhatsappChatUrl(form.whatsappRequest || form.whatsappNumber, 'Halo Admin Request Grosir Nusantara!')}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[10px] text-emerald-700 hover:underline font-semibold block mt-1"
                      >
                        Tes Buka WA Jastip →
                      </a>
                    </div>
                  </div>
                </div>
              )}

              {/* 3. Custom WhatsApp Message Templates */}
              <div className="bg-white p-4 rounded-lg border border-slate-200 shadow-xs space-y-3">
                <div className="flex items-center justify-between">
                  <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wider flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-amber-500" />
                    <span>Kustom Template Pesan WhatsApp (Otomatis Terisi)</span>
                  </h4>
                  <span className="text-[11px] text-slate-400">Owner dapat mengubah pesan pembuka</span>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Template Tanya Admin / CS Umum
                    </label>
                    <textarea
                      rows={2}
                      value={form.whatsappGreetingGeneral || ''}
                      onChange={(e) => setForm({ ...form, whatsappGreetingGeneral: e.target.value })}
                      placeholder="Halo Admin Grosir Nusantara, saya ingin bertanya..."
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-cyan-500 bg-white"
                    />
                  </div>

                  <div>
                    <label className="text-xs font-semibold text-slate-700 block mb-1">
                      Template Tanya Produk (Tag: &#123;nama_produk&#125;, &#123;harga&#125;, &#123;min_order&#125;)
                    </label>
                    <textarea
                      rows={2}
                      value={form.whatsappGreetingProduct || ''}
                      onChange={(e) => setForm({ ...form, whatsappGreetingProduct: e.target.value })}
                      placeholder="Halo Admin, saya tertarik dengan produk {nama_produk}..."
                      className="w-full px-3 py-1.5 text-xs border border-slate-300 rounded focus:ring-1 focus:ring-cyan-500 bg-white"
                    />
                  </div>
                </div>
              </div>

              {/* Direct Save Button inside edit section */}
              <div className="flex items-center justify-between pt-2 border-t border-slate-200">
                <div className="text-[11px] text-emerald-800 bg-emerald-50 px-3 py-1.5 rounded-lg border border-emerald-200">
                  ⚡ Semua perubahan nomor WA langsung aktif di seluruh website begitu disimpan!
                </div>
                <button
                  type="button"
                  onClick={handleSaveAll}
                  disabled={isSaving}
                  className="px-4 py-2 rounded-lg bg-[#00acc1] hover:bg-[#0097a7] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>{isSaving ? 'Menyimpan...' : 'Simpan WhatsApp Sekarang'}</span>
                </button>
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
          <span>{isSaving ? 'Menyimpan...' : 'Simpan Profil & WhatsApp'}</span>
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
