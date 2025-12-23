import apiClient from './client';
import type {
  ApiChannel,
  ApiPost,
  ApiComment,
  ApiHashtag,
  ApiUser,
  PostListResponse,
  CommentListResponse,
  CreatePostDto,
  UpdatePostDto,
  CreateCommentDto,
  PostQueryParams,
} from '../types';

// ==================== 인증 API ====================

export interface DevLoginRequest {
  provider: string;
  nickname: string;
  subscriberCount: number;
}

export interface DevLoginResponse {
  user: ApiUser;
  token: {
    accessToken: string;
    expiresIn: string;
  };
}

export interface ProfileResponse {
  user: ApiUser;
}

// 개발용 로그인 (테스트용)
export const devLogin = async (data: DevLoginRequest): Promise<DevLoginResponse> => {
  const response = await apiClient.post<DevLoginResponse>('/auth/dev/login', data);
  return response.data;
};

// 프로필 조회
export const getProfile = async (): Promise<ProfileResponse> => {
  const response = await apiClient.get<ProfileResponse>('/auth/me');
  return response.data;
};

// 토큰 갱신
export const refreshToken = async (): Promise<{ accessToken: string; expiresIn: string }> => {
  const response = await apiClient.post('/auth/refresh');
  return response.data;
};

// ==================== 채널 API ====================

// 전체 채널 목록
export const getChannels = async (): Promise<ApiChannel[]> => {
  const response = await apiClient.get<ApiChannel[]>('/channels');
  return response.data;
};

// 채널 상세 (ID로 조회)
export const getChannelById = async (id: string): Promise<ApiChannel> => {
  const response = await apiClient.get<ApiChannel>(`/channels/by-id/${id}`);
  return response.data;
};

// 채널 상세 (슬러그로 조회)
export const getChannelBySlug = async (slug: string): Promise<ApiChannel> => {
  const response = await apiClient.get<ApiChannel>(`/channels/${slug}`);
  return response.data;
};

// 접근 가능한 채널 목록 (구독자 수 기준)
export const getAccessibleChannels = async (): Promise<ApiChannel[]> => {
  const response = await apiClient.get<ApiChannel[]>('/channels/accessible');
  return response.data;
};

// ==================== 게시글 API ====================

// 게시글 목록 조회
export const getPosts = async (params?: PostQueryParams): Promise<PostListResponse> => {
  const response = await apiClient.get<PostListResponse>('/posts', { params });
  return response.data;
};

// 게시글 상세 조회
export const getPostById = async (id: string): Promise<ApiPost> => {
  const response = await apiClient.get<ApiPost>(`/posts/${id}`);
  return response.data;
};

// 게시글 작성
export const createPost = async (data: CreatePostDto): Promise<ApiPost> => {
  const response = await apiClient.post<ApiPost>('/posts', data);
  return response.data;
};

// 게시글 수정
export const updatePost = async (id: string, data: UpdatePostDto): Promise<ApiPost> => {
  const response = await apiClient.put<ApiPost>(`/posts/${id}`, data);
  return response.data;
};

// 게시글 삭제
export const deletePost = async (id: string): Promise<void> => {
  await apiClient.delete(`/posts/${id}`);
};

// 좋아요 토글
export const togglePostLike = async (id: string): Promise<{ liked: boolean; likeCount: number }> => {
  const response = await apiClient.post<{ liked: boolean; likeCount: number }>(`/posts/${id}/like`);
  return response.data;
};

// 내 게시글 목록
export const getMyPosts = async (params?: { page?: number; limit?: number }): Promise<PostListResponse> => {
  const response = await apiClient.get<PostListResponse>('/posts/my', { params });
  return response.data;
};

// ==================== 댓글 API ====================

// 게시글의 댓글 목록
export const getCommentsByPostId = async (
  postId: string,
  params?: { page?: number; limit?: number }
): Promise<CommentListResponse> => {
  const response = await apiClient.get<CommentListResponse>('/comments', {
    params: { postId, ...params }
  });
  return response.data;
};

// 댓글 작성
export const createComment = async (data: CreateCommentDto): Promise<ApiComment> => {
  const response = await apiClient.post<ApiComment>('/comments', data);
  return response.data;
};

