import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useCart } from '../context/CartContext';
import { ArrowRight, Trash2, MapPin, CreditCard } from 'lucide-react';
import { motion } from 'framer-motion';
import Button from '../components/Button';
import Input from '../components/Input';
import Card from '../components/Card';

const CartPage = () => {
  const { items, removeFromCart, total, clearCart } = useCart();
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleCheckout = async (e: React.FormEvent) => {
    e.preventDefault();
    if (items.length === 0) return;
    setLoading(true);
    try {
      const payload = {
        restaurantId: items[0].restaurantId,
        customerName: 'Guest User',
        items: items.map(item => ({
          menuId: item.menuId,
          quantity: item.quantity,
          price: item.price
        }))
      };
      
      const response = await axios.post('http://localhost:3003/api/orders', payload);
      clearCart();
      navigate(`/order/${response.data.id}`);
    } catch (err) {
      console.error(err);
      setLoading(false);
    }
  };

  if (items.length === 0) {
    return (
      <div className="page-container text-center py-32">
        <motion.div initial={{ scale: 0.8, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}>
          <img src="https://cdn-icons-png.flaticon.com/512/2838/2838895.png" alt="Empty Cart" className="w-48 mx-auto mb-8 opacity-50" />
          <h1 className="text-3xl font-bold mb-4">Your cart is empty</h1>
          <p className="text-gray-500 mb-8">Looks like you haven't added anything yet.</p>
          <Button onClick={() => navigate('/restaurants')} size="lg">Browse Restaurants</Button>
        </motion.div>
      </div>
    );
  }

  const tax = total * 0.08;
  const deliveryFee = 3.99;
  const finalTotal = total + tax + deliveryFee;

  return (
    <div className="page-container max-w-6xl">
      <h1 className="text-3xl font-black mb-8">Secure Checkout</h1>
      
      <div className="flex flex-col lg:flex-row gap-10">
        {/* Left: Form */}
        <div className="flex-1">
          <form id="checkout-form" onSubmit={handleCheckout} className="space-y-8">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><MapPin className="text-primary"/> Delivery Address</h2>
              <div className="space-y-4">
                <Input label="Full Name" type="text" required />
                <Input label="Street Address" type="text" required />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="City" type="text" required />
                  <Input label="Zip Code" type="text" required />
                </div>
                <Input label="Delivery Instructions (Optional)" type="text" />
              </div>
            </Card>

            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6 flex items-center gap-2"><CreditCard className="text-primary"/> Payment Method</h2>
              <div className="p-4 border-2 border-primary rounded-xl bg-primary/5 flex items-center justify-between cursor-pointer">
                <div className="flex items-center gap-3">
                  <div className="w-6 h-6 rounded-full border-4 border-primary bg-white"></div>
                  <span className="font-bold">Credit / Debit Card</span>
                </div>
                <div className="flex gap-1">
                  <div className="w-8 h-5 bg-blue-600 rounded"></div>
                  <div className="w-8 h-5 bg-red-500 rounded"></div>
                </div>
              </div>
              <div className="mt-4 space-y-4">
                <Input label="Card Number" type="text" placeholder="**** **** **** ****" required />
                <div className="grid grid-cols-2 gap-4">
                  <Input label="Expiry (MM/YY)" type="text" required />
                  <Input label="CVC" type="text" required />
                </div>
              </div>
            </Card>
          </form>
        </div>

        {/* Right: Summary */}
        <div className="lg:w-[400px]">
          <div className="sticky top-28">
            <Card className="p-6">
              <h2 className="text-xl font-bold mb-6">Order Summary</h2>
              
              <div className="space-y-4 mb-6 max-h-[300px] overflow-y-auto pr-2">
                {items.map(item => (
                  <div key={item.menuId} className="flex justify-between items-center group">
                    <div className="flex-1">
                      <h4 className="font-semibold text-gray-800">{item.name}</h4>
                      <div className="text-sm text-gray-500">${item.price.toFixed(2)} x {item.quantity}</div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="font-bold">${(item.price * item.quantity).toFixed(2)}</span>
                      <button 
                        onClick={() => removeFromCart(item.menuId)}
                        className="text-red-400 hover:text-red-600 transition-colors opacity-0 group-hover:opacity-100"
                      >
                        <Trash2 size={18} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-3 mb-6 text-gray-600">
                <div className="flex justify-between">
                  <span>Subtotal</span>
                  <span className="font-semibold">${total.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Tax (8%)</span>
                  <span className="font-semibold">${tax.toFixed(2)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Delivery Fee</span>
                  <span className="font-semibold">${deliveryFee.toFixed(2)}</span>
                </div>
              </div>

              <div className="border-t border-gray-900 pt-4 mb-6">
                <div className="flex justify-between text-xl font-black">
                  <span>Total</span>
                  <span className="text-primary">${finalTotal.toFixed(2)}</span>
                </div>
              </div>

              <Button 
                type="submit" 
                form="checkout-form" 
                className="w-full h-14 text-lg"
                disabled={loading}
              >
                {loading ? 'Processing...' : 'Place Order'} <ArrowRight className="ml-2" />
              </Button>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CartPage;
