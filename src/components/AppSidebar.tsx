import React, { useState } from 'react';
import { useApp, AppView } from '../context/AppContext';
import {
  Home,
  ShoppingBag,
  Sparkles,
  Search,
  ShoppingCart,
  Truck,
  BookOpen,
  Info,
  ShieldCheck,
  Store,
  Building2,
  Database,
  History,
  HardDrive,
  Printer,
  ChevronRight,
  LogOut,
  User,
  X,
  Layers,
  MapPin,
  RefreshCw,
  Sliders,
} from 'lucide-react';

export const AppSidebar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    cartItemCount,
    setIsCartOpen,
    activeOutlet,
    activeOutletInfo,
    setActiveOutlet,
    setIsOutletSelectorOpen,
    user,
    login,
    logout,
    isAdmin,
    setIsAdminLoginModalOpen,
    logoutAdmin,
    adminSimulation,
    toggleAdminSimulation,
    isSidebarOpen,
    setIsSidebarOpen,
    storeSettings,
  } = useApp();

  const [menuSearch, setMenuSearch] = useState('');

  const handleNavigate = (view: AppView) => {
    setCurrentView(view);
    setIsSidebarOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const matchesSearch = (text: string) => {
    if (!menuSearch.trim()) return true;
    return text.toLowerCase().includes(menuSearch.toLowerCase());
  };

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 z-40 bg-slate-950/60 backdrop-blur-xs lg:hidden"
        />
      )}

      {/* Persistent Left Vertical Sidebar */}
      <aside
        className={`fixed top-0 bottom-0 left-0 z-40 w-72 bg-[#1e2530] text-slate-300 border-r border-[#2d3748] flex flex-col transition-transform duration-200 ease-in-out lg:translate-x-0 ${
          isSidebarOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        {/* 1. Header: Logo & Name (GROSIR NUSANTARA) */}
        <div className="p-4 bg-[#181e27] border-b border-[#2d3748] flex items-center justify-between">
          <div
            onClick={() => handleNavigate('home')}
            className="flex items-center gap-3 cursor-pointer group"
          >
            <img
              src="/assets/aistudio/Logo_Grosir_Nusantara_Warna_Nusantara_fc818c0f.png"
              alt="Grosir Nusantara"
              className="h-10 w-auto object-contain shrink-0 drop-shadow-xs"
              onError={(e) => {
                const target = e.currentTarget;
                if (target.src.indexOf('/public/') === -1) {
                  target.src = '/public/assets/aistudio/Logo_Grosir_Nusantara_Warna_Nusantara_fc818c0f.png';
                }
              }}
            />
            <div>
              <div className="text-base font-black tracking-tight text-white group-hover:text-amber-400 transition-colors">
                GROSIR <span className="text-amber-400">NUSANTARA</span>
              </div>
              <div className="text-[10px] text-slate-400 font-sans tracking-tight">
                Tanah Abang &amp; Aur Kuning
              </div>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsSidebarOpen(false)}
            className="lg:hidden p-1.5 text-slate-400 hover:text-white rounded-lg hover:bg-slate-800"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Outlet Active Switcher Pill */}
        <div className="p-3 bg-[#242b37] border-b border-[#2f3949]">
          <div className="text-[10px] uppercase font-bold tracking-wider text-slate-400 mb-1.5 flex items-center justify-between">
            <span>OUTLET AKTIF</span>
            <button
              type="button"
              onClick={() => setIsOutletSelectorOpen(true)}
              className="text-amber-400 hover:text-amber-300 text-[10px] font-bold underline cursor-pointer"
            >
              Ganti Outlet
            </button>
          </div>

          <button
            type="button"
            onClick={() => setIsOutletSelectorOpen(true)}
            className={`w-full py-2 px-3 rounded-xl border flex items-center justify-between transition-all cursor-pointer shadow-xs ${
              activeOutlet === 'TANAH_ABANG'
                ? 'bg-[#0f2744] text-white border-blue-900/60 hover:border-amber-400'
                : 'bg-amber-600 text-white border-amber-500 hover:border-white'
            }`}
          >
            <div className="flex items-center gap-2.5 text-left">
              {activeOutlet === 'TANAH_ABANG' ? (
                /* Monas icon */
                <div className="w-7 h-7 rounded-lg bg-amber-400 text-slate-900 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M11 2h2v4h-2zm-1 5h4l1 7h-6zm-3 8h10l2 7H4z" />
                  </svg>
                </div>
              ) : (
                /* Rumah Gadang icon */
                <div className="w-7 h-7 rounded-lg bg-slate-900 text-amber-400 flex items-center justify-center shrink-0">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M12 3l3 4h4l-3 4 5 7h-6l-3-4-3 4H3l5-7-3-4h4z" />
                  </svg>
                </div>
              )}
              <div>
                <div className="text-xs font-black truncate leading-tight">
                  {activeOutletInfo.shortName}
                </div>
                <div className="text-[10px] text-slate-300 font-medium">
                  {activeOutletInfo.city}
                </div>
              </div>
            </div>

            <ChevronRight className="w-4 h-4 text-slate-400 shrink-0" />
          </button>
        </div>

        {/* 3. Search Menu Input (Matching image_0.png) */}
        <div className="px-3 pt-3 pb-2 bg-[#1e2530]">
          <div className="relative">
            <input
              type="text"
              value={menuSearch}
              onChange={(e) => setMenuSearch(e.target.value)}
              placeholder="Search Menu"
              className="w-full bg-[#161c24] text-slate-200 placeholder-slate-500 text-xs pl-3 pr-8 py-2 rounded-lg border border-[#313c4c] focus:outline-none focus:border-amber-500 font-sans"
            />
            <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
          </div>
        </div>

        {/* 4. Vertical Scrollable Menu List */}
        <div className="flex-1 overflow-y-auto px-2 py-2 space-y-4 text-xs">
          
          {/* SECTION A: MENU UTAMA PEMBELI */}
          <div>
            <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Menu Pembeli
            </div>

            <div className="space-y-0.5 mt-0.5">
              {/* Beranda */}
              {matchesSearch('Beranda Home') && (
                <button
                  type="button"
                  onClick={() => handleNavigate('home')}
                  className={`w-full px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors text-left cursor-pointer ${
                    currentView === 'home'
                      ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                      : 'hover:bg-[#283241] text-slate-300'
                  }`}
                >
                  <Home className="w-4 h-4 shrink-0" />
                  <span>Beranda</span>
                </button>
              )}

              {/* Katalog Produk */}
              {matchesSearch('Katalog Produk Barang') && (
                <button
                  type="button"
                  onClick={() => handleNavigate('catalog')}
                  className={`w-full px-3 py-2.5 rounded-lg flex items-center justify-between transition-colors text-left cursor-pointer ${
                    currentView === 'catalog'
                      ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                      : 'hover:bg-[#283241] text-slate-300'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <ShoppingBag className="w-4 h-4 shrink-0" />
                    <span>Katalog Produk</span>
                  </div>
                  <span
                    className={`text-[10px] font-mono px-1.5 py-0.5 rounded ${
                      currentView === 'catalog'
                        ? 'bg-slate-950 text-amber-400 font-bold'
                        : 'bg-slate-800 text-slate-400'
                    }`}
                  >
                    {activeOutletInfo.shortName}
                  </span>
                </button>
              )}

              {/* Request Barang */}
              {matchesSearch('Request Barang Titip Sourcing') && (
                <button
                  type="button"
                  onClick={() => handleNavigate('request')}
                  className={`w-full px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors text-left cursor-pointer ${
                    currentView === 'request'
                      ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                      : 'hover:bg-[#283241] text-slate-300'
                  }`}
                >
                  <Sparkles className="w-4 h-4 shrink-0 text-amber-400" />
                  <span>Request Barang</span>
                </button>
              )}

              {/* Keranjang Belanja */}
              {matchesSearch('Keranjang Belanja Cart') && (
                <button
                  type="button"
                  onClick={() => {
                    setIsCartOpen(true);
                    setIsSidebarOpen(false);
                  }}
                  className="w-full px-3 py-2.5 rounded-lg flex items-center justify-between hover:bg-[#283241] text-slate-300 transition-colors text-left cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <ShoppingCart className="w-4 h-4 shrink-0 text-blue-400" />
                    <span>Keranjang Belanja</span>
                  </div>
                  {cartItemCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-amber-500 text-slate-950 font-mono font-black text-[10px] flex items-center justify-center">
                      {cartItemCount}
                    </span>
                  )}
                </button>
              )}

              {/* Lacak Pesanan */}
              {matchesSearch('Lacak Pesanan Order Tracking') && (
                <button
                  type="button"
                  onClick={() => handleNavigate('orders')}
                  className={`w-full px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors text-left cursor-pointer ${
                    currentView === 'orders' || currentView === 'order-detail'
                      ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                      : 'hover:bg-[#283241] text-slate-300'
                  }`}
                >
                  <Truck className="w-4 h-4 shrink-0 text-cyan-400" />
                  <span>Lacak Pesanan</span>
                </button>
              )}

              {/* Panduan & Blog */}
              {matchesSearch('Panduan Blog Artikel') && (
                <button
                  type="button"
                  onClick={() => handleNavigate('blog')}
                  className={`w-full px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors text-left cursor-pointer ${
                    currentView === 'blog' || currentView === 'article-detail'
                      ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                      : 'hover:bg-[#283241] text-slate-300'
                  }`}
                >
                  <BookOpen className="w-4 h-4 shrink-0 text-purple-400" />
                  <span>Panduan &amp; Berita</span>
                </button>
              )}

              {/* Tentang Kami */}
              {matchesSearch('Tentang Kami Profil') && (
                <button
                  type="button"
                  onClick={() => handleNavigate('about')}
                  className={`w-full px-3 py-2.5 rounded-lg flex items-center gap-3 transition-colors text-left cursor-pointer ${
                    currentView === 'about'
                      ? 'bg-amber-500 text-slate-950 font-extrabold shadow-sm'
                      : 'hover:bg-[#283241] text-slate-300'
                  }`}
                >
                  <Info className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>Tentang Grosir Nusantara</span>
                </button>
              )}
            </div>
          </div>

          {/* SECTION B: MENU KHUSUS ADMIN / OWNER (HANYA MUNCUL JIKA SUDAH LOGIN ADMIN) */}
          {isAdmin && (
            <div className="pt-2 border-t border-[#2d3748]">
              <div className="px-3 py-1.5 text-[10px] font-extrabold uppercase tracking-wider text-amber-400 flex items-center justify-between">
                <span>Admin &amp; Manajemen</span>
                <span className="text-[9px] px-1.5 py-0.2 rounded bg-amber-500/20 text-amber-300 font-mono">
                  Owner
                </span>
              </div>

              <div className="space-y-0.5 mt-0.5">
                {/* Profil Toko */}
                {matchesSearch('Profil Toko Struk') && (
                  <button
                    type="button"
                    onClick={() => handleNavigate('admin')}
                    className={`w-full px-3 py-2 rounded-lg flex items-center gap-3 transition-colors text-left cursor-pointer ${
                      currentView === 'admin'
                        ? 'bg-[#2b3543] text-amber-400 font-bold border-l-2 border-amber-400'
                        : 'hover:bg-[#242c38] text-slate-300'
                    }`}
                  >
                    <Store className="w-4 h-4 shrink-0 text-cyan-400" />
                    <span>Profil Toko &amp; Struk</span>
                  </button>
                )}

                {/* Manajemen Outlet */}
                {matchesSearch('Manajemen Outlet') && (
                  <button
                    type="button"
                    onClick={() => setIsOutletSelectorOpen(true)}
                    className="w-full px-3 py-2 rounded-lg flex items-center justify-between hover:bg-[#242c38] text-slate-300 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Building2 className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>Pilih / Ganti Outlet</span>
                    </div>
                    <span className="text-[10px] font-mono text-slate-400">
                      2 Sentra
                    </span>
                  </button>
                )}

                {/* Database (Google Sheets) */}
                {matchesSearch('Database Sheets') && (
                  <button
                    type="button"
                    onClick={() => handleNavigate('admin')}
                    className="w-full px-3 py-2 rounded-lg flex items-center gap-3 hover:bg-[#242c38] text-slate-300 transition-colors text-left cursor-pointer"
                  >
                    <Database className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Database (Google Sheets)</span>
                  </button>
                )}

                {/* Log Aktivitas */}
                {matchesSearch('Log Aktivitas Audit') && (
                  <button
                    type="button"
                    onClick={() => handleNavigate('admin')}
                    className="w-full px-3 py-2 rounded-lg flex items-center gap-3 hover:bg-[#242c38] text-slate-300 transition-colors text-left cursor-pointer"
                  >
                    <History className="w-4 h-4 shrink-0 text-purple-400" />
                    <span>Log Aktivitas (Audit)</span>
                  </button>
                )}

                {/* Backup & Restore */}
                {matchesSearch('Backup Restore Database') && (
                  <button
                    type="button"
                    onClick={() => handleNavigate('admin')}
                    className="w-full px-3 py-2 rounded-lg flex items-center gap-3 hover:bg-[#242c38] text-slate-300 transition-colors text-left cursor-pointer"
                  >
                    <HardDrive className="w-4 h-4 shrink-0 text-indigo-400" />
                    <span>Backup &amp; Restore</span>
                  </button>
                )}

                {/* POS & Kasir Transaksi */}
                {matchesSearch('POS Kasir Transaksi') && (
                  <button
                    type="button"
                    onClick={() => handleNavigate('admin')}
                    className="w-full px-3 py-2 rounded-lg flex items-center gap-3 hover:bg-[#242c38] text-slate-300 transition-colors text-left cursor-pointer"
                  >
                    <Printer className="w-4 h-4 shrink-0 text-blue-400" />
                    <span>POS &amp; Cetak Thermal</span>
                  </button>
                )}
              </div>
            </div>
          )}

        </div>

        {/* 5. Sidebar Bottom: User Auth & Dedicated Admin Access */}
        <div className="p-3 bg-[#181e27] border-t border-[#2d3748] space-y-2 text-xs">
          {user ? (
            <div className="flex items-center justify-between bg-[#222a36] p-2 rounded-xl border border-slate-700/50">
              <div className="flex items-center gap-2 truncate">
                <div className="w-7 h-7 rounded-full bg-amber-500 text-slate-950 font-bold text-xs flex items-center justify-center shrink-0">
                  {user.displayName?.[0] || 'U'}
                </div>
                <div className="truncate">
                  <div className="font-semibold text-white truncate text-[11px]">
                    {user.displayName || user.email}
                  </div>
                  <div className="text-[10px] text-amber-400 font-mono">
                    {isAdmin ? 'Admin / Owner' : 'Akun Pembeli'}
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={logout}
                className="p-1.5 text-slate-400 hover:text-red-400 rounded-lg hover:bg-slate-700/50 cursor-pointer"
                title="Keluar Akun"
              >
                <LogOut className="w-3.5 h-3.5" />
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={login}
              className="w-full py-2 px-3 bg-[#242b37] hover:bg-[#2c3543] text-slate-200 border border-slate-700 rounded-xl font-semibold flex items-center justify-center gap-2 transition-colors cursor-pointer text-xs"
            >
              <User className="w-3.5 h-3.5 text-amber-400" />
              <span>Masuk Akun Google</span>
            </button>
          )}

          {/* Admin / Owner Login or Status */}
          {isAdmin ? (
            <div className="p-2 rounded-xl bg-amber-500/10 border border-amber-500/30 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-400 shrink-0" />
                <span className="text-[11px] font-bold text-amber-400">Mode Owner Aktif</span>
              </div>
              <button
                type="button"
                onClick={logoutAdmin}
                className="text-[10px] font-semibold text-red-400 hover:text-red-300 underline cursor-pointer"
              >
                Keluar Admin
              </button>
            </div>
          ) : (
            <button
              type="button"
              onClick={() => {
                setIsSidebarOpen(false);
                setIsAdminLoginModalOpen(true);
              }}
              className="w-full py-2 px-3 bg-[#242b37] hover:bg-amber-500/15 text-slate-300 hover:text-amber-400 border border-slate-700 hover:border-amber-500/40 rounded-xl text-xs font-bold flex items-center justify-between transition-all cursor-pointer shadow-2xs"
            >
              <div className="flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-amber-500" />
                <span>Login Admin / Owner</span>
              </div>
              <span className="text-[10px] bg-slate-800 text-amber-400/90 font-mono px-1.5 py-0.5 rounded">
                PIN
              </span>
            </button>
          )}
        </div>

      </aside>
    </>
  );
};
