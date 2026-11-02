import React, { useState } from 'react';
import { MessageCircle, X } from 'lucide-react';
import { useApp } from '../context/AppContext';
import { BUSINESS_INFO } from '../data/initialData';
import { getEffectiveWhatsapp, formatWhatsappDisplay, getWhatsappChatUrl } from '../utils/whatsapp';

export const WhatsAppButton: React.FC = () => {
  const { storeSettings, activeOutletInfo } = useApp();
  const [isOpen, setIsOpen] = useState(false);

  // Target WhatsApp numbers based on owner customization
  const adminWhatsapp = getEffectiveWhatsapp(storeSettings, 'tanya_admin', activeOutletInfo.whatsappNumber);
  const orderWhatsapp = getEffectiveWhatsapp(storeSettings, 'order', activeOutletInfo.whatsappNumber);
  const requestWhatsapp = getEffectiveWhatsapp(storeSettings, 'request', activeOutletInfo.whatsappNumber);

  const startChat = (topic: string) => {
    let targetPhone = adminWhatsapp;
    let msg = `Halo CS Grosir Nusantara (${activeOutletInfo.shortName}), `;

    if (topic === 'request') {
      targetPhone = requestWhatsapp;
      msg += `saya ingin request dicarikan barang khusus di sentra ${activeOutletInfo.name}.`;
    } else if (topic === 'ongkir') {
      targetPhone = adminWhatsapp;
      msg += `saya mau tanya tarif ongkir ekspedisi kargo dari ${activeOutletInfo.city} ke kota saya.`;
    } else if (topic === 'order') {
      targetPhone = orderWhatsapp;
      msg += `saya mau konfirmasi status pesanan / invoice saya di ${activeOutletInfo.shortName}.`;
    } else {
      targetPhone = adminWhatsapp;
      msg = storeSettings?.whatsappGreetingGeneral || `Halo Admin Grosir Nusantara (${activeOutletInfo.shortName}), saya mau tanya info belanja grosir dan stok barang.`;
    }

    const url = getWhatsappChatUrl(targetPhone, msg);
    window.open(url, '_blank');
    setIsOpen(false);
  };

  return (
    <div className="fixed bottom-20 sm:bottom-6 right-4 sm:right-6 z-40 flex flex-col items-end">
      {/* Popover Bubble */}
      {isOpen && (
        <div className="mb-3 bg-white rounded-2xl shadow-2xl border border-slate-200 p-4 w-72 text-xs text-slate-800 animate-in fade-in slide-in-from-bottom-2 duration-150">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
              <div>
                <span className="font-bold text-slate-900 block leading-tight">CS {activeOutletInfo.shortName}</span>
                <span className="text-[10px] text-emerald-700 font-mono font-semibold block">{formatWhatsappDisplay(adminWhatsapp)}</span>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
          <p className="text-[11px] text-slate-500 mb-3 leading-relaxed">
            Ada yang bisa kami bantu carikan di sentra {activeOutletInfo.shortName} ({activeOutletInfo.city}) hari ini?
          </p>
          <div className="space-y-1.5">
            <button
              onClick={() => startChat('request')}
              className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 font-semibold text-slate-800 text-[11px] transition-colors"
            >
              🔍 Request Cari Barang Khusus
            </button>
            <button
              onClick={() => startChat('ongkir')}
              className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 font-semibold text-slate-800 text-[11px] transition-colors"
            >
              📦 Cek Ongkir Kargo ke Kota Saya
            </button>
            <button
              onClick={() => startChat('order')}
              className="w-full text-left p-2 rounded-lg bg-slate-50 hover:bg-slate-100 font-semibold text-slate-800 text-[11px] transition-colors"
            >
              🧾 Konfirmasi Pesanan / Invoice
            </button>
          </div>
        </div>
      )}

      {/* Main Floating Trigger Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-14 h-14 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white shadow-xl flex items-center justify-center transition-transform hover:scale-105 active:scale-95 cursor-pointer relative"
        aria-label="Hubungi WhatsApp"
      >
        <MessageCircle className="w-7 h-7" />
        <span className="sr-only">Hubungi Kami di WhatsApp</span>
      </button>
    </div>
  );
};
