import type {
  Category,
  Customer,
  Order,
  Product,
  StockMovement,
  Supplier,
} from "./types";
import { supabase } from "@/integrations/supabase/client";

/**
 * Cloud-backed cache. Keeps a synchronous `get*` API to preserve existing UI code,
 * while `set*` writes through to Supabase and refreshes the cache.
 */

type Cache = {
  products: Product[];
  categories: Category[];
  suppliers: Supplier[];
  customers: Customer[];
  orders: Order[];
  movements: StockMovement[];
};

const cache: Cache = {
  products: [],
  categories: [],
  suppliers: [],
  customers: [],
  orders: [],
  movements: [],
};

const loaded: Record<keyof Cache, boolean> = {
  products: false,
  categories: false,
  suppliers: false,
  customers: false,
  orders: false,
  movements: false,
};

function notify(key: keyof Cache) {
  window.dispatchEvent(new CustomEvent("estoque:update", { detail: { key } }));
}

/* ------------ mappers ------------ */
const mapProduct = (r: any): Product => ({
  id: r.id,
  sku: r.sku,
  barcode: r.barcode,
  name: r.name,
  description: r.description ?? "",
  categoryId: r.category_id,
  supplierId: r.supplier_id,
  costPrice: Number(r.cost_price) || 0,
  salePrice: Number(r.sale_price) || 0,
  stock: r.stock ?? 0,
  minStock: r.min_stock ?? 5,
  createdAt: r.created_at,
  updatedAt: r.updated_at,
});
const productToRow = (p: Product) => ({
  id: p.id,
  sku: p.sku,
  barcode: p.barcode,
  name: p.name,
  description: p.description,
  category_id: p.categoryId,
  supplier_id: p.supplierId,
  cost_price: p.costPrice,
  sale_price: p.salePrice,
  stock: p.stock,
  min_stock: p.minStock,
});

const mapCustomer = (r: any): Customer => ({
  id: r.id,
  name: r.name,
  document: r.document ?? "",
  email: r.email ?? "",
  phone: r.phone ?? "",
  address: r.address ?? "",
  cep: r.cep ?? "",
  street: r.street ?? "",
  number: r.number ?? "",
  complement: r.complement ?? "",
  neighborhood: r.neighborhood ?? "",
  city: r.city ?? "",
  state: r.state ?? "",
  birthDate: r.birth_date ?? "",
  notes: r.notes ?? "",
  createdAt: r.created_at,
});
const mapSupplier = (r: any): Supplier => ({
  id: r.id,
  name: r.name,
  contact: r.contact ?? "",
  phone: r.phone ?? "",
  email: r.email ?? "",
  createdAt: r.created_at,
});
const mapCategory = (r: any): Category => ({
  id: r.id,
  name: r.name,
  createdAt: r.created_at,
});
const mapOrder = (r: any): Order => ({
  id: r.id,
  number: r.number,
  customerId: r.customer_id,
  customerName: r.customer_name ?? "",
  items: (r.items as any) ?? [],
  total: Number(r.total) || 0,
  status: r.status,
  notes: r.notes ?? "",
  createdAt: r.created_at,
});
const mapMovement = (r: any): StockMovement => ({
  id: r.id,
  productId: r.product_id,
  productName: r.product_name,
  type: r.type,
  quantity: r.quantity,
  reason: r.reason ?? "",
  orderId: r.order_id ?? undefined,
  createdAt: r.created_at,
});

/* ------------ loaders ------------ */
async function loadProducts() {
  const { data } = await supabase.from("products").select("*").order("name");
  cache.products = (data ?? []).map(mapProduct);
  loaded.products = true;
  notify("products");
}
async function loadCategories() {
  const { data } = await supabase.from("categories").select("*").order("name");
  cache.categories = (data ?? []).map(mapCategory);
  loaded.categories = true;
  notify("categories");
}
async function loadSuppliers() {
  const { data } = await supabase.from("suppliers").select("*").order("name");
  cache.suppliers = (data ?? []).map(mapSupplier);
  loaded.suppliers = true;
  notify("suppliers");
}
async function loadCustomers() {
  const { data } = await supabase.from("customers").select("*").order("name");
  cache.customers = (data ?? []).map(mapCustomer);
  loaded.customers = true;
  notify("customers");
}
async function loadOrders() {
  const { data } = await supabase.from("orders").select("*").order("created_at", { ascending: false });
  cache.orders = (data ?? []).map(mapOrder);
  loaded.orders = true;
  notify("orders");
}
async function loadMovements() {
  const { data } = await supabase.from("stock_movements").select("*").order("created_at", { ascending: false });
  cache.movements = (data ?? []).map(mapMovement);
  loaded.movements = true;
  notify("movements");
}

export async function loadAll() {
  await Promise.all([
    loadProducts(), loadCategories(), loadSuppliers(),
    loadCustomers(), loadOrders(), loadMovements(),
  ]);
}

export function ensureLoaded(key: keyof Cache) {
  if (loaded[key]) return;
  switch (key) {
    case "products": loadProducts(); break;
    case "categories": loadCategories(); break;
    case "suppliers": loadSuppliers(); break;
    case "customers": loadCustomers(); break;
    case "orders": loadOrders(); break;
    case "movements": loadMovements(); break;
  }
}

