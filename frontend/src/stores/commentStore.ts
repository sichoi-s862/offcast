import { create } from 'zustand';
import {
  getCommentsByPostId,
  createComment,
  updateComment,
  deleteComment,
  toggleCommentLike,
} from '../api';
import { getErrorMessage } from '../api/client';
import type { ApiComment, CreateCommentDto } from '../types';

interface CommentState {
  // 상태
  comments: ApiComment[];
  total: number;
  page: number;
  isLoading: boolean;
  isLoadingMore: boolean;
  isSubmitting: boolean;
  error: string | null;
  replyingToId: string | null; // 답글 작성 중인 댓글 ID

  // 액션
  fetchComments: (postId: string, page?: number, append?: boolean) => Promise<void>;
  addComment: (data: CreateCommentDto) => Promise<ApiComment>;
  editComment: (id: string, content: string) => Promise<ApiComment>;
  removeComment: (id: string) => Promise<void>;
  toggleLike: (id: string) => Promise<void>;
  setReplyingTo: (commentId: string | null) => void;
  clearComments: () => void;
  clearError: () => void;

  // 로컬 상태 업데이트
  updateCommentLocally: (id: string, updates: Partial<ApiComment>) => void;
  addReplyLocally: (parentId: string, reply: ApiComment) => void;
}

const DEFAULT_LIMIT = 20;

export const useCommentStore = create<CommentState>((set, get) => ({
  // 초기 상태
  comments: [],
  total: 0,
  page: 1,
  isLoading: false,
  isLoadingMore: false,
  isSubmitting: false,
  error: null,
  replyingToId: null,

  // 댓글 목록 조회
  fetchComments: async (postId: string, page = 1, append = false) => {
    if (append) {
      set({ isLoadingMore: true });
    } else {
      set({ isLoading: true, error: null });
    }

    try {
      const data = await getCommentsByPostId(postId, { page, limit: DEFAULT_LIMIT });

      set((state) => ({
        comments: append ? [...state.comments, ...data.comments] : data.comments,
        total: data.total,
        page,
        isLoading: false,
        isLoadingMore: false,
      }));
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, '댓글을 불러오는데 실패했습니다.');
      set({ error: errorMessage, isLoading: false, isLoadingMore: false });
    }
  },

  // 댓글 작성
  addComment: async (data: CreateCommentDto) => {
    set({ isSubmitting: true, error: null });
    try {
      const newComment = await createComment(data);

      // 댓글 생성 후 전체 목록 다시 불러오기 (다른 사용자 댓글도 반영)
      await get().fetchComments(data.postId);

      set({ isSubmitting: false, replyingToId: null });
      return newComment;
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, '댓글 작성에 실패했습니다.');
      set({ error: errorMessage, isSubmitting: false });
      throw error;
    }
  },

  // 댓글 수정
  editComment: async (id: string, content: string) => {
    set({ isSubmitting: true, error: null });
    try {
      const updatedComment = await updateComment(id, content);

      // 목록 또는 답글에서 업데이트
      set((state) => ({
        comments: state.comments.map((c) => {
          if (c.id === id) {
            return updatedComment;
          }
          // 답글 확인
          if (c.replies) {
            return {
              ...c,
              replies: c.replies.map((r) => (r.id === id ? updatedComment : r)),
            };
          }
          return c;
        }),
        isSubmitting: false,
      }));

      return updatedComment;
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, '댓글 수정에 실패했습니다.');
      set({ error: errorMessage, isSubmitting: false });
      throw error;
    }
  },

  // 댓글 삭제
  removeComment: async (id: string) => {
    set({ isLoading: true, error: null });
    try {
      await deleteComment(id);

      // 목록 또는 답글에서 제거
      set((state) => ({
        comments: state.comments
          .filter((c) => c.id !== id)
          .map((c) => ({
            ...c,
            replies: c.replies?.filter((r) => r.id !== id),
          })),
        total: state.total - 1,
        isLoading: false,
      }));
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, '댓글 삭제에 실패했습니다.');
      set({ error: errorMessage, isLoading: false });
      throw error;
    }
  },

  // 좋아요 토글
  toggleLike: async (id: string) => {
    const { comments } = get();

    // 댓글 또는 답글 찾기
    let targetComment: ApiComment | undefined;
    for (const comment of comments) {
      if (comment.id === id) {
        targetComment = comment;
        break;
      }
      if (comment.replies) {
        targetComment = comment.replies.find((r) => r.id === id);
        if (targetComment) break;
      }
    }

    if (!targetComment) return;

    const newLiked = !targetComment.isLiked;
    const newLikeCount = targetComment.likeCount + (newLiked ? 1 : -1);

    // 옵티미스틱 업데이트
    get().updateCommentLocally(id, { isLiked: newLiked, likeCount: newLikeCount });

    try {
      const result = await toggleCommentLike(id);
      get().updateCommentLocally(id, { isLiked: result.liked, likeCount: result.likeCount });
    } catch (error: unknown) {
      // 실패 시 롤백
      get().updateCommentLocally(id, {
        isLiked: targetComment.isLiked,
        likeCount: targetComment.likeCount,
      });
      console.error('Failed to toggle comment like:', error);
    }
  },

  // 답글 대상 설정
  setReplyingTo: (commentId) => {
    set({ replyingToId: commentId });
  },

  // 댓글 목록 초기화
  clearComments: () => {
    set({
      comments: [],
      total: 0,
      page: 1,
      replyingToId: null,
    });
  },

  // 에러 클리어
  clearError: () => {
    set({ error: null });
  },

  // 로컬 상태 업데이트
  updateCommentLocally: (id, updates) => {
    set((state) => ({
      comments: state.comments.map((c) => {
        if (c.id === id) {
          return { ...c, ...updates };
        }
        // 답글 확인
        if (c.replies) {
          return {
            ...c,
            replies: c.replies.map((r) => (r.id === id ? { ...r, ...updates } : r)),
          };
        }
        return c;
      }),
    }));
  },

  // 로컬에 답글 추가
  addReplyLocally: (parentId, reply) => {
    set((state) => ({
      comments: state.comments.map((c) => {
        if (c.id === parentId) {
          return {
            ...c,
            replies: [...(c.replies || []), reply],
            _count: {
              ...c._count,
              replies: (c._count?.replies || 0) + 1,
            },
          };
        }
        return c;
      }),
    }));
  },
}));
