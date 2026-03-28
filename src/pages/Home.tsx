import { useState, useEffect } from 'react';
import { Heart, MessageCircle, Share2, Bookmark, MoreHorizontal, DollarSign, Sparkles, TrendingUp } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, orderBy, limit, onSnapshot, doc, updateDoc, increment } from 'firebase/firestore';
import { Post, Story, UserProfile } from '../types';
import { cn } from '../lib/utils';
import { auth } from '../firebase';
import { aiFeedService } from '../services/aiFeedService';
import { socialService } from '../services/socialService';

export default function Home() {
  const [posts, setPosts] = useState<Post[]>([]);
  const [stories, setStories] = useState<Story[]>([]);
  const [loading, setLoading] = useState(true);
  const [earning, setEarning] = useState<string | null>(null);
  const [user, setUser] = useState<UserProfile | null>(null);

  useEffect(() => {
    if (!auth.currentUser) return;

    // Fetch User Profile for AI Personalization
    const unsubscribeUser = onSnapshot(doc(db, 'users', auth.currentUser.uid), (doc) => {
      if (doc.exists()) {
        setUser({ uid: doc.id, ...doc.data() } as UserProfile);
      }
    });

    // Fetch Personalized Feed (AI-Powered)
    const fetchFeed = async () => {
      try {
        const feed = await aiFeedService.getForYouFeed(auth.currentUser!.uid);
        setPosts(feed);
        setLoading(false);
      } catch (error) {
        console.error("Feed Error:", error);
        // Fallback to standard feed
        const postsQuery = query(collection(db, 'posts'), orderBy('createdAt', 'desc'), limit(20));
        onSnapshot(postsQuery, (snapshot) => {
          setPosts(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Post)));
          setLoading(false);
        });
      }
    };
    fetchFeed();

    // Fetch Stories
    const storiesQuery = query(collection(db, 'stories'), orderBy('createdAt', 'desc'), limit(10));
    const unsubscribeStories = onSnapshot(storiesQuery, (snapshot) => {
      const storiesData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as Story));
      setStories(storiesData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'stories');
    });

    return () => {
      unsubscribeUser();
      unsubscribeStories();
    };
  }, []);

  const handleLike = async (postId: string, authorId: string, isLiked: boolean) => {
    if (!auth.currentUser) return;
    try {
      await socialService.toggleLike(postId, authorId, isLiked);
      // Track behavior for AI Feed
      await aiFeedService.trackBehavior(auth.currentUser.uid, postId, 'like');
    } catch (error) {
      console.error("Like Error:", error);
    }
  };

  const handleEarn = async (postId: string) => {
    if (!auth.currentUser) return;
    setEarning(postId);
    
    try {
      // Reward XP and Earnings
      await socialService.addXP(auth.currentUser.uid, 10);
      const userRef = doc(db, 'users', auth.currentUser.uid);
      await updateDoc(userRef, {
        earnings: increment(0.5) // ₹0.50 per scroll/interaction
      });
      
      // Track behavior for AI Feed
      await aiFeedService.trackBehavior(auth.currentUser.uid, postId, 'click');
      
      alert(`Congratulations! You earned ₹0.50 and 10 XP!`);
    } catch (error) {
      console.error("Earning Error:", error);
    } finally {
      setEarning(null);
    }
  };

  if (loading) {
    return (
      <div className="flex h-[60vh] items-center justify-center">
        <motion.div
          animate={{ rotate: 360 }}
          transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
          className="h-12 w-12 rounded-full border-4 border-primary border-t-transparent"
        />
      </div>
    );
  }

  return (
    <div className="space-y-8 pb-20">
      <header className="flex items-center justify-between">
        <div className="flex flex-col">
          <h1 className="text-3xl font-black tracking-tighter text-white">
            KHOJ<span className="text-primary">AI</span>
          </h1>
          {user && (
            <div className="flex items-center gap-2 mt-1">
              <div className="h-1.5 w-1.5 rounded-full bg-primary animate-pulse" />
              <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest">
                Level {user.level} • {user.xp} XP
              </p>
            </div>
          )}
        </div>
        <div className="flex gap-4">
          <div className="h-10 w-10 rounded-full bg-white/5 p-2 backdrop-blur-md border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all">
            <Heart className="h-5 w-5 text-white" />
          </div>
          <div className="h-10 w-10 rounded-full bg-white/5 p-2 backdrop-blur-md border border-white/10 flex items-center justify-center cursor-pointer hover:bg-white/10 transition-all">
            <MessageCircle className="h-5 w-5 text-white" />
          </div>
        </div>
      </header>

      {/* AI Feed Toggle */}
      <div className="flex items-center gap-3 glass-card py-3 px-4 border-primary/20">
        <Sparkles className="h-4 w-4 text-primary animate-pulse" />
        <p className="text-xs font-bold uppercase tracking-widest text-primary">AI Personalized Feed Active</p>
        <div className="ml-auto flex items-center gap-2">
          <TrendingUp className="h-3 w-3 text-secondary" />
          <span className="text-[10px] font-bold text-gray-500">Trending Now</span>
        </div>
      </div>

      {/* Stories / Reels Row */}
      <div className="flex gap-4 overflow-x-auto pb-4 no-scrollbar">
        <motion.div
          whileHover={{ scale: 1.05 }}
          className="flex-shrink-0 w-20 h-20 rounded-full p-1 border-2 border-dashed border-gray-600 flex items-center justify-center cursor-pointer"
        >
          <div className="w-16 h-16 rounded-full bg-white/5 flex items-center justify-center">
            <span className="text-2xl text-gray-400">+</span>
          </div>
          <p className="absolute -bottom-6 text-[10px] font-bold text-gray-500 uppercase tracking-widest">Your Story</p>
        </motion.div>
        {stories.map((story) => (
          <motion.div
            key={story.id}
            whileHover={{ scale: 1.05 }}
            className="flex-shrink-0 w-20 h-20 rounded-full p-1 bg-gradient-to-tr from-primary to-secondary"
          >
            <div className="w-full h-full rounded-full bg-background p-1">
              <img
                src={story.userAvatar}
                alt={story.userName}
                className="w-full h-full rounded-full object-cover"
                referrerPolicy="no-referrer"
              />
            </div>
            <p className="text-[10px] text-center mt-1 font-bold text-gray-400 truncate w-20">
              {story.userName}
            </p>
          </motion.div>
        ))}
      </div>

      {/* Feed */}
      <div className="space-y-8">
        {posts.length === 0 ? (
          <div className="glass-card text-center py-20">
            <p className="text-gray-400">No posts yet. Start by creating one!</p>
          </div>
        ) : (
          posts.map((post) => (
            <motion.article
              key={post.id}
              initial={{ opacity: 0, scale: 0.95 }}
              whileInView={{ opacity: 1, scale: 1 }}
              viewport={{ once: true }}
              className="glass-card overflow-hidden !p-0"
            >
              <div className="flex items-center justify-between p-4">
                <div className="flex items-center gap-3">
                  <img
                    src={post.authorPhoto || `https://picsum.photos/seed/${post.authorId}/200/200`}
                    alt={post.authorName}
                    className="h-10 w-10 rounded-full object-cover border border-white/10"
                    referrerPolicy="no-referrer"
                  />
                  <div>
                    <h3 className="font-bold text-sm flex items-center gap-1">
                      {post.authorName}
                      {post.isViral && <Sparkles className="h-3 w-3 text-primary" />}
                    </h3>
                    <p className="text-xs text-gray-400">AI Personalized • {new Date(post.createdAt).toLocaleDateString()}</p>
                  </div>
                </div>
                <MoreHorizontal className="h-5 w-5 text-gray-400 cursor-pointer" />
              </div>

              {post.mediaUrl && (
                <div className="relative aspect-square bg-black/20">
                  {post.type === 'video' ? (
                    <video
                      src={post.mediaUrl}
                      className="h-full w-full object-cover"
                      autoPlay
                      muted
                      loop
                    />
                  ) : (
                    <img
                      src={post.mediaUrl}
                      alt="Post content"
                      className="h-full w-full object-cover"
                      referrerPolicy="no-referrer"
                    />
                  )}
                  {post.isViral && (
                    <div className="absolute top-4 left-4 bg-primary/80 backdrop-blur-md px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-widest text-black flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Viral
                    </div>
                  )}
                </div>
              )}

              <div className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <Heart 
                      onClick={() => handleLike(post.id!, post.authorId, false)}
                      className="h-6 w-6 hover:text-red-500 cursor-pointer transition-colors" 
                    />
                    <MessageCircle className="h-6 w-6 hover:text-primary cursor-pointer transition-colors" />
                    <Share2 className="h-6 w-6 hover:text-secondary cursor-pointer transition-colors" />
                    <button
                      onClick={() => handleEarn(post.id!)}
                      disabled={earning === post.id}
                      className={cn(
                        "flex items-center gap-1 rounded-full px-3 py-1 text-[10px] font-bold uppercase tracking-widest transition-all",
                        earning === post.id ? "bg-primary/20 text-primary animate-pulse" : "bg-primary/10 text-primary hover:bg-primary/20"
                      )}
                    >
                      <DollarSign className="h-3 w-3" />
                      Earn
                    </button>
                  </div>
                  <Bookmark className="h-6 w-6 hover:text-primary cursor-pointer transition-colors" />
                </div>

                <div className="space-y-1">
                  <p className="text-sm font-bold">{post.likesCount.toLocaleString()} likes</p>
                  <p className="text-sm">
                    <span className="font-bold mr-2">{post.authorName}</span>
                    {post.content}
                  </p>
                  {post.hashtags && post.hashtags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {post.hashtags.map(tag => (
                        <span key={tag} className="text-[10px] font-bold text-primary hover:underline cursor-pointer">
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </motion.article>
          ))
        )}
      </div>
    </div>
  );
}

