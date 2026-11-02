import React, { useState } from 'react';
import { useApp } from '../context/AppContext';
import {
  GripVertical,
  HelpCircle,
  X,
  Check,
  Copy,
  ExternalLink,
  RefreshCw,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  Database,
  Code,
  Table,
  Sparkles,
  Send,
} from 'lucide-react';
import {
  syncToGoogleSheets,
  SAMPLE_GOOGLE_APPS_SCRIPT_CODE,
  recordActivityLog,
  fetchAllOrders,
  fetchProducts,
} from '../services/dataService';

export const GoogleSheetsSettingsView: React.FC = () => {
  const { storeSettings, updateStoreSettings, showToast, setCurrentView } = useApp();

  const [webhookUrl, setWebhookUrl] = useState(storeSettings.googleSheetsWebhookUrl || '');
  const [sheetId, setSheetId] = useState(storeSettings.googleSheetId || '');
  const [autoSync, setAutoSync] = useState(storeSettings.autoSyncGoogleSheets ?? true);
  const [syncProfile, setSyncProfile] = useState(true);
  const [syncProducts, setSyncProducts] = useState(true);
  const [syncLogs, setSyncLogs] = useState(true);

  const [activeEditingField, setActiveEditingField] = useState<string | null>(null);
  const [isTesting, setIsTesting] = useState(false);
  const [isSyncingAll, setIsSyncingAll] = useState(false);
  const [hasCopiedCode, setHasCopiedCode] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [showDocsModal, setShowDocsModal] = useState(false);

  const handleCopyCode = async () => {
    await navigator.clipboard.writeText(SAMPLE_GOOGLE_APPS_SCRIPT_CODE);
    setHasCopiedCode(true);
    showToast('Kode Google Apps Script berhasil disalin ke clipboard!', 'success');
    setTimeout(() => setHasCopiedCode(false), 2500);
  };

  const handleTestConnection = async () => {
    if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
      showToast('Masukkan URL Webhook Google Apps Script terlebih dahulu.', 'error');
      return;
    }

    setIsTesting(true);
    setTestResult(null);

    try {
      const res = await syncToGoogleSheets(
        'test',
        {
          appName: 'Grosir Nusantara',
          testedAt: new Date().toISOString(),
          message: 'Uji koneksi dari panel admin POS.',
        },
        webhookUrl.trim()
      );

      setTestResult(res);
      if (res.success) {
        showToast('Koneksi ke Google Sheets berhasil diuji!', 'success');
        await recordActivityLog(
          'Uji Koneksi Google Sheets',
          'sheets',
          'Berhasil mengirim ping tes ke Google Apps Script Web App.',
          'success'
        );
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      setTestResult({
        success: false,
        message: err.message || 'Koneksi gagal terhubung.',
      });
      showToast('Uji koneksi gagal', 'error');
    } finally {
      setIsTesting(false);
    }
  };

  const handleSyncAllData = async () => {
    if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
      showToast('URL Webhook belum diisi', 'error');
      return;
    }

    setIsSyncingAll(true);
    try {
      const [products, orders] = await Promise.all([
        fetchProducts(),
        fetchAllOrders(),
      ]);

      const res = await syncToGoogleSheets(
        'sync_all',
        {
          products,
          orders,
          profile: storeSettings,
        },
        webhookUrl.trim()
      );

      if (res.success) {
        showToast('Semua data berhasil disinkronkan ke Google Sheets!', 'success');
        await recordActivityLog(
          'Sinkronisasi Massal Google Sheets',
          'sheets',
          `Sinkronisasi ${products.length} produk dan ${orders.length} pesanan ke Google Sheets.`,
          'success'
        );
      } else {
        showToast(res.message, 'error');
      }
    } catch (err: any) {
      showToast('Gagal sinkronisasi data: ' + err.message, 'error');
    } finally {
      setIsSyncingAll(false);
    }
  };

  const handleSaveSettings = async () => {
    try {
      await updateStoreSettings({
        ...storeSettings,
        googleSheetsWebhookUrl: webhookUrl.trim(),
        googleSheetId: sheetId.trim(),
        autoSyncGoogleSheets: autoSync,
      });

      await recordActivityLog(
        'Update Pengaturan Google Sheets',
        'sheets',
        `Memperbarui URL Webhook Google Apps Script. Auto-sync: ${autoSync ? 'Aktif' : 'Nonaktif'}.`,
        'success'
      );

      showToast('Pengaturan Google Sheets berhasil disimpan!', 'success');
      setActiveEditingField(null);
    } catch (err: any) {
      showToast('Gagal menyimpan: ' + err.message, 'error');
    }
  };

  const handleCancel = () => {
    setWebhookUrl(storeSettings.googleSheetsWebhookUrl || '');
    setSheetId(storeSettings.googleSheetId || '');
    setAutoSync(storeSettings.autoSyncGoogleSheets ?? true);
    setActiveEditingField(null);
    showToast('Perubahan dibatalkan', 'info');
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
      {/* 1. Header Bar matching image_0.png "Side Widget" style */}
      <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
        <div>
          <h2 className="text-xl font-bold text-slate-800 tracking-tight flex items-center gap-2">
            Database (Sheets) & Apps Script
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Sinkronisasi cloud database dua arah antara POS / Toko Online dengan spreadsheet Google Sheets melalui Google Apps Script.
          </p>
        </div>

        {/* Top Right Icons: Help (?) and Close (X) matching image_0.png */}
        <div className="flex items-center gap-2 text-slate-400">
          <button
            type="button"
            onClick={() => setShowDocsModal(true)}
            className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
            title="Dokumentasi Kode & Struktur Kolom"
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

        {/* Row 1: Auto Sync Toggle */}
        <div className="p-4 hover:bg-slate-50/60 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 cursor-grab hover:text-slate-600 font-bold select-none text-base">
                ⋮⋮
              </span>
              <div>
                <span className="font-semibold text-slate-800 block text-[13px]">
                  Sinkronisasi Otomatis Transaksi (Real-time)
                </span>
                <span className="text-xs text-slate-500">
                  Kirim setiap transaksi & request baru langsung ke Google Sheets tanpa perlu manual sync
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={handleSyncAllData}
                disabled={isSyncingAll}
                className="text-xs font-medium text-slate-600 hover:text-cyan-700 hover:underline cursor-pointer disabled:opacity-50"
              >
                {isSyncingAll ? 'Syncing...' : 'Sync Now'}
              </button>

              <button
                type="button"
                onClick={() => setAutoSync(!autoSync)}
                className={`inline-flex items-center justify-center min-w-[52px] h-7 px-2.5 rounded text-xs font-bold border uppercase tracking-wider cursor-pointer transition-colors ${
                  autoSync
                    ? 'bg-[#00acc1] text-white border-[#00acc1]'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                {autoSync ? 'On' : 'Off'}
              </button>
            </div>
          </div>
        </div>

        {/* Row 2: URL Webhook Google Apps Script */}
        <div className="p-4 hover:bg-slate-50/60 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 cursor-grab hover:text-slate-600 font-bold select-none text-base">
                ⋮⋮
              </span>
              <div>
                <span className="font-semibold text-slate-800 block text-[13px]">
                  URL Webhook Google Apps Script (Web App)
                </span>
                <span className="text-xs text-slate-500 font-mono truncate max-w-sm block">
                  {webhookUrl ? webhookUrl : 'Belum dikonfigurasi (https://script.google.com/...)'}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() =>
                  setActiveEditingField(
                    activeEditingField === 'webhook' ? null : 'webhook'
                  )
                }
                className="text-xs font-medium text-slate-600 hover:text-cyan-700 hover:underline cursor-pointer"
              >
                Edit text
              </button>

              <button
                type="button"
                onClick={handleTestConnection}
                disabled={isTesting}
                className="text-xs font-medium text-slate-600 hover:text-cyan-700 hover:underline cursor-pointer disabled:opacity-50"
              >
                {isTesting ? 'Testing...' : 'Manage'}
              </button>

              <div
                className={`inline-flex items-center justify-center min-w-[52px] h-7 px-2.5 rounded text-xs font-bold border uppercase tracking-wider ${
                  webhookUrl.trim()
                    ? 'bg-[#00acc1] text-white border-[#00acc1]'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                {webhookUrl.trim() ? 'On' : 'Off'}
              </div>
            </div>
          </div>

          {activeEditingField === 'webhook' && (
            <div className="mt-3 p-4 bg-slate-50 rounded-lg border border-slate-200 space-y-3 animate-in fade-in duration-150">
              <div>
                <label className="text-xs font-bold text-slate-700 block mb-1">
                  Google Apps Script Web App Deployment URL
                </label>
                <input
                  type="url"
                  value={webhookUrl}
                  onChange={(e) => setWebhookUrl(e.target.value)}
                  placeholder="https://script.google.com/macros/s/AKfycb.../exec"
                  className="w-full px-3 py-1.5 text-xs font-mono border border-slate-300 rounded focus:ring-1 focus:ring-cyan-500 bg-white"
                />
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="px-3.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer disabled:opacity-60"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isTesting ? 'animate-spin' : ''}`} />
                  <span>Uji Koneksi Sekarang</span>
                </button>

                <button
                  type="button"
                  onClick={() => setShowDocsModal(true)}
                  className="px-3 py-1.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold text-xs rounded transition-colors flex items-center gap-1.5 cursor-pointer"
                >
                  <Code className="w-3.5 h-3.5" />
                  <span>Lihat Kode GAS (.gs)</span>
                </button>
              </div>

              {testResult && (
                <div
                  className={`p-2.5 rounded text-xs flex items-center gap-2 ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                      : 'bg-red-50 text-red-800 border border-red-200'
                  }`}
                >
                  {testResult.success ? (
                    <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  ) : (
                    <AlertCircle className="w-4 h-4 text-red-600 shrink-0" />
                  )}
                  <span>{testResult.message}</span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* Row 3: Sheet Profil Toko */}
        <div className="p-4 hover:bg-slate-50/60 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 cursor-grab hover:text-slate-600 font-bold select-none text-base">
                ⋮⋮
              </span>
              <div>
                <span className="font-semibold text-slate-800 block text-[13px]">
                  Sheet: &quot;Profil&quot;
                </span>
                <span className="text-xs text-slate-500">
                  Menyimpan parameter identitas toko, nomor WA, alamat lapak, dan format struk
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400">Parameter | Nilai</span>
              <button
                type="button"
                onClick={() => setSyncProfile(!syncProfile)}
                className={`inline-flex items-center justify-center min-w-[52px] h-7 px-2.5 rounded text-xs font-bold border uppercase tracking-wider cursor-pointer transition-colors ${
                  syncProfile
                    ? 'bg-[#00acc1] text-white border-[#00acc1]'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                {syncProfile ? 'On' : 'Off'}
              </button>
            </div>
          </div>
        </div>

        {/* Row 4: Sheet Transaksi & Pelanggan */}
        <div className="p-4 hover:bg-slate-50/60 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 cursor-grab hover:text-slate-600 font-bold select-none text-base">
                ⋮⋮
              </span>
              <div>
                <span className="font-semibold text-slate-800 block text-[13px]">
                  Sheet: &quot;Transaksi&quot; &amp; &quot;Pelanggan&quot;
                </span>
                <span className="text-xs text-slate-500">
                  Mencatat rincian transaksi belanja, status pembayaran, nomor resi, dan profil pelanggan
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <span className="text-xs text-slate-400">CRUD doPost &amp; doGet</span>
              <div
                className="inline-flex items-center justify-center min-w-[52px] h-7 px-2.5 rounded text-xs font-bold border uppercase tracking-wider bg-[#00acc1] text-white border-[#00acc1]"
              >
                On
              </div>
            </div>
          </div>
        </div>

        {/* Row 5: Sheet Layanan & Produk */}
        <div className="p-4 hover:bg-slate-50/60 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 cursor-grab hover:text-slate-600 font-bold select-none text-base">
                ⋮⋮
              </span>
              <div>
                <span className="font-semibold text-slate-800 block text-[13px]">
                  Sheet: &quot;Layanan &amp; Produk&quot;
                </span>
                <span className="text-xs text-slate-500">
                  Katalog barang grosir, harga grosir vs ecer, minimal order, dan stok produk
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setSyncProducts(!syncProducts)}
                className={`inline-flex items-center justify-center min-w-[52px] h-7 px-2.5 rounded text-xs font-bold border uppercase tracking-wider cursor-pointer transition-colors ${
                  syncProducts
                    ? 'bg-[#00acc1] text-white border-[#00acc1]'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                {syncProducts ? 'On' : 'Off'}
              </button>
            </div>
          </div>
        </div>

        {/* Row 6: Sheet Activity Log */}
        <div className="p-4 hover:bg-slate-50/60 transition-colors">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <span className="text-slate-400 cursor-grab hover:text-slate-600 font-bold select-none text-base">
                ⋮⋮
              </span>
              <div>
                <span className="font-semibold text-slate-800 block text-[13px]">
                  Sheet: &quot;Activity Log&quot; (Audit Trail)
                </span>
                <span className="text-xs text-slate-500">
                  Sinkronisasi catatan tindakan login, ubah pesanan, cetak struk thermal, dan pemulihan data
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={() => setSyncLogs(!syncLogs)}
                className={`inline-flex items-center justify-center min-w-[52px] h-7 px-2.5 rounded text-xs font-bold border uppercase tracking-wider cursor-pointer transition-colors ${
                  syncLogs
                    ? 'bg-[#00acc1] text-white border-[#00acc1]'
                    : 'bg-slate-100 text-slate-600 border-slate-300'
                }`}
              >
                {syncLogs ? 'On' : 'Off'}
              </button>
            </div>
          </div>
        </div>

      </div>

      {/* 3. Bottom Action Bar matching image_0.png: [✓ Sort] and [✕ Cancel] */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-between">
        <button
          type="button"
          onClick={() => setShowDocsModal(true)}
          className="text-xs text-cyan-700 hover:text-cyan-800 font-semibold flex items-center gap-1.5"
        >
          <Table className="w-4 h-4" />
          <span>Panduan Struktur Kolom Google Sheets</span>
        </button>

        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={handleSaveSettings}
            className="px-5 py-2 rounded bg-[#00acc1] hover:bg-[#0097a7] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <Check className="w-4 h-4 stroke-[3]" />
            <span>Sort</span>
          </button>

          <button
            type="button"
            onClick={handleCancel}
            className="px-5 py-2 rounded bg-[#546e7a] hover:bg-[#455a64] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
          >
            <X className="w-4 h-4 stroke-[3]" />
            <span>Cancel</span>
          </button>
        </div>
      </div>

      {/* Modal: Full Google Apps Script & Recommended Column Structures */}
      {showDocsModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-3 sm:p-5 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col overflow-hidden border border-slate-200">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b border-slate-200 bg-slate-50 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-xl bg-emerald-100 flex items-center justify-center text-emerald-700">
                  <FileSpreadsheet className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="text-base font-bold text-slate-900">
                    Panduan Arsitektur Backend Google Apps Script &amp; Struktur Google Sheets
                  </h3>
                  <p className="text-xs text-slate-500">
                    Operasi CRUD lengkap menggunakan doPost() dan doGet()
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setShowDocsModal(false)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Scrollable Body */}
            <div className="flex-1 overflow-y-auto p-6 space-y-6 text-xs text-slate-700">
              {/* Section 1: Recommended Column Structure */}
              <div>
                <h4 className="text-sm font-bold text-slate-900 mb-2 flex items-center gap-2">
                  <Table className="w-4 h-4 text-cyan-600" />
                  Struktur Tabel &amp; Kolom yang Disarankan di Google Sheets
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Table 1: Profil */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-900 mb-1 text-[11px] flex items-center justify-between">
                      <span>1. Sheet: &quot;Profil&quot;</span>
                      <span className="text-[10px] text-slate-500 font-mono">3 Kolom</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2">Menyimpan setelan toko dan konfigurasi struk.</p>
                    <div className="bg-white p-2 rounded border border-slate-200 font-mono text-[10.5px] text-slate-800 leading-relaxed">
                      A: Parameter / Kunci<br/>
                      B: Nilai Pengaturan<br/>
                      C: Terakhir Diperbarui
                    </div>
                  </div>

                  {/* Table 2: Transaksi */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-900 mb-1 text-[11px] flex items-center justify-between">
                      <span>2. Sheet: &quot;Transaksi&quot;</span>
                      <span className="text-[10px] text-slate-500 font-mono">15 Kolom</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2">Rekap transaksi masuk, struk, dan status ongkir.</p>
                    <div className="bg-white p-2 rounded border border-slate-200 font-mono text-[10.5px] text-slate-800 leading-relaxed">
                      Waktu Transaksi | No. Invoice | Nama Pelanggan | No. WhatsApp | Email | Kota Tujuan | Rincian Barang | Subtotal Barang | Ongkos Kirim | Total Bayar | Status Bayar | Status Pesanan | Ekspedisi | No. Resi | Link Lacak
                    </div>
                  </div>

                  {/* Table 3: Pelanggan */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-900 mb-1 text-[11px] flex items-center justify-between">
                      <span>3. Sheet: &quot;Pelanggan&quot;</span>
                      <span className="text-[10px] text-slate-500 font-mono">6 Kolom</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2">Buku alamat pembeli grosir & riwayat transaksi.</p>
                    <div className="bg-white p-2 rounded border border-slate-200 font-mono text-[10.5px] text-slate-800 leading-relaxed">
                      Waktu Registrasi | Nama Lengkap | Nomor WhatsApp | Email | Kota / Domisili | Total Transaksi Terakhir
                    </div>
                  </div>

                  {/* Table 4: Layanan & Produk */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
                    <div className="font-bold text-slate-900 mb-1 text-[11px] flex items-center justify-between">
                      <span>4. Sheet: &quot;Layanan &amp; Produk&quot;</span>
                      <span className="text-[10px] text-slate-500 font-mono">8 Kolom</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2">Master data katalog produk Grosir Nusantara.</p>
                    <div className="bg-white p-2 rounded border border-slate-200 font-mono text-[10.5px] text-slate-800 leading-relaxed">
                      ID Produk | Nama Produk | Kategori | Harga Ecer | Harga Grosir | Min. Order | Satuan | Stok
                    </div>
                  </div>

                  {/* Table 5: Activity Log */}
                  <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 md:col-span-2">
                    <div className="font-bold text-slate-900 mb-1 text-[11px] flex items-center justify-between">
                      <span>5. Sheet: &quot;Activity Log&quot; (Audit Trail)</span>
                      <span className="text-[10px] text-slate-500 font-mono">4 Kolom</span>
                    </div>
                    <p className="text-[11px] text-slate-500 mb-2">Catatan jejak audit aktivitas admin & sistem.</p>
                    <div className="bg-white p-2 rounded border border-slate-200 font-mono text-[10.5px] text-slate-800 leading-relaxed">
                      Timestamp | Pengguna | Aktivitas / Aksi | Rincian Catatan
                    </div>
                  </div>
                </div>
              </div>

              {/* Section 2: Complete Code */}
              <div>
                <div className="flex items-center justify-between mb-2">
                  <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                    <Code className="w-4 h-4 text-emerald-600" />
                    Kode Lengkap Google Apps Script (.gs) Backend
                  </h4>
                  <button
                    type="button"
                    onClick={handleCopyCode}
                    className="px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    {hasCopiedCode ? (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>Tersalin!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-3.5 h-3.5" />
                        <span>Salin Seluruh Kode</span>
                      </>
                    )}
                  </button>
                </div>

                <div className="bg-slate-900 text-slate-100 p-4 rounded-xl font-mono text-[11px] leading-relaxed max-h-72 overflow-y-auto border border-slate-800">
                  <pre>{SAMPLE_GOOGLE_APPS_SCRIPT_CODE}</pre>
                </div>
              </div>

              {/* Section 3: 4-Step Deployment Guide */}
              <div className="p-4 bg-cyan-50 border border-cyan-200 rounded-xl space-y-2">
                <h5 className="font-bold text-cyan-950 text-xs">
                  Cara Pasang Google Apps Script dalam 3 Menit:
                </h5>
                <ol className="list-decimal list-inside space-y-1 text-cyan-900 text-[11px] leading-relaxed">
                  <li>Buka spreadsheet Google Sheets Anda di <b>https://sheets.new</b>.</li>
                  <li>Buka menu <b>Ekstensi &gt; Apps Script</b>.</li>
                  <li>Hapus kode bawaan, lalu tempel kode yang Anda salin dari tombol di atas.</li>
                  <li>Klik tombol biru <b>Deploy &gt; New deployment</b>, pilih jenis <b>Web app</b>.</li>
                  <li>Atur <b>Execute as: Me</b> dan <b>Who has access: Anyone</b>.</li>
                  <li>Klik <b>Deploy</b>, salin Web App URL yang dihasilkan, lalu tempel di kolom URL Webhook aplikasi ini!</li>
                </ol>
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-3.5 border-t border-slate-200 bg-slate-50 flex justify-end">
              <button
                type="button"
                onClick={() => setShowDocsModal(false)}
                className="px-4 py-2 bg-slate-800 hover:bg-slate-900 text-white font-semibold text-xs rounded-lg transition-colors cursor-pointer"
              >
                Tutup Panduan
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
