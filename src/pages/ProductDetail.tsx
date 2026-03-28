import React, { useState, useEffect } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { doc, getDoc, collection, query, where, limit, getDocs, updateDoc, arrayUnion } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Product, Review, UserProfile } from '../types';
import { 
  Star, 
  ShoppingCart, 
  Heart, 
  Share2, 
  ChevronLeft, 
  ShieldCheck, 
  Truck, 
  RotateCcw,
  MessageSquare,
  Plus,
  Minus,
  Send
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export default function ProductDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [product, setProduct] = useState<Product | null>(null);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [relatedProducts, setRelatedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [quantity, setQuantity] = useState(1);
  const [isWishlisted, setIsWishlisted] = useState(false);
  const [activeTab, setActiveTab] = useState('description');
  const [newReview, setNewReview] = useState({ rating: 5, comment: '' });
  const [submittingReview, setSubmittingReview] = useState(false);

  useEffect(() => {
    if (id) {
      fetchProductData();
      checkWishlist();
    }
  }, [id]);

  const fetchProductData = async () => {
    setLoading(true);
    try {
      const productRef = doc(db, 'products', id!);
      const productSnap = await getDoc(productRef);
      
      if (productSnap.exists()) {
        const productData = { id: productSnap.id, ...productSnap.data() } as Product;
        setProduct(productData);

        // Fetch Reviews
        const reviewsRef = collection(db, 'products', id!, 'reviews');
        const reviewsSnap = await getDocs(query(reviewsRef, limit(10)));
        setReviews(reviewsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Review[]);

        // Fetch Related Products
        const relatedRef = collection(db, 'products');
        const relatedSnap = await getDocs(query(
          relatedRef, 
          where('category', '==', productData.category),
          limit(4)
        ));
        setRelatedProducts(relatedSnap.docs
          .map(doc => ({ id: doc.id, ...doc.data() }))
          .filter(p => p.id !== id) as Product[]);
      }
    } catch (error) {
      console.error('Error fetching product:', error);
    } finally {
      setLoading(false);
    }
  };

  const checkWishlist = async () => {
    if (!auth.currentUser) return;
    const userRef = doc(db, 'users', auth.currentUser.uid);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const userData = userSnap.data() as UserProfile;
      setIsWishlisted(userData.wishlist?.includes(id!) || false);
    }
  };

  const toggleWishlist = async () => {
    if (!auth.currentUser) return;
    const userRef = doc(db, 'users', auth.currentUser.uid);
    try {
      if (isWishlisted) {
        // Remove from wishlist (simplified for now)
        setIsWishlisted(false);
      } else {
        await updateDoc(userRef, {
          wishlist: arrayUnion(id)
        });
        setIsWishlisted(true);
      }
    } catch (error) {
      console.error('Error updating wishlist:', error);
    }
  };

  const addToCart = async () => {
    if (!auth.currentUser || !product) return;
    const userRef = doc(db, 'users', auth.currentUser.uid);
    try {
      const cartItem = {
        productId: product.id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        quantity: quantity,
        sellerId: product.sellerId
      };
      await updateDoc(userRef, {
        cart: arrayUnion(cartItem)
      });
      // Show success toast or navigate
      navigate('/cart');
    } catch (error) {
      console.error('Error adding to cart:', error);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <motion.div
          animate={{ scale: [1, 1.2, 1], opacity: [1, 0.5, 1] }}
          transition={{ duration: 2, repeat: Infinity }}
          className="text-2xl font-black tracking-tighter"
        >
          KHOJ<span className="text-primary">AI</span>
        </motion.div>
      </div>
    );
  }

  if (!product) return <div>Product not found</div>;

  return (
    <div className="min-h-screen bg-background pb-32">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md px-4 py-4 flex items-center justify-between border-b border-white/5">
        <button onClick={() => navigate(-1)} className="p-2 rounded-full hover:bg-white/5">
          <ChevronLeft className="h-6 w-6" />
        </button>
        <div className="flex items-center gap-2">
          <button onClick={toggleWishlist} className="p-2 rounded-full hover:bg-white/5">
            <Heart className={cn("h-6 w-6", isWishlisted && "fill-red-500 text-red-500")} />
          </button>
          <button className="p-2 rounded-full hover:bg-white/5">
            <Share2 className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-4 py-6 space-y-8">
        {/* Product Image */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="aspect-square rounded-3xl overflow-hidden bg-white/5"
        >
          <img 
            src={product.imageUrl} 
            alt={product.name} 
            className="w-full h-full object-cover"
            referrerPolicy="no-referrer"
          />
        </motion.div>

        {/* Product Info */}
        <div className="space-y-4">
          <div className="flex items-center gap-2">
            <span className="bg-primary/20 text-primary text-[10px] font-black uppercase px-2 py-1 rounded-lg tracking-widest">
              {product.category}
            </span>
            {product.trending && (
              <span className="bg-secondary/20 text-secondary text-[10px] font-black uppercase px-2 py-1 rounded-lg tracking-widest">
                Trending
              </span>
            )}
          </div>
          <h1 className="text-3xl font-black tracking-tight leading-none">{product.name}</h1>
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-1 text-yellow-500">
              <Star className="h-4 w-4 fill-current" />
              <span className="text-sm font-black text-white">{product.rating}</span>
            </div>
            <span className="text-gray-500 text-sm font-medium">({product.reviewsCount} Reviews)</span>
            <span className="text-green-500 text-sm font-bold uppercase tracking-widest">In Stock</span>
          </div>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black">₹{product.price.toLocaleString()}</span>
            <span className="text-gray-500 line-through text-lg">₹{(product.price * 1.2).toLocaleString()}</span>
            <span className="text-green-500 font-bold">20% OFF</span>
          </div>
        </div>

        {/* Seller Info */}
        <div className="glass-card p-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="h-10 w-10 rounded-full bg-primary/20 flex items-center justify-center font-black text-primary">
              {product.sellerName.charAt(0)}
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Sold by</p>
              <p className="font-bold">{product.sellerName}</p>
            </div>
          </div>
          <button className="btn-secondary px-4 py-2 text-xs">Visit Store</button>
        </div>

        {/* Tabs */}
        <div className="space-y-6">
          <div className="flex border-b border-white/5">
            {['description', 'reviews', 'shipping'].map(tab => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "flex-1 py-4 text-xs font-black uppercase tracking-widest transition-all relative",
                  activeTab === tab ? "text-primary" : "text-gray-500"
                )}
              >
                {tab}
                {activeTab === tab && (
                  <motion.div 
                    layoutId="activeTab"
                    className="absolute bottom-0 left-0 right-0 h-0.5 bg-primary"
                  />
                )}
              </button>
            ))}
          </div>

          <div className="min-h-[200px]">
            {activeTab === 'description' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-gray-400 leading-relaxed"
              >
                {product.description}
              </motion.div>
            )}

            {activeTab === 'reviews' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-6"
              >
                {reviews.length > 0 ? (
                  reviews.map(review => (
                    <div key={review.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <img src={review.userAvatar} className="h-8 w-8 rounded-full" alt="" />
                          <span className="font-bold text-sm">{review.userName}</span>
                        </div>
                        <div className="flex items-center gap-0.5 text-yellow-500">
                          {[...Array(5)].map((_, i) => (
                            <Star key={i} className={cn("h-3 w-3", i < review.rating ? "fill-current" : "text-gray-700")} />
                          ))}
                        </div>
                      </div>
                      <p className="text-sm text-gray-400">{review.comment}</p>
                    </div>
                  ))
                ) : (
                  <div className="text-center py-10 text-gray-500">No reviews yet. Be the first to review!</div>
                )}
              </motion.div>
            )}

            {activeTab === 'shipping' && (
              <motion.div 
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="space-y-4"
              >
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5">
                  <Truck className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-bold text-sm">Fast Delivery</p>
                    <p className="text-xs text-gray-500">Estimated delivery in 2-4 business days.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5">
                  <RotateCcw className="h-6 w-6 text-secondary" />
                  <div>
                    <p className="font-bold text-sm">7 Days Return</p>
                    <p className="text-xs text-gray-500">Easy returns if you're not satisfied.</p>
                  </div>
                </div>
                <div className="flex items-center gap-4 p-4 rounded-2xl bg-white/5">
                  <ShieldCheck className="h-6 w-6 text-primary" />
                  <div>
                    <p className="font-bold text-sm">Secure Payment</p>
                    <p className="text-xs text-gray-500">100% secure payment processing.</p>
                  </div>
                </div>
              </motion.div>
            )}
          </div>
        </div>

        {/* Related Products */}
        {relatedProducts.length > 0 && (
          <section className="space-y-4">
            <h2 className="text-lg font-black uppercase tracking-tight">You May Also Like</h2>
            <div className="grid grid-cols-2 gap-4">
              {relatedProducts.map(p => (
                <Link key={p.id} to={`/product/${p.id}`} className="space-y-2">
                  <div className="aspect-square rounded-2xl overflow-hidden bg-white/5">
                    <img src={p.imageUrl} className="w-full h-full object-cover" alt="" referrerPolicy="no-referrer" />
                  </div>
                  <h3 className="font-bold text-sm truncate">{p.name}</h3>
                  <p className="text-primary font-black">₹{p.price.toLocaleString()}</p>
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>

      {/* Bottom Action Bar */}
      <div className="fixed bottom-0 left-0 right-0 z-40 bg-background/80 backdrop-blur-xl border-t border-white/5 p-4 safe-bottom">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <div className="flex items-center gap-2 bg-white/5 rounded-2xl p-1">
            <button 
              onClick={() => setQuantity(Math.max(1, quantity - 1))}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <Minus className="h-4 w-4" />
            </button>
            <span className="w-8 text-center font-black">{quantity}</span>
            <button 
              onClick={() => setQuantity(Math.min(product.stock, quantity + 1))}
              className="p-2 hover:bg-white/10 rounded-xl transition-colors"
            >
              <Plus className="h-4 w-4" />
            </button>
          </div>
          <button 
            onClick={addToCart}
            className="flex-1 btn-secondary py-4 flex items-center justify-center gap-2"
          >
            <ShoppingCart className="h-5 w-5" />
            Add to Cart
          </button>
          <button 
            onClick={() => navigate('/checkout', { state: { product, quantity } })}
            className="flex-1 btn-primary py-4"
          >
            Buy Now
          </button>
        </div>
      </div>
    </div>
  );
}
