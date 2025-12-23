import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  ChevronLeft,
  MoreVertical,
  ThumbsUp,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Camera,
  X,
  Loader2,
  MessageSquare
} from 'lucide-react';
import { AuthorDisplay } from '../components/common/AuthorDisplay';
import { DetailSkeleton } from '../components/common/Skeleton';
import { MenuBottomSheet } from '../components/modals/MenuBottomSheet';
import { ReportModal } from '../components/modals/ReportModal';
import { ReplyPage } from './ReplyPage';
import type { ApiPost, ApiComment, CurrentUser } from '../types';
import { usePostStore, useCommentStore, useChannelStore, toast } from '../stores';
import { formatRelativeTime, formatCount, formatSubscriberCount } from '../utils/format';
import { blockUser, uploadImage } from '../api';

interface PostDetailProps {
  postId: string;
  currentUser: CurrentUser;
  onBack: () => void;
  onAccessDenied?: () => void;
}

const fadeIn = keyframes`
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Container = styled.div`
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: black;
  position: relative;
  z-index: 50;
  animation: ${fadeIn} 0.2s ease-out;
  max-width: 768px;
  margin: 0 auto;
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 50;
  background-color: rgba(0, 0, 0, 0.9);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #1f2937;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
`;

const BackButton = styled.button`
  padding: 10px;
  margin-left: -10px;
  color: white;
  border-radius: 8px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    background-color: #1f2937;
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

const HeaderTitle = styled.h2`
  font-size: 16px;
  font-weight: 700;
  color: white;
`;

const MenuButton = styled.button`
  padding: 12px;
  margin-right: -12px;
  min-width: 44px;
  min-height: 44px;
  color: #9ca3af;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;

  &:hover {
    color: white;
    background-color: rgba(255, 255, 255, 0.05);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const ScrollContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-bottom: 80px;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const PostSection = styled.div`
  padding: 20px;
  border-bottom: 1px solid #1f2937;
`;

const AuthorRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 16px;
`;

const PostTitle = styled.h1`
  font-size: 20px;
  font-weight: 700;
  color: white;
  margin-bottom: 24px;
  line-height: 1.4;
`;

const PostContent = styled.p`
  font-size: 16px;
  color: #d1d5db;
  line-height: 1.6;
  white-space: pre-wrap;
  margin-bottom: 24px;
`;

const PostImage = styled.div`
  margin-bottom: 32px;
  overflow: hidden;

  img {
    display: block;
    width: 100%;
    height: auto;
    object-fit: cover;
  }
`;

const ActionRow = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  margin-top: 24px;
`;

const ActionButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 6px;
  padding: 6px 12px;
  border-radius: 4px;
  background-color: #111827;
  border: 1px solid #1f2937;
  color: ${props => props.$active ? '#00D4AA' : '#9ca3af'};
  font-weight: 700;
  font-size: 14px;
  transition: color 0.2s;

  svg {
    width: 16px;
    height: 16px;
  }

  &:last-child {
    margin-left: auto;
  }
`;

const CommentsSection = styled.div`
  background-color: black;
  min-height: 100%;
`;

const CommentsHeader = styled.div`
  padding: 16px;
  font-size: 14px;
  font-weight: 700;
  color: white;
  border-bottom: 1px solid #111827;
  display: flex;
  align-items: center;
  justify-content: space-between;
`;

const LoadMoreButton = styled.button`
  font-size: 12px;
  color: #00D4AA;
  &:hover {
    text-decoration: underline;
  }
`;

const CommentItem = styled.div<{ $isReply?: boolean }>`
  padding: 16px;
  padding-left: ${props => props.$isReply ? '48px' : '16px'};
  background-color: ${props => props.$isReply ? '#111827' : 'transparent'};
  border-bottom: 1px solid ${props => props.$isReply ? '#1f2937' : '#111827'};
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const CommentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
`;