// 댓글 수정
export const updateComment = async (id: string, content: string): Promise<ApiComment> => {
  const response = await apiClient.put<ApiComment>(`/comments/${id}`, { content });
  return response.data;
};

// 댓글 삭제
export const deleteComment = async (id: string): Promise<void> => {
  await apiClient.delete(`/comments/${id}`);
};

// 댓글 좋아요 토글
export const toggleCommentLike = async (id: string): Promise<{ liked: boolean; likeCount: number }> => {
  const response = await apiClient.post<{ liked: boolean; likeCount: number }>(`/comments/${id}/like`);
  return response.data;
};

// ==================== 해시태그 API ====================

// 해시태그 검색 (자동완성)
export const searchHashtags = async (query: string, limit?: number): Promise<{ hashtags: ApiHashtag[]; total: number }> => {
  const response = await apiClient.get<{ hashtags: ApiHashtag[]; total: number }>('/hashtags/search', {
    params: { q: query, limit },
  });
  return response.data;
};

// 인기 해시태그
export const getPopularHashtags = async (limit?: number): Promise<ApiHashtag[]> => {
  const response = await apiClient.get<ApiHashtag[]>('/hashtags/popular', {
    params: { limit },
  });
  return response.data;
};

// 트렌딩 해시태그
export const getTrendingHashtags = async (limit?: number): Promise<ApiHashtag[]> => {
  const response = await apiClient.get<ApiHashtag[]>('/hashtags/trending', {
    params: { limit },
  });
  return response.data;
};

// ==================== 이미지 업로드 API ====================

export interface UploadResult {
  key: string;
  url: string;
  size: number;
}

export interface PresignedUrlResult {
  uploadUrl: string;
  key: string;
  publicUrl: string;
  expiresIn: number;
}

// 이미지 직접 업로드
export const uploadImage = async (file: File, folder: string = 'images'): Promise<UploadResult> => {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('folder', folder);

  const response = await apiClient.post<UploadResult>('/upload/image', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// 다중 이미지 업로드
export const uploadImages = async (files: File[], folder: string = 'images'): Promise<UploadResult[]> => {
  const formData = new FormData();
  files.forEach((file) => formData.append('files', file));
  formData.append('folder', folder);

  const response = await apiClient.post<UploadResult[]>('/upload/images', formData, {
    headers: {
      'Content-Type': 'multipart/form-data',
    },
  });
  return response.data;
};

// Presigned URL 발급 (대용량 직접 업로드용)
export const getPresignedUploadUrl = async (
  mimeType: string,
  folder: string = 'images',
  expiresIn: number = 3600
): Promise<PresignedUrlResult> => {
  const response = await apiClient.post<PresignedUrlResult>('/upload/presigned-url', {
    mimeType,
    folder,
    expiresIn,
  });
  return response.data;
};

// 이미지 삭제
export const deleteImage = async (key: string): Promise<void> => {
  await apiClient.delete(`/upload/${encodeURIComponent(key)}`);
};

// ==================== 헬스체크 API ====================

export interface HealthStatus {
  status: string;
  timestamp: string;
  uptime: number;
  database: {
    status: string;
    latency?: number;
  };
  memory: {
    heapUsed: number;
    heapTotal: number;
    external: number;
    rss: number;
  };
}

export interface AppVersion {
  currentVersion: string;
  minVersion: string;
  isForceUpdate: boolean;
  description: string | null;
}

export interface VersionCheckResult {
  isCompatible: boolean;
  needsUpdate: boolean;
  isForceUpdate: boolean;
  latestVersion: string;
  minVersion: string;
}

// 헬스체크
export const getHealth = async (): Promise<HealthStatus> => {
  const response = await apiClient.get<HealthStatus>('/health');
  return response.data;
};

// 핑
export const ping = async (): Promise<{ pong: boolean; timestamp: string }> => {
  const response = await apiClient.get<{ pong: boolean; timestamp: string }>('/health/ping');
  return response.data;
};

// 최신 버전 정보
export const getLatestVersion = async (): Promise<AppVersion> => {
  const response = await apiClient.get<AppVersion>('/health/version');
  return response.data;
};

// 버전 호환성 확인
export const checkVersion = async (version: string): Promise<VersionCheckResult> => {
  const response = await apiClient.get<VersionCheckResult>('/health/version/check', {
    params: { version },
  });
  return response.data;
};

// ==================== 신고 API ====================

export type ReportTargetType = 'POST' | 'COMMENT' | 'USER';
export type ReportReason = 'SPAM' | 'HARASSMENT' | 'INAPPROPRIATE' | 'MISINFORMATION' | 'COPYRIGHT' | 'OTHER';

export interface CreateReportDto {
  targetType: ReportTargetType;
  postId?: string;
  commentId?: string;
  targetUserId?: string;
  reason: ReportReason;
  detail?: string;
}

export interface ReportResponse {
  message: string;
  reportId: string;
}

// 신고하기
export const createReport = async (data: CreateReportDto): Promise<ReportResponse> => {
  const response = await apiClient.post<ReportResponse>('/reports', data);
  return response.data;
};

// 내 신고 목록 조회
export const getMyReports = async (params?: { page?: number; limit?: number }) => {
  const response = await apiClient.get('/reports/my', { params });
  return response.data;
};

// ==================== 차단 API ====================

// 사용자 차단
export const blockUser = async (userId: string): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>(`/blocks/${userId}`);
  return response.data;
};

// 차단 해제
export const unblockUser = async (userId: string): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>(`/blocks/${userId}`);
  return response.data;
};

