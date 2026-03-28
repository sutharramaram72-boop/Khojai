import { 
  collection, 
  addDoc, 
  onSnapshot, 
  query, 
  where, 
  orderBy, 
  limit, 
  updateDoc, 
  doc, 
  deleteDoc,
  getDoc,
  serverTimestamp,
  increment,
  arrayUnion
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { UserProfile, Notification } from '../types';
import { socialService } from './socialService';

export const liveService = {
  /**
   * Start a live stream (Go Live).
   */
  async startLiveStream(title: string, isMultiGuest: boolean = false): Promise<string> {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const userId = auth.currentUser.uid;

    const liveRef = collection(db, 'live_streams');
    const docRef = await addDoc(liveRef, {
      hostId: userId,
      hostName: auth.currentUser.displayName,
      hostPhoto: auth.currentUser.photoURL,
      title,
      isMultiGuest,
      guests: [],
      viewerCount: 0,
      status: 'live',
      createdAt: new Date().toISOString()
    });

    // Notify followers
    const userRef = doc(db, 'users', userId);
    const userSnap = await getDoc(userRef);
    if (userSnap.exists()) {
      const followers = (userSnap.data() as UserProfile).followersCount || 0;
      // In a real app, we'd loop through followers and notify them
    }

    return docRef.id;
  },

  /**
   * Join a live stream as a viewer.
   */
  async joinLiveStream(streamId: string): Promise<void> {
    const streamRef = doc(db, 'live_streams', streamId);
    await updateDoc(streamRef, {
      viewerCount: increment(1)
    });
  },

  /**
   * Leave a live stream as a viewer.
   */
  async leaveLiveStream(streamId: string): Promise<void> {
    const streamRef = doc(db, 'live_streams', streamId);
    await updateDoc(streamRef, {
      viewerCount: increment(-1)
    });
  },

  /**
   * End a live stream.
   */
  async endLiveStream(streamId: string): Promise<void> {
    const streamRef = doc(db, 'live_streams', streamId);
    await updateDoc(streamRef, {
      status: 'ended',
      endedAt: new Date().toISOString()
    });
  },

  /**
   * Add a guest to a multi-guest live stream.
   */
  async addGuest(streamId: string, guestId: string): Promise<void> {
    const streamRef = doc(db, 'live_streams', streamId);
    await updateDoc(streamRef, {
      guests: arrayUnion(guestId)
    });
  },

  /**
   * Listen to real-time live stream updates.
   */
  listenToLiveStream(streamId: string, callback: (stream: any) => void) {
    const streamRef = doc(db, 'live_streams', streamId);
    return onSnapshot(streamRef, (snapshot) => {
      if (snapshot.exists()) {
        callback({ id: snapshot.id, ...snapshot.data() });
      }
    });
  }
};