const CommentMenuButton = styled.button`
  color: #4b5563;
  padding: 12px;
  margin: -8px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;

  &:hover {
    color: #9ca3af;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const CommentContent = styled.p`
  font-size: 14px;
  color: #e5e7eb;
  line-height: 1.5;
  white-space: pre-wrap;
`;

const CommentImage = styled.div`
  max-width: 200px;
  border-radius: 4px;
  overflow: hidden;
  margin-top: 4px;

  img {
    width: 100%;
    height: auto;
  }
`;

const CommentMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #9ca3af;
  margin-top: 4px;
`;

const CommentAction = styled.button`
  display: flex;
  align-items: center;
  gap: 2px;
  color: #9ca3af;
  font-size: 14px;

  &:hover {
    color: #d1d5db;
  }

  svg {
    width: 16px;
    height: 16px;
  }
`;

const ReplyButton = styled.button`
  font-weight: 400;
  font-size: 14px;
  color: #9ca3af;

  &:hover {
    color: #d1d5db;
  }
`;

const CommentInputWrapper = styled.div`
  position: absolute;
  bottom: 0;
  width: 100%;
  background-color: #111827;
  border-top: 1px solid #1f2937;
  padding: 12px;
  padding-bottom: calc(12px + env(safe-area-inset-bottom));
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const ImagePreview = styled.div`
  position: relative;
  display: inline-block;
  width: fit-content;
  margin-left: 40px;

  img {
    height: 64px;
    width: auto;
    border-radius: 4px;
    border: 1px solid #374151;
  }
`;

const RemovePreviewButton = styled.button`
  position: absolute;
  top: -8px;
  right: -8px;
  background-color: #1f2937;
  border-radius: 50%;
  padding: 8px;
  min-width: 32px;
  min-height: 32px;
  border: 1px solid #4b5563;
  display: flex;
  align-items: center;
  justify-content: center;

  svg {
    width: 12px;
    height: 12px;
    color: #9ca3af;
  }
`;

const UploadingOverlay = styled.div`
  position: absolute;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.7);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  font-size: 12px;
  gap: 4px;
  border-radius: 4px;

  svg {
    width: 14px;
    height: 14px;
    animation: ${spin} 1s linear infinite;
  }