// 차단 목록 조회
export const getBlockedUsers = async (params?: { page?: number; limit?: number }) => {
  const response = await apiClient.get('/blocks', { params });
  return response.data;
};

// 차단 여부 확인
export const checkBlockStatus = async (userId: string): Promise<{ isBlocked: boolean }> => {
  const response = await apiClient.get<{ isBlocked: boolean }>(`/blocks/${userId}/status`);
  return response.data;
};

// ==================== 사용자 API ====================

// 내 정보 조회
export const getMyInfo = async () => {
  const response = await apiClient.get('/users/me');
  return response.data;
};

// 닉네임 변경
export const updateNickname = async (nickname: string): Promise<{ message: string; user: ApiUser }> => {
  const response = await apiClient.patch<{ message: string; user: ApiUser }>('/users/nickname', { nickname });
  return response.data;
};

// 연결된 계정 목록 조회
export const getMyAccounts = async () => {
  const response = await apiClient.get('/users/accounts');
  return response.data;
};

// 회원 탈퇴
export const withdrawUser = async (): Promise<{ message: string }> => {
  const response = await apiClient.delete<{ message: string }>('/users/withdraw');
  return response.data;
};

// ==================== 약관 동의 API ====================

export type AgreementType = 'TERMS_OF_SERVICE' | 'PRIVACY_POLICY' | 'MARKETING';

export interface AgreementItem {
  type: AgreementType;
  version: string;
}

export interface UserAgreement {
  id: string;
  agreementType: AgreementType;
  version: string;
  agreedAt: string;
}

// 약관 동의 저장
export const saveAgreements = async (agreements: AgreementItem[]): Promise<{ message: string }> => {
  const response = await apiClient.post<{ message: string }>('/users/agreements', { agreements });
  return response.data;
};

// 내 약관 동의 목록 조회
export const getMyAgreements = async (): Promise<{ agreements: UserAgreement[]; hasRequiredAgreements: boolean }> => {
  const response = await apiClient.get('/users/agreements');
  return response.data;
};

// ==================== 문의 API ====================

export type InquiryCategory = 'GENERAL' | 'BUG_REPORT' | 'SUGGESTION' | 'PARTNERSHIP' | 'ACCOUNT' | 'OTHER';
export type InquiryStatus = 'PENDING' | 'IN_PROGRESS' | 'ANSWERED' | 'CLOSED';

export interface CreateInquiryDto {
  category: InquiryCategory;
  title: string;
  content: string;
  email?: string;
}

export interface InquiryResponse {
  id: string;
  category: InquiryCategory;
  title: string;
  content: string;
  status: InquiryStatus;
  answer: string | null;
  answeredAt: string | null;
  createdAt: string;
}

