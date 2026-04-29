import { useEffect, useState } from "react";
import { ensureLoaded, storage } from "@/lib/storage";

type Key = "products" | "categories" | "suppliers" | "customers" | "orders" | "movements";

function useStored<T>(key: Key, getter: () => T): T {
  const [value, setValue] = useState<T>(getter);

  useEffect(() => {
    ensureLoaded(key);
    const handler = () => setValue(getter());
    window.addEventListener("estoque:update", handler);
    return () => window.removeEventListener("estoque:update", handler);
  }, [key, getter]);

  return value;
}

export const useProducts = () => useStored("products", storage.getProducts);
export const useCategories = () => useStored("categories", storage.getCategories);
export const useSuppliers = () => useStored("suppliers", storage.getSuppliers);
export const useCustomers = () => useStored("customers", storage.getCustomers);
export const useOrders = () => useStored("orders", storage.getOrders);
export const useMovements = () => useStored("movements", storage.getMovements);