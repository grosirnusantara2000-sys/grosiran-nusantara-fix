import {
  collection,
  doc,
  getDocs,
  getDoc,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  limit,
  onSnapshot,
  serverTimestamp,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../lib/firebase';
import {
  Product,
  Category,
  ProductRequest,
  Order,
  Review,
  Article,
  AdminOffer,
  OrderStatus,
  PaymentStatus,
  RequestStatus,
  StoreSettings,
  AppNotification,
} from '../types';
import {
  INITIAL_CATEGORIES,
  INITIAL_PRODUCTS,
  INITIAL_REVIEWS,
  INITIAL_ARTICLES,
  INITIAL_STORE_SETTINGS,
} from '../data/initialData';

// Recursive cleaner to strip undefined fields from Firestore payloads to prevent runtime errors
export function cleanFirestoreData<T>(obj: T): T {
  if (obj === undefined) return '' as any;
  if (obj === null || typeof obj !== 'object') return obj;
  if (Array.isArray(obj)) {
    return obj.map(cleanFirestoreData) as any;
  }
  const cleaned: Record<string, any> = {};
  for (const [key, val] of Object.entries(obj)) {
    if (val !== undefined) {
      cleaned[key] = cleanFirestoreData(val);
    }
  }
  return cleaned as T;
}

// Fetch Products from Firestore with auto-seeding to ensure cloud persistence across all users
export async function fetchProducts(): Promise<Product[]> {
  const path = 'products';
  try {
    const snap = await getDocs(collection(db, path));
    if (!snap.empty) {
      const list: Product[] = [];
      snap.forEach((docItem) => {
        const item = docItem.data() as Product;
        // Strictly normalize outletId
        if (!item.outletId) {
          item.outletId = item.id.startsWith('prod-ta') ? 'TANAH_ABANG' : 'AUR_KUNING';
        }
        list.push(item);
      });

      // Auto-merge any initial products that might not have been seeded yet (e.g. Tanah Abang products)
      const existingIds = new Set(list.map((p) => p.id));
      const missingInitial = INITIAL_PRODUCTS.filter((ip) => !existingIds.has(ip.id));
      if (missingInitial.length > 0) {
        for (const p of missingInitial) {
          list.push(p);
          try {
            await setDoc(doc(db, path, p.id), p, { merge: true });
          } catch (seedErr) {
            console.warn('Seeding missing product error:', seedErr);
          }
        }
      }

      try {
        localStorage.setItem('aur_kuning_local_products', JSON.stringify(list));
      } catch (e) {}
      return list;
    } else {
      // First-time sync: Auto-seed all initial catalog products to Cloud Firestore
      try {
        for (const p of INITIAL_PRODUCTS) {
          await setDoc(doc(db, path, p.id), p, { merge: true });
        }
      } catch (seedErr) {
        console.warn('Auto-seed products error:', seedErr);
      }
      return INITIAL_PRODUCTS;
    }
  } catch (error) {
    console.warn('Firestore fetch products failed, checking local cache:', error);
  }

  // Fallback to local storage if offline, ensuring all initial products exist
  try {
    const local = localStorage.getItem('aur_kuning_local_products');
    if (local) {
      const parsed: Product[] = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) {
        const existingIds = new Set(parsed.map((p) => p.id));
        const merged: Product[] = parsed.map((p) => ({
          ...p,
          outletId: p.outletId || (p.id.startsWith('prod-ta') ? 'TANAH_ABANG' : 'AUR_KUNING'),
        }));
        INITIAL_PRODUCTS.forEach((ip) => {
          if (!existingIds.has(ip.id)) {
            merged.push(ip);
          }
        });
        return merged;
      }
    }
  } catch (e) {}

  return INITIAL_PRODUCTS;
}

// Real-time synchronization listener for products across all devices and visitors
export function subscribeToProducts(onData: (products: Product[]) => void): () => void {
  const path = 'products';
  try {
    const unsubscribe = onSnapshot(
      collection(db, path),
      (snap) => {
        if (!snap.empty) {
          const list: Product[] = [];
          snap.forEach((docItem) => {
            const item = docItem.data() as Product;
            if (!item.outletId) {
              item.outletId = item.id.startsWith('prod-ta') ? 'TANAH_ABANG' : 'AUR_KUNING';
            }
            list.push(item);
          });

          // Ensure any missing initial dual-outlet items are present
          const existingIds = new Set(list.map((p) => p.id));
          INITIAL_PRODUCTS.forEach((ip) => {
            if (!existingIds.has(ip.id)) {
              list.push(ip);
            }
          });

          try {
            localStorage.setItem('aur_kuning_local_products', JSON.stringify(list));
          } catch (e) {}
          onData(list);
        } else {
          onData(INITIAL_PRODUCTS);
        }
      },
      (error) => {
        console.warn('Real-time products snapshot warning:', error);
      }
    );
    return unsubscribe;
  } catch (e) {
    console.warn('Failed to attach products listener:', e);
    return () => {};
  }
}

// Fetch Categories from Firestore
export async function fetchCategories(): Promise<Category[]> {
  const path = 'categories';
  try {
    const snap = await getDocs(collection(db, path));
    if (!snap.empty) {
      const list: Category[] = [];
      snap.forEach((docItem) => {
        list.push(docItem.data() as Category);
      });
      return list;
    } else {
      try {
        for (const c of INITIAL_CATEGORIES) {
          await setDoc(doc(db, path, c.id), c, { merge: true });
        }
      } catch (e) {}
      return INITIAL_CATEGORIES;
    }
  } catch (error) {
    console.warn('Using offline initial categories:', error);
    return INITIAL_CATEGORIES;
  }
}

// Fetch Reviews
export async function fetchReviews(): Promise<Review[]> {
  const path = 'reviews';
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      return INITIAL_REVIEWS;
    }
    const list: Review[] = [];
    snap.forEach((docItem) => {
      list.push(docItem.data() as Review);
    });
    return list;
  } catch (error) {
    return INITIAL_REVIEWS;
  }
}

// Fetch Articles
export async function fetchArticles(): Promise<Article[]> {
  const path = 'articles';
  try {
    const snap = await getDocs(collection(db, path));
    if (snap.empty) {
      return INITIAL_ARTICLES;
    }
    const list: Article[] = [];
    snap.forEach((docItem) => {
      list.push(docItem.data() as Article);
    });
    return list;
  } catch (error) {
    return INITIAL_ARTICLES;
  }
}

