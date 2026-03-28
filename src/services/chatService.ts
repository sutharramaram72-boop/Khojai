import { 
  collection, 
  doc, 
  addDoc, 
  updateDoc, 
  query, 
  where, 
  orderBy, 
  onSnapshot, 
  serverTimestamp,
  getDocs,
  limit,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { ChatMessage } from '../types';

export const chatService = {
  /**
   * Send a message with optional media and disappearing settings.
   */
  async sendMessage(receiverId: string, text: string, mediaUrl?: string, type: ChatMessage['type'] = 'text', isDisappearing: boolean = false): Promise<void> {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const senderId = auth.currentUser.uid;

    const messagesRef = collection(db, 'chats');
    const expiresAt = isDisappearing ? new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString() : null; // 24 hours

    await addDoc(messagesRef, {
      senderId,
      receiverId,
      text,
      mediaUrl: mediaUrl || '',
      type,
      reactions: {},
      isDisappearing,
      expiresAt,
      createdAt: new Date().toISOString()
    });
  },

  /**
   * Add a reaction to a message.
   */
  async addReaction(messageId: string, emoji: string): Promise<void> {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const userId = auth.currentUser.uid;

    const messageRef = doc(db, 'chats', messageId);
    const messageSnap = await getDocs(query(collection(db, 'chats'), where('id', '==', messageId)));
    
    // In a real app, we'd use arrayUnion on a specific emoji key in the reactions map
    // Firestore doesn't support dynamic map key arrayUnion easily, so we'd fetch and update
    const snap = await getDocs(query(collection(db, 'chats'), where('id', '==', messageId)));
    if (!snap.empty) {
      const data = snap.docs[0].data() as ChatMessage;
      const reactions = data.reactions || {};
      const userList = reactions[emoji] || [];
      if (!userList.includes(userId)) {
        reactions[emoji] = [...userList, userId];
        await updateDoc(doc(db, 'chats', snap.docs[0].id), { reactions });
      }
    }
  },

  /**
   * Fetch messages between two users in real-time.
   */
  listenToMessages(otherUserId: string, callback: (messages: ChatMessage[]) => void) {
    if (!auth.currentUser) return () => {};
    const currentUserId = auth.currentUser.uid;

    const messagesRef = collection(db, 'chats');
    const q = query(
      messagesRef,
      where('senderId', 'in', [currentUserId, otherUserId]),
      where('receiverId', 'in', [currentUserId, otherUserId]),
      orderBy('createdAt', 'asc'),
      limit(50)
    );

    return onSnapshot(q, (snapshot) => {
      const messages = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })) as ChatMessage[];
      // Filter out messages that belong to other conversations (Firestore 'in' query limitation)
      const filtered = messages.filter(m => 
        (m.senderId === currentUserId && m.receiverId === otherUserId) ||
        (m.senderId === otherUserId && m.receiverId === currentUserId)
      );
      callback(filtered);
    });
  },

  /**
   * Automatically delete expired disappearing messages (AI-Powered Cleanup).
   */
  async cleanupExpiredMessages(): Promise<void> {
    const now = new Date().toISOString();
    const q = query(
      collection(db, 'chats'),
      where('isDisappearing', '==', true),
      where('expiresAt', '<=', now)
    );
    const snapshot = await getDocs(q);
    const deletePromises = snapshot.docs.map(doc => deleteDoc(doc.ref));
    await Promise.all(deletePromises);
  }
};
