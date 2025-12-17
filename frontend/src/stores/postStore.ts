import { create } from 'zustand';
import axios from 'axios';
import {
  getPosts,
  getPostById,
  createPost,
  updatePost,
  deletePost,
  togglePostLike,
  getMyPosts,
} from '../api';
import { getErrorMessage } from '../api/client';
import type { ApiPost, CreatePostDto, UpdatePostDto, PostQueryParams } from '../types';

interface PostState {
  // 상태
  posts: ApiPost[];
  currentPost: ApiPost | null;
  myPosts: ApiPost[];
  total: number;
  page: number;
  limit: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  isCreating: boolean;
  error: string | null;
  errorCode: number | null; // HTTP 에러 코드

  // 필터 상태
  filters: PostQueryParams;

  // 액션
  fetchPosts: (params?: PostQueryParams, append?: boolean) => Promise<void>;
  fetchPostById: (id: string) => Promise<ApiPost | null>;
  fetchMyPosts: (page?: number, append?: boolean) => Promise<void>;
  createNewPost: (data: CreatePostDto) => Promise<ApiPost>;
  updateExistingPost: (id: string, data: UpdatePostDto) => Promise<ApiPost>;
  deleteExistingPost: (id: string) => Promise<void>;
  toggleLike: (id: string) => Promise<void>;
  setFilters: (filters: PostQueryParams) => void;
  resetFilters: () => void;
  clearCurrentPost: () => void;
  clearError: () => void;
  refreshPosts: () => Promise<void>;

  // 로컬 상태 업데이트 (옵티미스틱 업데이트용)
  updatePostLocally: (id: string, updates: Partial<ApiPost>) => void;
  removePostLocally: (id: string) => void;
}

const DEFAULT_LIMIT = 15;

