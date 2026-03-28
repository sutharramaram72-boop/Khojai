import { useState, useRef } from 'react';
import { Sparkles, Image as ImageIcon, Video, Type, Send, Wand2, Loader2, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { GoogleGenAI } from "@google/genai";
import { db, auth, OperationType, handleFirestoreError } from '../firebase';
import { collection, addDoc } from 'firebase/firestore';
import { cn } from '../lib/utils';

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export default function Create() {
  const [activeTab, setActiveTab] = useState<'post' | 'ai'>('post');
  const [prompt, setPrompt] = useState('');
  const [loading, setLoading] = useState(false);
  const [aiResponse, setAiResponse] = useState<string | null>(null);
  const [selectedMedia, setSelectedMedia] = useState<{ url: string; type: 'image' | 'video' } | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const url = URL.createObjectURL(file);
      const type = file.type.startsWith('video') ? 'video' : 'image';
      setSelectedMedia({ url, type });
    }
  };

  const handleAiGenerate = async () => {
    if (!prompt.trim()) return;
    setLoading(true);
    setAiResponse(null);

    try {
      const result = await ai.models.generateContent({
        model: "gemini-3-flash-preview",
        contents: [{ parts: [{ text: `Create a viral, engaging social media caption for: ${prompt}` }] }],
      });
      setAiResponse(result.text);
    } catch (error) {
      console.error("AI Generation Error:", error);
      setAiResponse("Failed to generate content. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleCreatePost = async () => {
    if (!auth.currentUser) return;
    if (!prompt.trim() && !selectedMedia) return;
    
    setLoading(true);

    try {
      const postData = {
        authorId: auth.currentUser.uid,
        authorName: auth.currentUser.displayName || 'Anonymous',
        authorPhoto: auth.currentUser.photoURL || '',
        type: selectedMedia?.type || 'text',
        content: prompt,
        mediaUrl: selectedMedia?.url || '',
        likesCount: 0,
        commentsCount: 0,
        createdAt: new Date().toISOString(),
      };

      await addDoc(collection(db, 'posts'), postData);
      alert('Post created successfully!');
      setPrompt('');
      setAiResponse(null);
      setSelectedMedia(null);
    } catch (error) {
      handleFirestoreError(error, OperationType.CREATE, 'posts');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <header className="flex items-center justify-between">
        <h1 className="text-3xl font-black tracking-tighter text-white">
          CREATE<span className="text-primary">AI</span>
        </h1>
        <div className="flex rounded-full bg-white/5 p-1 border border-white/10">
          <button
            onClick={() => setActiveTab('post')}
            className={cn(
              "rounded-full px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-300",
              activeTab === 'post' ? "bg-primary text-black" : "text-gray-400"
            )}
          >
            Post
          </button>
          <button
            onClick={() => setActiveTab('ai')}
            className={cn(
              "rounded-full px-6 py-2 text-xs font-bold uppercase tracking-widest transition-all duration-300",
              activeTab === 'ai' ? "bg-primary text-black" : "text-gray-400"
            )}
          >
            AI Assistant
          </button>
        </div>
      </header>

      <AnimatePresence mode="wait">
        {activeTab === 'post' ? (
          <motion.div
            key="post"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="glass-card space-y-4">
              <textarea
                placeholder="What's on your mind? (AI can help you write this)"
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full min-h-[150px] bg-transparent text-lg font-medium outline-none resize-none placeholder:text-gray-600"
              />

              {selectedMedia && (
                <div className="relative rounded-2xl overflow-hidden border border-white/10">
                  {selectedMedia.type === 'image' ? (
                    <img src={selectedMedia.url} className="w-full h-auto" alt="Selected" />
                  ) : (
                    <video src={selectedMedia.url} className="w-full h-auto" controls />
                  )}
                  <button 
                    onClick={() => setSelectedMedia(null)}
                    className="absolute top-2 right-2 p-2 rounded-full bg-black/60 backdrop-blur-md text-white hover:text-primary transition-colors"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              )}
              
              <div className="flex items-center gap-4 border-t border-white/10 pt-4">
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  className="hidden" 
                  accept="image/*,video/*"
                  onChange={handleFileSelect}
                />
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-xs font-bold hover:bg-white/10 transition-all"
                >
                  <ImageIcon className="h-4 w-4 text-primary" />
                  Image
                </button>
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-xs font-bold hover:bg-white/10 transition-all"
                >
                  <Video className="h-4 w-4 text-secondary" />
                  Video
                </button>
                <button className="flex items-center gap-2 rounded-xl bg-white/5 px-4 py-2 text-xs font-bold hover:bg-white/10 transition-all">
                  <Type className="h-4 w-4 text-white" />
                  Text
                </button>
              </div>
            </div>

            <button
              disabled={loading || (!prompt.trim() && !selectedMedia)}
              onClick={handleCreatePost}
              className="btn-primary w-full flex items-center justify-center gap-2 disabled:opacity-50 disabled:scale-100"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
              Post Now
            </button>
          </motion.div>
        ) : (
          <motion.div
            key="ai"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6"
          >
            <div className="glass-card space-y-4">
              <div className="flex items-center gap-2 text-primary">
                <Sparkles className="h-5 w-5" />
                <h2 className="text-sm font-bold uppercase tracking-widest">AI Super Intelligence</h2>
              </div>
              
              <textarea
                placeholder="Ask AI to write a caption, product description, or business idea..."
                value={prompt}
                onChange={(e) => setPrompt(e.target.value)}
                className="w-full min-h-[100px] bg-transparent text-lg font-medium outline-none resize-none placeholder:text-gray-600"
              />

              <button
                disabled={loading || !prompt.trim()}
                onClick={handleAiGenerate}
                className="flex items-center gap-2 rounded-xl bg-primary/10 px-6 py-3 text-xs font-bold text-primary hover:bg-primary/20 transition-all disabled:opacity-50"
              >
                {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Wand2 className="h-4 w-4" />}
                Generate with AI
              </button>
            </div>

            {aiResponse && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-card space-y-4 border-primary/20"
              >
                <p className="text-sm leading-relaxed text-gray-200 whitespace-pre-wrap">{aiResponse}</p>
                <div className="flex gap-3">
                  <button
                    onClick={() => {
                      setActiveTab('post');
                      setPrompt(aiResponse);
                    }}
                    className="flex-1 rounded-xl bg-primary py-3 text-xs font-bold text-black uppercase tracking-widest"
                  >
                    Use as Post
                  </button>
                  <button
                    onClick={() => setAiResponse(null)}
                    className="flex-1 rounded-xl bg-white/5 py-3 text-xs font-bold text-white uppercase tracking-widest border border-white/10"
                  >
                    Discard
                  </button>
                </div>
              </motion.div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
