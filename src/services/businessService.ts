import { 
  collection, 
  addDoc, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  updateDoc, 
  doc, 
  deleteDoc,
  getDoc,
  serverTimestamp,
  arrayUnion
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Product, Order, UserProfile, Notification } from '../types';
import { socialService } from './socialService';

export const businessService = {
  /**
   * Add a new product to the in-app shop.
   */
  async addProduct(sellerId: string, product: Partial<Product>): Promise<string> {
    const productsRef = collection(db, 'products');
    const docRef = await addDoc(productsRef, {
      ...product,
      sellerId,
      rating: 0,
      reviewsCount: 0,
      trending: false,
      createdAt: new Date().toISOString()
    });
    return docRef.id;
  },

  /**
   * Tag a product in a post or reel.
   */
  async tagProductInPost(postId: string, productId: string): Promise<void> {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      taggedProducts: arrayUnion(productId)
    });
  },

  /**
   * Fetch seller dashboard analytics (Orders, Earnings).
   */
  async getSellerAnalytics(sellerId: string): Promise<{ totalOrders: number; totalEarnings: number; activeProducts: number }> {
    const ordersRef = collection(db, 'orders');
    const productsRef = collection(db, 'products');

    const [ordersSnap, productsSnap] = await Promise.all([
      getDocs(query(ordersRef, where('sellerIds', 'array-contains', sellerId))),
      getDocs(query(productsRef, where('sellerId', '==', sellerId)))
    ]);

    const totalEarnings = ordersSnap.docs.reduce((sum, doc) => {
      const order = doc.data() as Order;
      const sellerItems = order.items.filter(item => item.sellerId === sellerId);
      return sum + sellerItems.reduce((s, i) => s + (i.price * i.quantity), 0);
    }, 0);

    return {
      totalOrders: ordersSnap.size,
      totalEarnings,
      activeProducts: productsSnap.size
    };
  },

  /**
   * Update order status and notify the buyer.
   */
  async updateOrderStatus(orderId: string, buyerId: string, status: Order['status']): Promise<void> {
    const orderRef = doc(db, 'orders', orderId);
    await updateDoc(orderRef, {
      status
    });

    await socialService.createNotification(buyerId, 'order', 'Order Update!', `Your order #${orderId.slice(-8)} is now ${status}.`);
  }
};
