import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile, CartItem } from '../types';
import { Trash2, Plus, Minus, ShoppingBag, ChevronLeft, ArrowRight, ShieldCheck } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Cart() {
  const [cart, setCart] = useState<CartItem[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCart();
  }, []);

  const fetchCart = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data() as UserProfile;
        setCart(userData.cart || []);
      }
    } catch (error) {
      console.error('Error fetching cart:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateQuantity = async (productId: string, delta: number) => {
    if (!auth.currentUser) return;
    const newCart = cart.map(item => {
      if (item.productId === productId) {
        return { ...item, quantity: Math.max(1, item.quantity + delta) };
      }
      return item;
    });
    setCart(newCart);
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, { cart: newCart });
  };

  const removeItem = async (productId: string) => {
    if (!auth.currentUser) return;
    const newCart = cart.filter(item => item.productId !== productId);
    setCart(newCart);
    const userRef = doc(db, 'users', auth.currentUser.uid);
    await updateDoc(userRef, { cart: newCart });
  };

  const totalAmount = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md px-4 py-4 flex items-center gap-4 border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/5">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-black uppercase tracking-tighter">Your <span className="text-primary">Cart</span></h1>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6">
        {cart.length > 0 ? (
          <div className="space-y-6">
            {/* Cart Items */}
            <div className="space-y-4">
              <AnimatePresence>
                {cart.map((item) => (
                  <motion.div
                    key={item.productId}
                    layout
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    className="glass-card p-4 flex gap-4"
                  >
                    <div className="h-24 w-24 rounded-2xl overflow-hidden bg-white/5 flex-shrink-0">
                      <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                    </div>
                    <div className="flex-1 flex flex-col justify-between">
                      <div className="flex justify-between items-start">
                        <div>
                          <h3 className="font-bold text-sm line-clamp-1">{item.name}</h3>
                          <p className="text-primary font-black">₹{item.price.toLocaleString()}</p>
                        </div>
                        <button 
                          onClick={() => removeItem(item.productId)}
                          className="p-2 text-gray-500 hover:text-red-500 transition-colors"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2 bg-white/5 rounded-xl p-1">
                          <button 
                            onClick={() => updateQuantity(item.productId, -1)}
                            className="p-1 hover:bg-white/10 rounded-lg"
                          >
                            <Minus className="h-3 w-3" />
                          </button>
                          <span className="w-6 text-center text-xs font-black">{item.quantity}</span>
                          <button 
                            onClick={() => updateQuantity(item.productId, 1)}
                            className="p-1 hover:bg-white/10 rounded-lg"
                          >
                            <Plus className="h-3 w-3" />
                          </button>
                        </div>
                        <p className="text-sm font-black">₹{(item.price * item.quantity).toLocaleString()}</p>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>

            {/* Summary */}
            <div className="glass-card p-6 space-y-4">
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-500">Order Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Subtotal</span>
                  <span className="font-bold">₹{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-400">Shipping</span>
                  <span className="text-green-500 font-bold uppercase tracking-widest text-[10px]">Free</span>
                </div>
                <div className="h-px bg-white/5 my-2" />
                <div className="flex justify-between text-lg">
                  <span className="font-black uppercase tracking-tighter">Total</span>
                  <span className="font-black text-primary">₹{totalAmount.toLocaleString()}</span>
                </div>
              </div>
              <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                <ShieldCheck className="h-4 w-4 text-green-500" />
                Secure Checkout & 7-Day Returns
              </div>
            </div>
          </div>
        ) : (
          <div className="text-center py-32 space-y-6">
            <div className="h-24 w-24 bg-white/5 rounded-full flex items-center justify-center mx-auto">
              <ShoppingBag className="h-10 w-10 text-gray-500" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black uppercase tracking-tight">Your cart is empty</h2>
              <p className="text-gray-400 text-sm">Looks like you haven't added anything yet.</p>
            </div>
            <Link to="/explore" className="btn-primary inline-flex items-center gap-2 px-8 py-3">
              Start Shopping <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
        )}
      </div>

      {/* Checkout Button */}
      {cart.length > 0 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-t border-white/5 p-4 safe-bottom">
          <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
            <div>
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Amount</p>
              <p className="text-xl font-black">₹{totalAmount.toLocaleString()}</p>
            </div>
            <button 
              onClick={() => navigate('/checkout')}
              className="btn-primary px-12 py-4 flex items-center gap-2"
            >
              Checkout <ArrowRight className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