// Submit Product Request
export async function submitProductRequest(requestData: Omit<ProductRequest, 'id' | 'ticketNumber' | 'createdAt' | 'updatedAt' | 'status'>): Promise<ProductRequest> {
  const path = 'productRequests';
  const timestamp = Date.now();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const ticketNumber = `REQ-AK-${dateStr}-${randomSuffix}`;
  const requestId = `req_${timestamp}_${randomSuffix}`;

  const newRequest: ProductRequest = {
    ...requestData,
    id: requestId,
    ticketNumber,
    status: 'Request Diterima',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  try {
    await setDoc(doc(db, path, requestId), newRequest);
  } catch (error) {
    // If Firestore fails (e.g. offline or rule issue), report and return local model so user is never blocked
    handleFirestoreError(error, OperationType.CREATE, path);
  }

  // Real-time admin notification
  try {
    await createNotification({
      title: 'Request Barang Baru!',
      message: `${newRequest.customerName} meminta dicarikan: ${newRequest.itemName} (${newRequest.quantity})`,
      type: 'request',
      referenceId: newRequest.id,
    });
  } catch (notifErr) {
    console.warn('Failed to dispatch notification:', notifErr);
  }

  // Real-time Google Sheets + Apps Script Sync (Background)
  syncToGoogleSheets('request', newRequest).catch((err) => {
    console.warn('Background Google Sheets request sync failed:', err);
  });

  return newRequest;
}

// Fetch all requests (for admin) or single request by ticket/id
export async function fetchAllRequests(): Promise<ProductRequest[]> {
  const path = 'productRequests';
  try {
    const snap = await getDocs(collection(db, path));
    const list: ProductRequest[] = [];
    snap.forEach((docItem) => {
      list.push(docItem.data() as ProductRequest);
    });
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Failed to fetch requests:', error);
    return [];
  }
}

export async function fetchRequestByIdOrTicket(queryStr: string): Promise<ProductRequest | null> {
  const path = 'productRequests';
  try {
    const snap = await getDocs(collection(db, path));
    for (const docItem of snap.docs) {
      const data = docItem.data() as ProductRequest;
      if (data.id === queryStr || data.ticketNumber.toUpperCase() === queryStr.toUpperCase()) {
        return data;
      }
    }
    return null;
  } catch (error) {
    console.error('Fetch request error:', error);
    return null;
  }
}

// Update Request Status or Offer
export async function updateRequestStatus(
  requestId: string,
  status: RequestStatus,
  adminOffer?: AdminOffer
): Promise<void> {
  const path = 'productRequests';
  try {
    const updatePayload: Partial<ProductRequest> = {
      status,
      updatedAt: new Date().toISOString(),
    };
    if (adminOffer) {
      updatePayload.adminOffer = adminOffer;
    }
    await updateDoc(doc(db, path, requestId), updatePayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.UPDATE, `${path}/${requestId}`);
  }
}

// Submit Order (Checkout)
// Submit Order (Checkout) - Fully sanitized against undefined fields and zero joki fees
export async function createOrder(
  orderPayload: Omit<Order, 'id' | 'invoiceNumber' | 'createdAt' | 'updatedAt' | 'orderStatus' | 'paymentStatus'>
): Promise<Order> {
  const path = 'orders';
  const timestamp = Date.now();
  const dateStr = new Date().toISOString().slice(0, 10).replace(/-/g, '');
  const randomSuffix = Math.floor(1000 + Math.random() * 9000);
  const invoiceNumber = `INV-${dateStr}-${randomSuffix}`;
  const orderId = `ord_${timestamp}_${randomSuffix}`;

  const calculatedTotal = Number(orderPayload.subtotal || 0) + Number(orderPayload.shippingCost || 0);

  const rawOrder: Order = {
    ...orderPayload,
    id: orderId,
    invoiceNumber,
    customerId: orderPayload.customerId || '',
    customerEmail: orderPayload.customerEmail || '',
    notes: orderPayload.notes || '',
    trackingNumber: orderPayload.trackingNumber || '',
    trackingLink: orderPayload.trackingLink || '',
    jokiTotal: 0, // Fee joki / upah joki ditiadakan
    totalAmount: calculatedTotal,
    paymentStatus: 'Menunggu Pembayaran',
    orderStatus: 'Menunggu Pembayaran',
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  };

  const newOrder = cleanFirestoreData(rawOrder);

  // Always cache locally so customer & admin can view even if network fluctuates
  try {
    const local = localStorage.getItem('nusantaragrosir_local_orders') || localStorage.getItem('grosirnusantara_local_orders');
    const list: Order[] = local ? JSON.parse(local) : [];
    list.unshift(newOrder);
    localStorage.setItem('nusantaragrosir_local_orders', JSON.stringify(list.slice(0, 50)));
  } catch (e) {
    console.warn('Local order cache error:', e);
  }

  try {
    await setDoc(doc(db, path, orderId), newOrder);
  } catch (error) {
    console.warn('Firestore setDoc warning, relying on local sync:', error);
    // Don't crash checkout if network is weak, as order is already cached in local memory
    try {
      handleFirestoreError(error, OperationType.CREATE, path);
    } catch (loggedErr) {
      // Return newOrder so user checkout proceeds gracefully to invoice confirmation
      return newOrder;
    }
  }

  // Real-time admin notification
  try {
    await createNotification({
      title: 'Pesanan Grosir Baru Masuk!',
      message: `${newOrder.customerName} membuat pesanan ${newOrder.invoiceNumber} senilai Rp ${newOrder.totalAmount.toLocaleString('id-ID')}`,
      type: 'order',
      referenceId: newOrder.id,
    });
  } catch (notifErr) {
    console.warn('Failed to dispatch notification:', notifErr);
  }

  // Real-time Google Sheets + Apps Script Sync (Background)
  syncToGoogleSheets('order', newOrder).catch((err) => {
    console.warn('Background Google Sheets order sync failed:', err);
  });

  return newOrder;
}

// Fetch all orders (admin)
export async function fetchAllOrders(): Promise<Order[]> {
  const path = 'orders';
  try {
    const snap = await getDocs(collection(db, path));
    const list: Order[] = [];
    snap.forEach((docItem) => {
      list.push(docItem.data() as Order);
    });

    // Merge with any local orders
    try {
      const local = localStorage.getItem('nusantaragrosir_local_orders') || localStorage.getItem('grosirnusantara_local_orders');
      if (local) {
        const localList: Order[] = JSON.parse(local);
        const existingIds = new Set(list.map((o) => o.id));
        localList.forEach((lo) => {
          if (!existingIds.has(lo.id)) {
            list.push(lo);
          }
        });
      }
    } catch (e) {}

    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (error) {
    console.error('Failed to fetch orders from firestore, using local cache:', error);
    try {
      const local = localStorage.getItem('nusantaragrosir_local_orders') || localStorage.getItem('grosirnusantara_local_orders');
      if (local) return JSON.parse(local);
    } catch (e) {}
    return [];
  }
}

export async function fetchOrderByIdOrInvoice(queryStr: string): Promise<Order | null> {
  const path = 'orders';
  const cleanQ = queryStr.trim().toUpperCase();
  try {
    const snap = await getDocs(collection(db, path));
    for (const docItem of snap.docs) {
      const data = docItem.data() as Order;
      if (
        data.id === queryStr ||
        data.id.toUpperCase() === cleanQ ||
        data.invoiceNumber.toUpperCase() === cleanQ
      ) {
        return data;
      }
    }
  } catch (error) {
    console.warn('Fetch firestore order warning:', error);
  }

  // Fallback to local cache
  try {
    const local = localStorage.getItem('nusantaragrosir_local_orders') || localStorage.getItem('grosirnusantara_local_orders');
    if (local) {
      const localList: Order[] = JSON.parse(local);
      const found = localList.find(
        (o) =>
          o.id === queryStr ||
          o.id.toUpperCase() === cleanQ ||
          o.invoiceNumber.toUpperCase() === cleanQ
      );
      if (found) return found;
    }
  } catch (e) {}

  return null;
}

// Update Order status / tracking / store photo proof
export async function updateOrderDetails(
  orderId: string,
  updates: Partial<Order>
): Promise<void> {
  const path = 'orders';
  const sanitized = cleanFirestoreData({
    ...updates,
    updatedAt: new Date().toISOString(),
  });

  // Update local cache immediately
  try {
    const local = localStorage.getItem('nusantaragrosir_local_orders') || localStorage.getItem('grosirnusantara_local_orders');
    if (local) {
      let localList: Order[] = JSON.parse(local);
      localList = localList.map((o) => (o.id === orderId ? { ...o, ...sanitized } : o));
      localStorage.setItem('nusantaragrosir_local_orders', JSON.stringify(localList));
    }
  } catch (e) {}

  try {
    await updateDoc(doc(db, path, orderId), sanitized);
  } catch (error) {
    console.warn('Firestore updateDoc warning, local cache updated:', error);
  }

  if (updates.paymentProofUrl) {
    try {
      await createNotification({
        title: 'Bukti Pembayaran Diunggah',
        message: `Pelanggan mengunggah bukti transfer untuk pesanan ${orderId}. Silakan verifikasi di dashboard.`,
        type: 'payment',
        referenceId: orderId,
      });
    } catch (e) {}
  }
}

// Product Management (Admin/Owner)
export async function saveProduct(product: Product): Promise<void> {
  const path = 'products';
  // Always update local cache so changes are instantly reflected in UI
  try {
    const local = localStorage.getItem('aur_kuning_local_products');
    let list: Product[] = local ? JSON.parse(local) : [...INITIAL_PRODUCTS];
    const idx = list.findIndex((p) => p.id === product.id);
    if (idx >= 0) {
      list[idx] = product;
    } else {
      list = [product, ...list];
    }
    localStorage.setItem('aur_kuning_local_products', JSON.stringify(list));
  } catch (e) {
    console.warn('Local product storage error:', e);
  }

  // Persist to Cloud Firestore
  try {
    await setDoc(doc(db, path, product.id), product, { merge: true });
  } catch (error) {
    console.error('Firestore saveProduct error:', error);
    // Attempt with merge
    try {
      await setDoc(doc(db, path, product.id), product);
    } catch (retryErr) {
      console.warn('Firestore retry failed:', retryErr);
    }
  }
}

export async function removeProduct(productId: string): Promise<void> {
  const path = 'products';
  // Update local cache
  try {
    const local = localStorage.getItem('aur_kuning_local_products');
    if (local) {
      const list: Product[] = JSON.parse(local);
      const filtered = list.filter((p) => p.id !== productId);
      localStorage.setItem('aur_kuning_local_products', JSON.stringify(filtered));
    }
  } catch (e) {}

  try {
    await deleteDoc(doc(db, path, productId));
  } catch (error) {
    console.warn('Firestore delete warning:', error);
  }
}

// Quick inline update for prices
export async function quickUpdateProductPrice(
  productId: string,
  newWholesalePrice: number,
  newJokiFee?: number,
  newRetailPrice?: number
): Promise<void> {
  const path = 'products';
  // Update local cache
  try {
    const local = localStorage.getItem('aur_kuning_local_products');
    let list: Product[] = local ? JSON.parse(local) : [...INITIAL_PRODUCTS];
    const idx = list.findIndex((p) => p.id === productId);
    if (idx >= 0) {
      list[idx] = {
        ...list[idx],
        wholesalePrice: newWholesalePrice,
        ...(newJokiFee !== undefined ? { jokiFee: newJokiFee } : {}),
        ...(newRetailPrice !== undefined ? { price: newRetailPrice } : {}),
      };
      localStorage.setItem('aur_kuning_local_products', JSON.stringify(list));
    }
  } catch (e) {}

  // Update Firestore using setDoc with merge so it creates or updates without throwing
  try {
    const updates: Record<string, any> = { wholesalePrice: newWholesalePrice };
    if (newJokiFee !== undefined) updates.jokiFee = newJokiFee;
    if (newRetailPrice !== undefined) updates.price = newRetailPrice;
    await setDoc(doc(db, path, productId), updates, { merge: true });
  } catch (error) {
    console.warn('Firestore quick price update warning:', error);
  }
}

// Quick toggle stock availability
export async function toggleProductStock(productId: string, inStock: boolean): Promise<void> {
  const path = 'products';
  try {
    const local = localStorage.getItem('aur_kuning_local_products');
    let list: Product[] = local ? JSON.parse(local) : [...INITIAL_PRODUCTS];
    const idx = list.findIndex((p) => p.id === productId);
    if (idx >= 0) {
      list[idx] = { ...list[idx], inStock };
      localStorage.setItem('aur_kuning_local_products', JSON.stringify(list));
    }
  } catch (e) {}

  try {
    await setDoc(doc(db, path, productId), { inStock }, { merge: true });
  } catch (error) {
    console.warn('Firestore toggle stock warning:', error);
  }
}

// Category Management
export async function saveCategory(category: Category): Promise<void> {
  const path = 'categories';
  try {
    await setDoc(doc(db, path, category.id), category);
  } catch (error) {
    handleFirestoreError(error, OperationType.WRITE, `${path}/${category.id}`);
  }
}

// 1-Click Database Seeding to Firestore
export async function seedInitialDataToFirestore(): Promise<{ countProducts: number; countCategories: number }> {
  let seededProducts = 0;
  let seededCategories = 0;

  for (const cat of INITIAL_CATEGORIES) {
    try {
      await setDoc(doc(db, 'categories', cat.id), cat);
      seededCategories++;
    } catch (err) {
      console.warn('Seed cat failed:', err);
    }
  }

  for (const prod of INITIAL_PRODUCTS) {
    try {
      await setDoc(doc(db, 'products', prod.id), prod);
      seededProducts++;
    } catch (err) {
      console.warn('Seed prod failed:', err);
    }
  }

  for (const rev of INITIAL_REVIEWS) {
    try {
      await setDoc(doc(db, 'reviews', rev.id), rev);
    } catch (err) {
      console.warn('Seed rev failed:', err);
    }
  }

  for (const art of INITIAL_ARTICLES) {
    try {
      await setDoc(doc(db, 'articles', art.id), art);
    } catch (err) {
      console.warn('Seed art failed:', err);
    }
  }

  return { countProducts: seededProducts, countCategories: seededCategories };
}

// ==========================================
// STORE SETTINGS & PROFILE MANAGEMENT
// ==========================================

export async function fetchStoreSettings(): Promise<StoreSettings> {
  const path = 'storeSettings';
  const docId = 'main';
  try {
    const snap = await getDoc(doc(db, path, docId));
    if (snap.exists()) {
      const data = snap.data() as StoreSettings;
      try {
        localStorage.setItem('aur_kuning_store_settings', JSON.stringify(data));
      } catch (e) {}
      return data;
    } else {
      // Auto-save default store settings on first load
      try {
        await setDoc(doc(db, path, docId), INITIAL_STORE_SETTINGS, { merge: true });
      } catch (e) {}
      return INITIAL_STORE_SETTINGS;
    }
  } catch (error) {
    console.warn('Error fetching store settings, using cached/initial:', error);
  }

  try {
    const local = localStorage.getItem('aur_kuning_store_settings');
    if (local) {
      return JSON.parse(local);
    }
  } catch (e) {}

  return INITIAL_STORE_SETTINGS;
}

export async function saveStoreSettings(settings: StoreSettings): Promise<void> {
  const path = 'storeSettings';
  const docId = 'main';
  const payload: StoreSettings = {
    ...settings,
    id: docId,
    updatedAt: new Date().toISOString(),
  };

  try {
    localStorage.setItem('aur_kuning_store_settings', JSON.stringify(payload));
  } catch (e) {}

  try {
    await setDoc(doc(db, path, docId), payload, { merge: true });
  } catch (error) {
    console.error('Failed to save store settings to Firestore:', error);
    handleFirestoreError(error, OperationType.WRITE, `${path}/${docId}`);
  }
}

export function subscribeToStoreSettings(onData: (settings: StoreSettings) => void): () => void {
  const path = 'storeSettings';
  const docId = 'main';
  try {
    const unsubscribe = onSnapshot(
      doc(db, path, docId),
      (snap) => {
        if (snap.exists()) {
          const data = snap.data() as StoreSettings;
          try {
            localStorage.setItem('aur_kuning_store_settings', JSON.stringify(data));
          } catch (e) {}
          onData(data);
        }
      },
      (err) => console.warn('Store settings listener warning:', err)
    );
    return unsubscribe;
  } catch (e) {
    return () => {};
  }
}

// ==========================================
// ADMIN REAL-TIME NOTIFICATIONS
// ==========================================

export async function fetchNotifications(): Promise<AppNotification[]> {
  const path = 'notifications';
  try {
    const snap = await getDocs(collection(db, path));
    const list: AppNotification[] = [];
    snap.forEach((docItem) => {
      list.push(docItem.data() as AppNotification);
    });
    return list.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  } catch (err) {
    console.warn('Failed to fetch notifications:', err);
    try {
      const local = localStorage.getItem('aur_kuning_notifications');
      return local ? JSON.parse(local) : [];
    } catch {
      return [];
    }
  }
}

export async function createNotification(
  notifData: Omit<AppNotification, 'id' | 'createdAt' | 'isRead'>
): Promise<AppNotification> {
  const path = 'notifications';
  const id = `notif_${Date.now()}_${Math.floor(100 + Math.random() * 900)}`;
  const notif: AppNotification = {
    ...notifData,
    id,
    isRead: false,
    createdAt: new Date().toISOString(),
  };

  // Local storage update
  try {
    const local = localStorage.getItem('aur_kuning_notifications');
    const list: AppNotification[] = local ? JSON.parse(local) : [];
    localStorage.setItem('aur_kuning_notifications', JSON.stringify([notif, ...list.slice(0, 49)]));
  } catch (e) {}

  // Audio notification chime if supported in browser
  try {
    if (typeof window !== 'undefined' && 'AudioContext' in window) {
      const ctx = new (window.AudioContext || (window as any).webkitAudioContext)();
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(587.33, ctx.currentTime); // D5
      osc.frequency.setValueAtTime(880, ctx.currentTime + 0.1); // A5
      gain.gain.setValueAtTime(0.15, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.35);
      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.35);
    }
  } catch (audioErr) {}

  // Cloud Firestore persistence
  try {
    await setDoc(doc(db, path, id), notif, { merge: true });
  } catch (err) {
    console.warn('Failed to save notification to Firestore:', err);
  }

  return notif;
}

export async function markNotificationAsRead(id: string): Promise<void> {
  const path = 'notifications';
  try {
    const local = localStorage.getItem('aur_kuning_notifications');
    if (local) {
      const list: AppNotification[] = JSON.parse(local);
      const updated = list.map((n) => (n.id === id ? { ...n, isRead: true } : n));
      localStorage.setItem('aur_kuning_notifications', JSON.stringify(updated));
    }
  } catch (e) {}

  try {
    await updateDoc(doc(db, path, id), { isRead: true });
  } catch (e) {
    try {
      await setDoc(doc(db, path, id), { isRead: true }, { merge: true });
    } catch (err) {}
  }
}

export function subscribeToNotifications(onData: (notifs: AppNotification[]) => void): () => void {
  const path = 'notifications';
  try {
    const unsubscribe = onSnapshot(
      collection(db, path),
      (snap) => {
        const list: AppNotification[] = [];
        snap.forEach((docItem) => {
          list.push(docItem.data() as AppNotification);
        });
        const sorted = list.sort(
          (a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        try {
          localStorage.setItem('aur_kuning_notifications', JSON.stringify(sorted));
        } catch (e) {}
        onData(sorted);
      },
      (err) => console.warn('Notifications snapshot warning:', err)
    );
    return unsubscribe;
  } catch (e) {
    return () => {};
  }
}
// ==========================================
// ACTIVITY LOG & AUDIT TRAIL SERVICE
// ==========================================

export async function fetchActivityLogs(): Promise<import('../types').ActivityLog[]> {
  const path = 'activity_logs';
  try {
    const snap = await getDocs(collection(db, path));
    if (!snap.empty) {
      const list: import('../types').ActivityLog[] = [];
      snap.forEach((docItem) => {
        list.push(docItem.data() as import('../types').ActivityLog);
      });
      const sorted = list.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
      try {
        localStorage.setItem('aur_kuning_activity_logs', JSON.stringify(sorted));
      } catch (e) {}
      return sorted;
    }
  } catch (err) {
    console.warn('Firestore fetch activity logs failed:', err);
  }

  // Fallback to local storage
  try {
    const local = localStorage.getItem('aur_kuning_activity_logs');
    if (local) {
      const parsed = JSON.parse(local);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {}

  const { INITIAL_ACTIVITY_LOGS } = await import('../data/initialData');
  return INITIAL_ACTIVITY_LOGS;
}

export async function recordActivityLog(
  action: string,
  category: import('../types').ActivityLog['category'],
  details: string,
  status: import('../types').ActivityLog['status'] = 'success',
  metadata?: Record<string, any>
): Promise<import('../types').ActivityLog> {
  const newLog: import('../types').ActivityLog = {
    id: 'log-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
    timestamp: new Date().toISOString(),
    user: 'rama.jockey@gmail.com (Owner)',
    action,
    category,
    details,
    status,
    metadata,
  };

  // 1. Save to local storage
  try {
    const current = localStorage.getItem('aur_kuning_activity_logs');
    const list: import('../types').ActivityLog[] = current ? JSON.parse(current) : [];
    list.unshift(newLog);
    // Keep last 200 logs
    const trimmed = list.slice(0, 200);
    localStorage.setItem('aur_kuning_activity_logs', JSON.stringify(trimmed));
  } catch (e) {}

  // 2. Save to Firestore if available
  try {
    await setDoc(doc(db, 'activity_logs', newLog.id), newLog, { merge: true });
  } catch (e) {
    // Fail silently
  }

  // 3. Sync to Google Sheets in background if configured
  try {
    syncToGoogleSheets('log_activity', newLog).catch(() => {});
  } catch (e) {}

  return newLog;
}

// ==========================================
// GOOGLE SHEETS + APPS SCRIPT INTEGRATION
// ==========================================

export async function syncToGoogleSheets(
  action:
    | 'order'
    | 'create_order'
    | 'request'
    | 'create_request'
    | 'product'
    | 'profile'
    | 'save_profile'
    | 'log_activity'
    | 'sync_all'
    | 'test',
  data: any,
  overrideWebhookUrl?: string
): Promise<{ success: boolean; message: string }> {
  let webhookUrl = overrideWebhookUrl;
  if (!webhookUrl) {
    try {
      const settings = await fetchStoreSettings();
      webhookUrl = settings.googleSheetsWebhookUrl;
      if (!settings.autoSyncGoogleSheets && action !== 'test') {
        return { success: false, message: 'Sinkronisasi otomatis Google Sheet dinonaktifkan di pengaturan.' };
      }
    } catch {
      return { success: false, message: 'Pengaturan Google Sheet tidak dapat diakses.' };
    }
  }

  if (!webhookUrl || !webhookUrl.trim().startsWith('http')) {
    return { success: false, message: 'URL Webhook Google Apps Script belum diisi.' };
  }

  try {
    const payload = {
      action,
      timestamp: new Date().toISOString(),
      data,
    };

    // Google Apps Script Web App responds with 302 redirects.
    // text/plain prevents CORS preflight OPTIONS rejection
    await fetch(webhookUrl.trim(), {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain;charset=utf-8',
      },
      body: JSON.stringify(payload),
      mode: 'no-cors',
    });

    return {
      success: true,
      message: 'Data berhasil dikirim ke Google Apps Script dan disinkronkan ke Google Sheet!',
    };
  } catch (err: any) {
    console.error('Google Sheets sync error:', err);
    return {
      success: false,
      message: err.message || 'Gagal mengirim data ke Google Sheet.',
    };
  }
}

// ==========================================
// BACKUP & RESTORE DATABASE MANDIRI
// ==========================================

export interface FullDatabaseBackup {
  version: string;
  exportedAt: string;
  exportedBy: string;
  storeSettings: StoreSettings;
  orders: Order[];
  requests: ProductRequest[];
  products: Product[];
  categories: Category[];
  activityLogs: import('../types').ActivityLog[];
}

export async function exportDatabaseSnapshot(): Promise<FullDatabaseBackup> {
  const [settings, prods, cats, ords, reqs, logs] = await Promise.all([
    fetchStoreSettings(),
    fetchProducts(),
    fetchCategories(),
    fetchAllOrders(),
    fetchAllRequests(),
    fetchActivityLogs(),
  ]);

  const backupData: FullDatabaseBackup = {
    version: '2.5',
    exportedAt: new Date().toISOString(),
    exportedBy: 'rama.jockey@gmail.com (Owner)',
    storeSettings: settings,
    orders: ords,
    requests: reqs,
    products: prods,
    categories: cats,
    activityLogs: logs,
  };

  await recordActivityLog(
    'Backup Database Mandiri',
    'backup',
    `Snapshot data diunduh: ${prods.length} produk, ${ords.length} pesanan, ${reqs.length} request belanja.`,
    'success'
  );

  return backupData;
}

export async function restoreDatabaseSnapshot(
  backup: Partial<FullDatabaseBackup>
): Promise<{ success: boolean; message: string; restoredCounts: Record<string, number> }> {
  try {
    const counts = { products: 0, orders: 0, requests: 0, categories: 0, settings: 0 };

    if (backup.storeSettings) {
      await saveStoreSettings(backup.storeSettings);
      counts.settings = 1;
    }

    if (Array.isArray(backup.categories) && backup.categories.length > 0) {
      for (const cat of backup.categories) {
        await saveCategory(cat);
        counts.categories++;
      }
    }

    if (Array.isArray(backup.products) && backup.products.length > 0) {
      for (const prod of backup.products) {
        await saveProduct(prod);
        counts.products++;
      }
    }

    if (Array.isArray(backup.orders) && backup.orders.length > 0) {
      for (const ord of backup.orders) {
        try {
          await setDoc(doc(db, 'orders', ord.id), ord, { merge: true });
          counts.orders++;
        } catch (e) {}
      }
    }

    if (Array.isArray(backup.requests) && backup.requests.length > 0) {
      for (const req of backup.requests) {
        try {
          await setDoc(doc(db, 'requests', req.id), req, { merge: true });
          counts.requests++;
        } catch (e) {}
      }
    }

    await recordActivityLog(
      'Restore Database Mandiri',
      'backup',
      `Restorasi berhasil: ${counts.products} produk, ${counts.orders} pesanan, ${counts.requests} request dipulihkan.`,
      'success'
    );

    return {
      success: true,
      message: `Database berhasil dipulihkan! ${counts.products} produk, ${counts.orders} pesanan, ${counts.requests} request telah masuk ke sistem.`,
      restoredCounts: counts,
    };
  } catch (err: any) {
    await recordActivityLog(
      'Gagal Restore Database',
      'backup',
      `Restorasi gagal: ${err.message || 'Format data tidak valid'}`,
      'error'
    );
    return {
      success: false,
      message: err.message || 'Gagal memulihkan database dari file cadangan.',
      restoredCounts: {},
    };
  }
}

// ==========================================
// THERMAL RECEIPT & WHATSAPP STRUK HELPERS
// ==========================================

export function formatThermalReceiptLines(
  order: Order,
  settings: StoreSettings
): string[] {
  const lineW = 32; // standard 58mm character width (approx 32 cols in normal font)
  const sep = '='.repeat(lineW);
  const dash = '-'.repeat(lineW);

  const outletName = order.outletId === 'TANAH_ABANG' ? 'TANAH ABANG (JAKARTA)' : 'AUR KUNING (BUKITTINGGI)';

  const lines: string[] = [];
  lines.push('GROSIR NUSANTARA');
  lines.push(outletName);
  if (settings.tagline) lines.push(settings.tagline);
  if (settings.showAddressOnReceipt && settings.address) {
    lines.push(settings.address);
  }
  if (settings.showWhatsappOnReceipt && settings.whatsappNumber) {
    lines.push(`WA: ${settings.whatsappNumber}`);
  }
  lines.push(sep);

  // Invoice & Info
  lines.push(`No. Nota  : ${order.invoiceNumber}`);
  lines.push(`Outlet    : ${order.outletId || 'Pusat'}`);
  lines.push(`Tanggal   : ${new Date(order.createdAt).toLocaleDateString('id-ID', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })}`);
  lines.push(`Pelanggan : ${order.customerName}`);
  lines.push(`Kasir     : Grosir Nusantara Kasir`);
  lines.push(dash);

  // Items
  lines.push('BARANG GROSIR              TOTAL');
  lines.push(dash);
  order.items.forEach((item) => {
    const itemTotal = (item.wholesalePrice || item.price) * item.quantity;
    lines.push(`${item.productName.substring(0, 30)}`);
    const qtyPrice = ` ${item.quantity}x @Rp${(item.wholesalePrice || item.price).toLocaleString('id-ID')}`;
    const totStr = `Rp${itemTotal.toLocaleString('id-ID')}`;
    const spacing = Math.max(1, lineW - qtyPrice.length - totStr.length);
    lines.push(qtyPrice + ' '.repeat(spacing) + totStr);
  });
  lines.push(dash);

  // Subtotals (Tanpa upah joki)
  const formatRow = (label: string, val: number) => {
    const valStr = `Rp${val.toLocaleString('id-ID')}`;
    const spacing = Math.max(1, lineW - label.length - valStr.length);
    return label + ' '.repeat(spacing) + valStr;
  };

  lines.push(formatRow('Subtotal Barang:', order.subtotal));
  lines.push(formatRow('Ongkos Kirim (' + (order.courier || 'Ekspedisi') + '):', order.shippingCost));
  lines.push(sep);
  lines.push(formatRow('TOTAL BAYAR:', order.totalAmount));
  lines.push(sep);

  lines.push(`Metode Bayar: ${order.paymentMethod}`);
  lines.push(`Status Bayar: ${order.paymentStatus.toUpperCase()}`);
  if (order.trackingNumber) {
    lines.push(`No. Resi     : ${order.trackingNumber}`);
  }
  if (order.trackingLink) {
    lines.push(`Link Lacak   : ${order.trackingLink.substring(0, 28)}`);
  }
  lines.push(dash);

  if (settings.showFooterOnReceipt && settings.receiptFooter) {
    lines.push(settings.receiptFooter);
  }
  if (settings.receiptReturnPolicy) {
    lines.push(settings.receiptReturnPolicy);
  }
  lines.push(sep);
  lines.push(' *** GROSIR NUSANTARA *** ');

  return lines;
}

export function formatWhatsappReceiptText(order: Order, settings: StoreSettings): string {
  const outletLabel =
    order.outletId === 'TANAH_ABANG'
      ? 'Tanah Abang (DKI Jakarta)'
      : 'Pasar Aur Kuning (Bukittinggi)';

  const itemsText = order.items
    .map(
      (item, idx) =>
        `${idx + 1}. *${item.productName}*\n   ${item.quantity} pcs @ Rp${(item.wholesalePrice || item.price).toLocaleString('id-ID')} = *Rp${((item.wholesalePrice || item.price) * item.quantity).toLocaleString('id-ID')}*${item.color ? ` (Warna: ${item.color})` : ''}`
    )
    .join('\n');

  return `*STRUK DIGITAL PESANAN GROSIR*
*GROSIR NUSANTARA*
_Sentra Sourcing: ${outletLabel}_

📄 *No. Invoice:* ${order.invoiceNumber}
🏢 *Outlet:* ${outletLabel}
📅 *Waktu:* ${new Date(order.createdAt).toLocaleDateString('id-ID', {
    day: 'numeric',
    month: 'long',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })} WIB
👤 *Nama Pelanggan:* ${order.customerName}
📍 *Tujuan:* ${order.shippingAddress ? `${order.shippingAddress.city}, ${order.shippingAddress.province}` : '-'}

=============================
*RINCIAN BARANG GROSIR:*
${itemsText}
=============================
💰 *Subtotal Barang:* Rp${order.subtotal.toLocaleString('id-ID')}
📦 *Ongkos Kirim (${order.courier}):* Rp${order.shippingCost.toLocaleString('id-ID')}
-----------------------------
💳 *TOTAL PEMBAYARAN:* *Rp${order.totalAmount.toLocaleString('id-ID')}*
-----------------------------
📌 *Status Bayar:* ${order.paymentStatus === 'Lunas' ? '✅ LUNAS' : '⏳ ' + order.paymentStatus}
🚚 *Status Pengiriman:* ${order.orderStatus}
${order.trackingNumber ? `🏷️ *No. Resi:* ${order.trackingNumber}\n` : ''}${order.trackingLink ? `🔗 *Tautan Lacak Pesanan:* ${order.trackingLink}\n` : ''}
${settings.receiptFooter || 'Terima kasih telah berbelanja grosir melalui Grosir Nusantara!'}

📞 *Konfirmasi & CS:* wa.me/${settings.whatsappNumber.replace(/\D/g, '')}
`;
}

// Complete Google Apps Script code with multi-outlet support & full CRUD
export const SAMPLE_GOOGLE_APPS_SCRIPT_CODE = `// =========================================================================
// GOOGLE APPS SCRIPT - MULTI-OUTLET POS & DATABASE GROSIR NUSANTARA
// Outlets: 1. Tanah Abang (Jakarta) | 2. Pasar Aur Kuning (Bukittinggi)
// =========================================================================
// Panduan Pasang:
// 1. Buat Google Sheets baru di https://sheets.new
// 2. Klik menu: Ekstensi > Apps Script (Extensions > Apps Script)
// 3. Hapus seluruh isi default lalu tempel kode ini seluruhnya
// 4. Klik "Simpan" (Ctrl+S) lalu klik tombol "Deploy" > "New deployment"
// 5. Pilih "Web app" (Aplikasi Web):
//    - Description: "Grosir Nusantara Multi-Outlet API"
//    - Execute as : "Me" (Email Google Anda)
//    - Who has access: "Anyone" (Siapa saja)
// 6. Klik "Deploy", beri izin akses Google, lalu Salin Web App URL
// 7. Tempelkan URL tersebut ke Menu "Database (Sheets)" di Aplikasi Web!
// =========================================================================

/**
 * Endpoint POST: Menangani Create / Update / Sinkronisasi Multi-Outlet
 */
function doPost(e) {
  try {
    var contents = JSON.parse(e.postData.contents);
    var action = contents.action;
    var data = contents.data;
    var timestamp = contents.timestamp || new Date().toISOString();
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    // -------------------------------------------------------------
    // 1. Simpan / Perbarui Profil Toko & Outlet
    // -------------------------------------------------------------
    if (action === 'save_profile' || action === 'profile') {
      var sheet = getOrCreateSheet(ss, 'Profil', [
        'Outlet ID', 'Parameter / Kunci', 'Nilai Pengaturan', 'Terakhir Diperbarui'
      ], '#0f2744');

      var outletId = data.activeOutletId || 'TANAH_ABANG';
      var profileData = [
        [outletId, 'Nama Toko', data.storeName || '', timestamp],
        [outletId, 'Nomor WhatsApp', data.whatsappNumber || '', timestamp],
        [outletId, 'Email Toko', data.email || '', timestamp],
        [outletId, 'Alamat Lengkap', data.address || '', timestamp],
        [outletId, 'Hari Pasar Utama', data.marketDays || '', timestamp],
        [outletId, 'Jam Operasional', data.operationalHours || '', timestamp],
        [outletId, 'Header Struk Thermal', data.receiptHeader || '', timestamp],
        [outletId, 'Footer Pesan Struk', data.receiptFooter || '', timestamp],
        [outletId, 'Kebijakan Retur Struk', data.receiptReturnPolicy || '', timestamp],
        [outletId, 'Tampilkan Logo Struk', data.showLogoOnReceipt ? 'Ya' : 'Tidak', timestamp],
        [outletId, 'Ukuran Kertas Thermal', data.thermalPaperWidth || '58mm', timestamp]
      ];

      profileData.forEach(function(row) {
        sheet.appendRow(row);
      });

      logActivity(ss, outletId, 'Admin', 'Update Profil Toko', 'Profil outlet ' + outletId + ' berhasil diperbarui.');
      return jsonResponse({ status: 'success', message: 'Profil outlet ' + outletId + ' berhasil disimpan' });
    }

    // -------------------------------------------------------------
    // 2. Simpan Transaksi / Pesanan Masuk (Multi-Outlet)
    // -------------------------------------------------------------
    else if (action === 'order' || action === 'create_order') {
      var sheet = getOrCreateSheet(ss, 'Transaksi', [
        'Waktu Transaksi', 'Outlet ID', 'No. Invoice', 'Nama Pelanggan', 'No. WhatsApp', 'Email',
        'Kota Tujuan', 'Rincian Barang', 'Subtotal Barang',
        'Ongkos Kirim', 'Total Bayar', 'Status Bayar', 'Status Pesanan', 'Ekspedisi', 'No. Resi', 'Link Lacak'
      ], '#0f2744');

      var outletId = data.outletId || 'TANAH_ABANG';
      var itemsDesc = data.items ? data.items.map(function(it) {
        return it.productName + ' (' + it.quantity + ' pcs @ Rp' + (it.wholesalePrice || it.price) + ')';
      }).join('\\n') : '';

      sheet.appendRow([
        new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
        outletId,
        data.invoiceNumber || data.id,
        data.customerName || '',
        data.customerWhatsapp || '',
        data.customerEmail || '',
        data.shippingAddress ? (data.shippingAddress.city + ', ' + data.shippingAddress.province) : '',
        itemsDesc,
        data.subtotal || 0,
        data.shippingCost || 0,
        data.totalAmount || 0,
        data.paymentStatus || 'Menunggu Pembayaran',
        data.orderStatus || 'Menunggu Pembayaran',
        data.courier || '',
        data.trackingNumber || '',
        data.trackingLink || ''
      ]);

      recordCustomer(ss, data);
      logActivity(ss, outletId, data.customerName || 'Customer', 'Transaksi Baru', 'Invoice ' + (data.invoiceNumber || data.id) + ' senilai Rp' + (data.totalAmount || 0));

      return jsonResponse({ status: 'success', message: 'Transaksi berhasil dicatat ke sheet Transaksi' });
    }

    // -------------------------------------------------------------
    // 3. Simpan Permintaan Barang (Request Sourcing)
    // -------------------------------------------------------------
    else if (action === 'request' || action === 'create_request') {
      var sheet = getOrCreateSheet(ss, 'Request Barang', [
        'Waktu Masuk', 'Outlet Target', 'No. Tiket', 'Nama Pelanggan', 'No. WhatsApp',
        'Nama Barang', 'Kategori', 'Jumlah', 'Target Budget', 'Status', 'Catatan'
      ], '#ea580c');

      var outletId = data.outletId || 'TANAH_ABANG';
      sheet.appendRow([
        new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
        outletId,
        data.ticketNumber || data.id,
        data.customerName || '',
        data.customerWhatsapp || '',
        data.itemName || '',
        data.category || '',
        data.quantity || '',
        data.targetBudget || '',
        data.status || 'Request Diterima',
        data.description || data.notes || ''
      ]);

      logActivity(ss, outletId, data.customerName || 'Customer', 'Request Belanja', 'Tiket ' + (data.ticketNumber || data.id) + ' (' + data.itemName + ')');
      return jsonResponse({ status: 'success', message: 'Request sourcing berhasil dicatat' });
    }

    // -------------------------------------------------------------
    // 4. Catat Log Aktivitas (Audit Trail Multi-Outlet)
    // -------------------------------------------------------------
    else if (action === 'log_activity') {
      var outletId = data.outletId || 'ALL';
      logActivity(ss, outletId, data.user || 'Admin', data.action || 'Aktivitas', data.details || '');
      return jsonResponse({ status: 'success', message: 'Log aktivitas tercatat' });
    }

    // -------------------------------------------------------------
    // 5. Sinkronisasi Massal (Sync All Katalog & Transaksi)
    // -------------------------------------------------------------
    else if (action === 'sync_all') {
      if (data.products && Array.isArray(data.products)) {
        var pSheet = getOrCreateSheet(ss, 'Layanan & Produk', [
          'ID Produk', 'Outlet ID', 'Nama Produk', 'Kategori', 'Harga Ecer', 'Harga Grosir', 'Min. Order', 'Satuan', 'Stok'
        ], '#047857');
        pSheet.clearContents();
        pSheet.appendRow(['ID Produk', 'Outlet ID', 'Nama Produk', 'Kategori', 'Harga Ecer', 'Harga Grosir', 'Min. Order', 'Satuan', 'Stok']);
        pSheet.getRange(1, 1, 1, 9).setFontWeight('bold').setBackground('#047857').setFontColor('#ffffff');
        data.products.forEach(function(p) {
          pSheet.appendRow([
            p.id, p.outletId || 'TANAH_ABANG', p.name, p.categoryName || '', p.price || 0, p.wholesalePrice || 0,
            p.minOrder || 1, p.unit || 'pcs', p.inStock ? 'Ready' : 'Habis'
          ]);
        });
      }
      logActivity(ss, 'ALL', 'Admin', 'Sinkronisasi Massal', 'Sinkronisasi lengkap database multi-outlet');
      return jsonResponse({ status: 'success', message: 'Sinkronisasi multi-outlet selesai' });
    }

    // -------------------------------------------------------------
    // 6. Uji Koneksi Webhook
    // -------------------------------------------------------------
    else if (action === 'test') {
      var logSheet = getOrCreateSheet(ss, 'Log Koneksi', [
        'Waktu Pengujian', 'Status', 'Payload Diterima'
      ], '#2563eb');

      logSheet.appendRow([
        new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
        'Koneksi Berhasil Aktif & Terhubung!',
        JSON.stringify(data)
      ]);

      return jsonResponse({
        status: 'success',
        message: 'Koneksi ke Google Sheets Aktif!',
        spreadsheetName: ss.getName(),
        outletsSupported: ['TANAH_ABANG', 'AUR_KUNING'],
        timestamp: new Date().toISOString()
      });
    }

    return jsonResponse({ status: 'warning', message: 'Aksi tidak dikenali: ' + action });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

/**
 * Endpoint GET: Mendukung CRUD Read Data dengan Filter Outlet
 */
function doGet(e) {
  try {
    var params = e ? e.parameter : {};
    var action = params ? params.action : '';
    var sheetName = params ? params.sheet : '';
    var outletFilter = params ? params.outlet : '';
    var ss = SpreadsheetApp.getActiveSpreadsheet();

    if (action === 'read' && sheetName) {
      var sheet = ss.getSheetByName(sheetName);
      if (!sheet) return jsonResponse({ status: 'error', message: 'Sheet tidak ditemukan: ' + sheetName });
      var rows = sheet.getDataRange().getValues();
      var headers = rows[0];
      var data = [];
      for (var i = 1; i < rows.length; i++) {
        var obj = {};
        for (var j = 0; j < headers.length; j++) {
          obj[headers[j]] = rows[i][j];
        }
        if (!outletFilter || obj['Outlet ID'] === outletFilter || obj['Outlet Target'] === outletFilter) {
          data.push(obj);
        }
      }
      return jsonResponse({ status: 'success', sheet: sheetName, count: data.length, rows: data });
    }

    return jsonResponse({
      status: 'active',
      appName: 'API Backend GROSIR NUSANTARA (Multi-Outlet)',
      outlets: ['TANAH_ABANG (Jakarta)', 'AUR_KUNING (Bukittinggi)'],
      spreadsheetName: ss.getName(),
      sheetsAvailable: ss.getSheets().map(function(s) { return s.getName(); })
    });
  } catch (err) {
    return jsonResponse({ status: 'error', message: err.toString() });
  }
}

// ---------------- Helper Utilities ----------------
function getOrCreateSheet(ss, name, headers, headerColor) {
  var sheet = ss.getSheetByName(name);
  if (!sheet) sheet = ss.insertSheet(name);
  if (sheet.getLastRow() === 0 && headers && headers.length > 0) {
    sheet.appendRow(headers);
    sheet.getRange(1, 1, 1, headers.length).setFontWeight('bold').setBackground(headerColor || '#0f2744').setFontColor('#ffffff');
  }
  return sheet;
}

function recordCustomer(ss, order) {
  try {
    var sheet = getOrCreateSheet(ss, 'Pelanggan', [
      'Waktu Registrasi', 'Outlet Asal', 'Nama Lengkap', 'Nomor WhatsApp', 'Email', 'Kota / Domisili', 'Total Transaksi Terakhir'
    ], '#059669');
    var wa = order.customerWhatsapp || '';
    if (!wa) return;
    var rows = sheet.getDataRange().getValues();
    var foundRow = -1;
    for (var i = 1; i < rows.length; i++) {
      if (String(rows[i][3]).replace(/\\D/g, '') === String(wa).replace(/\\D/g, '')) {
        foundRow = i + 1;
        break;
      }
    }
    if (foundRow > 0) {
      sheet.getRange(foundRow, 7).setValue(order.totalAmount || 0);
    } else {
      sheet.appendRow([
        new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }),
        order.outletId || 'TANAH_ABANG',
        order.customerName || '',
        wa,
        order.customerEmail || '',
        order.shippingAddress ? (order.shippingAddress.city + ', ' + order.shippingAddress.province) : '',
        order.totalAmount || 0
      ]);
    }
  } catch (e) {}
}

function logActivity(ss, outletId, user, actionName, details) {
  try {
    var sheet = getOrCreateSheet(ss, 'Activity Log', [
      'Timestamp', 'Outlet', 'Pengguna', 'Aktivitas / Aksi', 'Rincian Catatan'
    ], '#334155');
    sheet.appendRow([new Date().toLocaleString('id-ID', { timeZone: 'Asia/Jakarta' }), outletId || 'ALL', user, actionName, details]);
  } catch (e) {}
}

function jsonResponse(obj) {
  return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON);
}
`;

