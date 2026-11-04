import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import { saveProduct } from '../services/dataService';
import { Product } from '../types';
import { X, Tag, Save, MessageCircle } from 'lucide-react';

export const QuickPriceEditModal: React.FC = () => {
  const { quickPriceEditProduct, setQuickPriceEditProduct, showToast, triggerRefresh } = useApp();

  const [askAdminPrice, setAskAdminPrice] = useState(false);
  const [wholesalePrice, setWholesalePrice] = useState(0);
  const [retailPrice, setRetailPrice] = useState(0);
  const [inStock, setInStock] = useState(true);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    if (quickPriceEditProduct) {
      const isAskAdmin = !!quickPriceEditProduct.askAdminPrice || quickPriceEditProduct.wholesalePrice <= 0;
      setAskAdminPrice(isAskAdmin);
      setWholesalePrice(isAskAdmin ? 0 : quickPriceEditProduct.wholesalePrice);
      setRetailPrice(quickPriceEditProduct.price || quickPriceEditProduct.retailPrice || 0);
      setInStock(quickPriceEditProduct.inStock);
    }
  }, [quickPriceEditProduct]);

  if (!quickPriceEditProduct) return null;

  const formatRupiah = (num: number) => 'Rp ' + (num || 0).toLocaleString('id-ID');

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!askAdminPrice && wholesalePrice <= 0) {
      showToast('Harga grosir harus lebih dari 0 atau aktifkan "Tanyakan Admin"', 'error');
      return;
    }

    setIsSaving(true);
    try {
      const updatedProd: Product = {
        ...quickPriceEditProduct,
        askAdminPrice,
        wholesalePrice: askAdminPrice ? 0 : wholesalePrice,
        price: retailPrice || wholesalePrice,
        retailPrice,
        inStock,
      };

      await saveProduct(updatedProd);
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
    setWholesalePrice((prev) => Math.max(0, prev + delta));
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl relative border-2 border-slate-300 animate-in fade-in zoom-in-95 duration-150">
        <button
          onClick={() => setQuickPriceEditProduct(null)}
          className="absolute top-4 right-4 p-1.5 rounded-full hover:bg-slate-100 text-slate-800 hover:text-black cursor-pointer"
        >
          <X className="w-5 h-5 text-slate-950" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-2 text-xs font-black text-amber-800 uppercase tracking-wider mb-1">
          <Tag className="w-4 h-4 text-amber-600" />
          <span>Mode Owner · Ubah Harga Cepat</span>
        </div>
        <h3 className="text-base font-black text-slate-950 leading-snug">
          {quickPriceEditProduct.name}
        </h3>
        <p className="text-xs text-slate-900 font-bold mb-4">
          Kategori: {quickPriceEditProduct.categoryName} · Satuan: {quickPriceEditProduct.unit}
        </p>

        <form onSubmit={handleSave} className="space-y-4 text-xs">
          
          {/* Tanyakan Admin Toggle */}
          <div className="p-3 bg-amber-50 rounded-xl border border-amber-300 flex items-center justify-between">
            <div>
              <span className="font-black text-slate-950 block text-xs">Opsi Fleksibel: "Tanyakan Admin"</span>
              <span className="text-[11px] text-slate-800 font-bold">
                Tampilkan teks "Tanyakan Admin" di katalog tanpa nominal angka
              </span>
            </div>
            <input
              type="checkbox"
              checked={askAdminPrice}
              onChange={(e) => {
                setAskAdminPrice(e.target.checked);
                if (e.target.checked) setWholesalePrice(0);
                else if (wholesalePrice === 0) setWholesalePrice(35000);
              }}
              className="w-5 h-5 rounded text-amber-600 accent-amber-600 cursor-pointer"
            />
          </div>

          {!askAdminPrice && (
            <>
              {/* Wholesale Price Field */}
              <div className="p-3.5 bg-slate-50 rounded-xl border-2 border-slate-300">
                <label className="block font-black text-slate-950 mb-1">
                  Harga Grosir Lapak (Rp) <span className="text-red-600">*</span>
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-slate-900 font-bold">Rp</span>
                  <input
                    type="number"
                    step="500"
                    required
                    value={wholesalePrice}
                    onChange={(e) => setWholesalePrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-400 rounded-lg font-mono font-black text-base text-slate-950 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
                {/* Quick Adjustment Buttons */}
                <div className="flex flex-wrap gap-1.5">
                  <button
                    type="button"
                    onClick={() => adjustWholesale(-5000)}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded text-[11px] text-slate-950 font-bold hover:bg-slate-100 shadow-2xs"
                  >
                    -5.000
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustWholesale(-1000)}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded text-[11px] text-slate-950 font-bold hover:bg-slate-100 shadow-2xs"
                  >
                    -1.000
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustWholesale(1000)}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded text-[11px] text-slate-950 font-bold hover:bg-slate-100 shadow-2xs"
                  >
                    +1.000
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustWholesale(5000)}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded text-[11px] text-slate-950 font-bold hover:bg-slate-100 shadow-2xs"
                  >
                    +5.000
                  </button>
                  <button
                    type="button"
                    onClick={() => adjustWholesale(10000)}
                    className="px-2.5 py-1 bg-white border border-slate-300 rounded text-[11px] text-slate-950 font-bold hover:bg-slate-100 shadow-2xs"
                  >
                    +10.000
                  </button>
                </div>
              </div>

              {/* Retail Price Field */}
              <div className="p-3.5 bg-slate-50 rounded-xl border-2 border-slate-300">
                <label className="block font-black text-slate-950 mb-1">
                  Harga Eceran Patokan per {quickPriceEditProduct.unit}
                </label>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-slate-900 font-bold">Rp</span>
                  <input
                    type="number"
                    step="500"
                    value={retailPrice}
                    onChange={(e) => setRetailPrice(Number(e.target.value))}
                    className="w-full px-3 py-2 bg-white border border-slate-400 rounded-lg font-mono font-black text-base text-emerald-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
                  />
                </div>
              </div>
            </>
          )}

          {/* Stock Status Toggle */}
          <div className="flex items-center justify-between p-3.5 bg-slate-50 rounded-xl border-2 border-slate-300">
            <div>
              <span className="font-black text-slate-950 block">Ketersediaan Stok di Lapak</span>
              <span className="text-[11px] text-slate-800 font-bold">
                {inStock ? 'Barang ready dibeli langsung' : 'Stok sedang kosong di sentra pasar'}
              </span>
            </div>
            <button
              type="button"
              onClick={() => setInStock(!inStock)}
              className={`px-3 py-1.5 rounded-lg text-xs font-black transition-colors cursor-pointer border shadow-2xs ${
                inStock
                  ? 'bg-emerald-100 text-emerald-950 border-emerald-300'
                  : 'bg-rose-100 text-rose-950 border-rose-300'
              }`}
            >
              {inStock ? '● Ready Lapak' : '✕ Kosong'}
            </button>
          </div>

          {/* Live Preview Strip */}
          <div className="p-3 bg-amber-50 border border-amber-300 rounded-xl flex items-center justify-between text-xs">
            <div>
              <span className="text-slate-950 font-black block">Tampilan Harga di Sisi Pembeli:</span>
              <span className="text-[11px] text-slate-800 font-bold">Harga per {quickPriceEditProduct.unit}</span>
            </div>
            <div className="text-right">
              {askAdminPrice ? (
                <span className="inline-block px-2.5 py-1 bg-amber-300 text-slate-950 border border-amber-500 rounded-lg font-black text-xs">
                  Tanyakan Admin
                </span>
              ) : (
                <div className="text-base font-black font-mono text-slate-950">
                  {formatRupiah(wholesalePrice)}
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setQuickPriceEditProduct(null)}
              className="px-4 py-2 text-slate-800 font-black hover:bg-slate-100 rounded-xl cursor-pointer"
            >
              Batal
            </button>
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2.5 bg-amber-500 hover:bg-amber-600 text-slate-950 rounded-xl font-black flex items-center gap-1.5 cursor-pointer shadow-sm disabled:opacity-50 transition-colors"
            >
              <Save className="w-4 h-4" />
              <span>{isSaving ? 'Menyimpan...' : 'Simpan Perubahan'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
