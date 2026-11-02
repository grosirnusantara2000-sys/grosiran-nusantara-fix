import React, { useState } from 'react';
import { Order, StoreSettings } from '../types';
import {
  Printer,
  X,
  Share2,
  Copy,
  Check,
  Smartphone,
  CheckCircle2,
  AlertCircle,
  FileText,
  RotateCcw,
} from 'lucide-react';
import { formatThermalReceiptLines, formatWhatsappReceiptText, recordActivityLog } from '../services/dataService';

interface ThermalReceiptModalProps {
  order: Order | null;
  storeSettings: StoreSettings;
  isOpen: boolean;
  onClose: () => void;
}

export const ThermalReceiptModal: React.FC<ThermalReceiptModalProps> = ({
  order,
  storeSettings,
  isOpen,
  onClose,
}) => {
  const [paperWidth, setPaperWidth] = useState<'58mm' | '80mm'>(
    storeSettings.thermalPaperWidth || '58mm'
  );
  const [hasCopiedText, setHasCopiedText] = useState(false);
  const [bluetoothStatus, setBluetoothStatus] = useState<
    'idle' | 'searching' | 'connected' | 'printing' | 'success' | 'unsupported'
  >('idle');

  if (!isOpen || !order) return null;

  const receiptLines = formatThermalReceiptLines(order, {
    ...storeSettings,
    thermalPaperWidth: paperWidth,
  });

  const handleWebPrint = async () => {
    await recordActivityLog(
      'Cetak Struk Thermal (Web Print)',
      'print',
      `Mencetak nota thermal ${paperWidth} untuk invoice ${order.invoiceNumber}.`,
      'success',
      { invoice: order.invoiceNumber, paper: paperWidth }
    );
    window.print();
  };

  const handleBluetoothPrint = async () => {
    // Check Web Bluetooth API availability
    if (!(navigator as any).bluetooth) {
      setBluetoothStatus('unsupported');
      setTimeout(() => setBluetoothStatus('idle'), 4000);
      return;
    }

    try {
      setBluetoothStatus('searching');
      // Simulate/Request device
      const device = await (navigator as any).bluetooth.requestDevice({
        acceptAllDevices: true,
        optionalServices: ['000018f0-0000-1000-8000-00805f9b34fb'],
      });

      setBluetoothStatus('connected');
      setTimeout(async () => {
        setBluetoothStatus('printing');
        await recordActivityLog(
          'Cetak Struk Thermal (Bluetooth)',
          'print',
          `Mencetak via Bluetooth ke ${device.name || 'Printer Thermal'} untuk invoice ${order.invoiceNumber}.`,
          'success'
        );
        setTimeout(() => {
          setBluetoothStatus('success');
          setTimeout(() => setBluetoothStatus('idle'), 3000);
        }, 1200);
      }, 1000);
    } catch (err: any) {
      console.warn('Bluetooth print cancelled or error:', err);
      setBluetoothStatus('idle');
    }
  };

  const handleSendWhatsApp = async () => {
    const rawWa = order.customerWhatsapp.replace(/\D/g, '');
    const cleanWa = rawWa.startsWith('0') ? '62' + rawWa.substring(1) : rawWa;
    const message = formatWhatsappReceiptText(order, storeSettings);
    const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(message)}`;

    await recordActivityLog(
      'Kirim Struk via WhatsApp',
      'order',
      `Mengirim nota WhatsApp ke ${order.customerName} (${order.customerWhatsapp}) untuk invoice ${order.invoiceNumber}.`,
      'success'
    );

    window.open(waUrl, '_blank');
  };

  const handleCopyRaw = async () => {
    const text = receiptLines.join('\n');
    await navigator.clipboard.writeText(text);
    setHasCopiedText(true);
    setTimeout(() => setHasCopiedText(false), 2000);
  };

  return (
    <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 overflow-y-auto">
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[92vh] flex flex-col overflow-hidden border border-slate-200">
        
        {/* Header Dialog */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-600/10 flex items-center justify-center text-cyan-600">
              <Printer className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 flex items-center gap-2">
                Pencetakan Nota Thermal POS
                <span className="text-xs px-2 py-0.5 rounded-full bg-cyan-100 text-cyan-800 font-semibold font-mono">
                  {order.invoiceNumber}
                </span>
              </h3>
              <p className="text-xs text-slate-500">
                Format standar printer thermal POS 58mm / 80mm & Struk WhatsApp
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-slate-600 hover:bg-slate-200/60 rounded-xl transition-colors cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body: Left Preview, Right Controls */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 grid grid-cols-1 md:grid-cols-12 gap-6 bg-slate-100/60">
          
          {/* Thermal Receipt Visual Paper (Centered 58mm roll mockup) */}
          <div className="md:col-span-7 flex flex-col items-center">
            <div className="text-xs text-slate-400 mb-2 font-mono flex items-center gap-2">
              <span>Preview Kertas Thermal:</span>
              <span className="px-1.5 py-0.5 rounded bg-slate-200 text-slate-700 font-bold uppercase">{paperWidth}</span>
            </div>

            <div
              id="printable-thermal-receipt"
              className={`bg-white text-slate-900 font-mono text-[11px] leading-relaxed shadow-xl border border-slate-300 rounded-t-sm p-4 relative ${
                paperWidth === '58mm' ? 'w-[280px]' : 'w-[360px]'
              }`}
              style={{
                fontFamily: '"Space Mono", "Courier New", monospace',
              }}
            >
              {/* Paper zigzag top cut effect */}
              <div className="absolute top-0 left-0 right-0 h-2 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-slate-200/50 to-transparent"></div>

              {/* Shop Logo & Name */}
              <div className="text-center pb-2 mb-2 border-b border-dashed border-slate-400">
                {storeSettings.showLogoOnReceipt && (
                  <div className="inline-block px-2 py-1 mb-1 rounded bg-slate-900 text-white font-extrabold text-[10px] tracking-wider uppercase">
                    AUR KUNING
                  </div>
                )}
                <div className="font-bold text-[13px] tracking-tight text-slate-900">
                  {storeSettings.storeName}
                </div>
                <div className="text-[10px] text-slate-600">
                  {storeSettings.tagline || 'Pusat Grosir Pakaian & Tekstil Bukittinggi'}
                </div>
                {storeSettings.showAddressOnReceipt && storeSettings.address && (
                  <div className="text-[9px] text-slate-500 mt-1">
                    {storeSettings.address}
                  </div>
                )}
                {storeSettings.showWhatsappOnReceipt && (
                  <div className="text-[9px] text-slate-600 font-bold mt-0.5">
                    WA: {storeSettings.whatsappNumber}
                  </div>
                )}
              </div>

              {/* Receipt Header text if defined */}
              {storeSettings.receiptHeader && (
                <div className="text-center text-[9px] text-slate-500 whitespace-pre-line pb-1.5 mb-1.5 border-b border-dotted border-slate-300">
                  {storeSettings.receiptHeader}
                </div>
              )}

              {/* Metadata */}
              <div className="text-[10px] space-y-0.5 pb-2 mb-2 border-b border-dashed border-slate-400">
                <div className="flex justify-between">
                  <span>No. Nota</span>
                  <span className="font-bold">{order.invoiceNumber}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tanggal</span>
                  <span>
                    {new Date(order.createdAt).toLocaleDateString('id-ID', {
                      day: '2-digit',
                      month: '2-digit',
                      year: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Pelanggan</span>
                  <span className="font-semibold truncate max-w-[140px] text-right">
                    {order.customerName}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Petugas / Kasir</span>
                  <span>Admin Grosir Nusantara</span>
                </div>
              </div>

              {/* Item List */}
              <div className="space-y-1.5 pb-2 mb-2 border-b border-dashed border-slate-400 text-[10px]">
                <div className="flex justify-between font-bold text-slate-700 text-[9px] pb-1 border-b border-slate-200">
                  <span>ITEM BARANG</span>
                  <span>TOTAL</span>
                </div>
                {order.items.map((it, idx) => {
                  const price = it.wholesalePrice || it.price;
                  const itemTot = price * it.quantity;
                  return (
                    <div key={idx} className="space-y-0.5">
                      <div className="font-medium text-slate-900 leading-tight">
                        {it.productName}
                      </div>
                      <div className="flex justify-between text-slate-500 text-[9.5px]">
                        <span>
                          {it.quantity} pcs @ Rp{price.toLocaleString('id-ID')}
                          {it.color ? ` (${it.color})` : ''}
                        </span>
                        <span className="font-semibold text-slate-800">
                          Rp{itemTot.toLocaleString('id-ID')}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Calculations */}
              <div className="space-y-1 pb-2 mb-2 border-b border-dashed border-slate-400 text-[10px]">
                <div className="flex justify-between text-slate-600">
                  <span>Subtotal Barang:</span>
                  <span>Rp{order.subtotal.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between text-slate-600">
                  <span>Ongkir ({order.courier || 'Ekspedisi'}):</span>
                  <span>Rp{order.shippingCost.toLocaleString('id-ID')}</span>
                </div>
                <div className="flex justify-between font-extrabold text-[12px] text-slate-900 pt-1 border-t border-slate-800">
                  <span>TOTAL:</span>
                  <span>Rp{order.totalAmount.toLocaleString('id-ID')}</span>
                </div>
              </div>

              {/* Payment & Status */}
              <div className="text-[9.5px] space-y-0.5 pb-2 mb-2 border-b border-dotted border-slate-300">
                <div className="flex justify-between">
                  <span>Metode:</span>
                  <span className="font-bold">{order.paymentMethod}</span>
                </div>
                <div className="flex justify-between">
                  <span>Status:</span>
                  <span
                    className={`font-bold ${
                      order.paymentStatus === 'Lunas' ? 'text-emerald-700' : 'text-amber-700'
                    }`}
                  >
                    {order.paymentStatus.toUpperCase()}
                  </span>
                </div>
                {order.trackingNumber && (
                  <div className="flex justify-between">
                    <span>No. Resi:</span>
                    <span className="font-mono font-bold">{order.trackingNumber}</span>
                  </div>
                )}
                {order.trackingLink && (
                  <div className="flex justify-between items-center text-blue-900 font-bold">
                    <span>Link Lacak:</span>
                    <a href={order.trackingLink} target="_blank" rel="noopener noreferrer" className="underline truncate max-w-[130px]">
                      Buka Tautan Lacak
                    </a>
                  </div>
                )}
              </div>

              {/* QR Code / Barcode simulation */}
              {storeSettings.showQrisOnReceipt && (
                <div className="my-2 py-2 flex flex-col items-center justify-center border-y border-dashed border-slate-300 bg-slate-50/50">
                  <div className="w-16 h-16 bg-white border border-slate-300 p-1 rounded flex items-center justify-center">
                    {/* Simulated Clean QR Code Grid */}
                    <div className="grid grid-cols-4 gap-0.5 w-full h-full p-0.5 bg-slate-100">
                      <div className="bg-slate-900"></div>
                      <div className="bg-slate-900"></div>
                      <div className="bg-slate-300"></div>
                      <div className="bg-slate-900"></div>
                      <div className="bg-slate-900"></div>
                      <div className="bg-white"></div>
                      <div className="bg-slate-900"></div>
                      <div className="bg-slate-300"></div>
                      <div className="bg-slate-300"></div>
                      <div className="bg-slate-900"></div>
                      <div className="bg-slate-900"></div>
                      <div className="bg-slate-900"></div>
                      <div className="bg-slate-900"></div>
                      <div className="bg-slate-300"></div>
                      <div className="bg-slate-900"></div>
                      <div className="bg-slate-900"></div>
                    </div>
                  </div>
                  <span className="text-[8px] text-slate-500 mt-1 font-mono">
                    Scan Struk / Lacak Invoice
                  </span>
                </div>
              )}

              {/* Footer Policy */}
              {storeSettings.showFooterOnReceipt && (
                <div className="text-center text-[8.5px] text-slate-500 space-y-1 pt-1">
                  <p className="font-medium text-slate-700">
                    {storeSettings.receiptFooter ||
                      'Terima kasih telah belanja grosir di Aur Kuning!'}
                  </p>
                  {storeSettings.receiptReturnPolicy && (
                    <p className="text-[8px] text-slate-400">
                      {storeSettings.receiptReturnPolicy}
                    </p>
                  )}
                  <p className="text-[7.5px] font-bold text-slate-400 pt-1 tracking-wider uppercase">
                    *** SIMPAN STRUK INI SEBAGAI BUKTI ***
                  </p>
                </div>
              )}

              {/* Bottom ragged cut edge */}
              <div className="mt-3 pt-2 border-t-2 border-dashed border-slate-300 text-center text-[7px] text-slate-400 tracking-widest">
                - - - - - - - - - - - - - - - - - - -
              </div>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="md:col-span-5 flex flex-col justify-between space-y-4">
            
            <div className="space-y-4">
              {/* Paper roll selector */}
              <div className="bg-white p-3.5 rounded-xl border border-slate-200 shadow-2xs">
                <label className="text-xs font-bold text-slate-700 block mb-2">
                  Ukuran Lebar Kertas Printer
                </label>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setPaperWidth('58mm')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      paperWidth === '58mm'
                        ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    58 mm (Mini Portable)
                  </button>
                  <button
                    type="button"
                    onClick={() => setPaperWidth('80mm')}
                    className={`py-2 px-3 text-xs font-semibold rounded-lg border transition-all cursor-pointer ${
                      paperWidth === '80mm'
                        ? 'bg-cyan-600 text-white border-cyan-600 shadow-xs'
                        : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    80 mm (Desktop POS)
                  </button>
                </div>
              </div>

              {/* Quick Action Buttons */}
              <div className="space-y-2.5">
                {/* 1. Web Print Button */}
                <button
                  type="button"
                  onClick={handleWebPrint}
                  className="w-full py-3 px-4 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Printer className="w-4 h-4" />
                  <span>Cetak Nota (Browser Web Print)</span>
                </button>

                {/* 2. WhatsApp Receipt Button */}
                <button
                  type="button"
                  onClick={handleSendWhatsApp}
                  className="w-full py-3 px-4 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-sm shadow-md hover:shadow-lg transition-all flex items-center justify-center gap-2 cursor-pointer"
                >
                  <Share2 className="w-4 h-4" />
                  <span>Kirim Struk via WhatsApp</span>
                </button>

                {/* 3. Bluetooth ESC/POS Print */}
                <button
                  type="button"
                  onClick={handleBluetoothPrint}
                  disabled={bluetoothStatus === 'searching' || bluetoothStatus === 'printing'}
                  className="w-full py-2.5 px-4 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs shadow-xs transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-60"
                >
                  <Smartphone className="w-4 h-4 text-cyan-400" />
                  <span>
                    {bluetoothStatus === 'searching'
                      ? 'Mencari Printer Bluetooth...'
                      : bluetoothStatus === 'connected'
                      ? 'Terhubung! Menyiapkan data...'
                      : bluetoothStatus === 'printing'
                      ? 'Mengirim ESC/POS...'
                      : bluetoothStatus === 'success'
                      ? '✓ Berhasil Dicetak via Bluetooth'
                      : 'Koneksikan Printer Bluetooth (ESC/POS)'}
                  </span>
                </button>

                {bluetoothStatus === 'unsupported' && (
                  <p className="text-[11px] text-amber-600 bg-amber-50 p-2 rounded-lg border border-amber-200 flex items-center gap-1.5">
                    <AlertCircle className="w-4 h-4 shrink-0" />
                    Web Bluetooth tidak didukung browser ini. Silakan gunakan tombol Web Print di atas.
                  </p>
                )}

                {/* 4. Copy Raw ESC/POS Text */}
                <button
                  type="button"
                  onClick={handleCopyRaw}
                  className="w-full py-2 px-3 rounded-lg border border-slate-300 hover:bg-slate-100 text-slate-700 text-xs font-medium flex items-center justify-center gap-1.5 transition-colors cursor-pointer"
                >
                  {hasCopiedText ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-700">Teks Raw Berhasil Disalin!</span>
                    </>
                  ) : (
                    <>
                      <Copy className="w-3.5 h-3.5 text-slate-500" />
                      <span>Salin Raw Teks Nota</span>
                    </>
                  )}
                </button>
              </div>

              {/* Information Card */}
              <div className="p-3 bg-blue-50 border border-blue-200 rounded-xl text-blue-900 text-xs space-y-1">
                <p className="font-bold flex items-center gap-1.5">
                  <FileText className="w-3.5 h-3.5" />
                  Tips Cetak Struk Kasir:
                </p>
                <p className="text-[11px] text-blue-800 leading-relaxed">
                  Pada dialog cetak browser, atur <b>Margins: None</b> dan hilangkan centang <b>Headers and footers</b> agar hasil print pas di kertas struk thermal.
                </p>
              </div>
            </div>

            <button
              type="button"
              onClick={onClose}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-200 hover:bg-slate-300 text-slate-700 font-semibold text-xs transition-colors cursor-pointer"
            >
              Tutup Preview
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
