import { 
  doc, 
  getDoc, 
  updateDoc, 
  increment, 
  addDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  orderBy,
  limit,
  arrayUnion
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile, Post, Notification } from '../types';
import { socialService } from './socialService';

export const monetizationService = {
  /**
   * Share ad revenue with a creator based on post views.
   */
  async shareAdRevenue(postId: string, creatorId: string, views: number): Promise<void> {
    const revenuePerView = 0.05; // ₹0.05 per view
    const totalRevenue = views * revenuePerView;

    const creatorRef = doc(db, 'users', creatorId);
    await updateDoc(creatorRef, {
      earnings: increment(totalRevenue)
    });

    await socialService.createNotification(creatorId, 'gift', 'Ad Revenue Share!', `You've earned ₹${totalRevenue.toFixed(2)} from your post views.`);
  },

  /**
   * Subscribe to a creator (Paid Fans System).
   */
  async subscribeToCreator(creatorId: string, amount: number): Promise<void> {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const userId = auth.currentUser.uid;

    // Simulate payment success
    const creatorRef = doc(db, 'users', creatorId);
    await updateDoc(creatorRef, {
      earnings: increment(amount * 0.8) // 80% to creator, 20% platform fee
    });

    await socialService.createNotification(creatorId, 'gift', 'New Subscriber!', `${auth.currentUser.displayName} subscribed to your profile.`);
    await socialService.createNotification(userId, 'system', 'Subscription Successful!', `You've successfully subscribed to the creator.`);
  },

  /**
   * Send a live gift or coins to a creator.
   */
  async sendLiveGift(creatorId: string, giftName: string, coinValue: number): Promise<void> {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const userId = auth.currentUser.uid;

    const creatorRef = doc(db, 'users', creatorId);
    await updateDoc(creatorRef, {
      earnings: increment(coinValue)
    });

    await socialService.createNotification(creatorId, 'gift', 'New Gift!', `${auth.currentUser.displayName} sent you a ${giftName} during your live stream.`);
  },

  /**
   * Tag an affiliate product in a post.
   */
  async tagAffiliateProduct(postId: string, productId: string): Promise<void> {
    const postRef = doc(db, 'posts', postId);
    await updateDoc(postRef, {
      taggedProducts: arrayUnion(productId)
    });
  }
};
