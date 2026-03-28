import { collection, addDoc, getDocs, query, limit, doc, getDoc, updateDoc, where } from 'firebase/firestore';
import { db } from '../firebase';

export async function seedInitialData(userId: string) {
  const postsRef = collection(db, 'posts');
  const productsRef = collection(db, 'products');
  const userRef = doc(db, 'users', userId);

  // Update user profile with new fields if they don't exist
  const userSnap = await getDoc(userRef);
  if (userSnap.exists()) {
    const userData = userSnap.data();
    if (!userData.addresses || !userData.wishlist || !userData.cart) {
      await updateDoc(userRef, {
        addresses: userData.addresses || [],
        wishlist: userData.wishlist || [],
        cart: userData.cart || [],
        role: userData.role || 'user'
      });
    }
  }

  const postsSnap = await getDocs(query(postsRef, limit(1)));
  const productsSnap = await getDocs(query(productsRef, limit(1)));

  if (postsSnap.empty) {
    const samplePosts = [
      {
        authorId: userId,
        authorName: 'KhojAI Official',
        authorPhoto: 'https://picsum.photos/seed/khojai/200/200',
        type: 'image',
        content: 'Welcome to KhojAI! The future of Indian Super Apps is here. 🚀 #KhojAI #SuperApp',
        mediaUrl: 'https://picsum.photos/seed/tech/800/800',
        likesCount: 1250,
        commentsCount: 45,
        createdAt: new Date().toISOString(),
      },
      {
        authorId: 'ai_bot',
        authorName: 'AI Curator',
        authorPhoto: 'https://picsum.photos/seed/ai/200/200',
        type: 'image',
        content: 'Check out this amazing AI-generated landscape! 🎨 #AIArt #Creativity',
        mediaUrl: 'https://picsum.photos/seed/nature/800/800',
        likesCount: 850,
        commentsCount: 12,
        createdAt: new Date(Date.now() - 3600000).toISOString(),
      },
      {
        authorId: 'reels_bot',
        authorName: 'Reels Master',
        authorPhoto: 'https://picsum.photos/seed/reels/200/200',
        type: 'video',
        content: 'Amazing drone shot of the Himalayas! 🏔️ #Travel #India #Nature',
        mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-mountain-range-covered-in-snow-1587-large.mp4',
        likesCount: 15400,
        commentsCount: 230,
        createdAt: new Date(Date.now() - 7200000).toISOString(),
      },
      {
        authorId: 'reels_bot',
        authorName: 'Reels Master',
        authorPhoto: 'https://picsum.photos/seed/reels/200/200',
        type: 'video',
        content: 'Futuristic city vibes. 🌃 #Cyberpunk #CityLife',
        mediaUrl: 'https://assets.mixkit.co/videos/preview/mixkit-city-traffic-at-night-seen-from-above-1588-large.mp4',
        likesCount: 8900,
        commentsCount: 120,
        createdAt: new Date(Date.now() - 10800000).toISOString(),
      }
    ];

    for (const post of samplePosts) {
      await addDoc(postsRef, post);
    }
  }

  if (productsSnap.empty) {
    const sampleProducts = [
      {
        sellerId: userId,
        sellerName: 'KhojAI Store',
        name: 'Premium Wireless Earbuds',
        description: 'Crystal clear sound with active noise cancellation and 40-hour battery life. Perfect for music lovers and professionals.',
        price: 2499,
        imageUrl: 'https://picsum.photos/seed/earbuds/600/600',
        category: 'Electronics',
        stock: 50,
        rating: 4.5,
        reviewsCount: 128,
        trending: true,
        createdAt: new Date().toISOString(),
      },
      {
        sellerId: 'seller_1',
        sellerName: 'TechHub',
        name: 'Smart Fitness Watch',
        description: 'Track your health and workouts in style. Heart rate monitoring, GPS, and water resistance.',
        price: 3999,
        imageUrl: 'https://picsum.photos/seed/watch/600/600',
        category: 'Electronics',
        stock: 30,
        rating: 4.2,
        reviewsCount: 85,
        trending: false,
        createdAt: new Date().toISOString(),
      },
      {
        sellerId: 'seller_2',
        sellerName: 'LeatherCraft',
        name: 'Minimalist Leather Wallet',
        description: 'Handcrafted premium leather wallet with RFID protection. Slim design for modern lifestyle.',
        price: 899,
        imageUrl: 'https://picsum.photos/seed/wallet/600/600',
        category: 'Fashion',
        stock: 100,
        rating: 4.8,
        reviewsCount: 210,
        trending: true,
        createdAt: new Date().toISOString(),
      },
      {
        sellerId: 'seller_3',
        sellerName: 'HomeStyle',
        name: 'Ergonomic Office Chair',
        description: 'Comfortable seating for long working hours. Adjustable height and lumbar support.',
        price: 12499,
        imageUrl: 'https://picsum.photos/seed/chair/600/600',
        category: 'Home',
        stock: 15,
        rating: 4.6,
        reviewsCount: 45,
        trending: false,
        createdAt: new Date().toISOString(),
      }
    ];

    for (const product of sampleProducts) {
      await addDoc(productsRef, product);
    }
  }

  // Seed Stories
  const storiesRef = collection(db, 'stories');
  const storiesSnap = await getDocs(query(storiesRef, limit(1)));
  if (storiesSnap.empty) {
    const sampleStories = [
      {
        userId,
        userName: 'You',
        userAvatar: 'https://api.dicebear.com/7.x/avataaars/svg?seed=' + userId,
        imageUrl: 'https://picsum.photos/seed/story1/400/800',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      },
      {
        userId: 'ai_bot',
        userName: 'AI Assistant',
        userAvatar: 'https://picsum.photos/seed/ai/200/200',
        imageUrl: 'https://picsum.photos/seed/story2/400/800',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      },
      {
        userId: 'trend_bot',
        userName: 'Trending',
        userAvatar: 'https://picsum.photos/seed/trend/200/200',
        imageUrl: 'https://picsum.photos/seed/story3/400/800',
        createdAt: new Date().toISOString(),
        expiresAt: new Date(Date.now() + 86400000).toISOString(),
      }
    ];
    for (const story of sampleStories) {
      await addDoc(storiesRef, story);
    }
  }

  // Seed Music
  const musicRef = collection(db, 'music');
  const musicSnap = await getDocs(query(musicRef, limit(1)));
  if (musicSnap.empty) {
    const sampleMusic = [
      {
        title: 'Neon Dreams',
        artist: 'KhojAI Beats',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-1.mp3',
        cover: 'https://picsum.photos/seed/music1/200/200',
        category: 'Synthwave'
      },
      {
        title: 'Cyber City',
        artist: 'Synth Wave',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-2.mp3',
        cover: 'https://picsum.photos/seed/music2/200/200',
        category: 'Cyberpunk'
      },
      {
        title: 'Midnight Drive',
        artist: 'Lofi Girl',
        url: 'https://www.soundhelix.com/examples/mp3/SoundHelix-Song-3.mp3',
        cover: 'https://picsum.photos/seed/music3/200/200',
        category: 'Lofi'
      }
    ];
    for (const track of sampleMusic) {
      await addDoc(musicRef, track);
    }
  }
}
