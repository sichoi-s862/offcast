export type Provider = 'youtube' | 'tiktok' | 'soop' | 'instagram' | 'chzzk';

export interface Channel {
  id: string;
  name: string;
  minSubs: number;
}

export interface Post {
  id: number;
  authorInfo: string;
  channelId: string;
  title: string;
  content: string;
  likes: number;
  comments: number;
  time: string;
  isLiked: boolean;
  image: string | null;
}

export interface Comment {
  id: number;
  authorInfo: string;
  content: string;
  time: string;
  likes: number;
  image: string | null;
  replies: Reply[];
}

export interface Reply {
  id: number;
  authorInfo: string;
  content: string;
  time: string;
  likes: number;
  image: string | null;
}

export interface CurrentUser {
  provider: Provider | string;
  nickname: string;
  subscriberCount: string;
  rawSubCount: number;
}

export interface UserAccount {
  id: string;
  provider: string;
  providerAccountId: string;
  profileName: string | null;
  profileImage: string | null;
}

export interface User {
  id: string;
  accounts: UserAccount[];
}

export interface SocialStats {
  provider: string;
  subscriberCount?: number;
  followerCount?: number;
  viewCount?: number;
  videoCount?: number;
  fanCount?: number;
  error?: string;
}
