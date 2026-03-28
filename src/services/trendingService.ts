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

export const trendingService = {
  /**
   * Fetch trending reels, hashtags, and creators.
   */
  async getTrendingContent(): Promise<{ reels: Post[]; hashtags: string[]; creators: UserProfile[] }> {
    const postsRef = collection(db, 'posts');
    const usersRef = collection(db, 'users');

    const [reelsSnap, hashtagsSnap, creatorsSnap] = await Promise.all([
      getDocs(query(postsRef, where('type', '==', 'video'), orderBy('likesCount', 'desc'), limit(10))),
      getDocs(query(postsRef, orderBy('likesCount', 'desc'), limit(50))),
      getDocs(query(usersRef, orderBy('followersCount', 'desc'), limit(10)))
    ]);

    const reels = reelsSnap.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as Post));
    const creators = creatorsSnap.docs.map(doc => ({ uid: doc.id, ...(doc.data() as object) } as UserProfile));

    // Extract trending hashtags from posts
    const allHashtags = hashtagsSnap.docs.flatMap(doc => (doc.data() as Post).hashtags || []);
    const hashtagCounts = allHashtags.reduce((acc, tag) => {
      acc[tag] = (acc[tag] || 0) + 1;
      return acc;
    }, {} as { [tag: string]: number });

    const trendingHashtags = Object.entries(hashtagCounts)
      .sort((a, b) => b[1] - a[1])
      .map(entry => entry[0])
      .slice(0, 10);

    return { reels, hashtags: trendingHashtags, creators };
  },

  /**
   * Explore page with AI recommendations.
   */
  async getExploreContent(userId: string): Promise<Post[]> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const interests = userSnap.exists() ? (userSnap.data() as UserProfile).interests || [] : [];

    const postsRef = collection(db, 'posts');
    let q;

    if (interests.length > 0) {
      // AI Logic: Fetch posts matching user interests but from new creators
      q = query(
        postsRef,
        where('tags', 'array-contains-any', interests.slice(0, 10)),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(30)
      );
    } else {
      // Fallback: Fetch diverse trending content
      q = query(
        postsRef,
        where('status', '==', 'published'),
        orderBy('likesCount', 'desc'),
        limit(30)
      );
    }

    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as Post));
  }
};
