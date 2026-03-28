import { 
  doc, 
  getDoc, 
  updateDoc, 
  arrayUnion, 
  arrayRemove, 
  getDocs,
  collection,
  addDoc,
  query,
  where,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile } from '../types';

export const securityService = {
  /**
   * Enable or disable 2FA (Two-Factor Authentication).
   */
  async toggle2FA(userId: string, isEnabled: boolean): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      is2FAEnabled: isEnabled
    });
  },

  /**
   * Block or unblock a user.
   */
  async toggleBlock(userId: string, targetUserId: string, isBlocked: boolean): Promise<void> {
    const userRef = doc(db, 'users', userId);
    if (isBlocked) {
      await updateDoc(userRef, {
        blockedUsers: arrayRemove(targetUserId)
      });
    } else {
      await updateDoc(userRef, {
        blockedUsers: arrayUnion(targetUserId)
      });
    }
  },

  /**
   * Report a user or post for abuse.
   */
  async reportContent(userId: string, targetId: string, type: 'user' | 'post', reason: string): Promise<void> {
    const reportsRef = collection(db, 'reports');
    await addDoc(reportsRef, {
      reporterId: userId,
      targetId,
      type,
      reason,
      status: 'pending',
      createdAt: new Date().toISOString()
    });

    // If post, mark as reported for moderation
    if (type === 'post') {
      const postRef = doc(db, 'posts', targetId);
      await updateDoc(postRef, {
        status: 'reported'
      });
    }
  },

  /**
   * Set account privacy (Private vs Public).
   */
  async togglePrivacy(userId: string, isPrivate: boolean): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      isPrivate
    });
  },

  /**
   * Encrypt a message (Mocking E2E Encryption).
   */
  encryptMessage(text: string, key: string): string {
    // In a real app, we'd use a crypto library like CryptoJS or Web Crypto API
    return btoa(text + key); // Simple Base64 for mock
  },

  /**
   * Decrypt a message (Mocking E2E Decryption).
   */
  decryptMessage(encryptedText: string, key: string): string {
    const decoded = atob(encryptedText);
    return decoded.replace(key, '');
  }
};
