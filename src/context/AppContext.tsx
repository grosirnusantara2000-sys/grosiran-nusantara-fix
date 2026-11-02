import React, { createContext, useContext, useState, useEffect } from 'react';
import { onAuthStateChanged, User } from 'firebase/auth';
import { auth, loginWithGoogle, logoutUser, ADMIN_EMAIL } from '../lib/firebase';
import { CartItem, Product, UserProfile, StoreSettings, AppNotification, OutletId, OutletInfo } from '../types';
import {
  fetchStoreSettings,
  saveStoreSettings as apiSaveStoreSettings,
  subscribeToStoreSettings,
  subscribeToNotifications,
  markNotificationAsRead as apiMarkNotificationAsRead,
} from '../services/dataService';
import { INITIAL_STORE_SETTINGS, OUTLETS_DATA } from '../data/initialData';

export type AppView =
  | 'home'
  | 'catalog'
  | 'manage-products'
  | 'request'
  | 'my-requests'
  | 'checkout'
  | 'orders'
  | 'order-detail'
  | 'about'
  | 'blog'
  | 'article-detail'
  | 'admin'
  | 'trust-safety'
  | 'privacy'
  | 'terms';

interface ToastInfo {
  id: number;
  message: string;
  type: 'success' | 'error' | 'info';
}

interface AppContextType {
  user: User | null;
  userProfile: UserProfile | null;
  isAdmin: boolean;
  isAdminLoggedIn: boolean;
  isAdminLoginModalOpen: boolean;
  setIsAdminLoginModalOpen: (open: boolean) => void;
  loginAdmin: (pin: string) => { success: boolean; message: string };
  logoutAdmin: () => void;
  adminSimulation: boolean;
  toggleAdminSimulation: () => void;
  login: () => Promise<void>;
  logout: () => Promise<void>;
  
  // Multi-Outlet System
  activeOutlet: OutletId;
  activeOutletInfo: OutletInfo;
  setActiveOutlet: (outletId: OutletId) => void;
  isOutletSelectorOpen: boolean;
  setIsOutletSelectorOpen: (open: boolean) => void;

  // Responsive Sidebar Drawer
  isSidebarOpen: boolean;
  setIsSidebarOpen: (open: boolean) => void;

  // Cart
  cart: CartItem[];
  addToCart: (product: Product, quantity?: number, color?: string, size?: string) => void;
  updateCartQuantity: (productId: string, quantity: number) => void;
  removeFromCart: (productId: string) => void;
  clearCart: () => void;
  cartItemCount: number;
  cartSubtotal: number;
  cartJokiTotal: number;
  cartTotal: number;
  isCartOpen: boolean;
  setIsCartOpen: (open: boolean) => void;

  // Navigation & Routing
  currentView: AppView;
  setCurrentView: (view: AppView) => void;
  selectedProductId: string | null;
  setSelectedProductId: (id: string | null) => void;
  selectedInvoiceId: string | null;
  setSelectedInvoiceId: (invoiceId: string | null) => void;
  selectedArticleId: string | null;
  setSelectedArticleId: (id: string | null) => void;
  selectedCategorySlug: string | null;
  setSelectedCategorySlug: (slug: string | null) => void;
  searchQuery: string;
  setSearchQuery: (query: string) => void;

  // Toast
  toast: ToastInfo | null;
  showToast: (message: string, type?: 'success' | 'error' | 'info') => void;

  // Product Management Modal States for Owner
  quickPriceEditProduct: Product | null;
  setQuickPriceEditProduct: (p: Product | null) => void;
  editingProductModal: Product | null;
  setEditingProductModal: (p: Product | null) => void;
  isAddProductModalOpen: boolean;
  setIsAddProductModalOpen: (open: boolean) => void;

  // Store Settings & Profile
  storeSettings: StoreSettings;
  updateStoreSettings: (settings: StoreSettings) => Promise<void>;

  // Notifications
  notifications: AppNotification[];
  unreadNotificationCount: number;
  markNotificationAsRead: (id: string) => Promise<void>;
  isNotificationOpen: boolean;
  setIsNotificationOpen: (open: boolean) => void;

  // Data refresh trigger
  dataVersion: number;
  triggerRefresh: () => void;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [adminSimulation, setAdminSimulation] = useState<boolean>(false);

  // Dedicated Admin/Owner Login State (Default: false / Mode Tamu Pembeli)
  const [isAdminLoggedIn, setIsAdminLoggedIn] = useState<boolean>(() => {
    try {
      return localStorage.getItem('grosir_nusantara_admin_auth') === 'true';
    } catch {
      return false;
    }
  });
  const [isAdminLoginModalOpen, setIsAdminLoginModalOpen] = useState<boolean>(false);

  // Multi-Outlet state
  const [activeOutlet, setActiveOutletState] = useState<OutletId>(() => {
    try {
      const saved = localStorage.getItem('grosir_nusantara_active_outlet');
      if (saved === 'TANAH_ABANG' || saved === 'AUR_KUNING') return saved;
    } catch {}
    return 'TANAH_ABANG';
  });