// 문의 생성
export const createInquiry = async (data: CreateInquiryDto): Promise<{ message: string; inquiry: InquiryResponse }> => {
  const response = await apiClient.post('/inquiries', data);
  return response.data;
};

// 내 문의 목록 조회
export const getMyInquiries = async (params?: { page?: number; limit?: number }): Promise<{
  inquiries: InquiryResponse[];
  total: number;
  page: number;
  limit: number;
}> => {
  const response = await apiClient.get('/inquiries/my', { params });
  return response.data;
};

// 문의 상세 조회
export const getInquiryById = async (id: string): Promise<{ inquiry: InquiryResponse }> => {
  const response = await apiClient.get(`/inquiries/${id}`);
  return response.data;
};

// ==================== FAQ API ====================

export type FaqCategory = 'ACCOUNT' | 'COMMUNITY' | 'CHANNEL' | 'REPORT' | 'OTHER';

export interface FaqResponse {
  id: string;
  category: FaqCategory;
  question: string;
  answer: string;
}

// FAQ 목록 조회
export const getFaqs = async (params?: { category?: FaqCategory; search?: string }): Promise<{ faqs: FaqResponse[] }> => {
  const response = await apiClient.get('/faqs', { params });
  return response.data;
};

// FAQ 카테고리 목록
export const getFaqCategories = async (): Promise<{ categories: Array<{ value: FaqCategory; label: string }> }> => {
  const response = await apiClient.get('/faqs/categories');
  return response.data;
};

// ==================== 소셜 통계 API ====================

export type SocialProvider = 'youtube' | 'tiktok' | 'twitter';

export interface SocialAccount {
  id: string;
  provider: string;
  providerAccountId: string;
  profileName: string | null;
  profileImage: string | null;
  subscriberCount: number | null;
  isConnected: boolean;
  lastSyncedAt: string | null;
}

export interface YouTubeSocialStats {
  subscriberCount: number;
  videoCount: number;
  viewCount: number;
  channelId: string;
  channelTitle: string;
  thumbnailUrl: string;
}

export interface TikTokSocialStats {
  followerCount: number;
  followingCount: number;
  likesCount: number;
  videoCount: number;
  displayName: string;
  avatarUrl: string;
}

export interface TwitterSocialStats {
  followersCount: number;
  followingCount: number;
  tweetCount: number;
  username: string;
  name: string;
  profileImage: string;
}

export interface AllSocialStats {
  youtube?: YouTubeSocialStats;
  tiktok?: TikTokSocialStats;
  twitter?: TwitterSocialStats;
}

// 연결된 소셜 계정 목록
export const getLinkedAccounts = async (): Promise<SocialAccount[]> => {
  const response = await apiClient.get<SocialAccount[]>('/social/accounts');
  return response.data;
};

// 모든 플랫폼 통계
export const getAllSocialStats = async (): Promise<AllSocialStats> => {
  const response = await apiClient.get<AllSocialStats>('/social/all');
  return response.data;
};

// 특정 플랫폼 통계
export const getSocialStatsByProvider = async (provider: SocialProvider): Promise<YouTubeSocialStats | TikTokSocialStats | TwitterSocialStats> => {
  const response = await apiClient.get<YouTubeSocialStats | TikTokSocialStats | TwitterSocialStats>(`/social/${provider}/stats`);
  return response.data;
};

// YouTube 통계
export const getYouTubeStats = async (): Promise<YouTubeSocialStats> => {
  const response = await apiClient.get<YouTubeSocialStats>('/social/youtube/stats');
  return response.data;
};

// TikTok 통계
export const getTikTokStats = async (): Promise<TikTokSocialStats> => {
  const response = await apiClient.get<TikTokSocialStats>('/social/tiktok/stats');
  return response.data;
};

// Twitter 통계
export const getTwitterStats = async (): Promise<TwitterSocialStats> => {
  const response = await apiClient.get<TwitterSocialStats>('/social/twitter/stats');
  return response.data;
};

// Re-export client for direct use if needed
export { setAuthToken, getAuthToken } from './client';
export { default as apiClient } from './client';
