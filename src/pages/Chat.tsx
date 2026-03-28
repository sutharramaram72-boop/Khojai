import { useState, useEffect, useRef } from 'react';
import { Send, Image as ImageIcon, Phone, Video, MoreVertical, Search, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, addDoc, where } from 'firebase/firestore';
import { ChatMessage } from '../types';
import { cn } from '../lib/utils';

export default function Chat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    // In a real app, you'd filter by sender/receiver
    const q = query(
      collection(db, 'chats'),
      orderBy('createdAt', 'asc'),
      limit(50)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messagesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as ChatMessage));
      setMessages(messagesData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'chats');
    });

    return () => unsubscribe();
  }, []);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !auth.currentUser) return;

    try {
      const chatData = {
        senderId: auth.currentUser.uid,
        receiverId: 'system', // Mock receiver for now
        text: newMessage,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'chats'), chatData);
      setNewMessage('');
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'chats');
    }
  };

  return (
    <div className="flex flex-col h-[80vh] space-y-6">
      <header className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="relative">
            <img
              src="https://picsum.photos/seed/system/200/200"
              alt="System"
              className="h-12 w-12 rounded-full object-cover border-2 border-primary/50"
              referrerPolicy="no-referrer"
            />
            <div className="absolute bottom-0 right-0 h-3 w-3 rounded-full bg-primary border-2 border-background" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight">KhojAI Support</h1>
            <p className="text-[10px] font-bold text-primary uppercase tracking-widest">Online Now</p>
          </div>
        </div>
        <div className="flex gap-4">
          <Phone className="h-5 w-5 text-gray-400 hover:text-primary transition-colors cursor-pointer" />
          <Video className="h-5 w-5 text-gray-400 hover:text-secondary transition-colors cursor-pointer" />
          <MoreVertical className="h-5 w-5 text-gray-400 hover:text-white transition-colors cursor-pointer" />
        </div>
      </header>

      <div 
        ref={scrollRef}
        className="flex-1 overflow-y-auto space-y-4 pr-2 no-scrollbar"
      >
        {loading ? (
          <div className="flex justify-center py-20">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
              className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent"
            />
          </div>
        ) : messages.length === 0 ? (
          <div className="glass-card text-center py-20">
            <p className="text-gray-400">Start a conversation with KhojAI Support.</p>
          </div>
        ) : (
          messages.map((msg) => (
            <motion.div
              key={msg.id}
              initial={{ opacity: 0, scale: 0.9, x: msg.senderId === auth.currentUser?.uid ? 20 : -20 }}
              animate={{ opacity: 1, scale: 1, x: 0 }}
              className={cn(
                "flex max-w-[80%] flex-col gap-1",
                msg.senderId === auth.currentUser?.uid ? "ml-auto items-end" : "mr-auto items-start"
              )}
            >
              <div
                className={cn(
                  "rounded-2xl px-4 py-3 text-sm font-medium shadow-lg",
                  msg.senderId === auth.currentUser?.uid
                    ? "bg-primary text-black rounded-tr-none"
                    : "bg-white/10 text-white rounded-tl-none border border-white/10 backdrop-blur-md"
                )}
              >
                {msg.text}
              </div>
              <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">
                {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </motion.div>
          ))
        )}
      </div>

      <form 
        onSubmit={handleSendMessage}
        className="relative flex items-center gap-3"
      >
        <div className="flex h-12 w-12 items-center justify-center rounded-full bg-white/5 border border-white/10 text-gray-400 hover:text-primary transition-all cursor-pointer">
          <Plus className="h-6 w-6" />
        </div>
        <div className="relative flex-1">
          <input
            type="text"
            placeholder="Type your message..."
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            className="w-full rounded-full bg-white/5 py-4 pl-6 pr-12 text-sm font-medium outline-none border border-white/10 focus:border-primary/50 transition-all duration-300"
          />
          <button
            type="submit"
            disabled={!newMessage.trim()}
            className="absolute right-2 top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-primary text-black flex items-center justify-center disabled:opacity-50 transition-all hover:scale-110 active:scale-95"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </form>
    </div>
  );
}
