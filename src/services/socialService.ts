import { 
  collection, 
  doc, 
  updateDoc, 
  increment, 
  arrayUnion, 
  arrayRemove, 
  getDoc, 
  setDoc, 
  addDoc, 
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile, Post, Notification } from '../types';

export const socialService = {
  /**
   * Follow or unfollow a user.
   */
  async toggleFollow(targetUserId: string, isFollowing: boolean): Promise<void> {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const currentUserId = auth.currentUser.uid;

    const currentUserRef = doc(db, 'users', currentUserId);
    const targetUserRef = doc(db, 'users', targetUserId);

    if (isFollowing) {
      // Unfollow
      await updateDoc(currentUserRef, {
        followingCount: increment(-1)
      });
      await updateDoc(targetUserRef, {
        followersCount: increment(-1)
      });
    } else {
      // Follow
      await updateDoc(currentUserRef, {
        followingCount: increment(1)
      });
      await updateDoc(targetUserRef, {
        followersCount: increment(1)
      });

      // Create notification
      await this.createNotification(targetUserId, 'follow', 'New Follower', `${auth.currentUser.displayName} started following you.`);
    }
  },

  /**
   * Like or unlike a post.
   */
  async toggleLike(postId: string, authorId: string, isLiked: boolean): Promise<void> {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const postRef = doc(db, 'posts', postId);

    if (isLiked) {
      // Unlike
      await updateDoc(postRef, {
        likesCount: increment(-1)
      });
    } else {
      // Like
      await updateDoc(postRef, {
        likesCount: increment(1)
      });

      // Create notification if not own post
      if (authorId !== auth.currentUser.uid) {
        await this.createNotification(authorId, 'like', 'New Like', `${auth.currentUser.displayName} liked your post.`);
      }

      // Reward XP for liking (gamification)
      await this.addXP(auth.currentUser.uid, 5);
    }
  },

  /**
   * Add XP to a user and handle level-ups.
   */
  async addXP(userId: string, amount: number): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data() as UserProfile;
      const newXP = (userData.xp || 0) + amount;
      const currentLevel = userData.level || 1;
      const nextLevelXP = currentLevel * 1000;

      if (newXP >= nextLevelXP) {
        // Level up!
        await updateDoc(userRef, {
          xp: newXP - nextLevelXP,
          level: increment(1),
          trustScore: increment(1) // Reward trust score for activity
        });
        await this.createNotification(userId, 'system', 'Level Up!', `Congratulations! You've reached Level ${currentLevel + 1}.`);
      } else {
        await updateDoc(userRef, {
          xp: newXP
        });
      }
    }
  },

  /**
   * Create an in-app notification.
   */
  async createNotification(userId: string, type: Notification['type'], title: string, body: string, data?: any): Promise<void> {
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      userId,
      type,
      title,
      body,
      data: data || {},
      read: false,
      createdAt: new Date().toISOString()
    });
  },

  /**
   * Fetch personalized feed based on user interests (AI-Powered Feed Algorithm).
   */
  async getPersonalizedFeed(userId: string): Promise<Post[]> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    const interests = userSnap.exists() ? (userSnap.data() as UserProfile).interests || [] : [];

    // Simple algorithm: Fetch posts matching user interests, or trending posts
    const postsRef = collection(db, 'posts');
    let q;
    
    if (interests.length > 0) {
      q = query(
        postsRef,
        where('tags', 'array-contains-any', interests.slice(0, 10)),
        where('status', '==', 'published'),
        orderBy('createdAt', 'desc'),
        limit(20)
      );
    } else {
      q = query(
        postsRef,
        where('status', '==', 'published'),
        orderBy('likesCount', 'desc'),
        limit(20)
      );
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({ id: doc.id, ...(doc.data() as object) } as Post));
  }
};