`;

const InputRow = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const CameraButton = styled.button`
  color: #9ca3af;
  padding: 10px;
  min-width: 44px;
  min-height: 44px;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8px;

  &:hover {
    color: white;
    background-color: rgba(255, 255, 255, 0.05);
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

const InputContainer = styled.div`
  flex: 1;
  background-color: #1f2937;
  border-radius: 9999px;
  padding: 10px 16px;
  display: flex;
  align-items: center;
`;

const CommentInput = styled.input`
  background-color: transparent;
  width: 100%;
  font-size: 14px;
  color: white;
  border: none;
  outline: none;

  &::placeholder {
    color: #9ca3af;
  }
`;

const SubmitCommentButton = styled.button<{ $active: boolean }>`
  padding: 8px;
  font-weight: 700;
  font-size: 14px;
  color: ${props => props.$active ? '#00D4AA' : '#4b5563'};
  display: flex;
  align-items: center;
  gap: 4px;

  svg {
    width: 16px;
    height: 16px;
    animation: ${spin} 1s linear infinite;
  }
`;

const HiddenInput = styled.input`
  display: none;
`;

const ModalOverlay = styled.div`
  position: fixed;
  inset: 0;
  background-color: rgba(0, 0, 0, 0.8);
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 100;
`;

const ModalContent = styled.div`
  background-color: #1f2937;
  border-radius: 12px;
  padding: 24px;
  margin: 20px;
  max-width: 320px;
  width: 100%;
  text-align: center;
`;

const ModalTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: white;
  margin-bottom: 12px;
`;

const ModalMessage = styled.p`
  font-size: 14px;
  color: #9ca3af;
  margin-bottom: 24px;
  line-height: 1.5;
`;

const ModalButton = styled.button`
  width: 100%;
  padding: 12px;
  background-color: #00D4AA;
  border-radius: 8px;
  color: white;
  font-weight: 700;
  font-size: 14px;

  &:hover {
    background-color: #00B894;
  }
`;

const RepliesContainer = styled.div`
  cursor: pointer;
`;

const MoreRepliesButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 12px 16px 12px 52px;
  color: #00D4AA;
  font-size: 13px;
  font-weight: 500;
  width: 100%;
  text-align: left;

  svg {
    width: 14px;
    height: 14px;
  }

  &:hover {
    background-color: rgba(0, 212, 170, 0.1);
  }
`;

// 작성자 정보 문자열 생성
const buildAuthorInfo = (comment: ApiComment): string => {
  if (comment.author) {
    const account = comment.author.accounts?.[0];
    const provider = account?.provider || 'YOUTUBE';
    const nickname = comment.author.nickname;
    const subCount = account?.subscriberCount || 0;
    return `${provider}|${nickname}|${formatSubscriberCount(subCount)}`;
  }
  return 'YOUTUBE|Anonymous|0';
};

const buildPostAuthorInfo = (post: ApiPost): string => {
  if (post.author) {
    const account = post.author.accounts?.[0];
    const provider = account?.provider || 'YOUTUBE';
    const nickname = post.author.nickname;
    const subCount = account?.subscriberCount || 0;
    return `${provider}|${nickname}|${formatSubscriberCount(subCount)}`;
  }
  return 'YOUTUBE|Anonymous|0';
};

export const PostDetail: React.FC<PostDetailProps> = ({ postId, onBack, onAccessDenied }) => {
  const [commentText, setCommentText] = useState('');
  const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null);
  const [uploadedCommentImage, setUploadedCommentImage] = useState<{ url: string; key: string } | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTarget, setMenuTarget] = useState<{ type: 'post' | 'comment'; id: string; authorId?: string; isReply?: boolean } | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [accessDeniedOpen, setAccessDeniedOpen] = useState(false);
  const [replyingToComment, setReplyingToComment] = useState<ApiComment | null>(null);

  const commentFileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  // Zustand 스토어
  const { currentPost, isLoading: postLoading, errorCode, fetchPostById, toggleLike, clearError } = usePostStore();
  const {
    comments,
    total: totalComments,
    isLoading: commentsLoading,
    isSubmitting,
    fetchComments,
    addComment,
    toggleLike: toggleCommentLike,
    clearComments,
  } = useCommentStore();
  const { getChannelById } = useChannelStore();

  // 이미 fetch한 게시글 ID 추적 (StrictMode 중복 호출 방지)
  const fetchedPostIdRef = useRef<string | null>(null);

  // 게시글 및 댓글 로드
  useEffect(() => {
    // 같은 게시글을 이미 fetch했으면 스킵 (조회수 중복 증가 방지)
    if (fetchedPostIdRef.current !== postId) {
      fetchedPostIdRef.current = postId;
      fetchPostById(postId);
    }
    fetchComments(postId);

    return () => {
      clearComments();
    };
  }, [postId, fetchPostById, fetchComments, clearComments]);

  // 403 에러 감지 시 처리
  useEffect(() => {
    if (errorCode === 403) {
      if (onAccessDenied) {
        // URL로 직접 접근한 경우 외부에서 처리
        onAccessDenied();
      } else {
        // 앱 내부 네비게이션인 경우 모달 표시
        setAccessDeniedOpen(true);
      }
    }
  }, [errorCode, onAccessDenied]);

  // 접근 불가 모달 닫기 및 뒤로가기
  const handleAccessDeniedClose = useCallback(() => {
    setAccessDeniedOpen(false);
    clearError();
    onBack();
  }, [clearError, onBack]);

  const channel = currentPost ? getChannelById(currentPost.channelId) : null;

  const handleCommentImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setCommentImagePreview(previewUrl);
      setIsUploadingImage(true);

      try {
        const result = await uploadImage(file, 'comments');
        setUploadedCommentImage({ url: result.url, key: result.key });
      } catch (error) {
        console.error('Failed to upload comment image:', error);
        // 전역 인터셉터에서 토스트 처리
        setCommentImagePreview(null);
      } finally {
        setIsUploadingImage(false);
      }
    }
  }, []);

  const handleReplyClick = useCallback((comment: ApiComment) => {
    setReplyingToComment(comment);
  }, []);

  const handleCommentSubmit = useCallback(async () => {
    if (!commentText.trim() && !uploadedCommentImage) return;
    if (isUploadingImage) return;

    try {
      await addComment({
        postId,
        content: commentText,
        imageUrl: uploadedCommentImage?.url || undefined,
        imageKey: uploadedCommentImage?.key || undefined,
        parentId: undefined,
      });
      setCommentText('');
      setCommentImagePreview(null);
      setUploadedCommentImage(null);

      // 댓글 작성 후 맨 아래로 스크롤 (API 완료 후 다음 렌더링)
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth',
        });
      });
    } catch (error) {
      console.error('Failed to add comment:', error);
      // 전역 인터셉터에서 토스트 처리
    }
  }, [commentText, uploadedCommentImage, isUploadingImage, postId, addComment]);

  const openMenu = (type: 'post' | 'comment', id: string, authorId?: string, isReply?: boolean) => {
    setMenuTarget({ type, id, authorId, isReply });
    setMenuOpen(true);
  };

  const handleBlock = useCallback(async () => {
    if (!menuTarget?.authorId) {
      toast.error('No user information to block.');
      return;
    }

    try {
      await blockUser(menuTarget.authorId);
      toast.success('User has been blocked.');
    } catch (err: unknown) {
      // 전역 인터셉터에서 토스트 처리
      console.error('Failed to block user:', err);
    }
  }, [menuTarget?.authorId]);

  const handleReportSubmit = useCallback(() => {
    setReportOpen(false);
    toast.success('Report has been submitted.');
  }, []);

  const handlePostLike = useCallback(() => {
    if (currentPost) {
      toggleLike(currentPost.id);
    }
  }, [currentPost, toggleLike]);

  const handleShare = useCallback(async () => {
    if (!currentPost) return;

    const shareUrl = `${window.location.origin}/post/${currentPost.id}`;
    const shareText = `${currentPost.title}\n\n${shareUrl}`;

    // Web Share API 지원 확인
    if (navigator.share) {
      try {
        await navigator.share({
          title: currentPost.title,
          text: currentPost.content.slice(0, 100) + (currentPost.content.length > 100 ? '...' : ''),
          url: shareUrl,
        });
      } catch (err) {
        // 사용자가 취소한 경우 무시
        if ((err as Error).name !== 'AbortError') {
          console.error('Share failed:', err);
        }
      }
    } else {
      // 클립보드에 복사
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success('Link copied to clipboard.');
      } catch (err) {
        console.error('Clipboard copy failed:', err);
        toast.error('Failed to copy link.');
      }
    }
  }, [currentPost]);

  const handleCommentLike = useCallback((commentId: string) => {
    toggleCommentLike(commentId);
  }, [toggleCommentLike]);

  const handleLoadMoreComments = useCallback(() => {
    const currentPage = Math.ceil(comments.length / 20);
    fetchComments(postId, currentPage + 1, true);
  }, [comments.length, postId, fetchComments]);

  if (postLoading || !currentPost) {
    return (
      <Container>
        <Header>
          <BackButton onClick={onBack} aria-label="Go back">
            <ChevronLeft />
          </BackButton>
          <HeaderTitle>Post</HeaderTitle>
          <MenuButton aria-label="Menu">
            <MoreVertical />
          </MenuButton>
        </Header>
        <DetailSkeleton />
      </Container>
    );
  }

  const authorInfo = buildPostAuthorInfo(currentPost);
  const images = currentPost.images || [];

  return (
    <Container>
      <Header>
        <BackButton onClick={onBack} aria-label="Go back">
          <ChevronLeft />
        </BackButton>
        <HeaderTitle>{channel?.name || 'Post'}</HeaderTitle>
        <MenuButton onClick={() => openMenu('post', currentPost.id, currentPost.authorId)} aria-label="Post menu">
          <MoreVertical />
        </MenuButton>
      </Header>

      <ScrollContent ref={scrollRef} className="no-scrollbar">
        <PostSection>
          <AuthorRow>
            <AuthorDisplay
              infoString={authorInfo}
              iconSize={32}
              time={formatRelativeTime(currentPost.createdAt)}
              adjustIconMargin
            />
          </AuthorRow>
          <PostTitle>{currentPost.title}</PostTitle>
          <PostContent>{currentPost.content}</PostContent>
          {images.length > 0 && images.map((image, index) => (
            <PostImage key={image.id}>
              <img src={image.url} alt={`Post content ${index + 1}`} />
            </PostImage>
          ))}
          <ActionRow>
            <ActionButton $active={currentPost.isLiked} onClick={handlePostLike}>
              <ThumbsUp fill={currentPost.isLiked ? "currentColor" : "none"} />
              {formatCount(currentPost.likeCount)}
            </ActionButton>
            <ActionButton>
              <MessageCircle /> {formatCount(currentPost.commentCount)}
            </ActionButton>
            <ActionButton onClick={handleShare}>
              <Share2 /> Share
            </ActionButton>
          </ActionRow>
        </PostSection>

        <CommentsSection>
          <CommentsHeader>
            <span>Comments {totalComments}</span>
            {comments.length < totalComments && (
              <LoadMoreButton onClick={handleLoadMoreComments}>
                Load More
              </LoadMoreButton>
            )}
          </CommentsHeader>

          {commentsLoading && comments.length === 0 ? (
            <CommentItem>
              <CommentContent style={{ color: '#6b7280' }}>Loading comments...</CommentContent>
            </CommentItem>
          ) : comments.length === 0 ? (
            <CommentItem>
              <CommentContent style={{ color: '#6b7280' }}>No comments yet. Be the first to comment!</CommentContent>
            </CommentItem>
          ) : (
            comments.map((comment) => (
              <React.Fragment key={comment.id}>
                <CommentItem>
                  <CommentHeader>
                    <AuthorDisplay infoString={buildAuthorInfo(comment)} iconSize={32} adjustIconMargin />
                    <CommentMenuButton onClick={() => openMenu('comment', comment.id, comment.authorId)} aria-label="Comment menu">
                      <MoreHorizontal />
                    </CommentMenuButton>
                  </CommentHeader>
                  <CommentContent>{comment.content}</CommentContent>
                  {comment.image && (
                    <CommentImage>
                      <img src={comment.image} alt="Comment" />
                    </CommentImage>
                  )}
                  <CommentMeta>
                    <span>{formatRelativeTime(comment.createdAt)}</span>
                    <CommentAction onClick={() => handleCommentLike(comment.id)}>
                      <ThumbsUp fill={comment.isLiked ? "currentColor" : "none"} />
                      {comment.likeCount}
                    </CommentAction>
                    <ReplyButton onClick={() => handleReplyClick(comment)}>
                      Reply
                    </ReplyButton>
                  </CommentMeta>
                </CommentItem>
                {comment.replies && comment.replies.length > 0 && (
                  <RepliesContainer>
                    {comment.replies.slice(0, 3).map((reply) => (
                      <CommentItem key={reply.id} $isReply onClick={() => handleReplyClick(comment)}>
                        <CommentHeader>
                          <AuthorDisplay infoString={buildAuthorInfo(reply)} iconSize={32} adjustIconMargin />
                          <CommentMenuButton onClick={(e) => { e.stopPropagation(); openMenu('comment', reply.id, reply.authorId, true); }} aria-label="Reply menu">
                            <MoreHorizontal />
                          </CommentMenuButton>
                        </CommentHeader>
                        <CommentContent>{reply.content}</CommentContent>
                        <CommentMeta>
                          <span>{formatRelativeTime(reply.createdAt)}</span>
                          <CommentAction onClick={(e) => { e.stopPropagation(); handleCommentLike(reply.id); }}>
                            <ThumbsUp fill={reply.isLiked ? "currentColor" : "none"} />
                            {reply.likeCount}
                          </CommentAction>
                        </CommentMeta>
                      </CommentItem>
                    ))}
                    {comment.replies.length > 3 && (
                      <MoreRepliesButton onClick={() => handleReplyClick(comment)}>
                        <MessageSquare />
                        View {comment.replies.length - 3} more replies
                      </MoreRepliesButton>
                    )}
                  </RepliesContainer>
                )}
              </React.Fragment>
            ))
          )}
        </CommentsSection>
      </ScrollContent>

      <CommentInputWrapper>
        {commentImagePreview && (
          <ImagePreview>
            <img src={commentImagePreview} alt="Preview" />
            {isUploadingImage && (
              <UploadingOverlay>
                <Loader2 />
                Uploading...
              </UploadingOverlay>
            )}
            <RemovePreviewButton onClick={() => {
              setCommentImagePreview(null);
              setUploadedCommentImage(null);
            }} aria-label="Remove image">
              <X />
            </RemovePreviewButton>
          </ImagePreview>
        )}
        <InputRow>
          <CameraButton onClick={() => commentFileRef.current?.click()} aria-label="Add image">
            <Camera />
          </CameraButton>
          <HiddenInput
            ref={commentFileRef}
            type="file"
            accept="image/*"
            onChange={handleCommentImageSelect}
          />
          <InputContainer>
            <CommentInput
              ref={inputRef}
              type="text"
              placeholder="Leave a comment..."
              value={commentText}
              onChange={(e) => setCommentText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isSubmitting && handleCommentSubmit()}
              disabled={isSubmitting}
            />
          </InputContainer>
          <SubmitCommentButton
            $active={!!(commentText.trim() || uploadedCommentImage) && !isUploadingImage}
            disabled={(!commentText.trim() && !uploadedCommentImage) || isSubmitting || isUploadingImage}
            onClick={handleCommentSubmit}
          >
            {isSubmitting ? <Loader2 /> : 'Post'}
          </SubmitCommentButton>
        </InputRow>
      </CommentInputWrapper>

      <MenuBottomSheet
        isOpen={menuOpen}
        isComment={menuTarget?.type === 'comment'}
        onClose={() => setMenuOpen(false)}
        onReply={menuTarget?.type === 'comment' && !menuTarget?.isReply ? () => {
          const targetComment = comments.find(c => c.id === menuTarget.id);
          if (targetComment) handleReplyClick(targetComment);
        } : undefined}
        onReport={() => setReportOpen(true)}
        onBlock={handleBlock}
      />

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={handleReportSubmit}
        targetType={menuTarget?.type === 'comment' ? 'COMMENT' : 'POST'}
        postId={menuTarget?.type === 'post' ? menuTarget.id : undefined}
        commentId={menuTarget?.type === 'comment' ? menuTarget.id : undefined}
        targetUserId={menuTarget?.authorId}
      />

      {accessDeniedOpen && (
        <ModalOverlay onClick={handleAccessDeniedClose}>
          <ModalContent onClick={(e) => e.stopPropagation()}>
            <ModalTitle>Access Denied</ModalTitle>
            <ModalMessage>
              You don't have access to this channel.<br />
              Available channels depend on your subscriber count.
            </ModalMessage>
            <ModalButton onClick={handleAccessDeniedClose}>
              OK
            </ModalButton>
          </ModalContent>
        </ModalOverlay>
      )}

      {replyingToComment && currentPost && (
        <ReplyPage
          postId={postId}
          parentComment={replyingToComment}
          onBack={() => {
            setReplyingToComment(null);
            fetchComments(postId); // 답글 페이지에서 돌아올 때 댓글 새로고침
          }}
        />
      )}
    </Container>
  );
};

export default PostDetail;
