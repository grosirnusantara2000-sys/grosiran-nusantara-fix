import React, { useState, useEffect } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Navbar } from './components/Navbar';
import { AppSidebar } from './components/AppSidebar';
import { OutletSelectorModal } from './components/OutletSelectorModal';
import { Hero } from './components/Hero';
import { CategoryGrid } from './components/CategoryGrid';
import { ProductGrid } from './components/ProductGrid';
import { ProductDetailModal } from './components/ProductDetailModal';
import { RequestForm } from './components/RequestForm';
import { CartDrawer } from './components/CartDrawer';
import { Checkout } from './components/Checkout';
import { OrderTrackingView } from './components/OrderTrackingView';
import { TrustSection } from './components/TrustSection';
import { HowItWorks } from './components/HowItWorks';
import { Testimonials } from './components/Testimonials';
import { FAQSection } from './components/FAQSection';
import { AboutSection } from './components/AboutSection';
import { BlogSection } from './components/BlogSection';
import { AdminDashboard } from './components/AdminDashboard';
import { ProductManagementView } from './components/ProductManagementView';
import { QuickPriceEditModal } from './components/QuickPriceEditModal';
import { ProductFormModal } from './components/ProductFormModal';
import { PolicyView } from './components/PolicyViews';
import { Footer } from './components/Footer';
import { WhatsAppButton } from './components/WhatsAppButton';
import { MobileBottomNav } from './components/MobileBottomNav';
import { AdminLoginModal } from './components/AdminLoginModal';
import {
  fetchProducts,
  fetchCategories,
  fetchReviews,
  fetchArticles,
  subscribeToProducts,
} from './services/dataService';
import { Product, Category, Review, Article } from './types';
import { INITIAL_FAQS } from './data/initialData';
import { AlertCircle, CheckCircle, Info, ShieldCheck } from 'lucide-react';

