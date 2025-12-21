export type Provider = 'youtube' | 'tiktok' | 'twitter';
export type PostStatus = 'ACTIVE' | 'HIDDEN' | 'REPORTED';
export type CommentStatus = 'ACTIVE' | 'HIDDEN' | 'DELETED';

// API 응답 타입 (백엔드와 일치)
export interface ApiChannel {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  icon: string | null;
  sortOrder: number;
  isActive: boolean;
  minSubscribers: number;
  maxSubscribers: number | null;
  createdAt: string;
  updatedAt: string;
  _count?: {
    posts: number;
  };
}

export interface ApiPostImage {
  id: string;
  postId: string;
  url: string;
  key: string;
  order: number;
  createdAt: string;
}

export interface ApiPost {
  id: string;
  channelId: string;
  authorId: string;
  title: string;
  content: string;
  images: ApiPostImage[];
  viewCount: number;
  likeCount: number;
  commentCount: number;
  status: PostStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  channel?: ApiChannel;
  author?: ApiUser;
  hashtags?: { hashtag: ApiHashtag }[];
  isLiked?: boolean;
}

export interface ApiComment {
  id: string;
  postId: string;
  authorId: string;
  parentId: string | null;
  content: string;
  image: string | null;
  likeCount: number;
  status: CommentStatus;
  createdAt: string;
  updatedAt: string;
  deletedAt: string | null;
  author?: ApiUser;
  replies?: ApiComment[];
  _count?: {
    replies: number;
  };
  isLiked?: boolean;
}

export interface ApiHashtag {
  id: string;
  name: string;
  usageCount: number;
}

export interface ApiUser {
  id: string;
  nickname: string;
  profileImage: string | null;
  status: string;
  createdAt: string;
  accounts?: ApiAccount[];
}

export interface ApiAccount {
  id: string;
  provider: string;
  providerAccountId: string;
  displayName: string | null;
  profileImage: string | null;
  subscriberCount: number;
}

// 페이지네이션 응답
export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface PostListResponse {
  posts: ApiPost[];
  total: number;
  page: number;
  limit: number;
}

export interface CommentListResponse {
  comments: ApiComment[];
  total: number;
  page: number;
  limit: number;
}

// 프론트엔드 UI용 타입 (기존 유지)
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
  id?: string;
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
  followersCount?: number; // Twitter용
  viewCount?: number;
  videoCount?: number;
  fanCount?: number;
  error?: string;
}

// API 요청 타입
export interface CreatePostDto {
  channelId: string;
  title: string;
  content: string;
  imageUrls?: string[];
  imageKeys?: string[];
  hashtags?: string[];
}

export interface UpdatePostDto {
  title?: string;
  content?: string;
  images?: string[];
  hashtags?: string[];
}

export interface CreateCommentDto {
  postId: string;
  content: string;
  imageUrl?: string;
  imageKey?: string;
  parentId?: string;
}

export interface PostQueryParams {
  channelId?: string;
  keyword?: string;
  hashtag?: string;
  sort?: 'latest' | 'popular' | 'views';
  page?: number;
  limit?: number;
}
