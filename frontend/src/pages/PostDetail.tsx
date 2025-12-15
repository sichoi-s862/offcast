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
  Loader2
} from 'lucide-react';
import { AuthorDisplay } from '../components/common/AuthorDisplay';
import { DetailSkeleton } from '../components/common/Skeleton';
import { MenuBottomSheet } from '../components/modals/MenuBottomSheet';
import { ReportModal } from '../components/modals/ReportModal';
import type { ApiPost, ApiComment, CurrentUser } from '../types';
import { usePostStore, useCommentStore, useChannelStore, toast } from '../stores';
import { formatRelativeTime, formatCount } from '../utils/format';
import { blockUser, uploadImage } from '../api';

interface PostDetailProps {
  postId: string;
  currentUser: CurrentUser;
  onBack: () => void;
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
  padding: 8px;
  margin-left: -8px;
  color: white;
  border-radius: 50%;

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
  padding: 8px;
  color: #9ca3af;

  &:hover {
    color: white;
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
  border-radius: 8px;
  overflow: hidden;
  border: 1px solid #1f2937;

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
  color: ${props => props.$active ? '#7c3aed' : '#9ca3af'};
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
  color: #7c3aed;
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
  padding: 4px;

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
  color: #6b7280;
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

const ReplyIndicator = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  background-color: #1f2937;
  padding: 8px 12px;
  border-radius: 4px;
  font-size: 12px;
  color: #d1d5db;
`;

const ReplyCloseButton = styled.button`
  padding: 4px;

  &:hover {
    background-color: #374151;
  }

  svg {
    width: 12px;
    height: 12px;
    color: #9ca3af;
  }
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
  top: -4px;
  right: -4px;
  background-color: #1f2937;
  border-radius: 50%;
  padding: 2px;
  border: 1px solid #4b5563;

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
  padding: 8px;

  &:hover {
    color: white;
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
    color: #6b7280;
  }
`;

const SubmitCommentButton = styled.button<{ $active: boolean }>`
  padding: 8px;
  font-weight: 700;
  font-size: 14px;
  color: ${props => props.$active ? '#7c3aed' : '#4b5563'};
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

const Spacer = styled.div`
  height: 80px;
`;

// 작성자 정보 문자열 생성
const buildAuthorInfo = (comment: ApiComment): string => {
  if (comment.author) {
    const account = comment.author.accounts?.[0];
    const provider = account?.provider || 'YOUTUBE';
    const nickname = comment.author.nickname;
    const subCount = account?.subscriberCount || 0;
    return `${provider}|${nickname}|${subCount}`;
  }
  return 'YOUTUBE|익명|0';
};

const buildPostAuthorInfo = (post: ApiPost): string => {
  if (post.author) {
    const account = post.author.accounts?.[0];
    const provider = account?.provider || 'YOUTUBE';
    const nickname = post.author.nickname;
    const subCount = account?.subscriberCount || 0;
    return `${provider}|${nickname}|${subCount}`;
  }
  return 'YOUTUBE|익명|0';
};

export const PostDetail: React.FC<PostDetailProps> = ({ postId, onBack }) => {
  const [commentText, setCommentText] = useState('');
  const [commentImagePreview, setCommentImagePreview] = useState<string | null>(null);
  const [uploadedCommentImage, setUploadedCommentImage] = useState<{ url: string; key: string } | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTarget, setMenuTarget] = useState<{ type: 'post' | 'comment'; id: string; authorId?: string } | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const commentFileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Zustand 스토어
  const { currentPost, isLoading: postLoading, fetchPostById, toggleLike } = usePostStore();
  const {
    comments,
    total: totalComments,
    isLoading: commentsLoading,
    isSubmitting,
    replyingToId,
    fetchComments,
    addComment,
    toggleLike: toggleCommentLike,
    setReplyingTo,
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

  const handleReplyClick = useCallback((commentId: string) => {
    setReplyingTo(commentId);
    inputRef.current?.focus();
  }, [setReplyingTo]);

  const handleCommentSubmit = useCallback(async () => {
    if (!commentText.trim() && !uploadedCommentImage) return;
    if (isUploadingImage) return;

    try {
      await addComment({
        postId,
        content: commentText,
        imageUrl: uploadedCommentImage?.url || undefined,
        imageKey: uploadedCommentImage?.key || undefined,
        parentId: replyingToId || undefined,
      });
      setCommentText('');
      setCommentImagePreview(null);
      setUploadedCommentImage(null);
    } catch (error) {
      console.error('Failed to add comment:', error);
      // 전역 인터셉터에서 토스트 처리
    }
  }, [commentText, uploadedCommentImage, isUploadingImage, postId, replyingToId, addComment]);

  const openMenu = (type: 'post' | 'comment', id: string, authorId?: string) => {
    setMenuTarget({ type, id, authorId });
    setMenuOpen(true);
  };

  const handleBlock = useCallback(async () => {
    if (!menuTarget?.authorId) {
      toast.error('차단할 사용자 정보가 없습니다.');
      return;
    }

    try {
      await blockUser(menuTarget.authorId);
      toast.success('사용자를 차단했습니다.');
    } catch (err: unknown) {
      // 전역 인터셉터에서 토스트 처리
      console.error('Failed to block user:', err);
    }
  }, [menuTarget?.authorId]);

  const handleReportSubmit = useCallback(() => {
    setReportOpen(false);
    toast.success('신고가 접수되었습니다.');
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
          console.error('공유 실패:', err);
        }
      }
    } else {
      // 클립보드에 복사
      try {
        await navigator.clipboard.writeText(shareText);
        toast.success('링크가 클립보드에 복사되었습니다.');
      } catch (err) {
        console.error('클립보드 복사 실패:', err);
        toast.error('링크 복사에 실패했습니다.');
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
          <BackButton onClick={onBack}>
            <ChevronLeft />
          </BackButton>
          <HeaderTitle>게시글</HeaderTitle>
          <MenuButton>
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
        <BackButton onClick={onBack}>
          <ChevronLeft />
        </BackButton>
        <HeaderTitle>{channel?.name || '게시글'}</HeaderTitle>
        <MenuButton onClick={() => openMenu('post', currentPost.id, currentPost.authorId)}>
          <MoreVertical />
        </MenuButton>
      </Header>

      <ScrollContent className="no-scrollbar">
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
              <Share2 /> 공유
            </ActionButton>
          </ActionRow>
        </PostSection>

        <CommentsSection>
          <CommentsHeader>
            <span>댓글 {totalComments}</span>
            {comments.length < totalComments && (
              <LoadMoreButton onClick={handleLoadMoreComments}>
                더 보기
              </LoadMoreButton>
            )}
          </CommentsHeader>

          {commentsLoading && comments.length === 0 ? (
            <CommentItem>
              <CommentContent style={{ color: '#6b7280' }}>댓글을 불러오는 중...</CommentContent>
            </CommentItem>
          ) : comments.length === 0 ? (
            <CommentItem>
              <CommentContent style={{ color: '#6b7280' }}>아직 댓글이 없습니다. 첫 댓글을 남겨보세요!</CommentContent>
            </CommentItem>
          ) : (
            comments.map((comment) => (
              <React.Fragment key={comment.id}>
                <CommentItem>
                  <CommentHeader>
                    <AuthorDisplay infoString={buildAuthorInfo(comment)} iconSize={32} adjustIconMargin />
                    <CommentMenuButton onClick={() => openMenu('comment', comment.id, comment.authorId)}>
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
                    <ReplyButton onClick={() => handleReplyClick(comment.id)}>
                      답글 쓰기
                    </ReplyButton>
                  </CommentMeta>
                </CommentItem>
                {comment.replies?.map((reply) => (
                  <CommentItem key={reply.id} $isReply>
                    <CommentHeader>
                      <AuthorDisplay infoString={buildAuthorInfo(reply)} iconSize={32} adjustIconMargin />
                      <CommentMenuButton onClick={() => openMenu('comment', reply.id, reply.authorId)}>
                        <MoreHorizontal />
                      </CommentMenuButton>
                    </CommentHeader>
                    <CommentContent>{reply.content}</CommentContent>
                    <CommentMeta>
                      <span>{formatRelativeTime(reply.createdAt)}</span>
                      <CommentAction onClick={() => handleCommentLike(reply.id)}>
                        <ThumbsUp fill={reply.isLiked ? "currentColor" : "none"} />
                        {reply.likeCount}
                      </CommentAction>
                    </CommentMeta>
                  </CommentItem>
                ))}
              </React.Fragment>
            ))
          )}
          <Spacer />
        </CommentsSection>
      </ScrollContent>

      <CommentInputWrapper>
        {replyingToId && (
          <ReplyIndicator>
            <span>답글 작성 중...</span>
            <ReplyCloseButton onClick={() => setReplyingTo(null)}>
              <X />
            </ReplyCloseButton>
          </ReplyIndicator>
        )}
        {commentImagePreview && (
          <ImagePreview>
            <img src={commentImagePreview} alt="Preview" />
            {isUploadingImage && (
              <UploadingOverlay>
                <Loader2 />
                업로드 중...
              </UploadingOverlay>
            )}
            <RemovePreviewButton onClick={() => {
              setCommentImagePreview(null);
              setUploadedCommentImage(null);
            }}>
              <X />
            </RemovePreviewButton>
          </ImagePreview>
        )}
        <InputRow>
          <CameraButton onClick={() => commentFileRef.current?.click()}>
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
              placeholder={replyingToId ? "답글을 입력하세요." : "댓글을 남겨주세요."}
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
            {isSubmitting ? <Loader2 /> : '등록'}
          </SubmitCommentButton>
        </InputRow>
      </CommentInputWrapper>

      <MenuBottomSheet
        isOpen={menuOpen}
        isComment={menuTarget?.type === 'comment'}
        onClose={() => setMenuOpen(false)}
        onReply={menuTarget?.type === 'comment' ? () => handleReplyClick(menuTarget.id) : undefined}
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
    </Container>
  );
};

export default PostDetail;