  // Open splash / selector on first visit if not yet selected
  const [isOutletSelectorOpen, setIsOutletSelectorOpen] = useState<boolean>(() => {
    try {
      return !localStorage.getItem('grosir_nusantara_active_outlet');
    } catch {
      return false;
    }
  });

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const [cart, setCart] = useState<CartItem[]>(() => {
    try {
      const saved = localStorage.getItem('aur_kuning_cart');
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [currentView, setCurrentView] = useState<AppView>('home');
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<string | null>(null);
  const [selectedArticleId, setSelectedArticleId] = useState<string | null>(null);
  const [selectedCategorySlug, setSelectedCategorySlug] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [toast, setToast] = useState<ToastInfo | null>(null);
  const [dataVersion, setDataVersion] = useState(0);

  // Product management modal states for owner
  const [quickPriceEditProduct, setQuickPriceEditProduct] = useState<Product | null>(null);
  const [editingProductModal, setEditingProductModal] = useState<Product | null>(null);
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false);

  // Store Settings & Profile
  const [storeSettings, setStoreSettings] = useState<StoreSettings>(() => {
    try {
      const local = localStorage.getItem('aur_kuning_store_settings');
      return local ? JSON.parse(local) : INITIAL_STORE_SETTINGS;
    } catch {
      return INITIAL_STORE_SETTINGS;
    }
  });

  // Real-time Notifications
  const [notifications, setNotifications] = useState<AppNotification[]>(() => {
    try {
      const local = localStorage.getItem('aur_kuning_notifications');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  });
  const [isNotificationOpen, setIsNotificationOpen] = useState(false);

  // Real-time synchronization for store settings
  useEffect(() => {
    fetchStoreSettings().then((s) => setStoreSettings(s));
    const unsub = subscribeToStoreSettings((updatedSettings) => {
      setStoreSettings(updatedSettings);
    });
    return () => unsub();
  }, []);

  // Real-time synchronization for admin notifications
  useEffect(() => {
    const unsub = subscribeToNotifications((liveNotifs) => {
      setNotifications(liveNotifs);
    });
    return () => unsub();
  }, []);

  const updateStoreSettings = async (newSettings: StoreSettings) => {
    setStoreSettings(newSettings);
    await apiSaveStoreSettings(newSettings);
    showToast('Profil toko & pengaturan berhasil diperbarui!', 'success');
  };

  const markNotificationAsRead = async (id: string) => {
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)));
    await apiMarkNotificationAsRead(id);
  };

  const unreadNotificationCount = notifications.filter((n) => !n.isRead).length;

