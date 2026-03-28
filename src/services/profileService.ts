import { 
  doc, 
  getDoc, 
  updateDoc, 
  increment, 
  arrayUnion, 
  arrayRemove, 
  getDocs,
  collection,
  addDoc,
  query,
  where,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile, Post } from '../types';

export const profileService = {
  /**
   * Update user profile with bio, links, and badges.
   */
  async updateProfile(userId: string, profile: Partial<UserProfile>): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      ...profile,
      updatedAt: new Date().toISOString()
    });
  },

  /**
   * Request profile verification (Verification System).
   */
  async requestVerification(userId: string, reason: string): Promise<void> {
    const verificationRef = collection(db, 'verification_requests');
    await addDoc(verificationRef, {
      userId,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString()
    });
  },

  /**
   * Add a link to the user profile.
   */
  async addLink(userId: string, title: string, url: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      links: arrayUnion({ title, url })
    });
  },

  /**
   * Remove a link from the user profile.
   */
  async removeLink(userId: string, link: { title: string; url: string }): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      links: arrayRemove(link)
    });
  },

  /**
   * Fetch user posts, reels, and shop items for the profile.
   */
  async getUserContent(userId: string): Promise<{ posts: Post[]; reels: Post[]; products: any[] }> {
    const postsRef = collection(db, 'posts');
    const productsRef = collection(db, 'products');

    const [postsSnap, reelsSnap, productsSnap] = await Promise.all([
      getDocs(query(postsRef, where('authorId', '==', userId), where('type', '==', 'image'), orderBy('createdAt', 'desc'))),
      getDocs(query(postsRef, where('authorId', '==', userId), where('type', '==', 'video'), orderBy('createdAt', 'desc'))),
      getDocs(query(productsRef, where('sellerId', '==', userId), orderBy('createdAt', 'desc')))
    ]);

    const posts = postsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[];
    const reels = reelsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Post[];
    const products = productsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() }));

    return { posts, reels, products };
  }
};
