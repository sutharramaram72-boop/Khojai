import { 
  getAuth, 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword, 
  signInWithPopup, 
  GoogleAuthProvider, 
  OAuthProvider, 
  RecaptchaVerifier, 
  signInWithPhoneNumber, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc, serverTimestamp } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { UserProfile } from '../types';

export const authService = {
  /**
   * Sign in with Google.
   */
  async signInWithGoogle(): Promise<void> {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    await this.syncUserToFirestore(result.user);
  },

  /**
   * Sign in with Apple.
   */
  async signInWithApple(): Promise<void> {
    const provider = new OAuthProvider('apple.com');
    const result = await signInWithPopup(auth, provider);
    await this.syncUserToFirestore(result.user);
  },

  /**
   * Sign in with Phone Number (OTP).
   */
  async signInWithPhone(phoneNumber: string, recaptchaContainerId: string): Promise<any> {
    const recaptchaVerifier = new RecaptchaVerifier(auth, recaptchaContainerId, {
      size: 'invisible'
    });
    const confirmationResult = await signInWithPhoneNumber(auth, phoneNumber, recaptchaVerifier);
    return confirmationResult;
  },

  /**
   * Sync user data to Firestore after authentication.
   */
  async syncUserToFirestore(user: any): Promise<void> {
    const userRef = doc(db, 'users', user.uid);
    const userSnap = await getDoc(userRef);

    if (!userSnap.exists()) {
      const newProfile: UserProfile = {
        uid: user.uid,
        displayName: user.displayName || 'Anonymous',
        email: user.email || '',
        photoURL: user.photoURL || '',
        bio: '',
        role: 'user',
        trustScore: 100,
        earnings: 0,
        followersCount: 0,
        followingCount: 0,
        xp: 0,
        level: 1,
        isPrivate: false,
        isVerified: false,
        badges: [],
        links: [],
        addresses: [],
        wishlist: [],
        cart: [],
        blockedUsers: [],
        closeFriends: [],
        interests: [],
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString(),
        screenTime: 0,
        settings: {
          notifications: true,
          privacyMode: false,
          amoledMode: false,
          language: 'en'
        }
      };
      await setDoc(userRef, newProfile);
    } else {
      await updateDoc(userRef, {
        lastLogin: new Date().toISOString()
      });
    }
  },

  /**
   * Sign out the current user.
   */
  async logOut(): Promise<void> {
    await signOut(auth);
  }
};
