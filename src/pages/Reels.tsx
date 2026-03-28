import { useState, useEffect, useRef } from 'react';
import { Heart, MessageCircle, Share2, Music, UserPlus, MoreVertical } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, where, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { Post } from '../types';
import { cn } from '../lib/utils';

export default function Reels() {
  const [reels, setReels] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeIndex, setActiveIndex] = useState(0);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      where('type', '==', 'video'),
      orderBy('createdAt', 'desc'),
      limit(10)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const reelsData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post));
      setReels(reelsData);
      setLoading(false);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'reels');
    });

    return () => unsubscribe();
  }, []);

  const handleScroll = () => {
    if (containerRef.current) {
      const index = Math.round(containerRef.current.scrollTop / window.innerHeight);
      setActiveIndex(index);
    }
  };

  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center bg-black">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent"
        />
      </div>
    );
  }

  return (
    <div 
      ref={containerRef}
      onScroll={handleScroll}
      className="fixed inset-0 z-40 bg-black overflow-y-scroll snap-y snap-mandatory no-scrollbar"
    >
      {reels.length === 0 ? (
        <div className="flex h-full items-center justify-center text-gray-500">
          <p>No reels available yet.</p>
        </div>
      ) : (
        reels.map((reel, idx) => (
          <div key={reel.id} className="relative h-screen w-full snap-start overflow-hidden">
            <video
              src={reel.mediaUrl}
              className="h-full w-full object-cover"
              autoPlay={idx === activeIndex}
              loop
              muted={false}
              playsInline
            />
            
            {/* Overlay */}
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 via-transparent to-black/60" />

            {/* Right Side Actions */}
            <div className="absolute right-4 bottom-32 flex flex-col items-center gap-6 z-10">
              <div className="flex flex-col items-center gap-1">
                <div className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all cursor-pointer">
                  <Heart className="h-6 w-6 text-white" />
                </div>
                <span className="text-[10px] font-bold text-white uppercase">{reel.likesCount}</span>
              </div>

              <div className="flex flex-col items-center gap-1">
                <div className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all cursor-pointer">
                  <MessageCircle className="h-6 w-6 text-white" />
                </div>
                <span className="text-[10px] font-bold text-white uppercase">{reel.commentsCount}</span>
              </div>

              <div className="h-12 w-12 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center border border-white/20 hover:bg-white/20 transition-all cursor-pointer">
                <Share2 className="h-6 w-6 text-white" />
              </div>

              <MoreVertical className="h-6 w-6 text-white cursor-pointer" />

              <motion.div 
                animate={{ rotate: 360 }}
                transition={{ duration: 4, repeat: Infinity, ease: "linear" }}
                className="h-10 w-10 rounded-full border-2 border-white/30 p-1"
              >
                <div className="h-full w-full rounded-full bg-primary flex items-center justify-center">
                  <Music className="h-4 w-4 text-black" />
                </div>
              </motion.div>
            </div>

            {/* Bottom Info */}
            <div className="absolute left-4 bottom-24 right-20 space-y-4 z-10">
              <div className="flex items-center gap-3">
                <img 
                  src={reel.authorAvatar || `https://picsum.photos/seed/${reel.authorId}/200/200`} 
                  className="h-10 w-10 rounded-full border-2 border-primary"
                  alt={reel.authorName}
                  referrerPolicy="no-referrer"
                />
                <p className="font-bold text-white">{reel.authorName}</p>
                <button className="rounded-lg border border-white/40 px-3 py-1 text-[10px] font-bold uppercase tracking-widest text-white hover:bg-white/10 transition-all">
                  Follow
                </button>
              </div>
              
              <p className="text-sm text-white/90 line-clamp-2">{reel.content}</p>
              
              <div className="flex items-center gap-2 text-white/80">
                <Music className="h-4 w-4" />
                <p className="text-xs font-medium truncate">Original Audio • {reel.authorName}</p>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
