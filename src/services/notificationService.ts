import { 
  collection, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  updateDoc, 
  doc, 
  getDocs,
  limit,
  addDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Notification } from '../types';

export const notificationService = {
  /**
   * Listen to real-time notifications for the current user.
   */
  listenToNotifications(callback: (notifications: Notification[]) => void) {
    if (!auth.currentUser) return () => {};
    const userId = auth.currentUser.uid;

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', userId),
      orderBy('createdAt', 'desc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const notifications = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as Notification[];
      callback(notifications);
    });
  },

  /**
   * Mark a notification as read.
   */
  async markAsRead(notificationId: string): Promise<void> {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true
    });
  },

  /**
   * Mark all notifications as read.
   */
  async markAllAsRead(): Promise<void> {
    if (!auth.currentUser) return;
    const userId = auth.currentUser.uid;

    const q = query(
      collection(db, 'notifications'),
      where('userId', '==', userId),
      where('read', '==', false)
    );
    const snapshot = await getDocs(q);
    const updatePromises = snapshot.docs.map(doc => updateDoc(doc.ref, { read: true }));
    await Promise.all(updatePromises);
  },

  /**
   * Create a smart notification for a user.
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
  }
};
