import React from 'react';
import { useApp, AppView } from '../context/AppContext';
import { Home, Package, FilePlus2, ShoppingBag, Truck } from 'lucide-react';

export const MobileBottomNav: React.FC = () => {
  const { currentView, setCurrentView, cartItemCount, setIsCartOpen } = useApp();

  const handleNav = (view: AppView) => {
    setCurrentView(view);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <div className="lg:hidden fixed bottom-0 inset-x-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200 shadow-lg px-2 py-1.5 flex items-center justify-around text-[10px] font-semibold text-slate-600">
      <button
        onClick={() => handleNav('home')}
        className={`flex flex-col items-center py-1 px-2 rounded-lg cursor-pointer ${
          currentView === 'home' ? 'text-blue-900 font-bold' : 'hover:text-slate-900'
        }`}
      >
        <Home className="w-4 h-4 mb-0.5" />
        <span>Beranda</span>
      </button>

      <button
        onClick={() => handleNav('catalog')}
        className={`flex flex-col items-center py-1 px-2 rounded-lg cursor-pointer ${
          currentView === 'catalog' ? 'text-blue-900 font-bold' : 'hover:text-slate-900'
        }`}
      >
        <Package className="w-4 h-4 mb-0.5" />
        <span>Katalog</span>
      </button>

      {/* Featured Request Center Button */}
      <button
        onClick={() => handleNav('request')}
        className="flex flex-col items-center -mt-4 cursor-pointer"
      >
        <div className="w-11 h-11 rounded-full bg-orange-600 text-white flex items-center justify-center shadow-md">
          <FilePlus2 className="w-5 h-5" />
        </div>
        <span className="mt-1 text-orange-600 font-bold">Request</span>
      </button>

      <button
        onClick={() => setIsCartOpen(true)}
        className="flex flex-col items-center py-1 px-2 rounded-lg cursor-pointer relative hover:text-slate-900"
      >
        <div className="relative">
          <ShoppingBag className="w-4 h-4 mb-0.5" />
          {cartItemCount > 0 && (
            <span className="absolute -top-1.5 -right-2 bg-orange-600 text-white font-mono-nums text-[9px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
              {cartItemCount}
            </span>
          )}
        </div>
        <span>Keranjang</span>
      </button>

      <button
        onClick={() => handleNav('orders')}
        className={`flex flex-col items-center py-1 px-2 rounded-lg cursor-pointer ${
          currentView === 'orders' || currentView === 'order-detail' ? 'text-blue-900 font-bold' : 'hover:text-slate-900'
        }`}
      >
        <Truck className="w-4 h-4 mb-0.5" />
        <span>Pesanan</span>
      </button>
    </div>
  );
};
