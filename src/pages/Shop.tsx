import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../firebase';
import { Product } from '../types';
import { Search, Filter, ShoppingCart, Star, TrendingUp, ChevronRight } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { Link } from 'react-router-dom';
import { cn } from '../lib/utils';

export default function Shop() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [sortBy, setSortBy] = useState('newest');
  const [showFilters, setShowFilters] = useState(false);

  const categories = ['All', 'Electronics', 'Fashion', 'Home', 'Beauty', 'Sports'];

  useEffect(() => {
    fetchProducts();
  }, [selectedCategory, sortBy]);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      let q = query(collection(db, 'products'));
      
      if (selectedCategory !== 'All') {
        q = query(q, where('category', '==', selectedCategory));
      }

      if (sortBy === 'price-low') {
        q = query(q, orderBy('price', 'asc'));
      } else if (sortBy === 'price-high') {
        q = query(q, orderBy('price', 'desc'));
      } else {
        q = query(q, orderBy('createdAt', 'desc'));
      }

      const querySnapshot = await getDocs(q);
      const productsData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      })) as Product[];
      
      setProducts(productsData);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredProducts = products.filter(p => 
    p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header Section */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-white/5 px-4 py-4">
        <div className="max-w-7xl mx-auto space-y-4">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-black tracking-tighter">MARKET<span className="text-primary">PLACE</span></h1>
            <Link to="/cart" className="relative p-2 rounded-full hover:bg-white/5 transition-colors">
              <ShoppingCart className="h-6 w-6" />
              <span className="absolute top-0 right-0 h-4 w-4 bg-primary text-[10px] font-bold rounded-full flex items-center justify-center">3</span>
            </Link>
          </div>

          <div className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
              <input
                type="text"
                placeholder="Search products..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm focus:outline-none focus:border-primary transition-colors"
              />
            </div>
            <button 
              onClick={() => setShowFilters(!showFilters)}
              className={cn(
                "p-2 rounded-xl border transition-all",
                showFilters ? "bg-primary border-primary text-white" : "bg-white/5 border-white/10 text-gray-400"
              )}
            >
              <Filter className="h-5 w-5" />
            </button>
          </div>

          <AnimatePresence>
            {showFilters && (
              <motion.div
                initial={{ height: 0, opacity: 0 }}
                animate={{ height: 'auto', opacity: 1 }}
                exit={{ height: 0, opacity: 0 }}
                className="overflow-hidden space-y-4 pt-2"
              >
                <div className="flex flex-wrap gap-2">
                  {categories.map(cat => (
                    <button
                      key={cat}
                      onClick={() => setSelectedCategory(cat)}
                      className={cn(
                        "px-4 py-1.5 rounded-full text-xs font-bold transition-all",
                        selectedCategory === cat 
                          ? "bg-primary text-white" 
                          : "bg-white/5 text-gray-400 hover:bg-white/10"
                      )}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
                <div className="flex items-center gap-4 text-xs font-bold text-gray-500 uppercase tracking-widest">
                  <span>Sort by:</span>
                  <select 
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="bg-transparent text-white focus:outline-none cursor-pointer"
                  >
                    <option value="newest">Newest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                  </select>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Trending Section */}
        {!searchQuery && selectedCategory === 'All' && (
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-primary" />
                <h2 className="text-lg font-black uppercase tracking-tight">Trending Now</h2>
              </div>
              <button className="text-xs font-bold text-primary uppercase tracking-widest flex items-center gap-1">
                View All <ChevronRight className="h-3 w-3" />
              </button>
            </div>
            <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-hide">
              {products.filter(p => p.trending).map(product => (
                <Link 
                  key={product.id} 
                  to={`/product/${product.id}`}
                  className="min-w-[200px] group"
                >
                  <div className="relative aspect-square rounded-2xl overflow-hidden bg-white/5 mb-3">
                    <img 
                      src={product.imageUrl} 
                      alt={product.name}
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                      referrerPolicy="no-referrer"
                    />
                    <div className="absolute top-2 right-2 bg-black/50 backdrop-blur-md px-2 py-1 rounded-lg flex items-center gap-1">
                      <Star className="h-3 w-3 text-yellow-500 fill-yellow-500" />
                      <span className="text-[10px] font-bold">{product.rating}</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-sm truncate">{product.name}</h3>
                  <p className="text-primary font-black">₹{product.price.toLocaleString()}</p>
                </Link>
              ))}
            </div>
          </section>
        )}

        {/* Main Product Grid */}
        <section className="space-y-4">
          <h2 className="text-lg font-black uppercase tracking-tight">
            {searchQuery ? `Search Results for "${searchQuery}"` : `${selectedCategory} Products`}
          </h2>
          {loading ? (
            <div className="grid grid-cols-2 gap-4">
              {[1, 2, 3, 4].map(i => (
                <div key={i} className="animate-pulse space-y-3">
                  <div className="aspect-square bg-white/5 rounded-2xl" />
                  <div className="h-4 bg-white/5 rounded w-3/4" />
                  <div className="h-4 bg-white/5 rounded w-1/2" />
                </div>
              ))}
            </div>
          ) : filteredProducts.length > 0 ? (
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {filteredProducts.map(product => (
                <motion.div
                  layout
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  key={product.id}
                >
                  <Link to={`/product/${product.id}`} className="block group">
                    <div className="relative aspect-square rounded-2xl overflow-hidden bg-white/5 mb-3">
                      <img 
                        src={product.imageUrl} 
                        alt={product.name}
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110"
                        referrerPolicy="no-referrer"
                      />
                      {product.stock < 10 && (
                        <div className="absolute bottom-2 left-2 bg-red-500 text-[10px] font-black uppercase px-2 py-1 rounded-lg">
                          Only {product.stock} Left
                        </div>
                      )}
                    </div>
                    <div className="space-y-1">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">{product.category}</p>
                      <h3 className="font-bold text-sm truncate group-hover:text-primary transition-colors">{product.name}</h3>
                      <div className="flex items-center justify-between">
                        <p className="text-lg font-black">₹{product.price.toLocaleString()}</p>
                        <div className="flex items-center gap-1 text-yellow-500">
                          <Star className="h-3 w-3 fill-current" />
                          <span className="text-xs font-bold text-white">{product.rating}</span>
                        </div>
                      </div>
                    </div>
                  </Link>
                </motion.div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20 space-y-4">
              <div className="h-20 w-20 bg-white/5 rounded-full flex items-center justify-center mx-auto">
                <Search className="h-8 w-8 text-gray-500" />
              </div>
              <p className="text-gray-400 font-medium">No products found matching your criteria.</p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