/* ------------ diff helpers ------------ */
function diffById<T extends { id: string }>(prev: T[], next: T[]) {
  const prevMap = new Map(prev.map((x) => [x.id, x]));
  const nextMap = new Map(next.map((x) => [x.id, x]));
  const added = next.filter((x) => !prevMap.has(x.id));
  const removed = prev.filter((x) => !nextMap.has(x.id));
  const updated = next.filter((x) => prevMap.has(x.id) && JSON.stringify(prevMap.get(x.id)) !== JSON.stringify(x));
  return { added, removed, updated };
}

/* ------------ storage facade ------------ */
export const storage = {
  getProducts: () => cache.products,
  setProducts: async (v: Product[]) => {
    const { added, removed, updated } = diffById(cache.products, v);
    for (const p of removed) await supabase.from("products").delete().eq("id", p.id);
    for (const p of added) await supabase.from("products").insert(productToRow(p));
    for (const p of updated) await supabase.from("products").update(productToRow(p)).eq("id", p.id);
    await loadProducts();
  },

  getCategories: () => cache.categories,
  setCategories: async (v: Category[]) => {
    const { added, removed } = diffById(cache.categories, v);
    for (const c of removed) await supabase.from("categories").delete().eq("id", c.id);
    for (const c of added) await supabase.from("categories").insert({ id: c.id, name: c.name });
    await loadCategories();
  },

  getSuppliers: () => cache.suppliers,
  setSuppliers: async (v: Supplier[]) => {
    const { added, removed, updated } = diffById(cache.suppliers, v);
    for (const s of removed) await supabase.from("suppliers").delete().eq("id", s.id);
    for (const s of added) await supabase.from("suppliers").insert({ id: s.id, name: s.name, contact: s.contact, phone: s.phone, email: s.email });
    for (const s of updated) await supabase.from("suppliers").update({ name: s.name, contact: s.contact, phone: s.phone, email: s.email }).eq("id", s.id);
    await loadSuppliers();
  },

  getCustomers: () => cache.customers,
  setCustomers: async (v: Customer[]) => {
    const { added, removed, updated } = diffById(cache.customers, v);
    for (const c of removed) await supabase.from("customers").delete().eq("id", c.id);
    const toRow = (c: Customer) => ({
      id: c.id, name: c.name, document: c.document, email: c.email, phone: c.phone, address: c.address,
      cep: c.cep, street: c.street, number: c.number, complement: c.complement,
      neighborhood: c.neighborhood, city: c.city, state: c.state,
      birth_date: c.birthDate || null, notes: c.notes,
    });
    for (const c of added) await supabase.from("customers").insert(toRow(c));
    for (const c of updated) {
      const { id, ...rest } = toRow(c);
      await supabase.from("customers").update(rest).eq("id", id);
    }
    await loadCustomers();
  },

  getOrders: () => cache.orders,
  setOrders: async (v: Order[]) => {
    const { added, removed, updated } = diffById(cache.orders, v);
    for (const o of removed) await supabase.from("orders").delete().eq("id", o.id);
    for (const o of added) await supabase.from("orders").insert({
      id: o.id, customer_id: o.customerId, customer_name: o.customerName,
      items: o.items as any, total: o.total, status: o.status, notes: o.notes,
    });
    for (const o of updated) await supabase.from("orders").update({
      customer_id: o.customerId, customer_name: o.customerName,
      items: o.items as any, total: o.total, status: o.status, notes: o.notes,
    }).eq("id", o.id);
    await loadOrders();
  },

  getMovements: () => cache.movements,
  setMovements: async (v: StockMovement[]) => {
    const { added, removed } = diffById(cache.movements, v);
    for (const m of removed) await supabase.from("stock_movements").delete().eq("id", m.id);
    for (const m of added) await supabase.from("stock_movements").insert({
      id: m.id, product_id: m.productId, product_name: m.productName,
      type: m.type, quantity: m.quantity, reason: m.reason, order_id: m.orderId ?? null,
    });
    await loadMovements();
  },

  nextOrderNumber: () => {
    // Server assigns via sequence; return temporary client-side estimate
    const max = cache.orders.reduce((m, o) => Math.max(m, o.number || 0), 1000);
    return max + 1;
  },
};

export function uid() {
  // Must be a valid UUID — Supabase id columns are typed as uuid
  if (typeof crypto !== "undefined" && "randomUUID" in crypto) {
    return crypto.randomUUID();
  }
  // Fallback (very rare)
  return "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    const v = c === "x" ? r : (r & 0x3) | 0x8;
    return v.toString(16);
  });
}

/** Generate a valid EAN-13 barcode */
export function generateEAN13(): string {
  let code = "789"; // BR prefix
  for (let i = 0; i < 9; i++) code += Math.floor(Math.random() * 10);
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(code[i]) * (i % 2 === 0 ? 1 : 3);
  }
  const check = (10 - (sum % 10)) % 10;
  return code + check;
}

export function generateSKU(prefix = "SKU") {
  const n = Date.now().toString(36).toUpperCase().slice(-6);
  return `${prefix}-${n}`;
}

export function formatBRL(value: number) {
  return new Intl.NumberFormat("pt-BR", { style: "currency", currency: "BRL" }).format(value || 0);
}

export function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString("pt-BR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}