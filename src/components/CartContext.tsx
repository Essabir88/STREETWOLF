"use client";

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
  ReactNode,
} from "react";

export type CartItem = {
  productId: string;
  slug: string;
  name: string;
  priceCents: number;
  image: string;
  size: string | null;
  quantity: number;
  stockRemaining: number;
};

function lineId(productId: string, size: string | null) {
  return `${productId}::${size ?? "-"}`;
}

type CartContextValue = {
  items: CartItem[];
  addItem: (item: Omit<CartItem, "quantity">, quantity?: number) => void;
  updateQuantity: (
    productId: string,
    size: string | null,
    quantity: number
  ) => void;
  removeItem: (productId: string, size: string | null) => void;
  clearCart: () => void;
  totalCents: number;
  totalItems: number;
};

const CartContext = createContext<CartContextValue | null>(null);
const STORAGE_KEY = "street-wolf-cart";

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [hydrated, setHydrated] = useState(false);

  // Load from localStorage once, on mount. This has to run after mount
  // (not in a lazy useState initializer) so the server render and the
  // client's first hydration pass both start from the same empty cart —
  // branching on `window` in the initializer would mismatch instead.
  useEffect(() => {
    try {
      const raw = window.localStorage.getItem(STORAGE_KEY);
      // eslint-disable-next-line react-hooks/set-state-in-effect
      if (raw) setItems(JSON.parse(raw));
    } catch {
      // ignore corrupt cart data
    }
    setHydrated(true);
  }, []);

  // Persist on every change, after the initial load.
  useEffect(() => {
    if (!hydrated) return;
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(items));
  }, [items, hydrated]);

  const addItem: CartContextValue["addItem"] = (item, quantity = 1) => {
    setItems((prev) => {
      const id = lineId(item.productId, item.size);
      const existing = prev.find((i) => lineId(i.productId, i.size) === id);
      const cap = item.stockRemaining;
      if (existing) {
        const nextQty = Math.min(existing.quantity + quantity, cap);
        return prev.map((i) =>
          lineId(i.productId, i.size) === id ? { ...i, quantity: nextQty } : i
        );
      }
      return [...prev, { ...item, quantity: Math.min(quantity, cap) }];
    });
  };

  const updateQuantity: CartContextValue["updateQuantity"] = (
    productId,
    size,
    quantity
  ) => {
    const id = lineId(productId, size);
    setItems((prev) =>
      prev
        .map((i) =>
          lineId(i.productId, i.size) === id
            ? { ...i, quantity: Math.max(0, Math.min(quantity, i.stockRemaining)) }
            : i
        )
        .filter((i) => i.quantity > 0)
    );
  };

  const removeItem = (productId: string, size: string | null) => {
    const id = lineId(productId, size);
    setItems((prev) => prev.filter((i) => lineId(i.productId, i.size) !== id));
  };

  const clearCart = () => setItems([]);

  const totalCents = useMemo(
    () => items.reduce((sum, i) => sum + i.priceCents * i.quantity, 0),
    [items]
  );
  const totalItems = useMemo(
    () => items.reduce((sum, i) => sum + i.quantity, 0),
    [items]
  );

  return (
    <CartContext.Provider
      value={{
        items,
        addItem,
        updateQuantity,
        removeItem,
        clearCart,
        totalCents,
        totalItems,
      }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const ctx = useContext(CartContext);
  if (!ctx) throw new Error("useCart must be used within a CartProvider");
  return ctx;
}
