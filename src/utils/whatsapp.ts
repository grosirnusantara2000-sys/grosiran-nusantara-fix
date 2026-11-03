import { StoreSettings, Order, ProductRequest } from '../types';

/**
 * Central WhatsApp utility for Grosir Nusantara
 * Ensures that whenever the store's WhatsApp number or multi-channel contacts
 * are changed in the store profile, they are automatically, consistently,
 * and accurately applied across the entire app.
 */

export function getCleanWhatsappNumber(phone?: string): string {
  if (!phone) return '6281298765432';
  // Strip all non-digit characters
  const digits = phone.replace(/\D/g, '');
  if (!digits) return '6281298765432';

  // If starts with 0 (e.g. 0812...), replace 0 with 62
  if (digits.startsWith('0')) {
    return '62' + digits.substring(1);
  }
  // If already starts with 62 (e.g. 62812...), return as-is
  if (digits.startsWith('62')) {
    return digits;
  }
  // Otherwise prepend 62
  return '62' + digits;
}

export function formatWhatsappDisplay(phone?: string): string {
  const clean = getCleanWhatsappNumber(phone);
  // Expected format: 628123456789 -> +62 812-3456-789
  if (clean.startsWith('62') && clean.length >= 10) {
    const main = clean.substring(2);
    const part1 = main.substring(0, 3);
    const part2 = main.substring(3, 7);
    const part3 = main.substring(7);
    return `+62 ${part1}-${part2}${part3 ? '-' + part3 : ''}`;
  }
  return phone || '+62 812-9876-5432';
}

/**
 * Returns the effective WhatsApp phone number for a given channel based on store settings.
 * If useSingleWhatsapp is true (or channel-specific number is empty), it seamlessly falls back to the main whatsappNumber.
 */
export function getEffectiveWhatsapp(
  storeSettings: StoreSettings | undefined,
  channel: 'main' | 'tanya_admin' | 'order' | 'request' = 'main',
  outletFallback?: string
): string {
  const fallback = storeSettings?.whatsappNumber?.trim() || outletFallback || '081298765432';

  if (!storeSettings) {
    return fallback;
  }

  // If store is configured to use a single WhatsApp number for everything
  if (storeSettings.useSingleWhatsapp !== false) {
    return storeSettings.whatsappNumber?.trim() || fallback;
  }

  // Otherwise check channel-specific numbers
  switch (channel) {
    case 'tanya_admin':
      return storeSettings.whatsappTanyaAdmin?.trim() || storeSettings.whatsappNumber?.trim() || fallback;
    case 'order':
      return storeSettings.whatsappOrder?.trim() || storeSettings.whatsappNumber?.trim() || fallback;
    case 'request':
      return storeSettings.whatsappRequest?.trim() || storeSettings.whatsappNumber?.trim() || fallback;
    case 'main':
    default:
      return storeSettings.whatsappNumber?.trim() || fallback;
  }
}

export function getWhatsappChatUrl(phone: string | undefined, message: string): string {
  const clean = getCleanWhatsappNumber(phone);
  return `https://wa.me/${clean}?text=${encodeURIComponent(message)}`;
}

/**
 * Helper to construct the product inquiry WhatsApp message using the store's custom template
 */
export function formatProductInquiryMessage(
  storeSettings: StoreSettings | undefined,
  product: {
    name: string;
    wholesalePrice: number;
    minOrder: number;
    unit?: string;
    id?: string;
  }
): string {
  const rawTemplate =
    storeSettings?.whatsappGreetingProduct ||
    'Halo Admin Grosir Nusantara, saya tertarik dengan produk grosir ini:\n\n*Nama Produk:* {nama_produk}\n*Harga Grosir:* {harga}\n*Min. Order:* {min_order}\n\nApakah stok masih tersedia dan bisa dikirim ke kota saya? Terima kasih!';

  const formattedPrice = `Rp ${product.wholesalePrice.toLocaleString('id-ID')}/${product.unit || 'pcs'}`;
  const formattedMin = `${product.minOrder} ${product.unit || 'pcs'}`;

  return rawTemplate
    .replace(/{nama_produk}/g, product.name)
    .replace(/{harga}/g, formattedPrice)
    .replace(/{min_order}/g, formattedMin)
    .replace(/{kode_produk}/g, product.id || '-');
}

