import React, { useState, useEffect } from 'react';
import { useApp } from '../context/AppContext';
import {
  fetchAllRequests,
  fetchAllOrders,
  fetchProducts,
  fetchCategories,
  updateRequestStatus,
  updateOrderDetails,
  saveProduct,
  removeProduct,
  saveCategory,
  seedInitialDataToFirestore,
  recordActivityLog,
} from '../services/dataService';
import {
  Product,
  Category,
  ProductRequest,
  Order,
  OrderStatus,
  PaymentStatus,
  RequestStatus,
} from '../types';
import {
  Search,
  LayoutGrid,
  Paintbrush,
  FileCode,
  FileText,
  ChevronDown,
  ChevronRight,
  Store,
  Database,
  History,
  HardDrive,
  Printer,
  ShoppingBag,
  Package,
  Layers,
  Sparkles,
  HelpCircle,
  X,
  Check,
  Share2,
  ExternalLink,
  Plus,
  Edit,
  Trash2,
  RefreshCw,
  Eye,
  Send,
  MessageCircle,
  Truck,
  CheckCircle2,
  Clock,
  Sliders,
  DollarSign,
} from 'lucide-react';
import { StoreProfileView } from './StoreProfileView';
import { GoogleSheetsSettingsView } from './GoogleSheetsSettingsView';
import { ActivityLogView } from './ActivityLogView';
import { BackupRestoreView } from './BackupRestoreView';
import { ThermalReceiptModal } from './ThermalReceiptModal';
import { formatWhatsappReceiptText } from '../services/dataService';

