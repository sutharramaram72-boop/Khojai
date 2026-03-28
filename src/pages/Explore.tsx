import { useState, useEffect } from 'react';
import { Search, ShoppingBag, Filter, Star, Heart, X, CreditCard, ShieldCheck, Loader2, TrendingUp, Sparkles, Users, Hash } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc } from 'firebase/firestore';
import { Product, Post, UserProfile } from '../types';
import { formatCurrency, cn } from '../lib/utils';
import { trendingService } from '../services/trendingService';

export default function Explore() {
  const [products, setProducts] = useState<Product[]>([]);
  const [trendingReels, setTrendingReels] = useState<Post[]>([]);
  const [trendingHashtags, setTrendingHashtags] = useState<string[]>([]);
  const [trendingCreators, setTrendingCreators] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [isPaying, setIsPaying] = useState(false);

  useEffect(() => {
    const fetchTrending = async () => {
      try {
        const { reels, hashtags, creators } = await trendingService.getTrendingContent();
        setTrendingReels(reels);
        setTrendingHashtags(hashtags);
        setTrendingCreators(creators);
      } catch (error) {
        console.error("Trending Error:", error);
      }
    };
    fetchTrending();

    const q = query(collection(db, 'products'), orderBy('createdAt', 'desc'), limit(20));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const productsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Product));
      setProducts(productsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'products');
    });

    return () => unsubscribe();
  }, []);

  const handlePayment = async () => {
    if (!selectedProduct || !auth.currentUser) return;
    setIsPaying(true);

    try {
      // Create order in Firestore
      await addDoc(collection(db, 'orders'), {
        buyerId: auth.currentUser.uid,
        productId: selectedProduct.id,
        productName: selectedProduct.name,
        amount: selectedProduct.price,
        status: 'paid',
        createdAt: new Date().toISOString(),
      });
      alert(`Payment successful!`);
      setSelectedProduct(null);
    } catch (error) {
      console.error("Payment Error:", error);
      alert("Something went wrong with the payment.");
    } finally {
      setIsPaying(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 pb-20">
      <header className="space-y-6">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-black tracking-tighter text-white">
            EXPLORE<span className="text-secondary">AI</span>
          </h1>
          <div className="relative cursor-pointer">
            <ShoppingBag className="h-6 w-6 text-white" />
            <span className="absolute -right-2 -top-2 flex h-5 w-5 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-black">
              2
            </span>
          </div>
        </div>

        <div className="relative">
          <Search className="absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400" />
          <input
            type="text"
            placeholder="Search products, trends, creators..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full rounded-2xl bg-white/5 py-4 pl-12 pr-4 text-sm font-medium outline-none border border-white/10 focus:border-primary/50 transition-all duration-300"
          />
          <Filter className="absolute right-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400 cursor-pointer hover:text-primary transition-colors" />
        </div>
      </header>

      {/* Trending Hashtags */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-4">
          <Hash className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Trending Hashtags</h2>
        </div>
        <div className="flex gap-3 overflow-x-auto pb-2 no-scrollbar px-4">
          {trendingHashtags.map((tag) => (
            <button
              key={tag}
              className="flex-shrink-0 rounded-full bg-white/5 px-6 py-2 text-xs font-bold border border-white/10 hover:bg-primary hover:text-black transition-all duration-300"
            >
              {tag}
            </button>
          ))}
        </div>
      </div>

      {/* Trending Reels */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-4">
          <TrendingUp className="h-4 w-4 text-secondary" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Viral Reels</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar px-4">
          {trendingReels.map((reel) => (
            <motion.div
              key={reel.id}
              whileHover={{ scale: 1.05 }}
              className="flex-shrink-0 w-32 aspect-[9/16] rounded-2xl overflow-hidden relative group cursor-pointer"
            >
              <img 
                src={reel.mediaUrl || `https://picsum.photos/seed/${reel.id}/400/711`} 
                className="w-full h-full object-cover" 
                alt="Reel"
                referrerPolicy="no-referrer"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
              <div className="absolute bottom-2 left-2 right-2">
                <p className="text-[10px] font-bold text-white truncate">{reel.authorName}</p>
                <div className="flex items-center gap-1">
                  <Heart className="h-2 w-2 text-primary fill-primary" />
                  <span className="text-[8px] text-gray-300">{(reel.likesCount / 1000).toFixed(1)}K</span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Trending Creators */}
      <div className="space-y-4">
        <div className="flex items-center gap-2 px-4">
          <Users className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Top Creators</h2>
        </div>
        <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar px-4">
          {trendingCreators.map((creator) => (
            <motion.div
              key={creator.uid}
              whileHover={{ scale: 1.05 }}
              className="flex-shrink-0 flex flex-col items-center gap-2 cursor-pointer"
            >
              <div className="h-16 w-16 rounded-full p-1 bg-gradient-to-tr from-primary to-secondary">
                <img 
                  src={creator.photoURL || `https://picsum.photos/seed/${creator.uid}/200/200`} 
                  className="h-full w-full rounded-full object-cover border-2 border-background" 
                  alt={creator.displayName}
                  referrerPolicy="no-referrer"
                />
              </div>
              <p className="text-[10px] font-bold text-gray-400 truncate w-16 text-center">{creator.displayName}</p>
            </motion.div>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      <div className="space-y-4 px-4">
        <div className="flex items-center gap-2">
          <ShoppingBag className="h-4 w-4 text-primary" />
          <h2 className="text-xs font-bold uppercase tracking-widest text-gray-400">Shop Trends</h2>
        </div>
        <div className="grid grid-cols-2 gap-4">
          {loading ? (
            [1, 2, 3, 4].map((i) => (
              <div key={i} className="glass-card h-64 animate-pulse bg-white/5" />
            ))
          ) : filteredProducts.length === 0 ? (
            <div className="col-span-2 glass-card text-center py-20">
              <p className="text-gray-400">No products found matching your search.</p>
            </div>
          ) : (
            filteredProducts.map((product) => (
              <motion.div
                key={product.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                whileHover={{ y: -5 }}
                className="glass-card !p-0 overflow-hidden group"
              >
                <div className="relative aspect-[3/4] bg-black/20">
                  <img
                    src={product.imageUrl || `https://picsum.photos/seed/${product.id}/400/600`}
                    alt={product.name}
                    className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-110"
                    referrerPolicy="no-referrer"
                  />
                  <div className="absolute right-3 top-3 h-8 w-8 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center border border-white/10">
                    <Heart className="h-4 w-4 text-white hover:text-red-500 transition-colors cursor-pointer" />
                  </div>
                  <div className="absolute bottom-3 left-3 rounded-full bg-black/60 backdrop-blur-md px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-primary border border-primary/20">
                    {product.category}
                  </div>
                </div>

                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-sm truncate">{product.name}</h3>
                  <div className="flex items-center justify-between">
                    <p className="text-lg font-black text-primary">{formatCurrency(product.price)}</p>
                    <div className="flex items-center gap-1">
                      <Star className="h-3 w-3 fill-yellow-400 text-yellow-400" />
                      <span className="text-[10px] font-bold text-gray-400">4.8</span>
                    </div>
                  </div>
                  <button 
                    onClick={() => setSelectedProduct(product)}
                    className="w-full rounded-xl bg-primary py-2 text-[10px] font-bold uppercase tracking-widest text-black hover:scale-105 transition-all duration-300"
                  >
                    Buy Now
                  </button>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* Checkout Modal */}
      <AnimatePresence>
        {selectedProduct && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedProduct(null)}
              className="absolute inset-0 bg-black/80 backdrop-blur-sm"
            />
            <motion.div
              initial={{ opacity: 0, scale: 0.9, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9, y: 20 }}
              className="glass-card relative w-full max-w-md space-y-6"
            >
              <button 
                onClick={() => setSelectedProduct(null)}
                className="absolute right-4 top-4 text-gray-400 hover:text-white"
              >
                <X className="h-6 w-6" />
              </button>

              <div className="space-y-4">
                <h2 className="text-2xl font-black tracking-tighter">Secure Checkout</h2>
                <div className="flex gap-4 border-b border-white/10 pb-4">
                  <img 
                    src={selectedProduct.imageUrl} 
                    className="h-20 w-20 rounded-xl object-cover" 
                    alt={selectedProduct.name}
                    referrerPolicy="no-referrer"
                  />
                  <div className="space-y-1">
                    <p className="font-bold">{selectedProduct.name}</p>
                    <p className="text-xs text-gray-400">{selectedProduct.category}</p>
                    <p className="text-lg font-black text-primary">{formatCurrency(selectedProduct.price)}</p>
                  </div>
                </div>

                <div className="space-y-3">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-gray-500">Payment Method</p>
                  <div className="flex items-center justify-between rounded-2xl bg-white/5 p-4 border border-primary/20">
                    <div className="flex items-center gap-3">
                      <CreditCard className="h-5 w-5 text-primary" />
                      <div>
                        <p className="text-sm font-bold">KhojAI Wallet / UPI</p>
                        <p className="text-[10px] text-gray-400">Instant & Secure</p>
                      </div>
                    </div>
                    <div className="h-5 w-5 rounded-full border-2 border-primary bg-primary/20" />
                  </div>
                </div>

                <div className="flex items-center gap-2 text-[10px] text-gray-400">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  Payments are encrypted and processed securely.
                </div>

                <button
                  onClick={handlePayment}
                  disabled={isPaying}
                  className="btn-primary w-full flex items-center justify-center gap-2"
                >
                  {isPaying ? <Loader2 className="h-5 w-5 animate-spin" /> : <CreditCard className="h-5 w-5" />}
                  Confirm & Pay {formatCurrency(selectedProduct.price)}
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

