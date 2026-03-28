import { useState, useRef, useEffect } from 'react';
import { Play, Pause, SkipBack, SkipForward, Music, Minimize2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { db, OperationType, handleFirestoreError } from '../firebase';
import { collection, query, limit, onSnapshot } from 'firebase/firestore';
import { MusicTrack } from '../types';

export default function MusicPlayer() {
  const [playlist, setPlaylist] = useState<MusicTrack[]>([]);
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTrackIdx, setCurrentTrackIdx] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isMinimized, setIsMinimized] = useState(true);
  const audioRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const q = query(collection(db, 'music'), limit(10));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const musicData = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() } as MusicTrack));
      setPlaylist(musicData);
    }, (error) => {
      handleFirestoreError(error, OperationType.LIST, 'music');
    });

    return () => unsubscribe();
  }, []);

  const currentTrack = playlist[currentTrackIdx];

  useEffect(() => {
    if (isPlaying && currentTrack) {
      audioRef.current?.play().catch(e => console.error("Audio Play Error:", e));
    } else {
      audioRef.current?.pause();
    }
  }, [isPlaying, currentTrackIdx, currentTrack]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      const p = (audioRef.current.currentTime / audioRef.current.duration) * 100;
      setProgress(p || 0);
    }
  };

  const handleNext = () => {
    if (playlist.length === 0) return;
    setCurrentTrackIdx((prev) => (prev + 1) % playlist.length);
  };

  const handlePrev = () => {
    if (playlist.length === 0) return;
    setCurrentTrackIdx((prev) => (prev - 1 + playlist.length) % playlist.length);
  };

  if (playlist.length === 0) return null;

  return (
    <div className="fixed bottom-24 left-4 right-4 z-[90] pointer-events-none">
      <audio 
        ref={audioRef} 
        src={currentTrack.url} 
        onTimeUpdate={handleTimeUpdate}
        onEnded={handleNext}
      />
      
      <AnimatePresence>
        {isMinimized ? (
          <motion.button
            layoutId="player"
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={() => setIsMinimized(false)}
            className="pointer-events-auto ml-auto h-12 w-12 rounded-full bg-primary flex items-center justify-center shadow-2xl shadow-primary/40 border border-white/20"
          >
            <Music className={`h-5 w-5 text-black ${isPlaying ? 'animate-bounce' : ''}`} />
          </motion.button>
        ) : (
          <motion.div
            layoutId="player"
            initial={{ y: 100, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 100, opacity: 0 }}
            className="pointer-events-auto glass-card !p-4 flex items-center gap-4 shadow-2xl border-primary/20"
          >
            <div className="relative h-12 w-12 rounded-lg overflow-hidden flex-shrink-0">
              <img src={currentTrack.cover} className="h-full w-full object-cover" alt="Cover" />
              {isPlaying && (
                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                  <div className="flex gap-0.5 items-end h-4">
                    <div className="w-1 bg-primary animate-[music-bar_0.5s_ease-in-out_infinite]" />
                    <div className="w-1 bg-primary animate-[music-bar_0.7s_ease-in-out_infinite]" />
                    <div className="w-1 bg-primary animate-[music-bar_0.6s_ease-in-out_infinite]" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex-1 min-w-0">
              <h4 className="text-xs font-bold truncate">{currentTrack.title}</h4>
              <p className="text-[10px] text-gray-400 truncate">{currentTrack.artist}</p>
              <div className="mt-2 h-1 w-full bg-white/10 rounded-full overflow-hidden">
                <div 
                  className="h-full bg-primary transition-all duration-300" 
                  style={{ width: `${progress}%` }} 
                />
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button onClick={handlePrev} className="text-gray-400 hover:text-white transition-colors">
                <SkipBack className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setIsPlaying(!isPlaying)}
                className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-black hover:scale-110 transition-transform"
              >
                {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
              </button>
              <button onClick={handleNext} className="text-gray-400 hover:text-white transition-colors">
                <SkipForward className="h-4 w-4" />
              </button>
              <button 
                onClick={() => setIsMinimized(true)}
                className="ml-2 text-gray-600 hover:text-white transition-colors"
              >
                <Minimize2 className="h-4 w-4" />
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <style>{`
        @keyframes music-bar {
          0%, 100% { height: 4px; }
          50% { height: 12px; }
        }
      `}</style>
    </div>
  );
}