export const AdminDashboard: React.FC = () => {
  const {
    showToast,
    triggerRefresh,
    dataVersion,
    setCurrentView,
    setQuickPriceEditProduct,
    storeSettings,
  } = useApp();

  // Top Tabs: [Manage] vs [Design] matching image_0.png
  const [topTab, setTopTab] = useState<'manage' | 'design'>('manage');
  const [menuSearch, setMenuSearch] = useState('');

  // Selected Active Menu Item
  const [activeMenu, setActiveMenu] = useState<
    | 'store_profile'
    | 'database_sheets'
    | 'activity_log'
    | 'backup_restore'
    | 'pos_orders'
    | 'inventory_products'
    | 'shopping_requests'
    | 'design_template'
    | 'design_page'
    | 'design_header'
    | 'design_body'
    | 'side_widget'
    | 'side_menu'
    | 'side_background'
  >('store_profile');

  // Accordion Expand States
  const [expandedMenus, setExpandedMenus] = useState<Record<string, boolean>>({
    header: false,
    body: false,
    side: true, // open by default as in image_0.png
  });

  const toggleAccordion = (key: string) => {
    setExpandedMenus((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  // Live Data States
  const [orders, setOrders] = useState<Order[]>([]);
  const [requests, setRequests] = useState<ProductRequest[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Thermal Receipt Modal State
  const [receiptOrder, setReceiptOrder] = useState<Order | null>(null);
  const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);

  // Order Details / Edit Modal State
  const [selectedOrderForEdit, setSelectedOrderForEdit] = useState<Order | null>(null);
  const [editOrderStatus, setEditOrderStatus] = useState<OrderStatus>('Pesanan Diproses');
  const [editPaymentStatus, setEditPaymentStatus] = useState<PaymentStatus>('Lunas');
  const [editTrackingNumber, setEditTrackingNumber] = useState('');
  const [editTrackingLink, setEditTrackingLink] = useState('');

  // Request Offer Modal State
  const [selectedRequestForOffer, setSelectedRequestForOffer] = useState<ProductRequest | null>(null);
  const [offerItemPrice, setOfferItemPrice] = useState(0);
  const [offerShipping, setOfferShipping] = useState(35000);
  const [offerNotes, setOfferNotes] = useState('');

  // Product Add / Edit Modal State
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [isProductModalOpen, setIsProductModalOpen] = useState(false);

  // Widget sample items for the exact image_0.png "Side Widget" view
  const [widgetItems, setWidgetItems] = useState([
    { id: '1', title: 'Text', action: 'Edit text', enabled: false },
    { id: '2', title: 'All Product Category', action: 'Style', enabled: false },
    { id: '3', title: 'Product Item Box', action: 'Manage', enabled: false },
    { id: '4', title: 'Side Menu', action: 'Style Manage', enabled: true },
    { id: '5', title: 'Facebook Like Box', action: 'use in Footer', enabled: false, note: 'use in Footer' },
    { id: '6', title: 'Banner', action: 'Manage', enabled: false },
  ]);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [ords, reqs, prods, cats] = await Promise.all([
        fetchAllOrders(),
        fetchAllRequests(),
        fetchProducts(),
        fetchCategories(),
      ]);
      setOrders(ords);
      setRequests(reqs);
      setProducts(prods);
      setCategories(cats);
    } catch (err) {
      console.error('Failed to load dashboard data:', err);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [dataVersion]);

  // Handle Send WhatsApp Receipt
  const handleSendWhatsappReceipt = async (order: Order) => {
    const rawWa = order.customerWhatsapp.replace(/\D/g, '');
    const cleanWa = rawWa.startsWith('0') ? '62' + rawWa.substring(1) : rawWa;
    const message = formatWhatsappReceiptText(order, storeSettings);
    const waUrl = `https://wa.me/${cleanWa}?text=${encodeURIComponent(message)}`;

    await recordActivityLog(
      'Kirim Struk WhatsApp',
      'order',
      `Kirim nota digital invoice ${order.invoiceNumber} ke ${order.customerName} (${order.customerWhatsapp}).`,
      'success'
    );

    window.open(waUrl, '_blank');
  };

  // Handle Open Thermal Print
  const handleOpenReceipt = (order: Order) => {
    setReceiptOrder(order);
    setIsReceiptModalOpen(true);
  };

  // Handle Order Status Update
  const handleSaveOrderStatus = async () => {
    if (!selectedOrderForEdit) return;

    try {
      await updateOrderDetails(selectedOrderForEdit.id, {
        orderStatus: editOrderStatus,
        paymentStatus: editPaymentStatus,
        trackingNumber: editTrackingNumber.trim(),
        trackingLink: editTrackingLink.trim(),
      });

      await recordActivityLog(
        'Update Status Pesanan',
        'order',
        `Invoice ${selectedOrderForEdit.invoiceNumber}: Status ${editOrderStatus}, Pembayaran ${editPaymentStatus}.`,
        'success'
      );

      showToast('Status pesanan berhasil diperbarui!', 'success');
      setSelectedOrderForEdit(null);
      loadData();
      triggerRefresh();
    } catch (err: any) {
      showToast('Gagal update status: ' + err.message, 'error');
    }
  };

  // Handle Submit Offer for Request
  const handleSubmitOffer = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRequestForOffer) return;

    try {
      const totalOffer = Number(offerItemPrice) + Number(offerShipping);
      await updateRequestStatus(
        selectedRequestForOffer.id,
        'Menunggu Persetujuan Harga',
        {
          itemPricePerUnit: Number(offerItemPrice),
          jokiFee: 0,
          estimatedShipping: Number(offerShipping),
          totalOffer,
          adminNotes: offerNotes,
          offerDate: new Date().toISOString(),
        }
      );

      await recordActivityLog(
        'Kirim Penawaran Harga Sourcing',
        'order',
        `Tiket ${selectedRequestForOffer.ticketNumber}: Penawaran total Rp${totalOffer.toLocaleString('id-ID')}.`,
        'success'
      );

      showToast('Penawaran harga berhasil dikirim ke pelanggan!', 'success');
      setSelectedRequestForOffer(null);
      loadData();
      triggerRefresh();
    } catch (err: any) {
      showToast('Gagal mengirim penawaran: ' + err.message, 'error');
    }
  };

  // Handle Save Product
  const handleSaveProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!editingProduct) return;

    try {
      await saveProduct(editingProduct);
      await recordActivityLog(
        'Simpan Produk Katalog',
        'product',
        `Produk "${editingProduct.name}" berhasil disimpan.`,
        'success'
      );
      showToast('Produk berhasil disimpan!', 'success');
      setIsProductModalOpen(false);
      setEditingProduct(null);
      loadData();
      triggerRefresh();
    } catch (err: any) {
      showToast('Gagal menyimpan produk: ' + err.message, 'error');
    }
  };

  // Handle Delete Product
  const handleDeleteProduct = async (id: string, name: string) => {
    if (!window.confirm(`Hapus produk "${name}" dari katalog grosir?`)) return;
    try {
      await removeProduct(id);
      await recordActivityLog(
        'Hapus Produk Katalog',
        'product',
        `Produk "${name}" (ID: ${id}) dihapus dari database.`,
        'warning'
      );
      showToast('Produk berhasil dihapus!', 'success');
      loadData();
      triggerRefresh();
    } catch (err: any) {
      showToast('Gagal menghapus produk: ' + err.message, 'error');
    }
  };

  // Filter menu items by search input
  const matchesSearch = (text: string) => {
    if (!menuSearch.trim()) return true;
    return text.toLowerCase().includes(menuSearch.toLowerCase());
  };

  return (
    <div className="bg-[#21262d] min-h-[calc(100vh-4.5rem)] text-slate-200 flex flex-col">
      {/* Top Breadcrumb Bar */}
      <div className="bg-[#1b1f24] px-4 py-2 border-b border-[#2d333b] flex items-center justify-between text-xs text-slate-400">
        <div className="flex items-center gap-2">
          <Store className="w-4 h-4 text-cyan-400" />
          <span className="text-white font-semibold">{storeSettings.storeName}</span>
          <span>/</span>
          <span className="text-cyan-400 uppercase font-mono tracking-wider text-[11px]">
            {topTab === 'manage' ? 'Sistem Manajemen (POS & Admin)' : 'Layout & Design Toko'}
          </span>
        </div>
        <div className="flex items-center gap-3">
          <span className="text-emerald-400 text-[11px] flex items-center gap-1 font-mono">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            Online (Aur Kuning)
          </span>
          <button
            type="button"
            onClick={() => setCurrentView('catalog')}
            className="text-slate-400 hover:text-white flex items-center gap-1 text-[11px] cursor-pointer"
          >
            <span>Katalog Depan</span>
            <ExternalLink className="w-3 h-3" />
          </button>
        </div>
      </div>

      {/* Main Split Layout: Left Navigation Tree (image_0.png) + Right Content Area */}
      <div className="flex-1 flex flex-col md:flex-row overflow-hidden">
        
        {/* ======================================================== */}
        {/* AREA NAVIGASI KIRI (PERSIS STRUKTUR GAMBAR image_0.png) */}
        {/* ======================================================== */}
        <aside className="w-full md:w-64 bg-[#2b333e] border-r border-[#3a4452] flex flex-col shrink-0 select-none">
          
          {/* 1. Search Menu Input (Matching Top Input in image_0.png) */}
          <div className="p-3 bg-[#242b35] border-b border-[#363f4d]">
            <div className="relative">
              <input
                type="text"
                value={menuSearch}
                onChange={(e) => setMenuSearch(e.target.value)}
                placeholder="Search Menu"
                className="w-full bg-[#1b2129] text-slate-200 placeholder-slate-500 text-xs pl-3 pr-8 py-2 rounded border border-[#374251] focus:outline-none focus:border-cyan-500 font-sans"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute right-2.5 top-1/2 -translate-y-1/2" />
            </div>
          </div>

          {/* 2. Top Tabs: [Manage] and [Design] (Matching image_0.png with orange border indicator) */}
          <div className="flex border-b border-[#3a4452] bg-[#242b35]">
            <button
              type="button"
              onClick={() => {
                setTopTab('manage');
                setActiveMenu('store_profile');
              }}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                topTab === 'manage'
                  ? 'text-white border-b-2 border-orange-500 bg-[#2b333e]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#28303b]'
              }`}
            >
              <LayoutGrid className="w-3.5 h-3.5" />
              <span>Manage</span>
            </button>

            <button
              type="button"
              onClick={() => {
                setTopTab('design');
                setActiveMenu('side_widget');
              }}
              className={`flex-1 py-3 text-xs font-bold flex items-center justify-center gap-1.5 transition-all cursor-pointer ${
                topTab === 'design'
                  ? 'text-white border-b-2 border-orange-500 bg-[#2b333e]'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-[#28303b]'
              }`}
            >
              <Paintbrush className="w-3.5 h-3.5" />
              <span>Design</span>
            </button>
          </div>

          {/* 3. Vertical Navigation Tree Menu */}
          <div className="flex-1 overflow-y-auto py-2 divide-y divide-[#323c4a]">
            
            {/* If MANAGE Tab is Active */}
            {topTab === 'manage' && (
              <div className="space-y-0.5 text-xs font-medium text-slate-300">
                
                {/* Section Header: Admin / Owner */}
                <div className="px-4 py-2 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Admin &amp; Toko (Fitur Baru)
                </div>

                {/* 1. Profil Toko (NEW requested by user) */}
                {matchesSearch('Profil Toko') && (
                  <button
                    type="button"
                    onClick={() => setActiveMenu('store_profile')}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors text-left cursor-pointer ${
                      activeMenu === 'store_profile'
                        ? 'bg-[#1e2530] text-cyan-400 font-bold border-l-3 border-cyan-400'
                        : 'hover:bg-[#343e4c] text-slate-300'
                    }`}
                  >
                    <Store className="w-4 h-4 shrink-0" />
                    <span>Profil Toko</span>
                  </button>
                )}

                {/* 2. Database (Sheets) (NEW requested by user) */}
                {matchesSearch('Database Sheets') && (
                  <button
                    type="button"
                    onClick={() => setActiveMenu('database_sheets')}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors text-left cursor-pointer ${
                      activeMenu === 'database_sheets'
                        ? 'bg-[#1e2530] text-cyan-400 font-bold border-l-3 border-cyan-400'
                        : 'hover:bg-[#343e4c] text-slate-300'
                    }`}
                  >
                    <Database className="w-4 h-4 shrink-0 text-emerald-400" />
                    <span>Database (Sheets)</span>
                  </button>
                )}

                {/* 3. Log Aktivitas (NEW requested by user) */}
                {matchesSearch('Log Aktivitas') && (
                  <button
                    type="button"
                    onClick={() => setActiveMenu('activity_log')}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors text-left cursor-pointer ${
                      activeMenu === 'activity_log'
                        ? 'bg-[#1e2530] text-cyan-400 font-bold border-l-3 border-cyan-400'
                        : 'hover:bg-[#343e4c] text-slate-300'
                    }`}
                  >
                    <History className="w-4 h-4 shrink-0 text-purple-400" />
                    <span>Log Aktivitas</span>
                  </button>
                )}

                {/* 4. Backup & Restore (NEW requested by user) */}
                {matchesSearch('Backup Restore') && (
                  <button
                    type="button"
                    onClick={() => setActiveMenu('backup_restore')}
                    className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors text-left cursor-pointer ${
                      activeMenu === 'backup_restore'
                        ? 'bg-[#1e2530] text-cyan-400 font-bold border-l-3 border-cyan-400'
                        : 'hover:bg-[#343e4c] text-slate-300'
                    }`}
                  >
                    <HardDrive className="w-4 h-4 shrink-0 text-indigo-400" />
                    <span>Backup &amp; Restore</span>
                  </button>
                )}

                {/* Section Header: Operasional Kasir & Belanja */}
                <div className="px-4 pt-3 pb-1.5 text-[10px] uppercase font-bold tracking-wider text-slate-400">
                  Operasional Pasar Aur Kuning
                </div>

                {/* 5. POS & Transaksi (with thermal print & WA) */}
                {matchesSearch('POS Transaksi Pesanan') && (
                  <button
                    type="button"
                    onClick={() => setActiveMenu('pos_orders')}
                    className={`w-full px-4 py-2.5 flex items-center justify-between transition-colors text-left cursor-pointer ${
                      activeMenu === 'pos_orders'
                        ? 'bg-[#1e2530] text-cyan-400 font-bold border-l-3 border-cyan-400'
                        : 'hover:bg-[#343e4c] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <ShoppingBag className="w-4 h-4 shrink-0 text-blue-400" />
                      <span>POS &amp; Transaksi</span>
                    </div>
                    {orders.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-blue-900 text-blue-200 text-[10px] font-mono">
                        {orders.length}
                      </span>
                    )}
                  </button>
                )}

                {/* 6. Inventori & Produk */}
                {matchesSearch('Inventori Produk Katalog') && (
                  <button
                    type="button"
                    onClick={() => setActiveMenu('inventory_products')}
                    className={`w-full px-4 py-2.5 flex items-center justify-between transition-colors text-left cursor-pointer ${
                      activeMenu === 'inventory_products'
                        ? 'bg-[#1e2530] text-cyan-400 font-bold border-l-3 border-cyan-400'
                        : 'hover:bg-[#343e4c] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Package className="w-4 h-4 shrink-0 text-amber-400" />
                      <span>Inventori &amp; Produk</span>
                    </div>
                    {products.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-slate-700 text-slate-300 text-[10px] font-mono">
                        {products.length}
                      </span>
                    )}
                  </button>
                )}

                {/* 7. Request Belanja Sourcing */}
                {matchesSearch('Request Belanja') && (
                  <button
                    type="button"
                    onClick={() => setActiveMenu('shopping_requests')}
                    className={`w-full px-4 py-2.5 flex items-center justify-between transition-colors text-left cursor-pointer ${
                      activeMenu === 'shopping_requests'
                        ? 'bg-[#1e2530] text-cyan-400 font-bold border-l-3 border-cyan-400'
                        : 'hover:bg-[#343e4c] text-slate-300'
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <Sparkles className="w-4 h-4 shrink-0 text-orange-400" />
                      <span>Request Belanja</span>
                    </div>
                    {requests.length > 0 && (
                      <span className="px-1.5 py-0.5 rounded-full bg-orange-950 text-orange-300 text-[10px] font-mono">
                        {requests.length}
                      </span>
                    )}
                  </button>
                )}
              </div>
            )}

            {/* If DESIGN Tab is Active (Exact hierarchical match to image_0.png) */}
            {topTab === 'design' && (
              <div className="space-y-0.5 text-xs font-medium text-slate-300">
                {/* 1. Template */}
                <button
                  type="button"
                  onClick={() => setActiveMenu('design_template')}
                  className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors text-left cursor-pointer ${
                    activeMenu === 'design_template'
                      ? 'bg-[#1e2530] text-cyan-400 font-bold border-l-3 border-cyan-400'
                      : 'hover:bg-[#343e4c] text-slate-300'
                  }`}
                >
                  <FileCode className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>Template</span>
                </button>

                {/* 2. Page */}
                <button
                  type="button"
                  onClick={() => setActiveMenu('design_page')}
                  className={`w-full px-4 py-2.5 flex items-center gap-3 transition-colors text-left cursor-pointer ${
                    activeMenu === 'design_page'
                      ? 'bg-[#1e2530] text-cyan-400 font-bold border-l-3 border-cyan-400'
                      : 'hover:bg-[#343e4c] text-slate-300'
                  }`}
                >
                  <FileText className="w-4 h-4 shrink-0 text-slate-400" />
                  <span>Page</span>
                </button>

                {/* 3. Header (Accordion) */}
                <div>
                  <button
                    type="button"
                    onClick={() => toggleAccordion('header')}
                    className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-[#343e4c] text-slate-300 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <Layers className="w-4 h-4 shrink-0 text-slate-400" />
                      <span>Header</span>
                    </div>
                    {expandedMenus.header ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  {expandedMenus.header && (
                    <div className="pl-11 pr-4 py-1 space-y-1 bg-[#242b35]/80 text-[11px] text-slate-400">
                      <div
                        onClick={() => setActiveMenu('design_header')}
                        className="py-1 hover:text-white cursor-pointer"
                      >
                        Top Bar &amp; Kontak Pasar
                      </div>
                      <div
                        onClick={() => setActiveMenu('design_header')}
                        className="py-1 hover:text-white cursor-pointer"
                      >
                        Logo &amp; Navigasi
                      </div>
                    </div>
                  )}
                </div>

                {/* 4. Body (Accordion) */}
                <div>
                  <button
                    type="button"
                    onClick={() => toggleAccordion('body')}
                    className="w-full px-4 py-2.5 flex items-center justify-between hover:bg-[#343e4c] text-slate-300 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <LayoutGrid className="w-4 h-4 shrink-0 text-slate-400" />
                      <span>Body</span>
                    </div>
                    {expandedMenus.body ? (
                      <ChevronDown className="w-4 h-4 text-slate-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-slate-400" />
                    )}
                  </button>
                  {expandedMenus.body && (
                    <div className="pl-11 pr-4 py-1 space-y-1 bg-[#242b35]/80 text-[11px] text-slate-400">
                      <div
                        onClick={() => setActiveMenu('design_body')}
                        className="py-1 hover:text-white cursor-pointer"
                      >
                        Hero Banner Aur Kuning
                      </div>
                      <div
                        onClick={() => setActiveMenu('design_body')}
                        className="py-1 hover:text-white cursor-pointer"
                      >
                        Grid Kategori &amp; Promo
                      </div>
                    </div>
                  )}
                </div>

                {/* 5. Side (Accordion - EXACT match to image_0.png) */}
                <div>
                  <button
                    type="button"
                    onClick={() => toggleAccordion('side')}
                    className="w-full px-4 py-2.5 flex items-center justify-between bg-[#1e2530] text-cyan-400 font-semibold border-l-3 border-cyan-400 transition-colors text-left cursor-pointer"
                  >
                    <div className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded-xs border border-cyan-400 flex items-center justify-center text-[10px]">
                        ◫
                      </div>
                      <span className="font-bold">Side</span>
                    </div>
                    {expandedMenus.side ? (
                      <ChevronDown className="w-4 h-4 text-cyan-400" />
                    ) : (
                      <ChevronRight className="w-4 h-4 text-cyan-400" />
                    )}
                  </button>

                  {/* Sub-items matching image_0.png: Side menu, Widget (2), Background */}
                  {expandedMenus.side && (
                    <div className="pl-11 pr-4 py-1.5 space-y-1 bg-[#1e2530] text-xs">
                      <div
                        onClick={() => setActiveMenu('side_menu')}
                        className={`py-1.5 cursor-pointer transition-colors ${
                          activeMenu === 'side_menu'
                            ? 'text-cyan-300 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Side menu
                      </div>

                      {/* Widget (Active #2 in image_0.png) */}
                      <div
                        onClick={() => setActiveMenu('side_widget')}
                        className={`py-1.5 flex items-center justify-between cursor-pointer transition-colors ${
                          activeMenu === 'side_widget'
                            ? 'text-white font-extrabold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        <span>Widget</span>
                        <span className="w-5 h-5 rounded-full bg-red-600 text-white font-bold text-[10px] flex items-center justify-center">
                          2
                        </span>
                      </div>

                      <div
                        onClick={() => setActiveMenu('side_background')}
                        className={`py-1.5 cursor-pointer transition-colors ${
                          activeMenu === 'side_background'
                            ? 'text-cyan-300 font-bold'
                            : 'text-slate-400 hover:text-slate-200'
                        }`}
                      >
                        Background
                      </div>
                    </div>
                  )}
                </div>

              </div>
            )}

          </div>

          {/* Sidebar Footer: Quick Status */}
          <div className="p-3 bg-[#1e2530] border-t border-[#3a4452] text-[11px] text-slate-400 flex items-center justify-between">
            <span className="truncate">Lapak Pasar Aur Kuning</span>
            <span className="font-mono text-cyan-400 font-bold">POS v2.5</span>
          </div>

        </aside>

        {/* ======================================================== */}
        {/* AREA KONTEN UTAMA (HALAMAN PENGATURAN & POS / TRANSAKSI) */}
        {/* ======================================================== */}
        <main className="flex-1 bg-slate-100 overflow-y-auto p-4 sm:p-6 lg:p-8">
          
          {/* VIEW 1: PROFIL TOKO (Side Widget Style) */}
          {activeMenu === 'store_profile' && <StoreProfileView />}

          {/* VIEW 2: DATABASE (SHEETS) & APPS SCRIPT (Side Widget Style) */}
          {activeMenu === 'database_sheets' && <GoogleSheetsSettingsView />}

          {/* VIEW 3: LOG AKTIVITAS (Audit Trail) */}
          {activeMenu === 'activity_log' && <ActivityLogView />}

          {/* VIEW 4: BACKUP & RESTORE DATABASE MANDIRI */}
          {activeMenu === 'backup_restore' && <BackupRestoreView />}

          {/* VIEW 5: SIDE WIDGET (Exact Replica of image_0.png) */}
          {activeMenu === 'side_widget' && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 overflow-hidden">
              {/* Top Header: "Side Widget" with ? and X */}
              <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-white">
                <h2 className="text-xl font-bold text-slate-800 tracking-tight">
                  Side Widget
                </h2>
                <div className="flex items-center gap-2 text-slate-400">
                  <button
                    type="button"
                    className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                  >
                    <HelpCircle className="w-5 h-5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => setActiveMenu('store_profile')}
                    className="p-1.5 hover:text-slate-700 hover:bg-slate-100 rounded-full transition-colors cursor-pointer"
                  >
                    <X className="w-5 h-5 font-bold" />
                  </button>
                </div>
              </div>

              {/* Rows replicating image_0.png */}
              <div className="divide-y divide-slate-100 text-sm">
                {widgetItems.map((item) => (
                  <div
                    key={item.id}
                    className="p-4 hover:bg-slate-50/60 transition-colors flex items-center justify-between"
                  >
                    <div className="flex items-center gap-3">
                      <span className="text-slate-400 cursor-grab font-bold select-none text-base">
                        ⋮⋮
                      </span>
                      <span className="font-semibold text-slate-800 text-[13px]">
                        {item.title}
                      </span>
                    </div>

                    <div className="flex items-center gap-4">
                      {item.note && (
                        <span className="text-xs text-red-600 font-medium">{item.note}</span>
                      )}
                      {item.action && !item.note && (
                        <div className="flex items-center gap-3">
                          {item.action.split(' ').map((act, i) => (
                            <button
                              key={i}
                              type="button"
                              className="text-xs font-medium text-slate-600 hover:text-cyan-700 hover:underline cursor-pointer"
                            >
                              {act}
                            </button>
                          ))}
                        </div>
                      )}

                      {/* On / Off switch */}
                      <button
                        type="button"
                        onClick={() =>
                          setWidgetItems(
                            widgetItems.map((w) =>
                              w.id === item.id ? { ...w, enabled: !w.enabled } : w
                            )
                          )
                        }
                        className={`inline-flex items-center justify-center min-w-[52px] h-7 px-2.5 rounded text-xs font-bold border uppercase tracking-wider cursor-pointer transition-colors ${
                          item.enabled
                            ? 'bg-[#00acc1] text-white border-[#00acc1]'
                            : 'bg-slate-100 text-slate-600 border-slate-300'
                        }`}
                      >
                        {item.enabled ? 'On' : 'Off'}
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              {/* Bottom buttons: [✓ Sort] and [✕ Cancel] */}
              <div className="p-4 bg-slate-50 border-t border-slate-200 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => showToast('Urutan widget berhasil disimpan!', 'success')}
                  className="px-5 py-2 rounded bg-[#00acc1] hover:bg-[#0097a7] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <Check className="w-4 h-4 stroke-[3]" />
                  <span>Sort</span>
                </button>
                <button
                  type="button"
                  onClick={() => showToast('Pengurutan dibatalkan', 'info')}
                  className="px-5 py-2 rounded bg-[#546e7a] hover:bg-[#455a64] text-white font-bold text-xs flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                >
                  <X className="w-4 h-4 stroke-[3]" />
                  <span>Cancel</span>
                </button>
              </div>
            </div>
          )}

          {/* VIEW 6: POS & TRANSAKSI (Daftar Order, Cetak Nota Thermal, Kirim WA) */}
          {activeMenu === 'pos_orders' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <ShoppingBag className="w-5 h-5 text-blue-900" />
                    Kasir &amp; Transaksi Pesanan (POS)
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Kelola belanja grosir pelanggan, cetak nota thermal 58mm/80mm, dan kirim struk otomatis ke WhatsApp.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={loadData}
                    className="px-3.5 py-2 text-xs font-semibold text-slate-700 bg-white border border-slate-300 rounded-lg hover:bg-slate-50 flex items-center gap-1.5 transition-colors cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                    <span>Muat Ulang</span>
                  </button>
                </div>
              </div>

              {/* Order Cards / Table */}
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Invoice / Waktu</th>
                        <th className="py-3 px-4">Pelanggan</th>
                        <th className="py-3 px-4">Barang Grosir</th>
                        <th className="py-3 px-4 text-right">Total Bayar</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Aksi Cepat Struk</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {orders.length === 0 ? (
                        <tr>
                          <td colSpan={6} className="py-12 text-center text-slate-400">
                            <ShoppingBag className="w-8 h-8 mx-auto mb-2 text-slate-300" />
                            <p className="font-medium text-slate-600">Belum ada transaksi pesanan tercatat</p>
                            <p className="text-[11px] text-slate-400 mt-1">Pesanan yang dibuat di checkout akan muncul di sini.</p>
                          </td>
                        </tr>
                      ) : (
                        orders.map((ord) => (
                          <tr key={ord.id} className="hover:bg-slate-50/80 transition-colors">
                            <td className="py-3.5 px-4 font-mono whitespace-nowrap">
                              <span className="font-bold text-slate-900 block">{ord.invoiceNumber}</span>
                              <span className="text-[10px] text-slate-400">
                                {new Date(ord.createdAt).toLocaleDateString('id-ID', {
                                  day: '2-digit',
                                  month: 'short',
                                  year: 'numeric',
                                })}
                              </span>
                            </td>

                            <td className="py-3.5 px-4">
                              <div className="font-semibold text-slate-900">{ord.customerName}</div>
                              <div className="text-[11px] text-slate-500 font-mono">{ord.customerWhatsapp}</div>
                              <div className="text-[10.5px] text-slate-400 truncate max-w-[150px]">
                                {ord.shippingAddress?.city}, {ord.shippingAddress?.province}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 max-w-xs">
                              <div className="space-y-0.5">
                                {ord.items.map((it, idx) => (
                                  <div key={idx} className="text-slate-700 truncate text-[11px]">
                                    • {it.productName} ({it.quantity} pcs)
                                  </div>
                                ))}
                              </div>
                            </td>

                            <td className="py-3.5 px-4 text-right font-mono whitespace-nowrap">
                              <div className="font-bold text-slate-900 text-sm">
                                Rp{ord.totalAmount.toLocaleString('id-ID')}
                              </div>
                              {ord.trackingLink && (
                                <a
                                  href={ord.trackingLink.startsWith('http') ? ord.trackingLink : `https://${ord.trackingLink}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="inline-flex items-center gap-1 text-[10px] text-cyan-600 hover:text-cyan-800 font-sans mt-0.5"
                                  title="Buka Tautan Lacak Ekspedisi"
                                >
                                  <ExternalLink className="w-2.5 h-2.5" />
                                  <span>Link Lacak</span>
                                </a>
                              )}
                            </td>

                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <span
                                className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold uppercase tracking-wider mb-1 ${
                                  ord.paymentStatus === 'Lunas'
                                    ? 'bg-emerald-100 text-emerald-800'
                                    : 'bg-amber-100 text-amber-800'
                                }`}
                              >
                                {ord.paymentStatus}
                              </span>
                              <div className="text-[10.5px] text-slate-500">{ord.orderStatus}</div>
                            </td>

                            <td className="py-3.5 px-4 text-center whitespace-nowrap">
                              <div className="flex items-center justify-center gap-1.5">
                                {/* Button A: Cetak Struk Thermal */}
                                <button
                                  type="button"
                                  onClick={() => handleOpenReceipt(ord)}
                                  className="px-2.5 py-1.5 bg-cyan-50 hover:bg-cyan-100 text-cyan-800 border border-cyan-200 rounded font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Cetak Nota Thermal 58mm / 80mm"
                                >
                                  <Printer className="w-3.5 h-3.5" />
                                  <span>Cetak Nota</span>
                                </button>

                                {/* Button B: Kirim WhatsApp */}
                                <button
                                  type="button"
                                  onClick={() => handleSendWhatsappReceipt(ord)}
                                  className="px-2.5 py-1.5 bg-emerald-50 hover:bg-emerald-100 text-emerald-800 border border-emerald-200 rounded font-bold text-[11px] flex items-center gap-1 transition-colors cursor-pointer"
                                  title="Kirim Struk Digital via WhatsApp"
                                >
                                  <Share2 className="w-3.5 h-3.5" />
                                  <span>WA Struk</span>
                                </button>

                                {/* Button C: Edit Status & Tracking */}
                                <button
                                  type="button"
                                  onClick={() => {
                                    setSelectedOrderForEdit(ord);
                                    setEditOrderStatus(ord.orderStatus);
                                    setEditPaymentStatus(ord.paymentStatus);
                                    setEditTrackingNumber(ord.trackingNumber || '');
                                    setEditTrackingLink(ord.trackingLink || '');
                                  }}
                                  className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors cursor-pointer"
                                  title="Edit Status Pesanan & Resi / Link Lacak"
                                >
                                  <Edit className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 7: INVENTORI & PRODUK */}
          {activeMenu === 'inventory_products' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Package className="w-5 h-5 text-amber-500" />
                    Manajemen Inventori &amp; Katalog Grosir
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Atur harga grosir, minimal pesanan, foto produk lapak sentra grosir, dan satuan kodi/lusin/pcs.
                  </p>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct({
                        id: 'prod-' + Date.now(),
                        name: '',
                        categoryId: categories[0]?.id || 'cat-pakaian-wanita',
                        categoryName: categories[0]?.name || 'Pakaian Wanita',
                        description: '',
                        price: 65000,
                        wholesalePrice: 45000,
                        minOrder: 6,
                        unit: 'pcs',
                        jokiFee: 0,
                        imageUrl: '/public/assets/aistudio/IMG_20261101_180521_d21841f0.jpg',
                        inStock: true,
                        estimatedShoppingDay: 'Lapak Sentra Grosir',
                        createdAt: new Date().toISOString(),
                      });
                      setIsProductModalOpen(true);
                    }}
                    className="px-3.5 py-2 text-xs font-bold text-white bg-cyan-600 hover:bg-cyan-700 rounded-lg flex items-center gap-1.5 shadow-xs transition-colors cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>Tambah Produk Baru</span>
                  </button>
                </div>
              </div>

              {/* Products Table */}
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Barang</th>
                        <th className="py-3 px-4">Kategori</th>
                        <th className="py-3 px-4 text-right">Harga Grosir</th>
                        <th className="py-3 px-4 text-center">Satuan</th>
                        <th className="py-3 px-4 text-center">Min. Order</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Aksi</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {products.map((prod) => (
                        <tr key={prod.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4">
                            <div className="flex items-center gap-3">
                              <img
                                src={prod.imageUrl}
                                alt={prod.name}
                                className="w-10 h-10 rounded-lg object-cover border border-slate-200 shrink-0"
                              />
                              <div>
                                <div className="font-semibold text-slate-900 line-clamp-1">{prod.name}</div>
                                <div className="text-[10px] text-slate-400 font-mono">ID: {prod.id}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3 px-4 text-slate-600">
                            {prod.categoryName}
                          </td>

                          <td className="py-3 px-4 text-right font-mono font-bold text-slate-900">
                            Rp{prod.wholesalePrice.toLocaleString('id-ID')}
                          </td>

                          <td className="py-3 px-4 text-center font-mono text-slate-700 font-medium">
                            {prod.unit || 'pcs'}
                          </td>

                          <td className="py-3 px-4 text-center font-mono">
                            {prod.minOrder} {prod.unit}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span
                              className={`inline-block px-2 py-0.5 rounded text-[10px] font-semibold ${
                                prod.inStock
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-red-100 text-red-800'
                              }`}
                            >
                              {prod.inStock ? 'Ready' : 'Habis'}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center whitespace-nowrap">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                type="button"
                                onClick={() => setQuickPriceEditProduct(prod)}
                                className="px-2 py-1 bg-amber-50 hover:bg-amber-100 text-amber-800 border border-amber-200 rounded text-[11px] font-semibold transition-colors cursor-pointer"
                                title="Edit Cepat Harga"
                              >
                                Edit Harga
                              </button>
                              <button
                                type="button"
                                onClick={() => {
                                  setEditingProduct(prod);
                                  setIsProductModalOpen(true);
                                }}
                                className="p-1.5 bg-slate-100 hover:bg-slate-200 text-slate-600 rounded transition-colors cursor-pointer"
                              >
                                <Edit className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => handleDeleteProduct(prod.id, prod.name)}
                                className="p-1.5 bg-red-50 hover:bg-red-100 text-red-600 rounded transition-colors cursor-pointer"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW 8: REQUEST BELANJA */}
          {activeMenu === 'shopping_requests' && (
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-xs border border-slate-200 p-6 flex flex-col md:flex-row md:items-center md:justify-between gap-4">
                <div>
                  <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-orange-500" />
                    Tiket Permintaan Sourcing Produk Grosir
                  </h2>
                  <p className="text-xs text-slate-500 mt-0.5">
                    Permintaan khusus dari pembeli grosir untuk dicarikan langsung di lapak sentra grosir.
                  </p>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-xs border border-slate-200 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse text-xs">
                    <thead>
                      <tr className="bg-slate-100/75 border-b border-slate-200 text-slate-600 font-semibold uppercase tracking-wider text-[10px]">
                        <th className="py-3 px-4">Tiket / Waktu</th>
                        <th className="py-3 px-4">Pelanggan</th>
                        <th className="py-3 px-4">Barang yang Dicari</th>
                        <th className="py-3 px-4">Target Budget</th>
                        <th className="py-3 px-4 text-center">Status</th>
                        <th className="py-3 px-4 text-center">Aksi Penawaran</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {requests.map((req) => (
                        <tr key={req.id} className="hover:bg-slate-50/80 transition-colors">
                          <td className="py-3 px-4 font-mono">
                            <span className="font-bold text-slate-900 block">{req.ticketNumber}</span>
                            <span className="text-[10px] text-slate-400">
                              {new Date(req.createdAt).toLocaleDateString('id-ID')}
                            </span>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{req.customerName}</div>
                            <div className="text-[11px] text-slate-500 font-mono">{req.customerWhatsapp}</div>
                          </td>

                          <td className="py-3 px-4">
                            <div className="font-semibold text-slate-900">{req.itemName}</div>
                            <div className="text-[11px] text-slate-500">Jumlah: {req.quantity}</div>
                          </td>

                          <td className="py-3 px-4 font-mono font-semibold text-slate-800">
                            {req.targetBudget}
                          </td>

                          <td className="py-3 px-4 text-center">
                            <span className="inline-block px-2 py-0.5 rounded text-[10px] font-semibold bg-orange-100 text-orange-800">
                              {req.status}
                            </span>
                          </td>

                          <td className="py-3 px-4 text-center">
                            <button
                              type="button"
                              onClick={() => {
                                setSelectedRequestForOffer(req);
                                setOfferItemPrice(0);
                              }}
                              className="px-2.5 py-1.5 bg-cyan-600 hover:bg-cyan-700 text-white rounded font-bold text-[11px] transition-colors cursor-pointer"
                            >
                              Beri Penawaran
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* VIEW: DESIGN GENERAL TABS (Template, Page, Header, Body, Side Menu, Side Background) */}
          {(activeMenu === 'design_template' ||
            activeMenu === 'design_page' ||
            activeMenu === 'design_header' ||
            activeMenu === 'design_body' ||
            activeMenu === 'side_menu' ||
            activeMenu === 'side_background') && (
            <div className="bg-white rounded-lg shadow-sm border border-slate-200 p-8 text-center">
              <Paintbrush className="w-12 h-12 text-cyan-600 mx-auto mb-3" />
              <h3 className="text-base font-bold text-slate-900">
                Menu Design: {activeMenu.replace('design_', '').replace('_', ' ').toUpperCase()}
              </h3>
              <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                Pengaturan tata letak dan tema visual aplikasi toko online Aur Kuning. Klik tab <b>Manage</b> di sidebar kiri untuk mengelola Profil Toko, Database Sheets, Log Aktivitas, dan Transaksi POS.
              </p>
              <button
                type="button"
                onClick={() => setActiveMenu('side_widget')}
                className="mt-4 px-4 py-2 bg-[#00acc1] hover:bg-[#0097a7] text-white font-bold text-xs rounded transition-colors cursor-pointer"
              >
                Buka Panel Side Widget
              </button>
            </div>
          )}

        </main>
      </div>

      {/* ======================================================== */}
      {/* MODAL 1: THERMAL RECEIPT 58MM/80MM PRINT & WHATSAPP */}
      {/* ======================================================== */}
      <ThermalReceiptModal
        order={receiptOrder}
        storeSettings={storeSettings}
        isOpen={isReceiptModalOpen}
        onClose={() => {
          setIsReceiptModalOpen(false);
          setReceiptOrder(null);
        }}
      />

      {/* ======================================================== */}
      {/* MODAL 2: EDIT ORDER STATUS & TRACKING NUMBER */}
      {/* ======================================================== */}
      {selectedOrderForEdit && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 text-sm">
                Perbarui Pesanan #{selectedOrderForEdit.invoiceNumber}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedOrderForEdit(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Status Pembayaran</label>
                <select
                  value={editPaymentStatus}
                  onChange={(e) => setEditPaymentStatus(e.target.value as PaymentStatus)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Menunggu Pembayaran">Menunggu Pembayaran</option>
                  <option value="Menunggu Verifikasi">Menunggu Verifikasi</option>
                  <option value="Lunas">Lunas</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Status Pengerjaan Pesanan</label>
                <select
                  value={editOrderStatus}
                  onChange={(e) => setEditOrderStatus(e.target.value as OrderStatus)}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                >
                  <option value="Menunggu Pembayaran">Menunggu Pembayaran</option>
                  <option value="Pembayaran Dikonfirmasi">Pembayaran Dikonfirmasi</option>
                  <option value="Pesanan Diproses">Pesanan Diproses</option>
                  <option value="Barang Sedang Dibelikan">Barang Sedang Dibelikan</option>
                  <option value="Barang Sedang Dikemas">Barang Sedang Dikemas</option>
                  <option value="Pesanan Dikirim">Pesanan Dikirim</option>
                  <option value="Selesai">Selesai</option>
                  <option value="Dibatalkan">Dibatalkan</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nomor Resi Pengiriman</label>
                <input
                  type="text"
                  value={editTrackingNumber}
                  onChange={(e) => setEditTrackingNumber(e.target.value)}
                  placeholder="Contoh: INDAH-BKT-8912347"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">
                  Link / Tautan Pelacakan Ekspedisi untuk Pembeli
                </label>
                <input
                  type="url"
                  value={editTrackingLink}
                  onChange={(e) => setEditTrackingLink(e.target.value)}
                  placeholder="Contoh: https://cekresi.com/?noresi=... atau link ekspedisi kargo"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono text-xs"
                />
                <span className="text-[10.5px] text-slate-500 mt-1 block">
                  Pelanggan dapat langsung menekan tombol tautan ini saat melacak pesanannya di halaman Lacak Pesanan.
                </span>
              </div>

              <div className="pt-3 flex gap-2">
                <button
                  type="button"
                  onClick={handleSaveOrderStatus}
                  className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Simpan Perubahan
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedOrderForEdit(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                >
                  Batal
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 3: REQUEST OFFER MODAL */}
      {/* ======================================================== */}
      {selectedRequestForOffer && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 text-sm">
                Kirim Penawaran Harga Tiket #{selectedRequestForOffer.ticketNumber}
              </h3>
              <button
                type="button"
                onClick={() => setSelectedRequestForOffer(null)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmitOffer} className="space-y-3 text-xs">
              <div className="bg-slate-50 p-3 rounded-lg border border-slate-200">
                <div className="font-semibold text-slate-800">{selectedRequestForOffer.itemName}</div>
                <div className="text-slate-500">Jumlah: {selectedRequestForOffer.quantity}</div>
                <div className="text-slate-500 font-mono">Budget: {selectedRequestForOffer.targetBudget}</div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Harga Barang per Unit (Rp)</label>
                <input
                  type="number"
                  required
                  value={offerItemPrice || ''}
                  onChange={(e) => setOfferItemPrice(Number(e.target.value))}
                  placeholder="Contoh: 45000"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Estimasi Ongkos Kirim Kargo (Rp)</label>
                <input
                  type="number"
                  value={offerShipping}
                  onChange={(e) => setOfferShipping(Number(e.target.value))}
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono bg-white"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Catatan Ketersediaan Lapak</label>
                <textarea
                  rows={2}
                  value={offerNotes}
                  onChange={(e) => setOfferNotes(e.target.value)}
                  placeholder="Contoh: Barang ready di lapak sentra grosir, bahan rayon tebal."
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="p-3 bg-cyan-50 rounded-lg font-mono font-bold text-cyan-950 flex justify-between">
                <span>Total Penawaran:</span>
                <span>
                  Rp{(Number(offerItemPrice) + Number(offerShipping)).toLocaleString('id-ID')}
                </span>
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Kirim ke Customer
                </button>
                <button
                  type="button"
                  onClick={() => setSelectedRequestForOffer(null)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* MODAL 4: ADD / EDIT PRODUCT MODAL */}
      {/* ======================================================== */}
      {isProductModalOpen && editingProduct && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-2xs flex items-center justify-center p-4 overflow-y-auto">
          <div className="bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 border border-slate-200">
            <div className="flex justify-between items-center mb-4">
              <h3 className="font-bold text-slate-900 text-base">
                {editingProduct.id.startsWith('prod-') && editingProduct.name
                  ? 'Edit Produk Katalog'
                  : 'Tambah Produk Baru Lapak'}
              </h3>
              <button
                type="button"
                onClick={() => setIsProductModalOpen(false)}
                className="text-slate-400 hover:text-slate-600"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProduct} className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Nama Produk</label>
                <input
                  type="text"
                  required
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({ ...editingProduct, name: e.target.value })}
                  placeholder="Contoh: Mukena Bordir Kerancang Khas Bukittinggi"
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kategori</label>
                  <select
                    value={editingProduct.categoryId}
                    onChange={(e) => {
                      const cat = categories.find((c) => c.id === e.target.value);
                      setEditingProduct({
                        ...editingProduct,
                        categoryId: e.target.value,
                        categoryName: cat ? cat.name : 'Pakaian Wanita',
                      });
                    }}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    {categories.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Satuan</label>
                  <input
                    type="text"
                    value={editingProduct.unit}
                    onChange={(e) => setEditingProduct({ ...editingProduct, unit: e.target.value })}
                    placeholder="pcs / lusin / kodi"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-2">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Harga Grosir (Rp)</label>
                  <input
                    type="number"
                    required
                    value={editingProduct.wholesalePrice || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, wholesalePrice: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Harga Ecer (Rp)</label>
                  <input
                    type="number"
                    value={editingProduct.price || ''}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, price: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Satuan</label>
                  <input
                    type="text"
                    value={editingProduct.unit || 'pcs'}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, unit: e.target.value, jokiFee: 0 })
                    }
                    placeholder="pcs / lusin / kodi"
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Min. Order</label>
                  <input
                    type="number"
                    value={editingProduct.minOrder || 1}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, minOrder: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg font-mono bg-white"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Status Ketersediaan</label>
                  <select
                    value={editingProduct.inStock ? 'true' : 'false'}
                    onChange={(e) =>
                      setEditingProduct({ ...editingProduct, inStock: e.target.value === 'true' })
                    }
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white"
                  >
                    <option value="true">Ready di Lapak</option>
                    <option value="false">Habis Sementara</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">URL Foto Produk</label>
                <input
                  type="text"
                  value={editingProduct.imageUrl}
                  onChange={(e) => setEditingProduct({ ...editingProduct, imageUrl: e.target.value })}
                  placeholder="/assets/images/... atau https://..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-lg bg-white font-mono"
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Deskripsi &amp; Detail Kain</label>
                <textarea
                  rows={2}
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({ ...editingProduct, description: e.target.value })}
                  placeholder="Keterangan bahan, varian warna, dan lokasi toko di Pasar Aur Kuning"
                  className="w-full px-3 py-1.5 border border-slate-300 rounded-lg bg-white"
                />
              </div>

              <div className="pt-2 flex gap-2">
                <button
                  type="submit"
                  className="flex-1 py-2.5 bg-cyan-600 hover:bg-cyan-700 text-white font-bold rounded-lg text-xs transition-colors cursor-pointer"
                >
                  Simpan Produk
                </button>
                <button
                  type="button"
                  onClick={() => setIsProductModalOpen(false)}
                  className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs"
                >
                  Batal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
