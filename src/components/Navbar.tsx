import React, { useState } from 'react';
import { useApp, AppView } from '../context/AppContext';
import {
  ShoppingBag,
  Search,
  User,
  ShieldCheck,
  Menu,
  X,
  LogOut,
  FileText,
  HelpCircle,
  Truck,
  Layers,
  Tag,
  Bell,
  LayoutDashboard,
  Building2,
  ChevronDown,
} from 'lucide-react';

export const Navbar: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    cartItemCount,
    setIsCartOpen,
    user,
    login,
    logout,
    isAdmin,
    isAdminLoggedIn,
    setIsAdminLoginModalOpen,
    logoutAdmin,
    adminSimulation,
    toggleAdminSimulation,
    searchQuery,
    setSearchQuery,
    setSelectedCategorySlug,
    unreadNotificationCount,
    setIsNotificationOpen,
    activeOutlet,
    activeOutletInfo,
    setIsOutletSelectorOpen,
    setIsSidebarOpen,
    storeSettings,
  } = useApp();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showSearchModal, setShowSearchModal] = useState(false);

  const handleNav = (view: AppView) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      setSelectedCategorySlug(null);
      setCurrentView('catalog');
      setShowSearchModal(false);
      setMobileMenuOpen(false);
    }
  };

  return (
    <>
      {/* Top Banner with Outlet Status & Discreet Admin Indicator */}
      <div className="bg-[#181e27] text-slate-300 text-xs py-2 px-4 border-b border-slate-800">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-amber-400 font-extrabold uppercase text-[11px] tracking-wide">
              GROSIR NUSANTARA
            </span>
            <span className="text-slate-500">·</span>
            <span className="text-slate-300 hidden sm:inline">
              Belanja Grosir &amp; Eceran Lebih Mudah: Tanah Abang (Jakarta) &amp; Pasar Aur Kuning (Bukittinggi)
            </span>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsOutletSelectorOpen(true)}
              className="text-amber-400 hover:text-amber-300 font-bold text-[11px] flex items-center gap-1 cursor-pointer"
            >
              <Building2 className="w-3.5 h-3.5" />
              <span>Ganti Outlet Pasar</span>
            </button>
            
            {isAdmin ? (
              <>
                <span className="text-slate-600">·</span>
                <span className="text-amber-400 font-bold text-[11px] flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-amber-400" />
                  <span>Mode Admin Aktif</span>
                </span>
                <button
                  onClick={logoutAdmin}
                  className="text-slate-400 hover:text-red-400 text-[11px] font-semibold underline cursor-pointer"
                >
                  (Keluar Admin)
                </button>
              </>
            ) : (
              <>
                <span className="text-slate-600 hidden md:inline">·</span>
                <button
                  onClick={() => setIsAdminLoginModalOpen(true)}
                  className="hidden md:flex items-center gap-1 text-slate-400 hover:text-amber-400 text-[11px] font-medium transition-colors cursor-pointer"
                >
                  <ShieldCheck className="w-3 h-3" />
                  <span>Akses Admin Toko</span>
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* Main Top Navigation Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-slate-200 shadow-2xs">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-18 flex items-center justify-between gap-4">
          
          {/* Left: Sidebar Toggle + Brand Title */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Sidebar Opener Button */}
            <button
              type="button"
              onClick={() => setIsSidebarOpen(true)}
              className="p-2 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
              aria-label="Buka Navigasi Samping"
              title="Buka Menu Navigasi"
            >
              <Menu className="w-5 h-5" />
            </button>

            <button
              onClick={() => handleNav('home')}
              className="text-left group cursor-pointer flex items-center gap-2.5"
            >
              <img
                src="/assets/aistudio/Logo_Grosir_Nusantara_Warna_Nusantara_fc818c0f.png"
                alt="Grosir Nusantara"
                className="h-10 sm:h-12 w-auto object-contain shrink-0 drop-shadow-2xs"
                onError={(e) => {
                  const target = e.currentTarget;
                  if (target.src.indexOf('/public/') === -1) {
                    target.src = '/public/assets/aistudio/Logo_Grosir_Nusantara_Warna_Nusantara_fc818c0f.png';
                  }
                }}
              />
              <div>
                <div className="text-lg sm:text-xl font-black tracking-tight text-slate-900 group-hover:text-amber-600 transition-colors whitespace-nowrap">
                  GROSIR <span className="text-amber-500">NUSANTARA</span>
                </div>
                <div className="text-[10px] tracking-wider text-slate-500 font-semibold uppercase">
                  Belanja Grosir &amp; Eceran Lebih Mudah
                </div>
              </div>
            </button>
          </div>

          {/* Center: Prominent Active Outlet Pill Switcher */}
          <div className="hidden md:flex items-center">
            <button
              type="button"
              onClick={() => setIsOutletSelectorOpen(true)}
              className={`py-1.5 px-3.5 rounded-full border text-xs font-bold flex items-center gap-2 shadow-xs transition-all cursor-pointer ${
                activeOutlet === 'TANAH_ABANG'
                  ? 'bg-[#0f2744] text-white border-blue-900 hover:border-amber-400'
                  : 'bg-amber-500 text-slate-950 border-amber-600 hover:bg-amber-400'
              }`}
            >
              {activeOutlet === 'TANAH_ABANG' ? (
                <svg className="w-3.5 h-3.5 fill-current text-amber-400" viewBox="0 0 24 24">
                  <path d="M11 2h2v4h-2zm-1 5h4l1 7h-6zm-3 8h10l2 7H4z" />
                </svg>
              ) : (
                <svg className="w-3.5 h-3.5 fill-current text-slate-950" viewBox="0 0 24 24">
                  <path d="M12 3l3 4h4l-3 4 5 7h-6l-3-4-3 4H3l5-7-3-4h4z" />
                </svg>
              )}
              <span>Outlet: {activeOutletInfo.name}</span>
              <ChevronDown className="w-3.5 h-3.5 opacity-70" />
            </button>
          </div>

          {/* Zone 2: 4-5 Concise Navigation Links */}
          <nav className="hidden lg:flex items-center gap-7 text-sm font-medium text-slate-700">
            <button
              onClick={() => handleNav('home')}
              className={`hover:text-blue-900 transition-colors whitespace-nowrap cursor-pointer pb-1 ${
                currentView === 'home' ? 'text-blue-900 font-bold border-b-2 border-blue-900' : ''
              }`}
            >
              Beranda
            </button>
            <button
              onClick={() => {
                setSelectedCategorySlug(null);
                handleNav('catalog');
              }}
              className={`hover:text-blue-900 transition-colors whitespace-nowrap cursor-pointer pb-1 ${
                currentView === 'catalog' ? 'text-blue-900 font-bold border-b-2 border-blue-900' : ''
              }`}
            >
              Semua Produk
            </button>
            <button
              onClick={() => handleNav('request')}
              className={`hover:text-blue-900 transition-colors whitespace-nowrap cursor-pointer pb-1 ${
                currentView === 'request' ? 'text-blue-900 font-bold border-b-2 border-blue-900' : ''
              }`}
            >
              Request Barang
            </button>
            <button
              onClick={() => handleNav('orders')}
              className={`hover:text-blue-900 transition-colors whitespace-nowrap cursor-pointer pb-1 ${
                currentView === 'orders' || currentView === 'order-detail' ? 'text-blue-900 font-bold border-b-2 border-blue-900' : ''
              }`}
            >
              Lacak Pesanan
            </button>
            <button
              onClick={() => handleNav('about')}
              className={`hover:text-blue-900 transition-colors whitespace-nowrap cursor-pointer pb-1 ${
                currentView === 'about' ? 'text-blue-900 font-bold border-b-2 border-blue-900' : ''
              }`}
            >
              Tentang Kami
            </button>
            <button
              onClick={() => handleNav('blog')}
              className={`hover:text-blue-900 transition-colors whitespace-nowrap cursor-pointer pb-1 ${
                currentView === 'blog' ? 'text-blue-900 font-bold border-b-2 border-blue-900' : ''
              }`}
            >
              Panduan & Blog
            </button>
            {isAdmin && (
              <>
                <button
                  onClick={() => handleNav('admin')}
                  className={`hover:text-cyan-700 transition-colors whitespace-nowrap cursor-pointer pb-1 flex items-center gap-1.5 font-bold ${
                    currentView === 'admin'
                      ? 'text-cyan-700 border-b-2 border-cyan-700'
                      : 'text-slate-700 hover:text-slate-900'
                  }`}
                >
                  <LayoutDashboard className="w-4 h-4 text-cyan-600" />
                  <span>POS &amp; Manajemen Toko</span>
                </button>
                <button
                  onClick={() => handleNav('manage-products')}
                  className={`text-orange-700 hover:text-orange-900 transition-colors whitespace-nowrap cursor-pointer pb-1 flex items-center gap-1.5 font-bold ${
                    currentView === 'manage-products' ? 'border-b-2 border-orange-700' : ''
                  }`}
                >
                  <Tag className="w-4 h-4 text-orange-600" />
                  Kelola Produk
                </button>
              </>
            )}
          </nav>

          {/* Zone 3: Actions (Search, Cart, User Auth) */}
          <div className="flex items-center gap-3 shrink-0">
            {/* Quick Search Bar (Desktop) */}
            <form onSubmit={handleSearchSubmit} className="hidden md:flex items-center relative">
              <input
                type="text"
                placeholder="Cari mukena, daster, jeans..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-48 lg:w-60 pl-8 pr-3 py-1.5 text-xs bg-slate-100 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800 focus:bg-white transition-all text-slate-800"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 pointer-events-none" />
            </form>

            {/* Search Icon Trigger for Mobile */}
            <button
              onClick={() => setShowSearchModal(true)}
              className="md:hidden p-2 text-slate-600 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
              aria-label="Cari Produk"
            >
              <Search className="w-5 h-5" />
            </button>

            {/* Admin Notification Bell */}
            {isAdmin && (
              <button
                onClick={() => setIsNotificationOpen(true)}
                className="relative p-2 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                aria-label="Notifikasi Masuk Admin"
                title="Pusat Notifikasi Admin Real-Time"
              >
                <Bell className="w-5 h-5 text-orange-600" />
                {unreadNotificationCount > 0 && (
                  <span className="absolute -top-1 -right-1 bg-red-600 text-white font-mono-nums text-[10px] font-extrabold w-4 h-4 rounded-full flex items-center justify-center shadow-xs animate-pulse">
                    {unreadNotificationCount}
                  </span>
                )}
              </button>
            )}

            {/* Shopping Cart Button */}
            <button
              onClick={() => setIsCartOpen(true)}
              className="relative p-2 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer flex items-center gap-2"
              aria-label="Keranjang Belanja"
            >
              <ShoppingBag className="w-5 h-5 text-slate-800" />
              {cartItemCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-orange-600 text-white font-mono-nums text-[11px] font-bold w-5 h-5 rounded-full flex items-center justify-center shadow-sm">
                  {cartItemCount}
                </span>
              )}
            </button>

            {/* Admin / Owner Access Button in Header (Clean & Elegant) */}
            {isAdmin ? (
              <div className="hidden sm:flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => handleNav('admin')}
                  className={`px-3 py-1.5 text-xs font-bold rounded-lg flex items-center gap-1.5 transition-all shadow-2xs cursor-pointer ${
                    currentView === 'admin'
                      ? 'bg-amber-500 text-slate-950 font-black'
                      : 'bg-amber-400 hover:bg-amber-300 text-slate-950'
                  }`}
                  title="Buka Panel Dashboard Admin / Owner"
                >
                  <LayoutDashboard className="w-3.5 h-3.5" />
                  <span>Panel Admin</span>
                </button>
                <button
                  type="button"
                  onClick={logoutAdmin}
                  className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded-lg transition-colors cursor-pointer"
                  title="Keluar dari Akses Admin"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                type="button"
                onClick={() => setIsAdminLoginModalOpen(true)}
                className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-bold text-slate-700 hover:text-amber-700 bg-slate-100 hover:bg-amber-50 border border-slate-200 rounded-lg transition-all cursor-pointer shadow-2xs"
                title="Masuk sebagai Pemilik Toko / Admin"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-amber-500" />
                <span>Login Admin</span>
              </button>
            )}

            {/* User Profile / Customer Login */}
            {user ? (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleNav(isAdmin ? 'admin' : 'orders')}
                  className="flex items-center gap-2 text-xs font-medium text-slate-800 bg-slate-100 hover:bg-slate-200 py-1.5 px-3 rounded-lg transition-colors cursor-pointer"
                  title={user.email || ''}
                >
                  <User className="w-3.5 h-3.5 text-blue-900" />
                  <span className="hidden sm:inline max-w-24 truncate">
                    {user.displayName?.split(' ')[0] || 'Akun'}
                  </span>
                </button>
                <button
                  onClick={logout}
                  className="p-1.5 text-slate-400 hover:text-red-600 rounded-lg hover:bg-slate-100 transition-colors cursor-pointer"
                  title="Keluar Akun"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            ) : (
              <button
                onClick={login}
                className="hidden sm:inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-lg transition-colors whitespace-nowrap cursor-pointer border border-slate-200"
              >
                <User className="w-3.5 h-3.5 text-slate-600" />
                Masuk
              </button>
            )}

            {/* Primary Action Button: Request Barang Direct CTA */}
            <button
              onClick={() => handleNav('request')}
              className="px-3.5 sm:px-4 py-2 text-xs font-semibold text-white bg-orange-600 hover:bg-orange-700 active:bg-orange-800 rounded-lg transition-colors shadow-xs whitespace-nowrap cursor-pointer"
            >
              Request Barang
            </button>

            {/* Mobile Menu Hamburger */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 text-slate-700 hover:text-slate-900 rounded-lg hover:bg-slate-100 cursor-pointer"
              aria-label="Menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Dropdown Menu */}
        {mobileMenuOpen && (
          <div className="lg:hidden border-t border-slate-200 bg-white px-4 py-4 space-y-3 shadow-lg">
            <div className="grid grid-cols-2 gap-2 pb-3 border-b border-slate-100">
              <button
                onClick={() => handleNav('home')}
                className="text-left px-3 py-2 text-sm font-medium rounded-lg hover:bg-slate-50 text-slate-800"
              >
                Beranda
              </button>
              <button
                onClick={() => {
                  setSelectedCategorySlug(null);
                  handleNav('catalog');
                }}
                className="text-left px-3 py-2 text-sm font-medium rounded-lg hover:bg-slate-50 text-slate-800"
              >
                Semua Produk
              </button>
              <button
                onClick={() => handleNav('request')}
                className="text-left px-3 py-2 text-sm font-medium rounded-lg hover:bg-slate-50 text-slate-800"
              >
                Request Barang
              </button>
              <button
                onClick={() => handleNav('orders')}
                className="text-left px-3 py-2 text-sm font-medium rounded-lg hover:bg-slate-50 text-slate-800"
              >
                Lacak Pesanan
              </button>
              <button
                onClick={() => handleNav('about')}
                className="text-left px-3 py-2 text-sm font-medium rounded-lg hover:bg-slate-50 text-slate-800"
              >
                Tentang Kami
              </button>
              <button
                onClick={() => handleNav('blog')}
                className="text-left px-3 py-2 text-sm font-medium rounded-lg hover:bg-slate-50 text-slate-800"
              >
                Panduan Belanja
              </button>
              {isAdmin ? (
                <>
                  <button
                    onClick={() => handleNav('manage-products')}
                    className="col-span-2 text-left px-3 py-2 text-sm font-bold rounded-lg bg-orange-50 text-orange-950 flex items-center gap-2"
                  >
                    <Tag className="w-4 h-4 text-orange-600" />
                    Kelola Produk &amp; Harga
                  </button>
                  <button
                    onClick={() => handleNav('admin')}
                    className="col-span-2 text-left px-3 py-2 text-sm font-bold rounded-lg bg-amber-50 text-amber-950 flex items-center justify-between"
                  >
                    <div className="flex items-center gap-2">
                      <LayoutDashboard className="w-4 h-4 text-amber-600" />
                      <span>Panel Admin &amp; POS</span>
                    </div>
                    <span className="text-xs bg-amber-200 text-amber-900 px-2 py-0.5 rounded font-mono">Owner</span>
                  </button>
                  <button
                    onClick={() => {
                      setMobileMenuOpen(false);
                      logoutAdmin();
                    }}
                    className="col-span-2 text-left px-3 py-1.5 text-xs font-semibold rounded-lg text-red-600 hover:bg-red-50 flex items-center gap-1.5"
                  >
                    <LogOut className="w-3.5 h-3.5" />
                    <span>Keluar dari Akses Admin</span>
                  </button>
                </>
              ) : (
                <button
                  onClick={() => {
                    setMobileMenuOpen(false);
                    setIsAdminLoginModalOpen(true);
                  }}
                  className="col-span-2 text-left px-3 py-2.5 text-xs font-bold rounded-xl bg-slate-100 hover:bg-amber-50 text-slate-800 hover:text-amber-800 border border-slate-200 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2">
                    <ShieldCheck className="w-4 h-4 text-amber-500" />
                    <span>Login Admin / Owner Toko</span>
                  </div>
                  <span className="text-[10px] bg-slate-200 text-slate-700 px-2 py-0.5 rounded font-mono">PIN</span>
                </button>
              )}
            </div>

            <div className="pt-1 flex items-center justify-between">
              {user ? (
                <div className="flex items-center justify-between w-full">
                  <span className="text-xs text-slate-600 truncate max-w-48">{user.email}</span>
                  <button
                    onClick={logout}
                    className="text-xs text-red-600 font-medium hover:underline"
                  >
                    Keluar
                  </button>
                </div>
              ) : (
                <button
                  onClick={login}
                  className="w-full py-2 px-4 bg-slate-900 text-white rounded-lg text-xs font-semibold"
                >
                  Masuk dengan Akun Google
                </button>
              )}
            </div>
          </div>
        )}
      </header>

      {/* Search Modal for Mobile */}
      {showSearchModal && (
        <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-xs flex items-start justify-center p-4 pt-20">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-4">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-sm font-semibold text-slate-900">Cari Produk Grosir</h3>
              <button
                onClick={() => setShowSearchModal(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSearchSubmit} className="mt-3">
              <div className="relative">
                <input
                  type="text"
                  placeholder="Ketik nama produk, mukena, kaos, jeans..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  autoFocus
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-800"
                />
                <Search className="w-4 h-4 text-slate-400 absolute left-3 top-3.5" />
              </div>
              <div className="mt-3 flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setShowSearchModal(false)}
                  className="px-3 py-1.5 text-xs text-slate-600 hover:bg-slate-100 rounded-lg"
                >
                  Batal
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 text-xs font-semibold text-white bg-blue-900 hover:bg-blue-800 rounded-lg"
                >
                  Cari Sekarang
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
};
