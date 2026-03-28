export interface Address {
  id: string;
  name: string;
  phone: string;
  street: string;
  city: string;
  state: string;
  zipCode: string;
  isDefault: boolean;
}

export interface CartItem {
  productId: string;
  name: string;
  price: number;
  imageUrl: string;
  quantity: number;
  sellerId: string;
}

export interface Review {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  rating: number;
  comment: string;
  createdAt: string;
}

export interface UserProfile {
  uid: string;
  displayName: string;
  email: string;
  photoURL: string;
  bio: string;
  role: 'user' | 'admin' | 'creator' | 'seller';
  trustScore: number;
  earnings: number;
  followersCount: number;
  followingCount: number;
  xp: number;
  level: number;
  isPrivate: boolean;
  isVerified: boolean;
  badges: string[];
  links: { title: string; url: string }[];
  addresses: Address[];
  wishlist: string[]; // Array of product IDs
  cart: CartItem[];
  blockedUsers: string[];
  closeFriends: string[];
  interests: string[];
  createdAt: string;
  lastLogin: string;
  screenTime: number; // in minutes
  lastRewardClaimed?: string;
  settings: UserSettings;
}

export interface Post {
  id: string;
  authorId: string;
  authorName: string;
  authorAvatar?: string;
  authorPhoto?: string;
  type: 'image' | 'video' | 'text' | 'carousel' | 'poll' | 'qa';
  content: string;
  mediaUrl?: string; // For single media
  mediaUrls?: string[]; // For carousel
  likesCount: number;
  commentsCount: number;
  sharesCount: number;
  viewsCount: number;
  tags: string[];
  hashtags: string[];
  taggedProducts?: string[]; // Product IDs
  isPremium?: boolean;
  price?: number; // For paid posts
  pollOptions?: { text: string; votes: number }[];
  status: 'draft' | 'published' | 'scheduled';
  scheduledFor?: string;
  aiEnhanced?: boolean;
  subtitles?: { start: number; end: number; text: string }[];
  location?: { name: string; lat: number; lng: number };
  isViral?: boolean;
  aiInsights?: string;
  isModerated?: boolean;
  createdAt: string;
}

export interface Product {
  id: string;
  sellerId: string;
  sellerName: string;
  name: string;
  description: string;
  price: number;
  imageUrl: string;
  category: string;
  stock: number;
  rating: number;
  reviewsCount: number;
  trending?: boolean;
  affiliateCommission?: number;
  createdAt: string;
}

export interface ChatMessage {
  id: string;
  senderId: string;
  receiverId: string; // or groupId
  text: string;
  mediaUrl?: string;
  type: 'text' | 'image' | 'video' | 'file' | 'voice';
  reactions?: { [emoji: string]: string[] }; // emoji -> list of userIds
  isDisappearing?: boolean;
  expiresAt?: string;
  createdAt: string;
}

export interface OrderItem {
  productId: string;
  name: string;
  price: number;
  quantity: number;
  imageUrl: string;
  sellerId: string;
}

export interface Order {
  id: string;
  buyerId: string;
  sellerIds: string[]; // List of sellers involved in this order
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'paid' | 'shipped' | 'delivered' | 'cancelled';
  paymentMethod: 'COD' | 'Online';
  shippingAddress: Address;
  createdAt: string;
}

export interface UserSettings {
  notifications: boolean;
  privacyMode: boolean;
  amoledMode: boolean;
  language: string;
}

export interface Story {
  id: string;
  userId: string;
  userName: string;
  userAvatar: string;
  imageUrl: string;
  type?: 'image' | 'video';
  viewers?: string[];
  createdAt: string;
  expiresAt: string;
}

export interface MusicTrack {
  id: string;
  title: string;
  artist: string;
  url: string;
  cover: string;
  category: string;
}

export interface Notification {
  id: string;
  userId: string;
  type: 'like' | 'comment' | 'follow' | 'order' | 'mention' | 'system' | 'gift';
  title: string;
  body: string;
  data?: any;
  read: boolean;
  createdAt: string;
}
