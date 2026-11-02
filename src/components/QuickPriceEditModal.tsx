import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { quickUpdateProductPrice, toggleProductStock } from '../services/dataService';
import { Product } from '../types';
import { X, Tag, Save, CheckCircle, Store, DollarSign } from 'lucide-react';

export const QuickPriceEditModal: React.FC = () => {
  const { quickPriceEditProduct, setQuickPriceEditProduct, showToast, triggerRefresh } = useApp();

  const [wholesalePrice, setWholesalePrice] = useState(0);
  const [retailPrice, setRetailPrice] = useState(0);
  const [inStock, setInStock] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (quickPriceEditProduct) {
      setWholesalePrice(quickPriceEditProduct.wholesalePrice);
      setRetailPrice(quickPriceEditProduct.price);
      setInStock(quickPriceEditProduct.inStock);
    }
  }, [quickPriceEditProduct]);

  if (!quickPriceEditProduct) return null;

  const formatRupiah = (num: number) => 'Rp ' + (num || 0).toLocaleString('id-ID');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (wholesalePrice <= 0) {
      showToast('Harga grosir harus lebih dari 0', 'error');
      return;
    }

    setIsSaving(true);
    try {
      await quickUpdateProductPrice(
        quickPriceEditProduct.id,
        wholesalePrice,
        0,
        retailPrice
      );
      if (inStock !== quickPriceEditProduct.inStock) {
        await toggleProductStock(quickPriceEditProduct.id, inStock);
      }
      showToast(`Harga "${quickPriceEditProduct.name}" berhasil diperbarui!`, 'success');
      setQuickPriceEditProduct(null);
      triggerRefresh();
    } catch (err: any) {
      showToast('Gagal update harga: ' + err.message, 'error');
    } finally {
      setIsSaving(false);
    }
  };

  const adjustWholesale = (delta: number) => {
    setWholesalePrice((prev) => Math.max(1000, prev + delta));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border border-slate-200">
        <button
          onClick={() => setQuickPriceEditProduct(null)}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-400 hover:text-slate-700 cursor-pointer"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 text-xs font-bold text-orange-600 uppercase tracking-wider mb-1">
          <Tag className="w-4 h-4" />
          <span>Mode Owner · Ubah Harga Cepat</span>
        </div>
        <h3 className="text-base font-extrabold text-slate-900 leading-snug">
          {quickPriceEditProduct.name}
        </h3>
        <p className="text-xs text-slate-500 mb-4">
          Kategori: {quickPriceEditProduct.categoryName} · Satuan: {quickPriceEditProduct.unit}
        </p>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          {/* Wholesale Price Field */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block font-bold text-slate-800 mb-1">
              Harga Grosir Lapak (Modal Pasar Aur Kuning)
            </label>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-slate-500 font-semibold">Rp</span>
              <input
                type="number"
                step="500"
                required
                value={wholesalePrice}
                onChange={(e) => setWholesalePrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono-nums font-bold text-base text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
            {/* Quick Adjustment Buttons */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => adjustWholesale(-5000)}
                className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] text-slate-700 hover:bg-slate-100"
              >
                -5.000
              </button>
              <button
                type="button"
                onClick={() => adjustWholesale(-1000)}
                className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] text-slate-700 hover:bg-slate-100"
              >
                -1.000
              </button>
              <button
                type="button"
                onClick={() => adjustWholesale(1000)}
                className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] text-slate-700 hover:bg-slate-100 font-semibold"
              >
                +1.000
              </button>
              <button
                type="button"
                onClick={() => adjustWholesale(5000)}
                className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] text-slate-700 hover:bg-slate-100 font-semibold"
              >
                +5.000
              </button>
              <button
                type="button"
                onClick={() => adjustWholesale(10000)}
                className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] text-slate-700 hover:bg-slate-100 font-semibold"
              >
                +10.000
              </button>
            </div>
          </div>

          {/* Retail Price Field */}
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-200">
            <label className="block font-bold text-slate-800 mb-1">
              Harga Eceran Toko (Patokan Eceran) per {quickPriceEditProduct.unit}
            </label>
            <div className="flex items-center gap-2 mb-2">
              <span className="text-slate-500 font-semibold">Rp</span>
              <input
                type="number"
                step="500"
                required
                value={retailPrice}
                onChange={(e) => setRetailPrice(Number(e.target.value))}
                className="w-full px-3 py-2 bg-white border border-slate-300 rounded-lg font-mono-nums font-bold text-base text-emerald-700 focus:outline-none focus:ring-2 focus:ring-blue-900"
              />
            </div>
            <div className="flex gap-1.5">
              <button
                type="button"
                onClick={() => setRetailPrice((prev) => Math.max(1000, prev - 5000))}
                className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] text-slate-700 hover:bg-slate-100"
              >
                -5.000
              </button>
              <button
                type="button"
                onClick={() => setRetailPrice((prev) => prev + 5000)}
                className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] text-slate-700 hover:bg-slate-100 font-semibold"
              >
                +5.000
              </button>
              <button
                type="button"
                onClick={() => setRetailPrice((prev) => prev + 10000)}
                className="px-2 py-1 bg-white border border-slate-200 rounded text-[11px] text-slate-700 hover:bg-slate-100 font-semibold"
              >
                +10.000
              </button>
            </div>
          </div>

          {/* Stock Status Toggle */}
          <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-200">
            <div>
              <span className="font-bold text-slate-800 block">Ketersediaan di Sentra Grosir</span>
              <span className="text-[11px] text-slate-500">
                {inStock ? 'Barang ready dibeli langsung' : 'Stok sedang kosong di sentra pasar'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setInStock(!inStock)}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-colors cursor-pointer ${
                inStock ? 'bg-emerald-600 text-white' : 'bg-red-600 text-white'
              }`}
            >
              {inStock ? 'Ready Stok' : 'Kosong'}
            </button>
          </div>

          {/* Live Preview Strip */}
          <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-600 block">Harga Grosir Ditampilkan ke Pelanggan:</span>
              <span className="text-[11px] text-slate-500">Harga tangan pertama per {quickPriceEditProduct.unit}</span>
            </div>
            <div className="text-right">
              <div className="text-base font-extrabold font-mono-nums text-blue-900">
                {formatRupiah(wholesalePrice)}
              </div>
              <span className="text-[10px] text-slate-500">per {quickPriceEditProduct.unit}</span>
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setQuickPriceEditProduct(null)}
              className="px-4 py-2 text-slate-600 hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-blue-900 hover:bg-blue-800 text-white rounded-xl font-bold flex items-center gap-1.5 cursor-pointer shadow-xs disabled:opacity-50"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan Harga'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
