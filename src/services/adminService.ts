import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  doc, 
  updateDoc, 
  deleteDoc,
  getDoc,
  increment,
  getCountFromServer
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile, Post, Product, Notification, Order } from '../types';

export const adminService = {
  /**
   * Fetch platform-wide statistics.
   */
  async getPlatformStats(): Promise<{
    totalUsers: number;
    totalPosts: number;
    totalProducts: number;
    totalOrders: number;
    totalRevenue: number;
    pendingReports: number;
  }> {
    const [usersCount, postsCount, productsCount, ordersCount, reportsCount] = await Promise.all([
      getCountFromServer(collection(db, 'users')),
      getCountFromServer(collection(db, 'posts')),
      getCountFromServer(collection(db, 'products')),
      getCountFromServer(collection(db, 'orders')),
      getCountFromServer(query(collection(db, 'reports'), where('status', '==', 'pending')))
    ]);

    // For revenue, we still need to fetch orders or have a global stats doc
    const ordersSnap = await getDocs(query(collection(db, 'orders'), limit(100)));
    const totalRevenue = ordersSnap.docs.reduce((sum, doc) => sum + (doc.data() as Order).totalAmount, 0);

    return {
      totalUsers: usersCount.data().count,
      totalPosts: postsCount.data().count,
      totalProducts: productsCount.data().count,
      totalOrders: ordersCount.data().count,
      totalRevenue,
      pendingReports: reportsCount.data().count
    };
  },

  /**
   * Fetch all users with pagination (simplified).
   */
  async getAllUsers(): Promise<UserProfile[]> {
    const snapshot = await getDocs(query(collection(db, 'users'), orderBy('createdAt', 'desc'), limit(50)));
    return snapshot.docs.map(doc => ({ uid: doc.id, ...(doc.data() as object) } as UserProfile));
  },

  /**
   * Update user role or status.
   */
  async updateUserStatus(userId: string, updates: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, updates);
  },

  /**
   * Fetch reported content.
   */
  async getReportedContent(): Promise<any[]> {
    const snapshot = await getDocs(query(collection(db, 'reports'), where('status', '==', 'pending'), orderBy('createdAt', 'desc')));
    return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) }));
  },

  /**
   * Resolve a report.
   */
  async resolveReport(reportId: string, action: 'dismiss' | 'delete_content' | 'block_user'): Promise<void> {
    const reportRef = doc(db, 'reports', reportId);
    const reportSnap = await getDoc(reportRef);
    
    if (reportSnap.exists()) {
      const report = reportSnap.data();
      
      if (action === 'delete_content' && report.type === 'post') {
        await deleteDoc(doc(db, 'posts', report.targetId));
      } else if (action === 'block_user') {
        await updateDoc(doc(db, 'users', report.targetId), { role: 'blocked' });
      }

      await updateDoc(reportRef, { status: 'resolved', resolvedAt: new Date().toISOString() });
    }
  },

  /**
   * Manage trending products.
   */
  async toggleTrendingProduct(productId: string, isTrending: boolean): Promise<void> {
    const productRef = doc(db, 'products', productId);
    await updateDoc(productRef, { trending: isTrending });
  }
};