const AppContent: React.FC = () => {
  const {
    currentView,
    setCurrentView,
    toast,
    dataVersion,
    editingProductModal,
    setEditingProductModal,
    isAddProductModalOpen,
    setIsAddProductModalOpen,
    activeOutlet,
    activeOutletInfo,
    isAdmin,
    setIsAdminLoginModalOpen,
  } = useApp();

  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [articles, setArticles] = useState<Article[]>([]);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Strict Dual-Outlet Isolation (Tanah Abang vs Aur Kuning)
  const displayedProducts = React.useMemo(() => {
    return products.filter((p) => {
      const effectiveOutlet = p.outletId || (p.id.startsWith('prod-ta') ? 'TANAH_ABANG' : 'AUR_KUNING');
      return effectiveOutlet === activeOutlet;
    });
  }, [products, activeOutlet]);

  // Real-time synchronization for products across all client devices and visitors
  useEffect(() => {
    const unsubscribe = subscribeToProducts((liveProducts) => {
      if (liveProducts && liveProducts.length > 0) {
        setProducts(liveProducts);
      }
    });
    return () => unsubscribe();
  }, []);

  // Load live data from Firestore / seed on startup and whenever dataVersion updates
  useEffect(() => {
    let isMounted = true;
    async function loadAllData() {
      try {
        const [prods, cats, revs, arts] = await Promise.all([
          fetchProducts(),
          fetchCategories(),
          fetchReviews(),
          fetchArticles(),
        ]);
        if (isMounted) {
          setProducts(prods);
          setCategories(cats);
          setReviews(revs);
          setArticles(arts);
        }
      } catch (err) {
        console.error('Error loading initial data:', err);
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }
    loadAllData();
    return () => {
      isMounted = false;
    };
  }, [dataVersion]);

  return (
    <div className="min-h-screen flex bg-slate-50 text-slate-800">
      {/* Toast Alert */}
      {toast && (
        <div className="fixed top-5 right-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200">
          <div
            className={`flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-xs font-semibold ${
              toast.type === 'success'
                ? 'bg-emerald-800 text-white'
                : toast.type === 'error'
                ? 'bg-red-800 text-white'
                : 'bg-blue-900 text-white'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="w-4 h-4 shrink-0" />}
            {toast.type === 'error' && <AlertCircle className="w-4 h-4 shrink-0" />}
            {toast.type === 'info' && <Info className="w-4 h-4 shrink-0" />}
            <span>{toast.message}</span>
          </div>
        </div>
      )}

      {/* Persistent Left Vertical Sidebar Navigation */}
      <AppSidebar />

      {/* Multi-Outlet Splash / Selector Modal */}
      <OutletSelectorModal />

      {/* Admin / Owner PIN Authentication Modal */}
      <AdminLoginModal />

      {/* Main Content Area (Offset by sidebar width on large screens) */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-72">
        {/* Top Navigation */}
        <Navbar />

        {/* Main Content Router */}
        <main className="flex-1 pb-16 lg:pb-0">
          {currentView === 'home' && (
            <>
              <Hero />
              <CategoryGrid categories={categories} />
              <ProductGrid
                products={displayedProducts}
                categories={categories}
                onOpenDetail={(prod) => setSelectedProduct(prod)}
              />
              <HowItWorks />
              <TrustSection />
              <Testimonials reviews={reviews} />
              <FAQSection faqs={INITIAL_FAQS} />
            </>
          )}

          {currentView === 'catalog' && (
            <>
              <CategoryGrid categories={categories} />
              <ProductGrid
                products={displayedProducts}
                categories={categories}
                onOpenDetail={(prod) => setSelectedProduct(prod)}
              />
            </>
          )}

        {currentView === 'request' && <RequestForm />}
        {currentView === 'my-requests' && <RequestForm />}

        {currentView === 'checkout' && <Checkout />}

        {(currentView === 'orders' || currentView === 'order-detail') && (
          <OrderTrackingView />
        )}

        {currentView === 'about' && <AboutSection />}

        {(currentView === 'blog' || currentView === 'article-detail') && (
          <BlogSection articles={articles} />
        )}

        {currentView === 'manage-products' && (
          isAdmin ? (
            <ProductManagementView />
          ) : (
            <div className="max-w-md mx-auto my-16 p-8 bg-white border border-slate-200 rounded-2xl shadow-lg text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Akses Khusus Owner &amp; Admin</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Halaman kelola produk &amp; harga partai hanya dapat diakses oleh Owner / Admin terverifikasi.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsAdminLoginModalOpen(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-all"
                >
                  Login Admin (PIN)
                </button>
                <button
                  onClick={() => setCurrentView('home')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer transition-all"
                >
                  Kembali ke Beranda
                </button>
              </div>
            </div>
          )
        )}

        {currentView === 'admin' && (
          isAdmin ? (
            <AdminDashboard />
          ) : (
            <div className="max-w-md mx-auto my-16 p-8 bg-white border border-slate-200 rounded-2xl shadow-lg text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mx-auto">
                <ShieldCheck className="w-6 h-6" />
              </div>
              <h2 className="text-lg font-bold text-slate-900">Akses Terproteksi</h2>
              <p className="text-xs text-slate-600 leading-relaxed">
                Panel manajemen toko, integrasi database Google Sheets, dan pencetakan POS thermal diproteksi khusus Admin/Owner.
              </p>
              <div className="flex justify-center gap-3 pt-2">
                <button
                  onClick={() => setIsAdminLoginModalOpen(true)}
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold rounded-xl cursor-pointer shadow-sm transition-all"
                >
                  Login Admin (PIN)
                </button>
                <button
                  onClick={() => setCurrentView('home')}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold rounded-xl cursor-pointer transition-all"
                >
                  Kembali ke Beranda
                </button>
              </div>
            </div>
          )
        )}

        {currentView === 'trust-safety' && <PolicyView type="trust-safety" />}
        {currentView === 'privacy' && <PolicyView type="privacy" />}
        {currentView === 'terms' && <PolicyView type="terms" />}
      </main>

      {/* Modals & Overlays */}
      <ProductDetailModal
        product={selectedProduct}
        onClose={() => setSelectedProduct(null)}
      />

      {/* Owner Quick Price Editor Modal */}
      <QuickPriceEditModal />

      {/* Owner Add / Edit Product Modal */}
      <ProductFormModal
        categories={categories}
        isOpen={isAddProductModalOpen || !!editingProductModal}
        onClose={() => {
          setIsAddProductModalOpen(false);
          setEditingProductModal(null);
        }}
        productToEdit={editingProductModal}
      />

      <CartDrawer />

      {/* Floating WhatsApp Quick Chat */}
      <WhatsAppButton />

      {/* Mobile Bottom Navigation Bar */}
      <MobileBottomNav />

      {/* Global Footer */}
      <Footer />
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
