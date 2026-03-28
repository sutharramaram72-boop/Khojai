import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Settings, Grid, ShoppingBag, DollarSign, TrendingUp, Users, Award, LogOut, Loader2, Clock, CheckCircle, Link as LinkIcon, ShieldCheck, Zap } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { auth, db, logOut, OperationType, handleFirestoreError } from '../firebase';
import { doc, onSnapshot } from 'firebase/firestore';
import { UserProfile } from '../types';
import { cn, formatCurrency } from '../lib/utils';
import { socialService } from '../services/socialService';
import { gamificationService } from '../services/gamificationService';

export default function Profile() {
  const [user, setUser] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'posts' | 'shop' | 'earnings'>('posts');
  const navigate = useNavigate();

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
      if (doc.exists()) {
        setUser({ uid: doc.id, ...doc.data() } as UserProfile);
      }
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.GET, `users/${auth.currentUser?.uid}`);
    });

    // Check for daily reward
    gamificationService.checkDailyReward(auth.currentUser.uid);

    return () => unsubscribe();
  }, []);

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent"
        />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="glass-card text-center py-20 space-y-6">
        <p className="text-gray-400">Please sign in to view your profile.</p>
        <button
          onClick={() => navigate('/auth')}
          className="btn-primary"
        >
          Sign In
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tighter text-white">
          PROFILE<span className="text-primary">AI</span>
        </h1>
        <div className="flex gap-4">
          <Settings 
            onClick={() => navigate('/settings')}
            className="h-6 w-6 text-gray-400 hover:text-white transition-colors cursor-pointer" 
          />
          <LogOut 
            onClick={logOut}
            className="h-6 w-6 text-gray-400 hover:text-red-500 transition-colors cursor-pointer" 
          />
        </div>
      </header>

      <div className="glass-card space-y-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 h-32 w-32 bg-primary/10 blur-[60px] -z-10" />
        
        <div className="flex items-center gap-6">
          <div className="relative">
            <img
              src={user.photoURL || `https://picsum.photos/seed/${user.uid}/200/200`}
              alt={user.displayName}
              className="h-24 w-24 rounded-full object-cover border-4 border-primary/20 p-1"
              referrerPolicy="no-referrer"
            />
            {user.isVerified && (
              <div className="absolute bottom-1 right-1 h-6 w-6 rounded-full bg-primary flex items-center justify-center border-2 border-background">
                <CheckCircle className="h-3 w-3 text-black" />
              </div>
            )}
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <h2 className="text-2xl font-black tracking-tight">{user.displayName}</h2>
              {user.isVerified && <ShieldCheck className="h-4 w-4 text-primary" />}
            </div>
            <p className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-2">
              <Zap className="h-3 w-3" />
              Level {user.level} • {user.xp} XP
            </p>
            <p className="text-sm text-gray-400 leading-relaxed">{user.bio || 'No bio yet.'}</p>
            {user.links && user.links.length > 0 && (
              <div className="flex gap-3 mt-2">
                {user.links.map((link, i) => (
                  <a key={i} href={link.url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-1 text-xs font-bold">
                    <LinkIcon className="h-3 w-3" />
                    {link.title}
                  </a>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Gamification Badges */}
        {user.badges && user.badges.length > 0 && (
          <div className="flex gap-2 overflow-x-auto no-scrollbar py-2">
            {user.badges.map((badge) => (
              <div key={badge} className="flex-shrink-0 bg-white/5 border border-white/10 rounded-full px-3 py-1 flex items-center gap-2">
                <Award className="h-3 w-3 text-primary" />
                <span className="text-[10px] font-bold uppercase tracking-widest">{badge}</span>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-3 gap-4 border-t border-white/10 pt-6">
          <div className="text-center space-y-1">
            <p className="text-xl font-black">{user.followersCount.toLocaleString()}</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Followers</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-xl font-black">{user.followingCount.toLocaleString()}</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Following</p>
          </div>
          <div className="text-center space-y-1">
            <p className="text-xl font-black">{user.trustScore}%</p>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Trust Score</p>
          </div>
        </div>
      </div>

      {/* E-Commerce & Admin Actions */}
      <div className={cn("grid gap-4", user.role === 'admin' ? "grid-cols-2" : "grid-cols-3")}>
        <button 
          onClick={() => navigate('/cart')}
          className="glass-card p-4 flex flex-col items-center gap-2 hover:bg-white/10 transition-colors"
        >
          <ShoppingBag className="h-6 w-6 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest">My Cart</span>
        </button>
        <button 
          onClick={() => navigate('/orders')}
          className="glass-card p-4 flex flex-col items-center gap-2 hover:bg-white/10 transition-colors"
        >
          <Clock className="h-6 w-6 text-secondary" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Orders</span>
        </button>
        <button 
          onClick={() => navigate('/seller')}
          className="glass-card p-4 flex flex-col items-center gap-2 hover:bg-white/10 transition-colors"
        >
          <TrendingUp className="h-6 w-6 text-primary" />
          <span className="text-[10px] font-bold uppercase tracking-widest">Seller Hub</span>
        </button>
        {user.role === 'admin' && (
          <button 
            onClick={() => navigate('/admin')}
            className="glass-card p-4 flex flex-col items-center gap-2 hover:bg-white/10 transition-colors border-primary/30 bg-primary/5"
          >
            <ShieldCheck className="h-6 w-6 text-primary" />
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">Admin Console</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex rounded-2xl bg-white/5 p-1 border border-white/10">
        <button
          onClick={() => setActiveTab('posts')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-bold uppercase tracking-widest transition-all duration-300",
            activeTab === 'posts' ? "bg-primary text-black" : "text-gray-400"
          )}
        >
          <Grid className="h-4 w-4" />
          Posts
        </button>
        <button
          onClick={() => setActiveTab('shop')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-bold uppercase tracking-widest transition-all duration-300",
            activeTab === 'shop' ? "bg-primary text-black" : "text-gray-400"
          )}
        >
          <ShoppingBag className="h-4 w-4" />
          Shop
        </button>
        <button
          onClick={() => setActiveTab('earnings')}
          className={cn(
            "flex-1 flex items-center justify-center gap-2 rounded-xl py-3 text-[10px] font-bold uppercase tracking-widest transition-all duration-300",
            activeTab === 'earnings' ? "bg-primary text-black" : "text-gray-400"
          )}
        >
          <DollarSign className="h-4 w-4" />
          Earnings
        </button>
      </div>

      <AnimatePresence mode="wait">
        {activeTab === 'earnings' ? (
          <motion.div
            key="earnings"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="space-y-6"
          >
            <div className="glass-card bg-primary/5 border-primary/20 space-y-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Total Balance</p>
                  <h3 className="text-4xl font-black tracking-tighter">{formatCurrency(user.earnings)}</h3>
                </div>
                <div className="h-12 w-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <TrendingUp className="h-6 w-6 text-primary" />
                </div>
              </div>
              <button className="btn-primary w-full text-sm">Withdraw to Bank</button>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="glass-card space-y-2">
                <Users className="h-5 w-5 text-secondary" />
                <p className="text-xl font-black">₹450.00</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Referral Bonus</p>
              </div>
              <div className="glass-card space-y-2">
                <ShoppingBag className="h-5 w-5 text-primary" />
                <p className="text-xl font-black">₹1,200.00</p>
                <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Shop Sales</p>
              </div>
            </div>

            <div className="glass-card space-y-4">
              <h4 className="text-xs font-bold uppercase tracking-widest text-gray-400">Recent Transactions</h4>
              {[1, 2, 3].map((i) => (
                <div key={i} className="flex items-center justify-between border-b border-white/5 pb-3 last:border-0">
                  <div className="flex items-center gap-3">
                    <div className="h-8 w-8 rounded-full bg-white/5 flex items-center justify-center">
                      <DollarSign className="h-4 w-4 text-primary" />
                    </div>
                    <div>
                      <p className="text-sm font-bold">Ad Revenue Share</p>
                      <p className="text-[10px] text-gray-500 uppercase tracking-widest">24 Mar 2026</p>
                    </div>
                  </div>
                  <p className="text-sm font-bold text-primary">+₹12.50</p>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="empty"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="glass-card text-center py-20"
          >
            <p className="text-gray-400">No {activeTab} to show yet.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

