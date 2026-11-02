import React, { useState, useRef } from 'react';
import {
  exportDatabaseSnapshot,
  restoreDatabaseSnapshot,
  FullDatabaseBackup,
  fetchAllOrders,
  fetchProducts,
  recordActivityLog,
} from '../services/dataService';
import { useApp } from '../context/AppContext';
import {
  Database,
  Download,
  Upload,
  RefreshCcw,
  CheckCircle2,
  AlertTriangle,
  FileJson,
  FileSpreadsheet,
  ShieldAlert,
  ArrowRight,
  HardDrive,
  Info,
} from 'lucide-react';

export const BackupRestoreView: React.FC = () => {
  const { showToast, triggerRefresh } = useApp();
  const [isExporting, setIsExporting] = useState(false);
  const [isRestoring, setIsRestoring] = useState(false);
  const [uploadedBackup, setUploadedBackup] = useState<Partial<FullDatabaseBackup> | null>(null);
  const [fileDetails, setFileDetails] = useState<{ name: string; size: string } | null>(null);
  const [parseError, setParseError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // 1. Download JSON Full Snapshot
  const handleDownloadSnapshot = async () => {
    setIsExporting(true);
    try {
      const data = await exportDatabaseSnapshot();
      const jsonString = `data:text/json;charset=utf-8,${encodeURIComponent(
        JSON.stringify(data, null, 2)
      )}`;
      const downloadAnchor = document.createElement('a');
      downloadAnchor.setAttribute('href', jsonString);
      downloadAnchor.setAttribute(
        'download',
        `Backup_AurKuning_Full_${new Date().toISOString().slice(0, 10)}.json`
      );
      document.body.appendChild(downloadAnchor);
      downloadAnchor.click();
      downloadAnchor.remove();

      showToast('Cadangan database JSON lengkap berhasil diunduh ke komputer Anda!', 'success');
    } catch (err: any) {
      showToast('Gagal membuat cadangan database: ' + err.message, 'error');
    } finally {
      setIsExporting(false);
    }
  };

  // 2. Download CSV of Orders
  const handleDownloadOrdersCSV = async () => {
    try {
      const orders = await fetchAllOrders();
      if (orders.length === 0) {
        showToast('Belum ada pesanan untuk diekspor ke CSV', 'info');
        return;
      }

      const headers = [
        'No Invoice',
        'Tanggal Masuk',
        'Pelanggan',
        'WhatsApp',
        'Kota Tujuan',
        'Subtotal',
        'Ongkir',
        'Total Bayar',
        'Status Bayar',
        'Status Pesanan',
        'Ekspedisi',
      ];

      const rows = orders.map((o) => [
        o.invoiceNumber,
        new Date(o.createdAt).toLocaleDateString('id-ID'),
        `"${o.customerName.replace(/"/g, '""')}"`,
        `'${o.customerWhatsapp}`,
        `"${o.shippingAddress?.city || ''}"`,
        o.subtotal,
        o.shippingCost,
        o.totalAmount,
        o.paymentStatus,
        o.orderStatus,
        o.courier,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,\uFEFF' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `Pesanan_NusantaraGrosir_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      link.remove();

      showToast('Data pesanan berhasil diekspor ke CSV', 'success');
    } catch (err: any) {
      showToast('Gagal ekspor pesanan ke CSV: ' + err.message, 'error');
    }
  };

  // 3. Handle File Upload (JSON or CSV)
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileDetails({
      name: file.name,
      size: `${(file.size / 1024).toFixed(1)} KB`,
    });
    setParseError(null);

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        const parsed = JSON.parse(text);

        // Validation: verify structure
        if (!parsed.products && !parsed.orders && !parsed.storeSettings) {
          throw new Error('File JSON tidak memiliki struktur database Grosir Nusantara yang valid.');
        }

        setUploadedBackup(parsed);
      } catch (err: any) {
        setUploadedBackup(null);
        setParseError(err.message || 'File tidak valid atau format JSON rusak.');
      }
    };
    reader.onerror = () => {
      setParseError('Gagal membaca file dari perangkat Anda.');
    };
    reader.readAsText(file);
  };

  // 4. Confirm and Restore
  const handleExecuteRestore = async () => {
    if (!uploadedBackup) return;

    const confirmed = window.confirm(
      'Apakah Anda yakin ingin memulihkan database dari file ini? Data yang ada akan disinkronkan dan diperbarui dengan isi file cadangan.'
    );
    if (!confirmed) return;

    setIsRestoring(true);
    try {
      const result = await restoreDatabaseSnapshot(uploadedBackup);
      if (result.success) {
        showToast(result.message, 'success');
        triggerRefresh();
        setUploadedBackup(null);
        setFileDetails(null);
        if (fileInputRef.current) fileInputRef.current.value = '';
      } else {
        showToast(result.message, 'error');
      }
    } catch (err: any) {
      showToast('Gagal memulihkan database: ' + err.message, 'error');
    } finally {
      setIsRestoring(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Info */}
      <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
              <Database className="w-5 h-5 text-cyan-600" />
              Backup & Restore Database Mandiri
            </h2>
            <p className="text-xs text-slate-500 mt-1">
              Amankan data toko, katalog grosir, riwayat pesanan, dan log aktivitas ke dalam file cadangan lokal (JSON & CSV).
            </p>
          </div>
          <span className="px-3 py-1 bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold rounded-full flex items-center gap-1.5">
            <CheckCircle2 className="w-3.5 h-3.5" />
            Sistem Siap Cadangkan
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card 1: Backup / Export */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-cyan-100 flex items-center justify-center text-cyan-700">
                <Download className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">1. Unduh Cadangan (Backup)</h3>
                <p className="text-xs text-slate-500">Simpan salinan utuh database ke komputer lokal Anda</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Pilih format cadangan yang Anda butuhkan. Format JSON direkomendasikan untuk pemulihan lengkap sistem, sedangkan format CSV cocok untuk pengolahan spreadsheet di Excel atau Google Sheets.
            </p>

            <div className="space-y-3">
              {/* Button A: Full JSON Snapshot */}
              <button
                type="button"
                onClick={handleDownloadSnapshot}
                disabled={isExporting}
                className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-xs shadow-xs hover:shadow transition-all flex items-center justify-between cursor-pointer disabled:opacity-60"
              >
                <div className="flex items-center gap-2">
                  <FileJson className="w-4 h-4" />
                  <span>Download Snapshot Lengkap (JSON)</span>
                </div>
                <span className="text-[10px] bg-cyan-700 px-2 py-0.5 rounded text-white font-mono">
                  Direkomendasikan
                </span>
              </button>

              {/* Button B: CSV Orders */}
              <button
                type="button"
                onClick={handleDownloadOrdersCSV}
                className="w-full py-2.5 px-4 rounded-xl bg-slate-50 hover:bg-slate-100 border border-slate-300 text-slate-800 font-semibold text-xs transition-colors flex items-center justify-between cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <FileSpreadsheet className="w-4 h-4 text-emerald-600" />
                  <span>Ekspor Riwayat Pesanan ke CSV</span>
                </div>
                <span className="text-[10px] text-slate-500 font-mono">Excel Ready</span>
              </button>
            </div>
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
            <Info className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>File JSON mencakup: Profil Toko, Transaksi, Produk, Request, & Log Audit.</span>
          </div>
        </div>

        {/* Card 2: Restore / Import */}
        <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <div className="w-10 h-10 rounded-xl bg-indigo-100 flex items-center justify-center text-indigo-700">
                <Upload className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-slate-900">2. Pulihkan Data (Restore)</h3>
                <p className="text-xs text-slate-500">Unggah file cadangan JSON yang telah diunduh sebelumnya</p>
              </div>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-4">
              Pilih file cadangan JSON dari perangkat Anda. Sistem akan memeriksa validitas struktur data sebelum memulihkan data ke sistem.
            </p>

            {/* Dropzone & File Input */}
            <div
              onClick={() => fileInputRef.current?.click()}
              className="border-2 border-dashed border-slate-300 hover:border-indigo-400 rounded-xl p-5 text-center cursor-pointer transition-colors bg-slate-50/60 hover:bg-indigo-50/30"
            >
              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />
              <Upload className="w-7 h-7 mx-auto text-slate-400 mb-2" />
              <div className="text-xs font-semibold text-slate-800">
                {fileDetails ? fileDetails.name : 'Klik untuk memilih file cadangan (.json)'}
              </div>
              <p className="text-[11px] text-slate-500 mt-0.5">
                {fileDetails ? `Ukuran: ${fileDetails.size}` : 'Maksimal 10 MB per berkas'}
              </p>
            </div>

            {/* Error banner */}
            {parseError && (
              <div className="mt-3 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-xs flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 shrink-0 text-red-600" />
                <span>{parseError}</span>
              </div>
            )}

            {/* Preview of items to restore */}
            {uploadedBackup && (
              <div className="mt-4 p-3 rounded-xl bg-emerald-50 border border-emerald-200 text-xs space-y-2">
                <div className="font-bold text-emerald-900 flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                  File Cadangan Valid & Siap Dipulihkan:
                </div>
                <div className="grid grid-cols-2 gap-2 text-[11px] text-emerald-800">
                  <div>• Produk: {uploadedBackup.products?.length || 0} barang</div>
                  <div>• Pesanan: {uploadedBackup.orders?.length || 0} data</div>
                  <div>• Request: {uploadedBackup.requests?.length || 0} tiket</div>
                  <div>• Profil Toko: {uploadedBackup.storeSettings ? 'Ada' : 'Tidak'}</div>
                </div>

                <button
                  type="button"
                  onClick={handleExecuteRestore}
                  disabled={isRestoring}
                  className="w-full mt-2 py-2.5 px-4 rounded-lg bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs shadow-xs transition-colors flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <RefreshCcw className={`w-3.5 h-3.5 ${isRestoring ? 'animate-spin' : ''}`} />
                  <span>{isRestoring ? 'Memproses Restorasi...' : 'Eksekusi Pemulihan Database Sekarang'}</span>
                </button>
              </div>
            )}
          </div>

          <div className="mt-6 pt-4 border-t border-slate-100 text-[11px] text-slate-400 flex items-center gap-1.5">
            <ShieldAlert className="w-3.5 h-3.5 text-slate-400 shrink-0" />
            <span>Restorasi akan memperbarui data tanpa menghapus data baru yang tidak berkonflik.</span>
          </div>
        </div>
      </div>
    </div>
  );
};
