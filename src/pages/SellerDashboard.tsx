import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, where, orderBy, doc, getDoc, addDoc, updateDoc, deleteDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Product, Order, UserProfile } from '../types';
import { 
  BarChart3, 
  Package, 
  ShoppingBag, 
  Plus, 
  TrendingUp, 
  DollarSign, 
  Users, 
  ChevronRight, 
  Edit2, 
  Trash2, 
  X,
  CheckCircle2,
  Clock,
  Truck
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from '../lib/utils';

export default function SellerDashboard() {
  const [products, setProducts] = useState<Product[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'products' | 'orders'>('overview');

  const [productForm, setProductForm] = useState({
    name: '',
    description: '',
    price: '',
    category: 'Electronics',
    stock: '',
    imageUrl: ''
  });

  useEffect(() => {
    fetchSellerData();
  }, []);

  const fetchSellerData = async () => {
    if (!auth.currentUser) return;
    setLoading(true);
    try {
      const userRef = doc(db, 'users', auth.currentUser.uid);
      const userSnap = await getDoc(userRef);
      if (userSnap.exists()) {
        setUserProfile(userSnap.data() as UserProfile);
      }

      // Fetch Products
      const productsRef = collection(db, 'products');
      const productsSnap = await getDocs(query(productsRef, where('sellerId', '==', auth.currentUser.uid)));
      setProducts(productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Product[]);

      // Fetch Orders
      const ordersRef = collection(db, 'orders');
      const ordersSnap = await getDocs(query(ordersRef, where('sellerIds', 'array-contains', auth.currentUser.uid), orderBy('createdAt', 'desc')));
      setOrders(ordersSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Order[]);
    } catch (error) {
      console.error('Error fetching seller data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!auth.currentUser) return;
    try {
      const newProduct = {
        sellerId: auth.currentUser.uid,
        sellerName: userProfile?.displayName || 'Unknown Seller',
        name: productForm.name,
        description: productForm.description,
        price: parseFloat(productForm.price),
        category: productForm.category,
        stock: parseInt(productForm.stock),
        imageUrl: productForm.imageUrl || 'https://picsum.photos/seed/product/600/600',
        rating: 0,
        reviewsCount: 0,
        createdAt: new Date().toISOString()
      };

      if (editingProduct) {
        await updateDoc(doc(db, 'products', editingProduct.id), newProduct);
      } else {
        await addDoc(collection(db, 'products'), newProduct);
      }

      setIsAddingProduct(false);
      setEditingProduct(null);
      setProductForm({ name: '', description: '', price: '', category: 'Electronics', stock: '', imageUrl: '' });
      fetchSellerData();
    } catch (error) {
      console.error('Error adding product:', error);
    }
  };

  const deleteProduct = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this product?')) return;
    try {
      await deleteDoc(doc(db, 'products', id));
      fetchSellerData();
    } catch (error) {
      console.error('Error deleting product:', error);
    }
  };

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    try {
      await updateDoc(doc(db, 'orders', orderId), { status: newStatus });
      fetchSellerData();
    } catch (error) {
      console.error('Error updating order status:', error);
    }
  };

  const totalEarnings = orders.reduce((sum, order) => sum + order.totalAmount, 0);
  const totalSales = orders.length;

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;

  return (
    <div className="min-h-screen bg-background pb-24">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-background/80 backdrop-blur-md border-b border-white/5 px-4 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-2xl font-black tracking-tighter uppercase">SELLER<span className="text-primary">DASHBOARD</span></h1>
          <button 
            onClick={() => setIsAddingProduct(true)}
            className="btn-primary p-2 rounded-full"
          >
            <Plus className="h-6 w-6" />
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6 space-y-8">
        {/* Stats Grid */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="glass-card p-4 space-y-2">
            <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <DollarSign className="h-6 w-6 text-primary" />
            </div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Earnings</p>
            <p className="text-xl font-black">₹{totalEarnings.toLocaleString()}</p>
          </div>
          <div className="glass-card p-4 space-y-2">
            <div className="h-10 w-10 bg-secondary/20 rounded-xl flex items-center justify-center">
              <ShoppingBag className="h-6 w-6 text-secondary" />
            </div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Orders</p>
            <p className="text-xl font-black">{totalSales}</p>
          </div>
          <div className="glass-card p-4 space-y-2">
            <div className="h-10 w-10 bg-primary/20 rounded-xl flex items-center justify-center">
              <Package className="h-6 w-6 text-primary" />
            </div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Total Products</p>
            <p className="text-xl font-black">{products.length}</p>
          </div>
          <div className="glass-card p-4 space-y-2">
            <div className="h-10 w-10 bg-secondary/20 rounded-xl flex items-center justify-center">
              <TrendingUp className="h-6 w-6 text-secondary" />
            </div>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Trust Score</p>
            <p className="text-xl font-black">{userProfile?.trustScore || 100}</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex border-b border-white/5">
          {['overview', 'products', 'orders'].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab as any)}
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

        <div className="min-h-[400px]">
          {activeTab === 'overview' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-8"
            >
              <section className="space-y-4">
                <h2 className="text-lg font-black uppercase tracking-tight">Recent Orders</h2>
                <div className="space-y-3">
                  {orders.slice(0, 5).map(order => (
                    <div key={order.id} className="glass-card p-4 flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 bg-white/5 rounded-xl flex items-center justify-center">
                          <ShoppingBag className="h-5 w-5 text-gray-400" />
                        </div>
                        <div>
                          <p className="font-bold text-sm">Order #{order.id.slice(-6)}</p>
                          <p className="text-xs text-gray-500">₹{order.totalAmount.toLocaleString()} • {new Date(order.createdAt).toLocaleDateString()}</p>
                        </div>
                      </div>
                      <span className={cn(
                        "text-[10px] font-black uppercase px-2 py-1 rounded-lg tracking-widest",
                        order.status === 'delivered' ? "bg-green-500/20 text-green-500" : "bg-yellow-500/20 text-yellow-500"
                      )}>
                        {order.status}
                      </span>
                    </div>
                  ))}
                </div>
              </section>
            </motion.div>
          )}

          {activeTab === 'products' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {products.map(product => (
                <div key={product.id} className="glass-card p-4 flex gap-4">
                  <div className="h-20 w-20 rounded-xl overflow-hidden bg-white/5 flex-shrink-0">
                    <img src={product.imageUrl} className="w-full h-full object-cover" alt="" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-bold text-sm truncate">{product.name}</h3>
                    <p className="text-primary font-black">₹{product.price.toLocaleString()}</p>
                    <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold mt-1">Stock: {product.stock}</p>
                  </div>
                  <div className="flex flex-col gap-2">
                    <button 
                      onClick={() => {
                        setEditingProduct(product);
                        setProductForm({
                          name: product.name,
                          description: product.description,
                          price: product.price.toString(),
                          category: product.category,
                          stock: product.stock.toString(),
                          imageUrl: product.imageUrl
                        });
                        setIsAddingProduct(true);
                      }}
                      className="p-2 bg-white/5 rounded-lg hover:bg-white/10"
                    >
                      <Edit2 className="h-4 w-4" />
                    </button>
                    <button 
                      onClick={() => deleteProduct(product.id)}
                      className="p-2 bg-red-500/10 text-red-500 rounded-lg hover:bg-red-500/20"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'orders' && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="space-y-4"
            >
              {orders.map(order => (
                <div key={order.id} className="glass-card p-6 space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Order ID</p>
                      <p className="font-black">#{order.id.slice(-8)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">Status</p>
                      <select 
                        value={order.status}
                        onChange={(e) => updateOrderStatus(order.id, e.target.value)}
                        className="bg-transparent text-primary font-black uppercase text-xs focus:outline-none cursor-pointer"
                      >
                        <option value="pending">Pending</option>
                        <option value="paid">Paid</option>
                        <option value="shipped">Shipped</option>
                        <option value="delivered">Delivered</option>
                        <option value="cancelled">Cancelled</option>
                      </select>
                    </div>
                  </div>
                  <div className="space-y-2">
                    {order.items.map((item, idx) => (
                      <div key={idx} className="flex items-center justify-between text-sm">
                        <span className="text-gray-400">{item.name} x {item.quantity}</span>
                        <span className="font-bold">₹{(item.price * item.quantity).toLocaleString()}</span>
                      </div>
                    ))}
                  </div>
                  <div className="h-px bg-white/5" />
                  <div className="flex items-center justify-between">
                    <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">Payment: {order.paymentMethod}</p>
                    <p className="text-lg font-black">Total: ₹{order.totalAmount.toLocaleString()}</p>
                  </div>
                </div>
              ))}
            </motion.div>
          )}
        </div>
      </div>

      {/* Add/Edit Product Modal */}
      <AnimatePresence>
        {isAddingProduct && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-4"
          >
            <motion.div 
              initial={{ scale: 0.9, y: 20 }}
              animate={{ scale: 1, y: 0 }}
              className="bg-background border border-white/10 rounded-3xl w-full max-w-lg p-6 space-y-6 max-h-[90vh] overflow-y-auto"
            >
              <div className="flex items-center justify-between">
                <h2 className="text-xl font-black uppercase tracking-tighter">
                  {editingProduct ? 'Edit' : 'Add New'} <span className="text-primary">Product</span>
                </h2>
                <button 
                  onClick={() => {
                    setIsAddingProduct(false);
                    setEditingProduct(null);
                  }}
                  className="p-2 rounded-full hover:bg-white/5"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>

              <form onSubmit={handleAddProduct} className="space-y-4">
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Product Name</label>
                  <input 
                    type="text" 
                    required
                    value={productForm.name}
                    onChange={(e) => setProductForm({ ...productForm, name: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Description</label>
                  <textarea 
                    required
                    rows={3}
                    value={productForm.description}
                    onChange={(e) => setProductForm({ ...productForm, description: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition-colors resize-none"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Price (₹)</label>
                    <input 
                      type="number" 
                      required
                      value={productForm.price}
                      onChange={(e) => setProductForm({ ...productForm, price: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Stock</label>
                    <input 
                      type="number" 
                      required
                      value={productForm.stock}
                      onChange={(e) => setProductForm({ ...productForm, stock: e.target.value })}
                      className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition-colors"
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Category</label>
                  <select 
                    value={productForm.category}
                    onChange={(e) => setProductForm({ ...productForm, category: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition-colors"
                  >
                    <option value="Electronics">Electronics</option>
                    <option value="Fashion">Fashion</option>
                    <option value="Home">Home</option>
                    <option value="Beauty">Beauty</option>
                    <option value="Sports">Sports</option>
                  </select>
                </div>
                <div className="space-y-2">
                  <label className="text-xs font-bold text-gray-500 uppercase tracking-widest">Image URL</label>
                  <input 
                    type="url" 
                    placeholder="https://..."
                    value={productForm.imageUrl}
                    onChange={(e) => setProductForm({ ...productForm, imageUrl: e.target.value })}
                    className="w-full bg-white/5 border border-white/10 rounded-xl px-4 py-3 focus:border-primary focus:outline-none transition-colors"
                  />
                </div>
                <button type="submit" className="w-full btn-primary py-4 font-black uppercase tracking-widest">
                  {editingProduct ? 'Update' : 'Add'} Product
                </button>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
