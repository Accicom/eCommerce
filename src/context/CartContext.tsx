import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '../lib/supabase';
import type { Database } from '../lib/database.types';

type Product = Database['public']['Tables']['products']['Row'];

type CartItem = {
  product: Product;
  quantity: number;
};

type CartContextType = {
  cart: CartItem[];
  addToCart: (product: Product) => void;
  removeFromCart: (productId: string) => void;
  updateQuantity: (productId: string, delta: number) => void;
  totalAmount: number;
};

const CartContext = createContext<CartContextType | undefined>(undefined);

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [cart, setCart] = useState<CartItem[]>(() => {
    const savedCart = localStorage.getItem('cart');
    return savedCart ? JSON.parse(savedCart) : [];
  });

  useEffect(() => {
    localStorage.setItem('cart', JSON.stringify(cart));

    // Save abandoned cart when items exist
    if (cart.length > 0) {
      const saveAbandonedCart = async () => {
        try {
          // Check if user is subscribed to newsletter
          const { data: subscriber } = await supabase
            .from('newsletter_subscribers')
            .select('email')
            .eq('status', 'active')
            .maybeSingle();

          const cartData = {
            user_email: subscriber?.email || null,
            cart_data: cart.map(item => ({
              product_id: item.product.id,
              product_name: item.product.name,
              quantity: item.quantity,
              price: item.product.price
            })),
            total_amount: cart.reduce((sum, item) => sum + Number(item.product.price) * item.quantity, 0)
          };

          const { error } = await supabase
            .from('abandoned_carts')
            .insert([cartData]);

          if (error) throw error;
        } catch (error) {
          console.error('Error saving abandoned cart:', error);
        }
      };

      // Save cart data when user is about to leave
      const handleBeforeUnload = () => {
        saveAbandonedCart();
      };

      window.addEventListener('beforeunload', handleBeforeUnload);
      return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }
  }, [cart]);

  const addToCart = (product: Product) => {
    setCart(currentCart => {
      const existingItem = currentCart.find(item => item.product.id === product.id);
      if (existingItem) {
        return currentCart.map(item =>
          item.product.id === product.id
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      return [...currentCart, { product, quantity: 1 }];
    });
  };

  const removeFromCart = (productId: string) => {
    setCart(currentCart => currentCart.filter(item => item.product.id !== productId));
  };

  const updateQuantity = (productId: string, delta: number) => {
    setCart(currentCart =>
      currentCart.map(item => {
        if (item.product.id === productId) {
          const newQuantity = item.quantity + delta;
          return newQuantity > 0
            ? { ...item, quantity: newQuantity }
            : item;
        }
        return item;
      }).filter(item => item.quantity > 0)
    );
  };

  const totalAmount = cart.reduce(
    (sum, item) => sum + Number(item.product.price) * item.quantity,
    0
  );

  return (
    <CartContext.Provider value={{
      cart,
      addToCart,
      removeFromCart,
      updateQuantity,
      totalAmount
    }}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart must be used within a CartProvider');
  }
  return context;
}