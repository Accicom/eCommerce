import React, { useState } from 'react';
import { ShoppingCart, Plus, Minus, X } from 'lucide-react';
import { useCart } from '../context/CartContext';
import { formatPrice } from '../utils/formatters';
import { useAnalytics } from '../hooks/useAnalytics';
import { supabase } from '../lib/supabase';

export default function Cart() {
  const [isOpen, setIsOpen] = useState(false);
  const { cart, removeFromCart, updateQuantity, totalAmount } = useCart();
  const { trackEvent } = useAnalytics();

  const handleCheckout = async () => {
    const orderNumber = Math.floor(Math.random() * 1000000);
    const message = `¡Hola! Me interesa finalizar mi compra 🛍️\n\nNúmero de orden: #${orderNumber}\n\nProductos:\n${cart
      .map(item => `- ${item.product.name} (x${item.quantity}) - $${formatPrice(Number(item.product.price) * item.quantity)}`)
      .join('\n')}\n\nTotal: $${formatPrice(totalAmount)}`;

    try {
      // Check if user is subscribed to newsletter
      const { data: subscriber } = await supabase
        .from('newsletter_subscribers')
        .select('email')
        .eq('status', 'active')
        .maybeSingle();

      // Save completed order
      const orderData = {
        order_number: `#${orderNumber}`,
        user_email: subscriber?.email || null,
        order_data: cart.map(item => ({
          product_id: item.product.id,
          product_name: item.product.name,
          quantity: item.quantity,
          price: item.product.price
        })),
        total_amount: totalAmount,
        whatsapp_message: message
      };

      const { error } = await supabase
        .from('completed_orders')
        .insert([orderData]);

      if (error) throw error;

      // Track checkout event in Google Analytics
      trackEvent('begin_checkout', 'ecommerce', `Order #${orderNumber}`, totalAmount);
      
      // Open WhatsApp with the message
      window.open(`https://wa.me/5493513486125?text=${encodeURIComponent(message)}`, '_blank');
    } catch (error) {
      console.error('Error saving completed order:', error);
    }
  };

  return (
    <>
      {/* Cart Button */}
      <button
        onClick={() => setIsOpen(true)}
        className="fixed bottom-24 right-6 bg-blue-600 text-white p-4 rounded-full
        shadow-lg hover:bg-blue-700 transition-colors z-50"
      >
        <ShoppingCart className="h-6 w-6" />
        {cart.length > 0 && (
          <span className="absolute -top-2 -right-2 bg-red-500 text-white text-xs
          w-6 h-6 rounded-full flex items-center justify-center">
            {cart.reduce((sum, item) => sum + item.quantity, 0)}
          </span>
        )}
      </button>

      {/* Cart Sidebar */}
      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50">
          <div className="absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-lg">
            <div className="p-4 flex justify-between items-center border-b">
              <h3 className="text-xl font-semibold">Carrito de Compras</h3>
              <button
                onClick={() => setIsOpen(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <X className="w-6 h-6" />
              </button>
            </div>
            
            <div className="p-4 flex-1 overflow-y-auto">
              {cart.length === 0 ? (
                <p className="text-gray-500 text-center py-8">
                  El carrito está vacío
                </p>
              ) : (
                <div className="space-y-4">
                  {cart.map(item => (
                    <div
                      key={item.product.id}
                      className="flex items-center space-x-4 bg-gray-50 p-4 rounded-lg"
                    >
                      <img
                        src={item.product.image}
                        alt={item.product.name}
                        className="w-20 h-20 object-cover rounded"
                      />
                      <div className="flex-1">
                        <h4 className="font-semibold">{item.product.name}</h4>
                        <p className="text-gray-400 text-sm">Código: {item.product.code}</p>
                        <p className="text-gray-600">
                          ${formatPrice(Number(item.product.price) * item.quantity)}
                        </p>
                        <div className="flex items-center space-x-2 mt-2">
                          <button
                            onClick={() => updateQuantity(item.product.id, -1)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <Minus className="w-4 h-4" />
                          </button>
                          <span className="px-2">{item.quantity}</span>
                          <button
                            onClick={() => updateQuantity(item.product.id, 1)}
                            className="text-gray-500 hover:text-gray-700"
                          >
                            <Plus className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                      <button
                        onClick={() => removeFromCart(item.product.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <X className="w-5 h-5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
            
            {cart.length > 0 && (
              <div className="border-t p-4">
                <div className="flex justify-between items-center mb-4">
                  <span className="font-semibold">Total:</span>
                  <span className="text-xl font-bold">
                    ${formatPrice(totalAmount)}
                  </span>
                </div>
                <button
                  onClick={handleCheckout}
                  className="w-full bg-blue-600 text-white px-4 py-3 rounded-lg
                  hover:bg-blue-700 transition-colors font-semibold"
                >
                  Finalizar Compra
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}