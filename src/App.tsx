import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { onAuthStateChanged, User } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db, signInWithGoogle, OperationType, handleFirestoreError } from './firebase';
import { UserProfile } from './types';
import { seedInitialData } from './lib/seed';
import Layout from './components/Layout';
import Home from './pages/Home';
import Explore from './pages/Explore';
import Reels from './pages/Reels';
import Shop from './pages/Shop';
import ProductDetail from './pages/ProductDetail';
import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import SellerDashboard from './pages/SellerDashboard';
import OrderHistory from './pages/OrderHistory';
import Create from './pages/Create';
import Chat from './pages/Chat';
import Profile from './pages/Profile';
import Settings from './pages/Settings';
import Admin from './pages/Admin';
import MusicPlayer from './components/MusicPlayer';
import { motion, AnimatePresence } from 'framer-motion';
import { Sparkles, ShieldCheck, Zap, TrendingUp } from 'lucide-react';

export default function App() {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        // Check if user exists in Firestore
        const userRef = doc(db, 'users', firebaseUser.uid);
        const userSnap = await getDoc(userRef);

        if (!userSnap.exists()) {
          // Create new user profile
          const newProfile: UserProfile = {
            uid: firebaseUser.uid,
            displayName: firebaseUser.displayName || 'Anonymous',
            email: firebaseUser.email || '',
            photoURL: firebaseUser.photoURL || '',
            bio: '',
            role: 'user',
            trustScore: 100,
            earnings: 0,
            followersCount: 0,
            followingCount: 0,
            xp: 0,
            level: 1,
            isPrivate: false,
            isVerified: false,
            badges: [],
            links: [],
            addresses: [],
            wishlist: [],
            cart: [],
            blockedUsers: [],
            closeFriends: [],
            interests: [],
            createdAt: new Date().toISOString(),
            lastLogin: new Date().toISOString(),
            screenTime: 0,
            settings: {
              notifications: true,
              privacyMode: false,
              amoledMode: false,
              language: 'en'
            }
          };
          try {
            await setDoc(userRef, newProfile);
          } catch (error) {
            handleFirestoreError(error, OperationType.CREATE, `users/${firebaseUser.uid}`);
          }
        }
        
        // Seed initial data for testing
        await seedInitialData(firebaseUser.uid);
        
        setUser(firebaseUser);
      } else {
        setUser(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-4xl font-black tracking-tighter text-white"
        >
          KHOJ<span className="text-primary">AI</span>
        </motion.div>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen bg-background text-white flex flex-col items-center justify-center p-6 relative overflow-hidden">
        {/* Background Gradients */}
        <div className="absolute -left-[20%] -top-[20%] h-[60%] w-[60%] rounded-full bg-primary/10 blur-[150px]" />
        <div className="absolute -right-[20%] bottom-[20%] h-[60%] w-[60%] rounded-full bg-secondary/10 blur-[150px]" />

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center space-y-8 max-w-md"
        >
          <div className="space-y-4">
            <h1 className="text-6xl font-black tracking-tighter leading-none">
              KHOJ<span className="text-primary">AI</span>
            </h1>
            <p className="text-gray-400 font-medium text-lg leading-relaxed">
              The next-gen Indian super app. Scroll, Learn, Earn, and Shop — all in one place.
            </p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="glass-card p-4 space-y-2 text-left">
              <ShieldCheck className="h-6 w-6 text-primary" />
              <p className="text-xs font-bold uppercase tracking-widest">Secure Auth</p>
              <p className="text-[10px] text-gray-500">Firebase Protected</p>
            </div>
            <div className="glass-card p-4 space-y-2 text-left">
              <Zap className="h-6 w-6 text-secondary" />
              <p className="text-xs font-bold uppercase tracking-widest">AI Powered</p>
              <p className="text-[10px] text-gray-500">Gemini Integrated</p>
            </div>
            <div className="glass-card p-4 space-y-2 text-left">
              <TrendingUp className="h-6 w-6 text-primary" />
              <p className="text-xs font-bold uppercase tracking-widest">Earn Money</p>
              <p className="text-[10px] text-gray-500">Creator Rewards</p>
            </div>
            <div className="glass-card p-4 space-y-2 text-left">
              <Sparkles className="h-6 w-6 text-secondary" />
              <p className="text-xs font-bold uppercase tracking-widest">Premium UI</p>
              <p className="text-[10px] text-gray-500">60FPS Smoothness</p>
            </div>
          </div>

          <button
            onClick={signInWithGoogle}
            className="btn-primary w-full py-4 text-lg flex items-center justify-center gap-3 group"
          >
            <img 
              src="https://www.gstatic.com/firebase/anonymous-scan.png" 
              className="h-6 w-6 invert brightness-0" 
              alt="Google" 
            />
            Continue with Google
          </button>

          <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">
            By continuing, you agree to KhojAI's Terms of Service.
          </p>
        </motion.div>
      </div>
    );
  }

  return (
    <Router>
      <Layout>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/explore" element={<Explore />} />
          <Route path="/reels" element={<Reels />} />
          <Route path="/shop" element={<Shop />} />
          <Route path="/product/:id" element={<ProductDetail />} />
          <Route path="/cart" element={<Cart />} />
          <Route path="/checkout" element={<Checkout />} />
          <Route path="/seller" element={<SellerDashboard />} />
          <Route path="/orders" element={<OrderHistory />} />
          <Route path="/create" element={<Create />} />
          <Route path="/chat" element={<Chat />} />
          <Route path="/profile" element={<Profile />} />
          <Route path="/settings" element={<Settings />} />
          <Route path="/admin" element={<Admin />} />
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </Layout>
      <MusicPlayer />
    </Router>
  );
}