/**
 * Helper to construct general Tanya Admin message using the store's custom template
 */
export function formatTanyaAdminMessage(
  storeSettings: StoreSettings | undefined,
  customContext?: string
): string {
  const base =
    storeSettings?.whatsappGreetingGeneral ||
    'Halo Admin Grosir Nusantara, saya ingin berkonsultasi mengenai belanja grosir dan pembelian tangan pertama dari sentra Tanah Abang & Aur Kuning.';

  if (customContext) {
    return `${base}\n\nCatatan tambahan: ${customContext}`;
  }
  return base;
}

/**
 * Constructs official Invoice Nota confirmation WhatsApp message
 * Guarantees that the unique Invoice Number is prominently featured
 * along with items, totals, destination, and self-tracking instructions.
 */
export function formatWhatsappOrderInvoiceMessage(
  storeSettings: StoreSettings | undefined,
  order: Order
): string {
  const formatRupiah = (num: number) => 'Rp ' + Number(num || 0).toLocaleString('id-ID');
  const itemsList = order.items
    ?.map(
      (it, idx) =>
        `${idx + 1}. ${it.productName} (${it.quantity} pcs${it.color ? ' - ' + it.color : ''}${it.size ? ' / ' + it.size : ''}) = ${formatRupiah((it.wholesalePrice || it.price) * it.quantity)}`
    )
    .join('\n') || '-';

  return `*NOTA RESMI PESANAN GROSIR NUSANTARA*
*NO. INVOICE:* \`${order.invoiceNumber}\`
--------------------------------------------
*Penerima:* ${order.customerName}
*WhatsApp:* ${order.customerWhatsapp}
*Alamat Tujuan:* ${order.shippingAddress?.street || ''}, ${order.shippingAddress?.city || ''}, ${order.shippingAddress?.province || ''}
*Ekspedisi:* ${order.courier || '-'}
*Metode Bayar:* ${order.paymentMethod || '-'}

*RINCIAN BARANG:*
${itemsList}

*Subtotal Belanja:* ${formatRupiah(order.subtotal)}
*Ongkir Kargo (${order.courier}):* ${formatRupiah(order.shippingCost)}
*TOTAL TAGIHAN:* ${formatRupiah(order.totalAmount)}
--------------------------------------------
*Status Pesanan:* ${order.orderStatus}
*Lacak Pesanan Mandiri:*
Anda dapat mengecek progres belanja, foto lapak, & nomor resi secara mandiri di web Grosir Nusantara pada menu *Lacak Pesanan* dengan memasukkan No. Invoice: *${order.invoiceNumber}*

Mohon dicek dan dibantu proses pembelian barangnya. Terima kasih!`;
}

/**
 * Constructs official Request Barang Nota/Tiket WhatsApp message
 * Guarantees that the unique Ticket/Nota Number is prominently featured
 * along with target outlet, requested item, budget, and tracking instructions.
 */
export function formatWhatsappRequestNotaMessage(
  storeSettings: StoreSettings | undefined,
  request: ProductRequest,
  outletName?: string
): string {
  return `*NOTA TIKET REQUEST BARANG GROSIR NUSANTARA*
*NO. TIKET / NOTA:* \`${request.ticketNumber}\`
--------------------------------------------
*Sentra Sourcing:* ${outletName || 'Tanah Abang & Aur Kuning'}
*Nama Pemesan:* ${request.customerName}
*WhatsApp:* ${request.customerWhatsapp}
*Kategori:* ${request.category || 'Grosir Umum'}

*BARANG YANG DICARI:*
*${request.itemName}*
*Jumlah / Partai:* ${request.quantity || '1 lusin'}
*Target Budget:* ${request.targetBudget || 'Harga tangan pertama lapak'}
*Catatan Sourcing:* ${request.notes || '-'}
--------------------------------------------
*Status Request:* ${request.status}
*Lacak Status Mandiri:*
Pantau update pencarian lapak & konfirmasi harga langsung di web Grosir Nusantara pada menu *Lacak Pesanan* dengan memasukkan No. Tiket: *${request.ticketNumber}*

Mohon bantuannya untuk dicarikan langsung di pasar grosir. Terima kasih!`;
}

