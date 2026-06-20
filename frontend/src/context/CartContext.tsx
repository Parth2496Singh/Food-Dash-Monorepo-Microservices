import React, { createContext, useContext, useState } from 'react';

export interface CartItem {
  menuId: string;
  name: string;
  price: number;
  quantity: number;
  restaurantId: string;
}

interface CartContextType {
  items: CartItem[];
  addToCart: (item: CartItem) => void;
  removeFromCart: (menuId: string) => void;
  clearCart: () => void;
  total: number;
}

const CartContext = createContext<CartContextType | undefined>(undefined);

export const CartProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [items, setItems] = useState<CartItem[]>([]);

  const addToCart = (newItem: CartItem) => {
    setItems((prevItems) => {
      const existingItem = prevItems.find((i) => i.menuId === newItem.menuId);
      if (existingItem) {
        return prevItems.map((i) =>
          i.menuId === newItem.menuId ? { ...i, quantity: i.quantity + newItem.quantity } : i
        ).filter(i => i.quantity > 0);
      }
      return newItem.quantity > 0 ? [...prevItems, { ...newItem, quantity: newItem.quantity }] : prevItems;
    });
  };

  const removeFromCart = (menuId: string) => {
    setItems((prevItems) => prevItems.filter((i) => i.menuId !== menuId));
  };

  const clearCart = () => {
    setItems([]);
  };

  // Fixed floating point math issue using Math.round
  const total = Math.round(items.reduce((sum, item) => sum + item.price * item.quantity, 0) * 100) / 100;

  return (
    <CartContext.Provider value={{ items, addToCart, removeFromCart, clearCart, total }}>
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
};