export const usePostStore = create<PostState>((set, get) => ({
  // 초기 상태
  posts: [],
  currentPost: null,
  myPosts: [],
  total: 0,
  page: 1,
  limit: DEFAULT_LIMIT,
  isLoading: false,
  isLoadingMore: false,
  isCreating: false,
  error: null,
  errorCode: null,
  filters: {},

  // 게시글 목록 조회
  fetchPosts: async (params?: PostQueryParams, append = false) => {
    const currentFilters = get().filters;
    const mergedParams = { ...currentFilters, ...params, limit: params?.limit || DEFAULT_LIMIT };

    if (append) {
      set({ isLoadingMore: true });
    } else {
      set({ isLoading: true, error: null });
    }

    try {
      const data = await getPosts(mergedParams);

      set((state) => ({
        posts: append ? [...state.posts, ...data.posts] : data.posts,
        total: data.total,
        page: mergedParams.page || 1,
        isLoading: false,
        isLoadingMore: false,
      }));
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, '게시글을 불러오는데 실패했습니다.');
      set({ error: errorMessage, isLoading: false, isLoadingMore: false });
    }
  },

  // 게시글 상세 조회
  fetchPostById: async (id: string) => {
    set({ isLoading: true, error: null, errorCode: null });
    try {
      const post = await getPostById(id);
      set({ currentPost: post, isLoading: false });
      return post;
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, '게시글을 불러오는데 실패했습니다.');
      const errorCode = axios.isAxiosError(error) ? error.response?.status || null : null;
      set({ error: errorMessage, errorCode, isLoading: false });
      return null;
    }
  },

  // 내 게시글 목록 조회
  fetchMyPosts: async (page = 1, append = false) => {
    if (append) {
      set({ isLoadingMore: true });
    } else {
      set({ isLoading: true, error: null });
    }

    try {
      const data = await getMyPosts({ page, limit: DEFAULT_LIMIT });

      set((state) => ({
        myPosts: append ? [...state.myPosts, ...data.posts] : data.posts,
        total: data.total,
        page,
        isLoading: false,
        isLoadingMore: false,
      }));
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, '내 게시글을 불러오는데 실패했습니다.');
      set({ error: errorMessage, isLoading: false, isLoadingMore: false });
    }
  },

  // 게시글 작성
  createNewPost: async (data: CreatePostDto) => {
    set({ isCreating: true, error: null });
    try {
      const newPost = await createPost(data);

      // 목록에 추가 (맨 앞에)
      set((state) => ({
        posts: [newPost, ...state.posts],
        total: state.total + 1,
        isCreating: false,
      }));

      return newPost;
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, '게시글 작성에 실패했습니다.');
      set({ error: errorMessage, isCreating: false });
      throw error;
    }
  },

  // 게시글 수정
  updateExistingPost: async (id: string, data: UpdatePostDto) => {
    set({ isLoading: true, error: null });
    try {
      const updatedPost = await updatePost(id, data);

      // 목록 및 현재 게시글 업데이트
      set((state) => ({
        posts: state.posts.map((p) => (p.id === id ? updatedPost : p)),
        currentPost: state.currentPost?.id === id ? updatedPost : state.currentPost,
        myPosts: state.myPosts.map((p) => (p.id === id ? updatedPost : p)),
        isLoading: false,
      }));

      return updatedPost;
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, '게시글 수정에 실패했습니다.');
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // 게시글 삭제
  deleteExistingPost: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await deletePost(id);

      // 목록에서 제거
      set((state) => ({
        posts: state.posts.filter((p) => p.id !== id),
        myPosts: state.myPosts.filter((p) => p.id !== id),
        currentPost: state.currentPost?.id === id ? null : state.currentPost,
        total: state.total - 1,
        isLoading: false,
      }));
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, '게시글 삭제에 실패했습니다.');
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // 좋아요 토글
  toggleLike: async (id: string) => {
    // 옵티미스틱 업데이트
    const { posts, currentPost } = get();
    const targetPost = posts.find((p) => p.id === id) || currentPost;

    if (!targetPost) return;

    const newLiked = !targetPost.isLiked;
    const newLikeCount = targetPost.likeCount + (newLiked ? 1 : -1);

    // 즉시 UI 업데이트
    get().updatePostLocally(id, { isLiked: newLiked, likeCount: newLikeCount });

    try {
      const result = await togglePostLike(id);

      // 서버 응답으로 실제 값 동기화
      get().updatePostLocally(id, { isLiked: result.liked, likeCount: result.likeCount });
    } catch (error: unknown) {
      // 실패 시 롤백
      get().updatePostLocally(id, { isLiked: targetPost.isLiked, likeCount: targetPost.likeCount });
      console.error('Failed to toggle like:', error);
    }
  },

  // 필터 설정
  setFilters: (filters) => {
    set({ filters });
  },

  // 필터 초기화
  resetFilters: () => {
    set({ filters: {} });
  },

  // 현재 게시글 클리어
  clearCurrentPost: () => {
    set({ currentPost: null });
  },

  // 에러 클리어
  clearError: () => {
    set({ error: null, errorCode: null });
  },

  // 게시글 새로고침
  refreshPosts: async () => {
    const { filters } = get();
    set({ page: 1 });
    await get().fetchPosts({ ...filters, page: 1 });
  },

  // 로컬 상태 업데이트
  updatePostLocally: (id, updates) => {
    set((state) => ({
      posts: state.posts.map((p) => (p.id === id ? { ...p, ...updates } : p)),
      currentPost: state.currentPost?.id === id ? { ...state.currentPost, ...updates } : state.currentPost,
      myPosts: state.myPosts.map((p) => (p.id === id ? { ...p, ...updates } : p)),
    }));
  },

  // 로컬에서 게시글 제거
  removePostLocally: (id) => {
    set((state) => ({
      posts: state.posts.filter((p) => p.id !== id),
      myPosts: state.myPosts.filter((p) => p.id !== id),
      currentPost: state.currentPost?.id === id ? null : state.currentPost,
    }));
  },
}));
