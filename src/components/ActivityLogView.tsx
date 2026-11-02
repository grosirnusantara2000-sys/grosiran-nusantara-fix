import React, { useState, useEffect } from 'react';
import { ActivityLog } from '../types';
import { fetchActivityLogs, recordActivityLog, syncToGoogleSheets } from '../services/dataService';
import {
  History,
  Search,
  Filter,
  RefreshCw,
  Download,
  CheckCircle2,
  AlertTriangle,
  Info,
  Clock,
  User,
  ShieldCheck,
  Send,
  FileSpreadsheet,
} from 'lucide-react';
import { useApp } from '../context/AppContext';

export const ActivityLogView: React.FC = () => {
  const { showToast } = useApp();
  const [logs, setLogs] = useState<ActivityLog[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isExporting, setIsExporting] = useState(false);

  const loadLogs = async () => {
    setIsLoading(true);
    try {
      const data = await fetchActivityLogs();
      setLogs(data);
    } catch (err) {
      console.error('Failed to load activity logs:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadLogs();
  }, []);

  const filteredLogs = logs.filter((log) => {
    const matchesSearch =
      log.action.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.details.toLowerCase().includes(searchQuery.toLowerCase()) ||
      log.user.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory =
      selectedCategory === 'all' || log.category === selectedCategory;
    return matchesSearch && matchesCategory;
  });

  const handleExportCSV = () => {
    setIsExporting(true);
    try {
      const headers = ['ID', 'Timestamp', 'Pengguna', 'Kategori', 'Aksi', 'Status', 'Rincian'];
      const rows = filteredLogs.map((l) => [
        l.id,
        new Date(l.timestamp).toLocaleString('id-ID'),
        `"${l.user.replace(/"/g, '""')}"`,
        l.category,
        `"${l.action.replace(/"/g, '""')}"`,
        l.status,
        `"${l.details.replace(/"/g, '""')}"`,
      ]);

      const csvContent =
        'data:text/csv;charset=utf-8,\uFEFF' +
        [headers.join(','), ...rows.map((e) => e.join(','))].join('\n');

      const encodedUri = encodeURI(csvContent);
      const link = document.createElement('a');
      link.setAttribute('href', encodedUri);
      link.setAttribute(
        'download',
        `Activity_Log_Aur_Kuning_${new Date().toISOString().slice(0, 10)}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      showToast('Log aktivitas berhasil diunduh dalam format CSV', 'success');
    } catch (err) {
      showToast('Gagal mengekspor log ke CSV', 'error');
    } finally {
      setIsExporting(false);
    }
  };

  const handleSyncLogsToSheets = async () => {
    try {
      showToast('Mengirim log ke Google Sheets...', 'info');
      const latest = logs[0];
      if (latest) {
        const res = await syncToGoogleSheets('log_activity', latest);
        if (res.success) {
          showToast('Log aktivitas berhasil dicatat ke sheet Activity Log!', 'success');
        } else {
          showToast(res.message, 'error');
        }
      }
    } catch (err: any) {
      showToast('Gagal sinkronisasi log: ' + err.message, 'error');
    }
  };

  return (
    <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
      {/* Top Banner & Header */}
      <div className="px-6 py-5 border-b border-slate-200 bg-slate-50 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
            <History className="w-5 h-5 text-cyan-600" />
            Log Aktivitas & Audit Trail
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Mencatat setiap tindakan penting (login, transaksi, edit profil toko, cetak struk thermal, dan backup)
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={loadLogs}
            disabled={isLoading}
            className="px-3 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Muat Ulang</span>
          </button>

          <button
            type="button"
            onClick={handleExportCSV}
            disabled={isExporting || logs.length === 0}
            className="px-3.5 py-2 text-xs font-semibold text-cyan-800 bg-cyan-50 border border-cyan-200 rounded-lg hover:bg-cyan-100 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Download className="w-3.5 h-3.5" />
            <span>Unduh CSV</span>
          </button>

          <button
            type="button"
            onClick={handleSyncLogsToSheets}
            className="px-3.5 py-2 text-xs font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 rounded-lg hover:bg-emerald-100 flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <FileSpreadsheet className="w-3.5 h-3.5" />
            <span>Sync Sheets</span>
          </button>
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="p-4 border-b border-slate-200 bg-white flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Cari aksi, rincian aktivitas, atau pengguna..."
            className="w-full pl-9 pr-4 py-2 text-xs border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-cyan-500 focus:border-cyan-500"
          />
        </div>

        <div className="flex items-center gap-2">
          <Filter className="w-3.5 h-3.5 text-slate-400" />
          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="text-xs border border-slate-300 rounded-lg px-3 py-2 bg-white text-slate-700 focus:outline-none focus:ring-2 focus:ring-cyan-500"
          >
            <option value="all">Semua Kategori</option>
            <option value="auth">Autentikasi (Auth)</option>
            <option value="order">Transaksi & Pesanan</option>
            <option value="profile">Profil Toko</option>
            <option value="print">Cetak Nota Thermal</option>
            <option value="sheets">Google Sheets</option>
            <option value="backup">Backup & Restore</option>
            <option value="system">Sistem</option>
          </select>
        </div>
      </div>

      {/* Table List of Logs */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse text-xs">
          <thead>
            <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
              <th className="py-3 px-4">Waktu</th>
              <th className="py-3 px-4">Pengguna</th>
              <th className="py-3 px-4">Kategori</th>
              <th className="py-3 px-4">Aktivitas / Aksi</th>
              <th className="py-3 px-4">Rincian Catatan</th>
              <th className="py-3 px-4 text-center">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100">
            {filteredLogs.length === 0 ? (
              <tr>
                <td colSpan={6} className="py-12 text-center text-slate-400">
                  <History className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                  <p className="font-medium text-slate-600">Tidak ada log aktivitas ditemukan</p>
                  <p className="text-[11px] text-slate-400 mt-1">Coba sesuaikan kata kunci pencarian atau kategori filter.</p>
                </td>
              </tr>
            ) : (
              filteredLogs.map((log) => {
                const dateObj = new Date(log.timestamp);
                const formattedTime = dateObj.toLocaleTimeString('id-ID', {
                  hour: '2-digit',
                  minute: '2-digit',
                  second: '2-digit',
                });
                const formattedDate = dateObj.toLocaleDateString('id-ID', {
                  day: '2-digit',
                  month: 'short',
                  year: 'numeric',
                });

                return (
                  <tr key={log.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                      <div>{formattedDate}</div>
                      <div className="text-[10px] text-slate-400 flex items-center gap-1">
                        <Clock className="w-2.5 h-2.5" />
                        {formattedTime} WIB
                      </div>
                    </td>

                    <td className="py-3 px-4 text-slate-800 font-medium whitespace-nowrap">
                      <div className="flex items-center gap-1.5">
                        <div className="w-6 h-6 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 text-[10px]">
                          <User className="w-3.5 h-3.5" />
                        </div>
                        <span className="truncate max-w-[140px]" title={log.user}>
                          {log.user}
                        </span>
                      </div>
                    </td>

                    <td className="py-3 px-4 whitespace-nowrap">
                      <span
                        className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider ${
                          log.category === 'auth'
                            ? 'bg-purple-100 text-purple-800'
                            : log.category === 'order'
                            ? 'bg-blue-100 text-blue-800'
                            : log.category === 'profile'
                            ? 'bg-amber-100 text-amber-800'
                            : log.category === 'print'
                            ? 'bg-cyan-100 text-cyan-800'
                            : log.category === 'sheets'
                            ? 'bg-emerald-100 text-emerald-800'
                            : log.category === 'backup'
                            ? 'bg-indigo-100 text-indigo-800'
                            : 'bg-slate-100 text-slate-700'
                        }`}
                      >
                        {log.category}
                      </span>
                    </td>

                    <td className="py-3 px-4 font-semibold text-slate-900 whitespace-nowrap">
                      {log.action}
                    </td>

                    <td className="py-3 px-4 text-slate-600 max-w-xs md:max-w-md truncate" title={log.details}>
                      {log.details}
                      {log.metadata && (
                        <span className="ml-2 font-mono text-[10px] text-cyan-700 bg-cyan-50 px-1.5 py-0.5 rounded">
                          {JSON.stringify(log.metadata)}
                        </span>
                      )}
                    </td>

                    <td className="py-3 px-4 text-center whitespace-nowrap">
                      {log.status === 'success' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full">
                          <CheckCircle2 className="w-3 h-3" />
                          Sukses
                        </span>
                      ) : log.status === 'error' ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-red-700 bg-red-50 px-2 py-0.5 rounded-full">
                          <AlertTriangle className="w-3 h-3" />
                          Gagal
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-full">
                          <Info className="w-3 h-3" />
                          Info
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Footer Info */}
      <div className="p-4 bg-slate-50 border-t border-slate-200 text-xs text-slate-500 flex justify-between items-center">
        <span>Menampilkan {filteredLogs.length} dari {logs.length} catatan aktivitas sistem</span>
        <span className="text-[11px] font-mono text-slate-400">Penyimpanan: Cloud Firestore + Local Cache + Google Sheets</span>
      </div>
    </div>
  );
};
