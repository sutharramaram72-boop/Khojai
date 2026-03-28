import { 
  collection, 
  getDocs, 
  query, 
  where, 
  orderBy, 
  limit, 
  doc, 
  getDoc, 
  increment, 
  updateDoc, 
  arrayUnion
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Post, UserProfile } from '../types';
import { aiService } from './aiService';

export const aiFeedService = {
  /**
   * Track user behavior (watch time, clicks, likes) to train the AI Feed Algorithm.
   */
  async trackBehavior(userId: string, postId: string, behavior: 'view' | 'click' | 'like' | 'share', duration?: number): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);

    if (postSnap.exists()) {
      const post = postSnap.data() as Post;
      const tags = post.tags || [];

      // Update user interests based on post tags
      if (tags.length > 0) {
        await updateDoc(userRef, {
          interests: arrayUnion(...tags.slice(0, 3))
        });
      }

      // Update post engagement metrics
      if (behavior === 'view') {
        await updateDoc(postRef, {
          viewsCount: increment(1)
        });
      } else if (behavior === 'click') {
        await updateDoc(postRef, {
          clicksCount: increment(1)
        });
      }
    }
  },

  /**
   * Fetch a personalized "For You" feed using AI recommendations.
   */
  async getForYouFeed(userId: string): Promise<Post[]> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const interests = userSnap.exists() ? (userSnap.data() as UserProfile).interests || [] : [];

    // AI Logic: Combine user interests with trending content
    const postsRef = collection(db, 'posts');
    let q;

    if (interests.length > 0) {
      // Fetch posts matching user interests
      q = query(
        postsRef,
        where('tags', 'array-contains-any', interests.slice(0, 10)),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
    } else {
      // Fallback: Fetch trending content
      q = query(
        postsRef,
        where('status', '==', 'published'),
        orderBy('likesCount', 'desc'),
        limit(20)
      );
    }

    const snapshot = await getDocs(q);
    const posts = snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as Post));

    // AI Re-ranking: Use Gemini to re-rank posts based on user profile (Mocking AI Re-ranking)
    // In a real app, we'd send the list of posts and user profile to Gemini for ranking
    return posts.sort((a, b) => (b.likesCount || 0) - (a.likesCount || 0));
  },

  /**
   * Viral boost system (top content auto push).
   */
  async viralBoost(): Promise<void> {
    const postsRef = collection(db, 'posts');
    const q = query(
      postsRef,
      where('status', '==', 'published'),
      where('likesCount', '>', 1000), // Viral threshold
      orderBy('likesCount', 'desc'),
      limit(10)
    );
    const snapshot = await getDocs(q);
    
    // In a real app, we'd mark these for the "Viral" section or boost their visibility
    const boostPromises = snapshot.docs.map(doc => updateDoc(doc.ref, { isViral: true }));
    await Promise.all(boostPromises);
  }
};