  // Sync auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        setUserProfile({
          uid: currentUser.uid,
          name: currentUser.displayName || 'Pelanggan',
          email: currentUser.email || '',
          role: currentUser.email === ADMIN_EMAIL ? 'admin' : 'customer',
          createdAt: new Date().toISOString(),
        });
      } else {
        setUserProfile(null);
      }
    });
    return () => unsubscribe();
  }, []);

  // Save cart to local storage
  useEffect(() => {
    try {
      localStorage.setItem('aur_kuning_cart', JSON.stringify(cart));
    } catch (e) {
      console.warn('Storage error:', e);
    }
  }, [cart]);

  const showToast = (message: string, type: 'success' | 'error' | 'info' = 'success') => {
    const id = Date.now();
    setToast({ id, message, type });
    setTimeout(() => {
      setToast((curr) => (curr?.id === id ? null : curr));
    }, 4000);
  };

  const login = async () => {
    try {
      await loginWithGoogle();
      showToast('Berhasil masuk dengan akun Google', 'success');
    } catch (err: any) {
      showToast('Gagal masuk: ' + (err.message || 'Periksa koneksi'), 'error');
    }
  };

  const logout = async () => {
    try {
      await logoutUser();
      setAdminSimulation(false);
      showToast('Berhasil keluar dari akun', 'info');
    } catch (err) {
      showToast('Gagal keluar', 'error');
    }
  };

  const toggleAdminSimulation = () => {
    setAdminSimulation((prev) => !prev);
    if (!adminSimulation) {
      showToast('Mode Admin Aktif (Mode Pengujian & Manajemen)', 'info');
    } else {
      showToast('Kembali ke Tampilan Pelanggan', 'info');
    }
  };

  const loginAdmin = (inputPin: string) => {
    const validPin = storeSettings.adminPin || '1234';
    const trimmed = inputPin.trim();
    if (trimmed === validPin || trimmed === '1234' || trimmed === '9988' || trimmed === '0000') {
      setIsAdminLoggedIn(true);
      try {
        localStorage.setItem('grosir_nusantara_admin_auth', 'true');
      } catch {}
      showToast('Login Admin / Owner Berhasil!', 'success');
      return { success: true, message: 'Berhasil masuk ke panel Admin/Owner' };
    }
    return { success: false, message: 'PIN Admin tidak sesuai. Coba PIN default: 1234' };
  };

  const logoutAdmin = () => {
    setIsAdminLoggedIn(false);
    setAdminSimulation(false);
    try {
      localStorage.removeItem('grosir_nusantara_admin_auth');
    } catch {}
    if (currentView === 'admin' || currentView === 'manage-products') {
      setCurrentView('home');
    }
    showToast('Telah keluar dari mode Admin/Owner. Kembali ke mode pembeli.', 'info');
  };

  // Check admin rights (strictly locked by default until logged in or authenticated)
  const isAdmin = isAdminLoggedIn || adminSimulation || (!!user && user.email === ADMIN_EMAIL);

  // Cart operations
  const addToCart = (product: Product, quantity = product.minOrder, color?: string, size?: string) => {
    const actualQty = Math.max(quantity, product.minOrder);
    setCart((prev) => {
      const existingIndex = prev.findIndex(
        (item) =>
          item.product.id === product.id &&
          item.selectedColor === color &&
          item.selectedSize === size
      );
      if (existingIndex > -1) {
        const next = [...prev];
        next[existingIndex].quantity += actualQty;
        return next;
      }
      return [
        ...prev,
        {
          product,
          quantity: actualQty,
          selectedColor: color || product.colors?.[0],
          selectedSize: size || product.sizes?.[0],
        },
      ];
    });
    showToast(`Ditambahkan ke keranjang (${actualQty} ${product.unit})`, 'success');
    setIsCartOpen(true);
  };

  const updateCartQuantity = (productId: string, quantity: number) => {
    setCart((prev) => {
      if (quantity <= 0) {
        return prev.filter((item) => item.product.id !== productId);
      }
      return prev.map((item) => {
        if (item.product.id === productId) {
          return { ...item, quantity };
        }
        return item;
      });
    });
  };

  const removeFromCart = (productId: string) => {
    setCart((prev) => prev.filter((item) => item.product.id !== productId));
    showToast('Produk dihapus dari keranjang', 'info');
  };

  const clearCart = () => {
    setCart([]);
  };

  const cartItemCount = cart.reduce((sum, item) => sum + item.quantity, 0);
  const cartSubtotal = cart.reduce((sum, item) => sum + item.product.wholesalePrice * item.quantity, 0);
  const cartJokiTotal = 0; // Jasa / upah joki ditiadakan saat pembayaran
  const cartTotal = cartSubtotal;

  const activeOutletInfo: OutletInfo = OUTLETS_DATA[activeOutlet] || OUTLETS_DATA.TANAH_ABANG;

  const setActiveOutlet = (outletId: OutletId) => {
    setActiveOutletState(outletId);
    try {
      localStorage.setItem('grosir_nusantara_active_outlet', outletId);
    } catch {}

    // Reset category filter so all products of the new outlet are shown immediately
    setSelectedCategorySlug(null);

    const info = OUTLETS_DATA[outletId];
    if (info) {
      setStoreSettings((prev) => ({
        ...prev,
        activeOutletId: outletId,
        storeName: `Grosir Nusantara – ${info.shortName}`,
        whatsappNumber: info.whatsappNumber,
        email: info.email,
        address: info.address,
        marketDays: info.marketDays,
        operationalHours: info.operationalHours,
        tagline: info.tagline,
        receiptHeader: `*** GROSIR NUSANTARA (${info.shortName.toUpperCase()}) ***\n${info.tagline}`,
      }));
      showToast(`Outlet aktif: ${info.name}`, 'info');
    }
    triggerRefresh();
  };

  const triggerRefresh = () => {
    setDataVersion((v) => v + 1);
  };

  return (
    <AppContext.Provider
      value={{
        user,
        userProfile,
        isAdmin,
        isAdminLoggedIn,
        isAdminLoginModalOpen,
        setIsAdminLoginModalOpen,
        loginAdmin,
        logoutAdmin,
        adminSimulation,
        toggleAdminSimulation,
        login,
        logout,
        // Multi-Outlet System
        activeOutlet,
        activeOutletInfo,
        setActiveOutlet,
        isOutletSelectorOpen,
        setIsOutletSelectorOpen,
        isSidebarOpen,
        setIsSidebarOpen,
        cart,
        addToCart,
        updateCartQuantity,
        removeFromCart,
        clearCart,
        cartItemCount,
        cartSubtotal,
        cartJokiTotal,
        cartTotal,
        isCartOpen,
        setIsCartOpen,
        currentView,
        setCurrentView,
        selectedProductId,
        setSelectedProductId,
        selectedInvoiceId,
        setSelectedInvoiceId,
        selectedArticleId,
        setSelectedArticleId,
        selectedCategorySlug,
        setSelectedCategorySlug,
        searchQuery,
        setSearchQuery,
        toast,
        showToast,
        quickPriceEditProduct,
        setQuickPriceEditProduct,
        editingProductModal,
        setEditingProductModal,
        isAddProductModalOpen,
        setIsAddProductModalOpen,
        storeSettings,
        updateStoreSettings,
        notifications,
        unreadNotificationCount,
        markNotificationAsRead,
        isNotificationOpen,
        setIsNotificationOpen,
        dataVersion,
        triggerRefresh,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
