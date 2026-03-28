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
  setDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile, UserSettings } from '../types';
import { aiService } from './aiService';

export const extraService = {
  /**
   * Toggle Dark Mode / Light Mode.
   */
  async toggleTheme(userId: string, isDarkMode: boolean): Promise<void> {
    const userRef = doc(db, 'users', userId);
    await updateDoc(userRef, {
      'settings.amoledMode': isDarkMode
    });

    // Apply theme to the document
    if (isDarkMode) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  },

  /**
   * Voice command navigation (Mocking Voice Command).
   */
  async handleVoiceCommand(command: string): Promise<string> {
    // In a real app, we'd use the Web Speech API
    const response = await aiService.generateCaption(`Handle this voice command for social media navigation: ${command}. Return only the route name (e.g., /home, /profile, /shop).`);
    return response.trim();
  },

  /**
   * Generate a QR code for profile sharing (Mocking QR Code).
   */
  generateProfileQRCode(userId: string): string {
    // In a real app, we'd use a library like qrcode.react
    return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=https://khojai.app/profile/${userId}`;
  },

  /**
   * Deep linking (Open post via link).
   */
  getDeepLink(postId: string): string {
    return `https://khojai.app/post/${postId}`;
  },

  /**
   * Multiple account switch (Mocking Account Switch).
   */
  async switchAccount(userId: string): Promise<void> {
    // In a real app, we'd handle Firebase Auth session switching
    localStorage.setItem('active_user_id', userId);
    window.location.reload();
  }
};
