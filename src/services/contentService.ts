import { 
  collection, 
  addDoc, 
  updateDoc, 
  doc, 
  getDoc, 
  serverTimestamp,
  query,
  where,
  getDocs,
  orderBy,
  limit,
  deleteDoc
} from 'firebase/firestore';
import { db, auth } from '../firebase';
import { Post, UserProfile } from '../types';
import { aiService } from './aiService';
import { socialService } from './socialService';

export const contentService = {
  /**
   * Create a new post (image, video, carousel, text, poll, qa).
   */
  async createPost(post: Partial<Post>): Promise<string> {
    if (!auth.currentUser) throw new Error('User not authenticated');
    const userId = auth.currentUser.uid;

    const postsRef = collection(db, 'posts');
    const docRef = await addDoc(postsRef, {
      ...post,
      authorId: userId,
      authorName: auth.currentUser.displayName,
      authorPhoto: auth.currentUser.photoURL,
      likesCount: 0,
      commentsCount: 0,
      sharesCount: 0,
      viewsCount: 0,
      tags: post.tags || [],
      hashtags: post.hashtags || [],
      status: post.status || 'published',
      createdAt: new Date().toISOString()
    });

    // Award XP for creating content (gamification)
    await socialService.addXP(userId, 100);

    return docRef.id;
  },

  /**
   * Save a post as a draft.
   */
  async saveDraft(post: Partial<Post>): Promise<string> {
    return this.createPost({ ...post, status: 'draft' });
  },

  /**
   * Schedule a post for later.
   */
  async schedulePost(post: Partial<Post>, scheduledAt: string): Promise<string> {
    return this.createPost({ ...post, status: 'scheduled', scheduledFor: scheduledAt });
  },

  /**
   * Handle poll voting.
   */
  async voteOnPoll(postId: string, optionIndex: number): Promise<void> {
    const postRef = doc(db, 'posts', postId);
    const postSnap = await getDoc(postRef);

    if (postSnap.exists()) {
      const post = postSnap.data() as Post;
      const pollOptions = post.pollOptions || [];
      if (pollOptions[optionIndex]) {
        pollOptions[optionIndex].votes += 1;
        await updateDoc(postRef, { pollOptions });
      }
    }
  },

  /**
   * Auto-generate viral caption and hashtags using AI.
   */
  async generateAIContent(description: string): Promise<{ caption: string; hashtags: string[] }> {
    const [caption, hashtags] = await Promise.all([
      aiService.generateCaption(description),
      aiService.generateHashtags(description)
    ]);
    return { caption, hashtags };
  },

  /**
   * AI Content Improver (enhance images/videos automatically).
   */
  async improveContent(description: string): Promise<string> {
    return aiService.suggestContentImprovements(description);
  }
};
