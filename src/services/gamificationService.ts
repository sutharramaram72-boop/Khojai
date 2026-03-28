import { 
  doc, 
  getDoc, 
  updateDoc, 
  increment, 
  arrayUnion, 
  getDocs,
  collection,
  query,
  orderBy,
  limit
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile } from '../types';
import { socialService } from './socialService';

export const gamificationService = {
  /**
   * Check and award daily login reward.
   */
  async checkDailyReward(userId: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data() as UserProfile;
      const lastLogin = new Date(userData.lastLogin || 0);
      const today = new Date();

      if (lastLogin.toDateString() !== today.toDateString()) {
        // Award daily reward: 50 XP
        await socialService.addXP(userId, 50);
        await socialService.createNotification(userId, 'system', 'Daily Reward!', "You've earned 50 XP for logging in today.");
        
        // Update last login
        await updateDoc(userRef, {
          lastLogin: today.toISOString()
        });
      }
    }
  },

  /**
   * Award a badge to a user.
   */
  async awardBadge(userId: string, badge: string): Promise<void> {
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);

    if (userSnap.exists()) {
      const userData = userSnap.data() as UserProfile;
      const badges = userData.badges || [];
      if (!badges.includes(badge)) {
        await updateDoc(userRef, {
          badges: arrayUnion(badge)
        });
        await socialService.createNotification(userId, 'system', 'New Badge!', `Congratulations! You've earned the ${badge} badge.`);
      }
    }
  },

  /**
   * Fetch top creators for the leaderboard.
   */
  async getLeaderboard(): Promise<UserProfile[]> {
    const usersRef = collection(db, 'users');
    const q = query(
      usersRef,
      orderBy('followersCount', 'desc'),
      limit(10)
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map(doc => ({ uid: doc.id, ...doc.data() })) as UserProfile[];
  },

  /**
   * Track screen time and award XP for engagement.
   */
  async trackScreenTime(userId: string, minutes: number): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      screenTime: increment(minutes)
    });

    // Award 10 XP for every 10 minutes of screen time
    if (minutes >= 10) {
      await socialService.addXP(userId, Math.floor(minutes / 10) * 10);
    }
  }
};
