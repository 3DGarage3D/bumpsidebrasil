import { useEffect, useState } from "react";
import { storage } from "@/lib/storage";

type StorageGetter<T> = () => T;

function useStored<T>(getter: StorageGetter<T>): T {
  const [value, setValue] = useState<T>(getter);

  useEffect(() => {
    const handler = () => setValue(getter());
    window.addEventListener("estoque:update", handler);
    window.addEventListener("storage", handler);
    return () => {
      window.removeEventListener("estoque:update", handler);
      window.removeEventListener("storage", handler);
    };
  }, [getter]);

  return value;
}

export const useProducts = () => useStored(storage.getProducts);
export const useCategories = () => useStored(storage.getCategories);
export const useSuppliers = () => useStored(storage.getSuppliers);
export const useCustomers = () => useStored(storage.getCustomers);
export const useOrders = () => useStored(storage.getOrders);
export const useMovements = () => useStored(storage.getMovements);