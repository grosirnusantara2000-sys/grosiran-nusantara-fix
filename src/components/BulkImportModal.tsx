import React, { useState } from 'react';
import {
  X,
  Upload,
  FileSpreadsheet,
  Download,
  AlertCircle,
  CheckCircle2,
  FileText,
  Copy,
  Check,
} from 'lucide-react';
import { Product, OutletId } from '../types';
import { saveMultipleProducts } from '../services/dataService';

interface BulkImportModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  currentOutlet: OutletId;
  categories: { id: string; name: string }[];
}

export const BulkImportModal: React.FC<BulkImportModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
  currentOutlet,
  categories,
}) => {
  const [activeTab, setActiveTab] = useState<'upload' | 'paste' | 'template'>('upload');
  const [pastedText, setPastedText] = useState('');
  const [parsedProducts, setParsedProducts] = useState<Product[]>([]);
  const [isProcessing, setIsProcessing] = useState(false);
  const [copiedTemplate, setCopiedTemplate] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isOpen) return null;

  const sampleCsvContent = `Nama Produk,Kategori,Harga Grosir,Harga Eceran,Min Order,Satuan,Warna,Ukuran,URL Foto,Deskripsi,Tanyakan Admin
Gamis Syari Premium Ceruty,Gamis & Busana Muslim,145000,185000,3,pcs,Hitam;Navy;Mocca,All Size;XL;XXL,https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b,Bahan ceruty babydoll premium lapis furing,TIDAK
Mukena Sutra Bordir Padang,Mukena & Perlengkapan Sholat,180000,230000,2,pcs,Putih;Milo;Bw,Dewasa Jumbo,https://images.unsplash.com/photo-1590736969955-71cc94801759,Mukena sutra silk bordir tangan khas Aur Kuning,TIDAK
Kemeja Flanel Katun Pria,Pakaian Pria,0,0,6,lusin,Merah;Biru;Hijau,M;L;XL;XXL,,Kemeja flanel katun halus harga nego langsung admin,YA`;

  const handleCopyTemplate = () => {
    navigator.clipboard.writeText(sampleCsvContent);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2500);
  };

  const handleDownloadTemplate = () => {
    const blob = new Blob([sampleCsvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'template_import_produk_grosir_nusantara.csv');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Helper to parse CSV rows handling quotes and semicolons/commas
  const parseCsvText = (text: string): Product[] => {
    const lines = text.split(/\r?\n/).filter((l) => l.trim().length > 0);
    if (lines.length < 2) {
      throw new Error('Format CSV tidak valid atau data masih kosong (harus berisi baris header dan minimal 1 produk).');
    }

    // Determine separator: comma or semicolon or tab
    const firstLine = lines[0];
    const sep = firstLine.includes(';') ? ';' : firstLine.includes('\t') ? '\t' : ',';

    const headerParts = firstLine.split(sep).map((h) => h.replace(/^["']|["']$/g, '').trim().toLowerCase());
    
    const results: Product[] = [];
    const timestamp = Date.now();

    for (let i = 1; i < lines.length; i++) {
      const line = lines[i].trim();
      if (!line) continue;

      // Simple regex for quoted/unquoted split
      const regex = new RegExp(`(?:^|${sep})(\"(?:[^\"]+|\"\")*\"|[^${sep}]*)`, 'g');
      const rowCols: string[] = [];
      let match;
      while ((match = regex.exec(line)) !== null) {
        let col = match[1] || '';
        if (col.startsWith('"') && col.endsWith('"')) {
          col = col.slice(1, -1).replace(/""/g, '"');
        }
        rowCols.push(col.trim());
      }

      if (rowCols.length < 2) continue;

      const getColVal = (keys: string[]): string => {
        for (const k of keys) {
          const idx = headerParts.findIndex((h) => h.includes(k));
          if (idx !== -1 && rowCols[idx]) return rowCols[idx];
        }
        return '';
      };

      const name = getColVal(['nama produk', 'nama', 'name', 'title']) || rowCols[0];
      if (!name) continue;

      const categoryName = getColVal(['kategori', 'category']) || 'Fashion & Busana Muslim';
      // Find matching category ID or create slug
      const matchedCat = categories.find(
        (c) => c.name.toLowerCase() === categoryName.toLowerCase() || c.id.toLowerCase() === categoryName.toLowerCase()
      );
      const categoryId = matchedCat ? matchedCat.id : 'cat-fashion';

      const wholesaleRaw = getColVal(['harga grosir', 'grosir', 'wholesale']);
      const wholesalePrice = parseFloat(wholesaleRaw.replace(/[^\d.-]/g, '')) || 0;

      const retailRaw = getColVal(['harga eceran', 'eceran', 'retail', 'harga ecer']);
      const retailPrice = parseFloat(retailRaw.replace(/[^\d.-]/g, '')) || (wholesalePrice > 0 ? Math.round(wholesalePrice * 1.25) : 0);

      const minOrderRaw = getColVal(['min order', 'minimal', 'min']);
      const minOrder = parseInt(minOrderRaw.replace(/[^\d]/g, ''), 10) || 1;

      const unit = getColVal(['satuan', 'unit']) || 'pcs';

      const colorsRaw = getColVal(['warna', 'color', 'colours']);
      const colors = colorsRaw
        ? colorsRaw.split(/[,;|]/).map((w) => w.trim()).filter(Boolean)
        : [];

      const sizesRaw = getColVal(['ukuran', 'size', 'sizes']);
      const sizes = sizesRaw
        ? sizesRaw.split(/[,;|]/).map((u) => u.trim()).filter(Boolean)
        : [];

      const imageUrl = getColVal(['url foto', 'foto', 'image', 'gambar']) || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b';

      const description = getColVal(['deskripsi', 'description', 'keterangan']) || `Produk grosir original pilihan langsung dari sentra ${currentOutlet === 'AUR_KUNING' ? 'Pasar Aur Kuning Bukittinggi' : 'Pasar Tanah Abang Jakarta'}.`;

      const askAdminVal = getColVal(['tanyakan admin', 'ask admin', 'tanya admin', 'harga fleksibel']).toLowerCase();
      const askAdminPrice = askAdminVal === 'ya' || askAdminVal === 'true' || askAdminVal === '1' || wholesalePrice <= 0;

      const newProd: Product = {
        id: `prod-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 4)}`,
        name,
        categoryId,
        categoryName: matchedCat ? matchedCat.name : categoryName,
        price: retailPrice || wholesalePrice,
        outletId: currentOutlet,
        wholesalePrice,
        retailPrice,
        minOrder,
        unit,
        description,
        imageUrl,
        images: [imageUrl],
        colors: colors.length > 0 ? colors : ['Pilihan Standar'],
        sizes: sizes.length > 0 ? sizes : ['All Size'],
        inStock: true,
        estimatedShoppingDay: 'Hari Pasar',
        createdAt: new Date().toISOString(),
        featured: false,
        askAdminPrice,
      };

      results.push(newProd);
    }

    return results;
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    setErrorMsg(null);
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result as string;
        if (file.name.endsWith('.json')) {
          const parsed = JSON.parse(text);
          if (Array.isArray(parsed)) {
            const list: Product[] = parsed.map((item, idx) => {
              const catId = item.categoryId || item.category || 'cat-fashion';
              const matchedCat = categories.find((c) => c.id === catId || c.name === item.categoryName);
              const wholesalePrice = Number(item.wholesalePrice) || 0;
              const retailPrice = Number(item.retailPrice) || 0;

              return {
                id: item.id || `prod-import-${Date.now()}-${idx}`,
                name: item.name || 'Produk Baru',
                categoryId: catId,
                categoryName: item.categoryName || matchedCat?.name || 'Grosir Nusantara',
                price: retailPrice || wholesalePrice,
                outletId: item.outletId || currentOutlet,
                wholesalePrice,
                retailPrice,
                minOrder: Number(item.minOrder) || 1,
                unit: item.unit || 'pcs',
                description: item.description || '',
                imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b',
                images: Array.isArray(item.images) && item.images.length > 0 ? item.images : [item.imageUrl || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b'],
                colors: Array.isArray(item.colors) ? item.colors : ['Pilihan Standar'],
                sizes: Array.isArray(item.sizes) ? item.sizes : ['All Size'],
                inStock: item.inStock !== false,
                estimatedShoppingDay: item.estimatedShoppingDay || 'Hari Pasar',
                createdAt: item.createdAt || new Date().toISOString(),
                askAdminPrice: !!item.askAdminPrice || wholesalePrice <= 0,
                customVariants: item.customVariants || [],
              };
            });
            setParsedProducts(list);
          } else {
            throw new Error('File JSON harus berupa Array daftar produk ([{...}, {...}])');
          }
        } else {
          const list = parseCsvText(text);
          setParsedProducts(list);
        }
      } catch (err: any) {
        setErrorMsg(err.message || 'Gagal membaca file data. Pastikan format file sesuai panduan.');
      }
    };
    reader.readAsText(file);
  };

  const handleProcessPastedText = () => {
    setErrorMsg(null);
    if (!pastedText.trim()) {
      setErrorMsg('Harap tempel (paste) data CSV atau JSON terlebih dahulu.');
      return;
    }

    try {
      if (pastedText.trim().startsWith('[') && pastedText.trim().endsWith(']')) {
        const parsed = JSON.parse(pastedText.trim());
        const list: Product[] = parsed.map((item: any, idx: number) => {
          const catId = item.categoryId || item.category || 'cat-fashion';
          const matchedCat = categories.find((c) => c.id === catId || c.name === item.categoryName);
          const wholesalePrice = Number(item.wholesalePrice) || 0;
          const retailPrice = Number(item.retailPrice) || 0;

          return {
            id: item.id || `prod-import-${Date.now()}-${idx}`,
            name: item.name || 'Produk Baru',
            categoryId: catId,
            categoryName: item.categoryName || matchedCat?.name || 'Grosir Nusantara',
            price: retailPrice || wholesalePrice,
            outletId: item.outletId || currentOutlet,
            wholesalePrice,
            retailPrice,
            minOrder: Number(item.minOrder) || 1,
            unit: item.unit || 'pcs',
            description: item.description || '',
            imageUrl: item.imageUrl || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b',
            images: Array.isArray(item.images) && item.images.length > 0 ? item.images : [item.imageUrl || 'https://images.unsplash.com/photo-1583391733956-3750e0ff4e8b'],
            colors: Array.isArray(item.colors) ? item.colors : ['Pilihan Standar'],
            sizes: Array.isArray(item.sizes) ? item.sizes : ['All Size'],
            inStock: item.inStock !== false,
            estimatedShoppingDay: item.estimatedShoppingDay || 'Hari Pasar',
            createdAt: item.createdAt || new Date().toISOString(),
            askAdminPrice: !!item.askAdminPrice || wholesalePrice <= 0,
            customVariants: item.customVariants || [],
          };
        });
        setParsedProducts(list);
      } else {
        const list = parseCsvText(pastedText);
        setParsedProducts(list);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Format teks CSV / JSON tidak dapat dibaca.');
    }
  };

  const handleExecuteImport = async () => {
    if (parsedProducts.length === 0) return;
    setIsProcessing(true);
    setErrorMsg(null);

    try {
      await saveMultipleProducts(parsedProducts);
      onSuccess();
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Terjadi kendala saat menyimpan produk ke database.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/75 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl border border-slate-300 w-full max-w-4xl max-h-[92vh] flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="px-6 py-5 bg-gradient-to-r from-slate-900 via-slate-850 to-slate-950 text-white flex items-center justify-between border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400">
              <FileSpreadsheet className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white tracking-tight">
                Impor Produk Massal (Bulk Import)
              </h3>
              <p className="text-xs text-slate-300">
                Tambah puluhan atau ratusan produk sekaligus via file CSV / Excel / JSON
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-xl text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center border-b border-slate-200 bg-slate-50 px-6 gap-2 pt-3">
          <button
            type="button"
            onClick={() => setActiveTab('upload')}
            className={`px-4 py-2.5 font-bold text-sm rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'upload'
                ? 'bg-white text-slate-950 border-amber-500 shadow-sm'
                : 'text-slate-600 border-transparent hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <Upload className="w-4 h-4" />
            Unggah File (CSV / JSON)
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('paste')}
            className={`px-4 py-2.5 font-bold text-sm rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'paste'
                ? 'bg-white text-slate-950 border-amber-500 shadow-sm'
                : 'text-slate-600 border-transparent hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <FileText className="w-4 h-4" />
            Tempel Teks Manual
          </button>
          <button
            type="button"
            onClick={() => setActiveTab('template')}
            className={`px-4 py-2.5 font-bold text-sm rounded-t-xl transition-all border-b-2 flex items-center gap-2 ${
              activeTab === 'template'
                ? 'bg-white text-slate-950 border-amber-500 shadow-sm'
                : 'text-slate-600 border-transparent hover:text-slate-950 hover:bg-slate-100'
            }`}
          >
            <Download className="w-4 h-4" />
            Download / Salin Template CSV
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto flex-1 space-y-5">
          {errorMsg && (
            <div className="p-4 rounded-xl bg-rose-50 border border-rose-300 text-rose-900 text-sm flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-bold text-slate-950">Terjadi Kesalahan Impor:</p>
                <p className="text-slate-900 font-medium">{errorMsg}</p>
              </div>
            </div>
          )}

          {activeTab === 'upload' && (
            <div className="space-y-4">
              <div className="border-2 border-dashed border-slate-300 hover:border-amber-500 rounded-2xl p-8 text-center bg-slate-50 hover:bg-amber-50/20 transition-all cursor-pointer relative group">
                <input
                  type="file"
                  accept=".csv, .json, text/csv, application/json"
                  onChange={handleFileUpload}
                  className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                />
                <div className="w-14 h-14 mx-auto rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                  <Upload className="w-7 h-7" />
                </div>
                <p className="text-base font-bold text-slate-950">
                  Pilih atau Tarik File CSV / JSON ke Sini
                </p>
                <p className="text-xs text-slate-700 font-semibold mt-1">
                  Mendukung file spreadsheet .csv hasil ekspor Excel / Google Sheets atau format .json
                </p>
              </div>

              <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl text-xs space-y-1">
                <p className="font-bold text-slate-950">Petunjuk Penting Kolom CSV:</p>
                <p className="text-slate-800">
                  • Kolom Wajib: <b className="text-slate-950">Nama Produk</b>
                </p>
                <p className="text-slate-800">
                  • Kolom Harga Fleksibel: Kosongkan harga atau isi 0 pada kolom <b className="text-slate-950">Harga Grosir</b> atau isi "YA" pada kolom <b className="text-slate-950">Tanyakan Admin</b> agar muncul sebagai <span className="font-bold text-amber-800">"Tanyakan Admin"</span> di katalog.
                </p>
                <p className="text-slate-800">
                  • Kolom Varian: Pisahkan warna & ukuran dengan titik koma (;), contoh: <code className="bg-white px-1.5 py-0.5 rounded border border-blue-200 text-slate-950 font-bold">Hitam;Navy;Mocca</code>
                </p>
              </div>
            </div>
          )}

          {activeTab === 'paste' && (
            <div className="space-y-3">
              <label className="block text-sm font-bold text-slate-950">
                Tempelkan Teks CSV atau JSON Produk:
              </label>
              <textarea
                value={pastedText}
                onChange={(e) => setPastedText(e.target.value)}
                placeholder="Nama Produk,Kategori,Harga Grosir,Harga Eceran,Min Order,Satuan,Warna,Ukuran,URL Foto,Deskripsi,Tanyakan Admin..."
                rows={7}
                className="w-full p-3.5 border border-slate-300 rounded-xl font-mono text-xs text-slate-950 focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
              />
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={handleProcessPastedText}
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-950 text-white font-bold text-xs rounded-xl shadow transition-colors flex items-center gap-2"
                >
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                  Pratinjau & Periksa Data Teks
                </button>
              </div>
            </div>
          )}

          {activeTab === 'template' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="font-bold text-sm text-slate-950">Template Format CSV Grosir Nusantara</h4>
                  <p className="text-xs text-slate-700 font-medium">
                    Gunakan format ini sebagai acuan file Excel / Spreadsheet Anda sebelum diimpor.
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={handleCopyTemplate}
                    className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 border border-slate-300 rounded-lg text-xs font-bold text-slate-900 flex items-center gap-1.5 transition-colors"
                  >
                    {copiedTemplate ? <Check className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4 text-slate-700" />}
                    {copiedTemplate ? 'Tersalin!' : 'Salin Contoh'}
                  </button>
                  <button
                    type="button"
                    onClick={handleDownloadTemplate}
                    className="px-3.5 py-1.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-lg text-xs font-bold flex items-center gap-1.5 shadow-sm transition-colors"
                  >
                    <Download className="w-4 h-4" />
                    Download File .CSV
                  </button>
                </div>
              </div>

              <div className="bg-slate-900 text-amber-200 p-4 rounded-xl overflow-x-auto text-xs font-mono border border-slate-800 leading-relaxed max-h-56">
                <pre>{sampleCsvContent}</pre>
              </div>
            </div>
          )}

          {/* Parsed Preview Table */}
          {parsedProducts.length > 0 && (
            <div className="space-y-3 pt-3 border-t border-slate-200">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="w-3 h-3 rounded-full bg-emerald-500 animate-pulse" />
                  <h4 className="font-bold text-sm text-slate-950">
                    Pratinjau Data Siap Diimpor ({parsedProducts.length} Produk Terdeteksi)
                  </h4>
                </div>
                <button
                  type="button"
                  onClick={() => setParsedProducts([])}
                  className="text-xs font-bold text-rose-600 hover:underline"
                >
                  Hapus / Reset Pratinjau
                </button>
              </div>

              <div className="border border-slate-300 rounded-xl overflow-hidden max-h-60 overflow-y-auto">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-slate-100 sticky top-0 text-slate-950 font-bold border-b border-slate-300">
                    <tr>
                      <th className="p-2.5">No</th>
                      <th className="p-2.5">Nama Produk</th>
                      <th className="p-2.5">Kategori</th>
                      <th className="p-2.5 text-right">Harga Grosir</th>
                      <th className="p-2.5 text-center">Min Order</th>
                      <th className="p-2.5">Varian Terbaca</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-200 text-slate-900 font-medium">
                    {parsedProducts.map((p, idx) => (
                      <tr key={idx} className="hover:bg-amber-50/40">
                        <td className="p-2.5 text-slate-600 font-bold">{idx + 1}</td>
                        <td className="p-2.5 font-bold text-slate-950">{p.name}</td>
                        <td className="p-2.5 text-slate-800">{p.categoryName || p.categoryId}</td>
                        <td className="p-2.5 text-right">
                          {p.askAdminPrice || p.wholesalePrice <= 0 ? (
                            <span className="inline-block px-2 py-0.5 bg-amber-100 text-amber-900 rounded font-bold text-[11px] border border-amber-300">
                              Tanyakan Admin
                            </span>
                          ) : (
                            <span className="font-bold text-slate-950">
                              Rp {p.wholesalePrice.toLocaleString('id-ID')}
                            </span>
                          )}
                        </td>
                        <td className="p-2.5 text-center font-bold text-slate-900">
                          {p.minOrder} {p.unit}
                        </td>
                        <td className="p-2.5 text-slate-700">
                          {(p.colors || []).slice(0, 3).join(', ')}{' '}
                          {p.sizes && p.sizes.length > 0 && `| ${p.sizes.slice(0, 2).join(', ')}`}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 bg-slate-100 border-t border-slate-300 flex items-center justify-between">
          <p className="text-xs text-slate-700 font-semibold">
            {parsedProducts.length > 0
              ? `${parsedProducts.length} produk siap dimasukkan ke etalase outlet aktif.`
              : 'Silakan pilih file atau tempel teks data produk untuk memulai.'}
          </p>
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={onClose}
              disabled={isProcessing}
              className="px-4 py-2 text-xs font-bold text-slate-800 hover:text-slate-950 hover:bg-slate-200 rounded-xl transition-colors"
            >
              Batal
            </button>
            <button
              type="button"
              onClick={handleExecuteImport}
              disabled={parsedProducts.length === 0 || isProcessing}
              className={`px-5 py-2.5 rounded-xl font-bold text-xs flex items-center gap-2 shadow-sm transition-all ${
                parsedProducts.length > 0 && !isProcessing
                  ? 'bg-amber-500 hover:bg-amber-600 text-slate-950 cursor-pointer shadow-amber-500/20'
                  : 'bg-slate-300 text-slate-500 cursor-not-allowed'
              }`}
            >
              {isProcessing ? (
                <>
                  <div className="w-4 h-4 border-2 border-slate-950 border-t-transparent rounded-full animate-spin" />
                  <span>Menyimpan ke Database...</span>
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4" />
                  <span>Impor Semua ({parsedProducts.length} Produk)</span>
                </>
              )}
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
