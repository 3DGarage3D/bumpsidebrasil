export interface Category {
  id: string;
  name: string;
  createdAt: string;
}

export interface Supplier {
  id: string;
  name: string;
  contact: string;
  phone: string;
  email: string;
  createdAt: string;
}

export interface Product {
  id: string;
  sku: string;
  barcode: string; // EAN-13
  name: string;
  description: string;
  categoryId: string | null;
  supplierId: string | null;
  costPrice: number;
  salePrice: number;
  stock: number;
  minStock: number;
  createdAt: string;
  updatedAt: string;
}

export interface Customer {
  id: string;
  name: string;
  document: string;
  email: string;
  phone: string;
  address: string;
  cep: string;
  street: string;
  number: string;
  complement: string;
  neighborhood: string;
  city: string;
  state: string;
  birthDate: string;
  notes: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}

export type OrderStatus = "pendente" | "pago" | "enviado" | "entregue" | "cancelado";

export interface Order {
  id: string;
  number: number;
  customerId: string | null;
  customerName: string;
  items: OrderItem[];
  total: number;
  status: OrderStatus;
  notes: string;
  createdAt: string;
}

export type MovementType = "entrada" | "saida" | "ajuste";

export interface StockMovement {
  id: string;
  productId: string;
  productName: string;
  type: MovementType;
  quantity: number;
  reason: string;
  orderId?: string;
  createdAt: string;
}