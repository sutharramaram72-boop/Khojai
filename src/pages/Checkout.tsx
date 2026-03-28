import React, { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc, collection, addDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile, CartItem, Address, Order, OrderItem } from '../types';
import { ChevronLeft, MapPin, CreditCard, Truck, ShieldCheck, CheckCircle2, Plus, ArrowRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useNavigate, useLocation } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Checkout() {
  const navigate = useNavigate();
  const location = useLocation();
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedAddress, setSelectedAddress] = useState<Address | null>(null);
  const [paymentMethod, setPaymentMethod] = useState<'COD' | 'Online'>('COD');
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const [orderSuccess, setOrderSuccess] = useState(false);

  // If coming from "Buy Now", we get product and quantity from location state
  const directPurchase = location.state as { product: any, quantity: number } | null;

  useEffect(() => {
    fetchUserData();
  }, []);

  const fetchUserData = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        const userData = userSnap.data() as UserProfile;
        setUserProfile(userData);
        if (userData.addresses?.length > 0) {
          setSelectedAddress(userData.addresses.find(a => a.isDefault) || userData.addresses[0]);
        }
      }
    } catch (error) {
      console.error('Error fetching user data:', error);
    } finally {
      setLoading(false);
    }
  };

  const calculateTotal = () => {
    if (directPurchase) {
      return directPurchase.product.price * directPurchase.quantity;
    }
    return userProfile?.cart?.reduce((sum, item) => sum + item.price * item.quantity, 0) || 0;
  };

  const placeOrder = async () => {
    if (!auth.currentUser || !selectedAddress || !userProfile) return;
    setIsPlacingOrder(true);
    try {
      const items: OrderItem[] = directPurchase 
        ? [{
            productId: directPurchase.product.id,
            name: directPurchase.product.name,
            price: directPurchase.product.price,
            quantity: directPurchase.quantity,
            imageUrl: directPurchase.product.imageUrl,
            sellerId: directPurchase.product.sellerId
          }]
        : userProfile.cart.map(item => ({
            productId: item.productId,
            name: item.name,
            price: item.price,
            quantity: item.quantity,
            imageUrl: item.imageUrl,
            sellerId: item.sellerId
          }));

      const sellerIds = Array.from(new Set(items.map(item => item.sellerId)));

      const orderData: Omit<Order, 'id'> = {
        buyerId: auth.currentUser.uid,
        sellerIds,
        items,
        totalAmount: calculateTotal(),
        status: 'pending',
        paymentMethod,
        shippingAddress: selectedAddress,
        createdAt: new Date().toISOString()
      };

      const orderRef = await addDoc(collection(db, 'orders'), orderData);
      
      // Clear cart if not direct purchase
      if (!directPurchase) {
        const userRef = doc(db, 'users', auth.currentUser.uid);
        await updateDoc(userRef, { cart: [] });
      }

      setOrderSuccess(true);
      setTimeout(() => {
        navigate('/profile');
      }, 3000);
    } catch (error) {
      console.error('Error placing order:', error);
    } finally {
      setIsPlacingOrder(false);
    }
  };

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;

  if (orderSuccess) {
    return (
      <div className="min-h-screen bg-background flex flex-col items-center justify-center p-6 text-center space-y-6">
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="h-24 w-24 bg-green-500 rounded-full flex items-center justify-center"
        >
          <CheckCircle2 className="h-12 w-12 text-white" />
        </motion.div>
        <div className="space-y-2">
          <h1 className="text-3xl font-black uppercase tracking-tighter">Order <span className="text-primary">Placed!</span></h1>
          <p className="text-gray-400 font-medium">Thank you for shopping with KhojAI. Your order is being processed.</p>
        </div>
        <button 
          onClick={() => navigate('/profile')}
          className="btn-primary px-8 py-3 flex items-center gap-2"
        >
          View Orders <ArrowRight className="h-4 w-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md px-4 py-4 flex items-center gap-4 border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/5">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <h1 className="text-xl font-black uppercase tracking-tighter">CHECK<span className="text-primary">OUT</span></h1>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Shipping Address */}
        <section className="space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <MapPin className="h-5 w-5 text-primary" />
              <h2 className="text-sm font-black uppercase tracking-widest text-gray-500">Shipping Address</h2>
            </div>
            <button className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1">
              <Plus className="h-3 w-3" /> Add New
            </button>
          </div>
          
          {userProfile?.addresses && userProfile.addresses.length > 0 ? (
            <div className="space-y-3">
              {userProfile.addresses.map(address => (
                <button
                  key={address.id}
                  onClick={() => setSelectedAddress(address)}
                  className={cn(
                    "w-full text-left p-4 rounded-2xl border transition-all",
                    selectedAddress?.id === address.id 
                      ? "bg-primary/10 border-primary" 
                      : "bg-white/5 border-white/10"
                  )}
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="font-bold text-sm">{address.name}</p>
                      <p className="text-xs text-gray-400 mt-1">{address.street}, {address.city}</p>
                      <p className="text-xs text-gray-400">{address.state}, {address.zipCode}</p>
                      <p className="text-xs text-gray-400 mt-1">{address.phone}</p>
                    </div>
                    {selectedAddress?.id === address.id && (
                      <CheckCircle2 className="h-5 w-5 text-primary" />
                    )}
                  </div>
                </button>
              ))}
            </div>
          ) : (
            <button className="w-full p-8 rounded-2xl border border-dashed border-white/10 bg-white/5 flex flex-col items-center gap-2 text-gray-500">
              <Plus className="h-6 w-6" />
              <span className="text-sm font-bold uppercase tracking-widest">Add Shipping Address</span>
            </button>
          )}
        </section>

        {/* Payment Method */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <CreditCard className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-500">Payment Method</h2>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <button
              onClick={() => setPaymentMethod('COD')}
              className={cn(
                "p-4 rounded-2xl border transition-all text-center space-y-2",
                paymentMethod === 'COD' ? "bg-primary/10 border-primary" : "bg-white/5 border-white/10"
              )}
            >
              <Truck className="h-6 w-6 mx-auto" />
              <p className="text-xs font-black uppercase tracking-widest">COD</p>
            </button>
            <button
              onClick={() => setPaymentMethod('Online')}
              className={cn(
                "p-4 rounded-2xl border transition-all text-center space-y-2 opacity-50 cursor-not-allowed",
                paymentMethod === 'Online' ? "bg-primary/10 border-primary" : "bg-white/5 border-white/10"
              )}
            >
              <CreditCard className="h-6 w-6 mx-auto" />
              <p className="text-xs font-black uppercase tracking-widest">Online</p>
            </button>
          </div>
        </section>

        {/* Order Summary */}
        <section className="space-y-4">
          <div className="flex items-center gap-2">
            <Truck className="h-5 w-5 text-primary" />
            <h2 className="text-sm font-black uppercase tracking-widest text-gray-500">Order Summary</h2>
          </div>
          <div className="glass-card p-6 space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Items Total</span>
                <span className="font-bold">₹{calculateTotal().toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-gray-400">Shipping</span>
                <span className="text-green-500 font-bold uppercase tracking-widest text-[10px]">Free</span>
              </div>
              <div className="h-px bg-white/5 my-2" />
              <div className="flex justify-between text-lg">
                <span className="font-black uppercase tracking-tighter">Total Payable</span>
                <span className="font-black text-primary">₹{calculateTotal().toLocaleString()}</span>
              </div>
            </div>
          </div>
        </section>

        <div className="flex items-center gap-2 text-[10px] text-gray-500 font-bold uppercase tracking-widest justify-center">
          <ShieldCheck className="h-4 w-4 text-green-500" />
          Secure Checkout & 7-Day Returns
        </div>
      </div>

      {/* Place Order Button */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-t border-white/5 p-4 safe-bottom">
        <div className="max-w-4xl mx-auto">
          <button 
            onClick={placeOrder}
            disabled={!selectedAddress || isPlacingOrder}
            className="w-full btn-primary py-4 flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isPlacingOrder ? (
              <div className="h-5 w-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
            ) : (
              <>
                Place Order <ArrowRight className="h-5 w-5" />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
