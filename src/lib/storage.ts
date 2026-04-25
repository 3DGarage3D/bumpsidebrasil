import type {
  Category,
  Customer,
  Order,
  Product,
  StockMovement,
  Supplier,
} from "./types";

const KEYS = {
  products: "estoque_products",
  categories: "estoque_categories",
  suppliers: "estoque_suppliers",
  customers: "estoque_customers",
  orders: "estoque_orders",
  movements: "estoque_movements",
  orderCounter: "estoque_order_counter",
} as const;

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write<T>(key: string, value: T) {
  localStorage.setItem(key, JSON.stringify(value));
  window.dispatchEvent(new CustomEvent("estoque:update", { detail: { key } }));
}

export const storage = {
  getProducts: () => read<Product[]>(KEYS.products, []),
  setProducts: (v: Product[]) => write(KEYS.products, v),

  getCategories: () => read<Category[]>(KEYS.categories, []),
  setCategories: (v: Category[]) => write(KEYS.categories, v),

  getSuppliers: () => read<Supplier[]>(KEYS.suppliers, []),
  setSuppliers: (v: Supplier[]) => write(KEYS.suppliers, v),

  getCustomers: () => read<Customer[]>(KEYS.customers, []),
  setCustomers: (v: Customer[]) => write(KEYS.customers, v),

  getOrders: () => read<Order[]>(KEYS.orders, []),
  setOrders: (v: Order[]) => write(KEYS.orders, v),

  getMovements: () => read<StockMovement[]>(KEYS.movements, []),
  setMovements: (v: StockMovement[]) => write(KEYS.movements, v),

  nextOrderNumber: () => {
    const current = read<number>(KEYS.orderCounter, 1000);
    const next = current + 1;
    write(KEYS.orderCounter, next);
    return next;
  },
};

export function uid() {
  return `${Date.now().toString(36)}${Math.random().toString(36).slice(2, 8)}`;
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