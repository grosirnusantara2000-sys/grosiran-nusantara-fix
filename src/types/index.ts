export type UserRole = 'customer' | 'admin' | 'staff';

export type OutletId = 'TANAH_ABANG' | 'AUR_KUNING';

export interface OutletInfo {
  id: OutletId;
  name: string;
  shortName: string;
  city: string;
  province: string;
  tagline: string;
  address: string;
  whatsappNumber: string;
  email: string;
  marketDays: string;
  operationalHours: string;
  landmark: string;
  themeColor: string;
  description: string;
}

export interface UserProfile {
  uid: string;
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  address?: string;
  city?: string;
  province?: string;
  postalCode?: string;
  createdAt: string;
}

export interface Category {
  id: string;
  name: string;
  slug: string;
  description: string;
  iconName: string;
  productCount?: number;
}

export interface Product {
  id: string;
  name: string;
  categoryId: string;
  categoryName: string;
  description: string;
  price: number; // Harga ecer / estimasi
  wholesalePrice: number; // Harga grosir per pcs
  minOrder: number; // Minimal order (misal 3 pcs, 6 pcs, 12 pcs/1 lusin, 20 pcs/1 kodi)
  unit: string; // 'pcs' | 'lusin' | 'kodi' | 'seri'
  retailPrice?: number; // Harga eceran
  jokiFee?: number; // Opsional backwards compatibility (0)
  imageUrl: string;
  galleryUrls?: string[];
  inStock: boolean;
  colors?: string[];
  sizes?: string[];
  estimatedShoppingDay: string;
  createdAt: string;
  featured?: boolean;
  bestSeller?: boolean;
  outletId?: OutletId; // Multichannel multi-outlet tag: TANAH_ABANG | AUR_KUNING
}

export interface CartItem {
  product: Product;
  quantity: number;
  selectedColor?: string;
  selectedSize?: string;
}

export type RequestStatus =
  | 'Request Diterima'
  | 'Sedang Dicarikan'
  | 'Barang Ditemukan'
  | 'Menunggu Persetujuan Harga'
  | 'Disetujui Customer'
  | 'Tidak Ditemukan'
  | 'Selesai';

export interface AdminOffer {
  itemPricePerUnit: number;
  jokiFee?: number;
  estimatedShipping: number;
  totalOffer: number;
  adminNotes: string;
  foundStoreLocation?: string;
  storePhotoUrl?: string;
  offerDate: string;
}

export interface ProductRequest {
  id: string;
  ticketNumber: string;
  customerId?: string;
  customerName: string;
  customerWhatsapp: string;
  itemName: string;
  category: string;
  description: string;
  quantity: string;
  targetBudget: string;
  notes?: string;
  photoUrls: string[];
  status: RequestStatus;
  adminOffer?: AdminOffer;
  createdAt: string;
  updatedAt: string;
  outletId?: OutletId; // Sourcing target: TANAH_ABANG | AUR_KUNING
}

export type OrderStatus =
  | 'Menunggu Pembayaran'
  | 'Pembayaran Dikonfirmasi'
  | 'Pesanan Diproses'
  | 'Barang Sedang Dibelikan'
  | 'Barang Sedang Dikemas'
  | 'Pesanan Dikirim'
  | 'Selesai'
  | 'Dibatalkan';

export type PaymentStatus =
  | 'Menunggu Pembayaran'
  | 'Menunggu Verifikasi'
  | 'Lunas'
  | 'Dibatalkan';

export interface ShippingAddress {
  recipientName: string;
  phone: string;
  street: string;
  kelurahan: string;
  kecamatan: string;
  city: string;
  province: string;
  postalCode: string;
  shippingNotes?: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  price: number;
  wholesalePrice: number;
  jokiFee?: number;
  quantity: number;
  color?: string;
  size?: string;
  imageUrl: string;
  outletId?: OutletId;
}

export interface Order {
  id: string;
  invoiceNumber: string;
  customerId?: string;
  customerName: string;
  customerWhatsapp: string;
  customerEmail: string;
  shippingAddress: ShippingAddress;
  items: OrderItem[];
  subtotal: number; // Subtotal barang grosir lapak
  jokiTotal?: number; // Opsional (0)
  shippingCost: number; // Ongkir ekspedisi
  totalAmount: number; // Total tagihan pembayaran (subtotal + shippingCost)
  courier: string;
  trackingNumber?: string; // Nomor resi pengiriman
  trackingLink?: string; // Tautan pelacakan dari penjual (langsung bisa ditekan pelanggan)
  paymentMethod: string;
  paymentStatus: PaymentStatus;
  orderStatus: OrderStatus;
  paymentProofUrl?: string;
  storeProofPhotos?: string[]; // Foto barang & nota asli lapak
  notes?: string;
  createdAt: string;
  updatedAt: string;
  outletId?: OutletId; // Origin outlet: TANAH_ABANG | AUR_KUNING
}

export interface Review {
  id: string;
  customerName: string;
  city: string;
  rating: number;
  comment: string;
  orderId?: string;
  createdAt: string;
  verifiedBuyer?: boolean;
  outletId?: OutletId;
}

export interface Article {
  id: string;
  title: string;
  slug: string;
  excerpt: string;
  content: string;
  coverImage: string;
  tags: string[];
  readTime: string;
  publishedAt: string;
  author: string;
  outletId?: OutletId;
}

export interface FAQItem {
  id: string;
  question: string;
  answer: string;
  category: string;
  outletId?: OutletId;
}

export interface StoreSettings {
  id: string;
  storeName: string;
  tagline: string;
  whatsappNumber: string;
  email: string;
  address: string;
  marketDays: string;
  operationalHours: string;
  googleSheetsWebhookUrl?: string;
  googleSheetId?: string;
  autoSyncGoogleSheets?: boolean;
  instagram?: string;
  tiktok?: string;
  updatedAt?: string;
  activeOutletId?: OutletId;
  // Professional Receipt & Thermal Printing Settings
  logoUrl?: string;
  receiptHeader?: string;
  receiptFooter?: string;
  receiptReturnPolicy?: string;
  showLogoOnReceipt?: boolean;
  showAddressOnReceipt?: boolean;
  showWhatsappOnReceipt?: boolean;
  showQrisOnReceipt?: boolean;
  showFooterOnReceipt?: boolean;
  thermalPaperWidth?: '58mm' | '80mm';
  adminPin?: string;
}

export interface ActivityLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  category: 'auth' | 'order' | 'profile' | 'sheets' | 'print' | 'backup' | 'system' | 'product';
  details: string;
  status: 'success' | 'warning' | 'error' | 'info';
  metadata?: Record<string, any>;
  outletId?: OutletId;
}

export interface AppNotification {
  id: string;
  title: string;
  message: string;
  type: 'order' | 'request' | 'payment' | 'system';
  referenceId?: string;
  isRead: boolean;
  createdAt: string;
}
