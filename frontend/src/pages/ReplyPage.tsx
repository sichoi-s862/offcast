import React, { useState, useRef, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  ChevronLeft,
  ThumbsUp,
  Camera,
  X,
  Loader2,
  MoreHorizontal
} from 'lucide-react';
import { AuthorDisplay } from '../components/common/AuthorDisplay';
import { MenuBottomSheet } from '../components/modals/MenuBottomSheet';
import { ReportModal } from '../components/modals/ReportModal';
import type { ApiComment } from '../types';
import { useCommentStore, toast } from '../stores';
import { formatRelativeTime, formatSubscriberCount } from '../utils/format';
import { blockUser, uploadImage } from '../api';

interface ReplyPageProps {
  postId: string;
  parentComment: ApiComment;
  onBack: () => void;
}

const slideIn = keyframes`
  from { transform: translateX(100%); }
  to { transform: translateX(0); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
`;

const Container = styled.div`
  position: fixed;
  inset: 0;
  display: flex;
  flex-direction: column;
  height: 100vh;
  background-color: black;
  z-index: 60;
  animation: ${slideIn} 0.2s ease-out;
  max-width: 768px;
  margin: 0 auto;
  left: 0;
  right: 0;
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
  padding: 0 16px;
  gap: 12px;
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

const ScrollContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-bottom: 80px;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const ParentCommentSection = styled.div`
  padding: 16px;
  background-color: #111827;
  border-bottom: 1px solid #1f2937;
`;

const CommentHeader = styled.div`
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
`;

const CommentContent = styled.p`
  font-size: 15px;
  color: #e5e7eb;
  line-height: 1.6;
  white-space: pre-wrap;
`;

const CommentImage = styled.div`
  max-width: 200px;
  border-radius: 8px;
  overflow: hidden;
  margin-top: 12px;

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
  margin-top: 12px;
`;

const CommentAction = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
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

const MenuButton = styled.button`
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

const RepliesSection = styled.div`
  background-color: black;
`;

const RepliesHeader = styled.div`
  padding: 16px;
  font-size: 14px;
  font-weight: 700;
  color: white;
  border-bottom: 1px solid #111827;
`;

const ReplyItem = styled.div`
  padding: 16px;
  border-bottom: 1px solid #111827;
  display: flex;
  flex-direction: column;
  gap: 8px;
`;

const EmptyReplies = styled.div`
  padding: 32px 16px;
  text-align: center;
  color: #6b7280;
  font-size: 14px;
`;

const InputWrapper = styled.div`
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

const Input = styled.input`
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

const SubmitButton = styled.button<{ $active: boolean }>`
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

const SpinnerIcon = styled(Loader2)`
  animation: ${spin} 1s linear infinite;
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

export const ReplyPage: React.FC<ReplyPageProps> = ({
  postId,
  parentComment,
  onBack,
}) => {
  const [replyText, setReplyText] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [uploadedImage, setUploadedImage] = useState<{ url: string; key: string } | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTarget, setMenuTarget] = useState<{ id: string; authorId?: string } | null>(null);
  const [reportOpen, setReportOpen] = useState(false);

  const fileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const scrollRef = useRef<HTMLDivElement>(null);

  const { comments, isSubmitting, addComment, toggleLike: toggleCommentLike } = useCommentStore();

  // 페이지 진입 시 입력창에 포커스
  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const handleImageSelect = useCallback(async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const previewUrl = URL.createObjectURL(file);
      setImagePreview(previewUrl);
      setIsUploadingImage(true);

      try {
        const result = await uploadImage(file, 'comments');
        setUploadedImage({ url: result.url, key: result.key });
      } catch (error) {
        console.error('Failed to upload image:', error);
        setImagePreview(null);
      } finally {
        setIsUploadingImage(false);
      }
    }
  }, []);

  const handleSubmit = useCallback(async () => {
    if (!replyText.trim() && !uploadedImage) return;
    if (isUploadingImage) return;

    try {
      await addComment({
        postId,
        content: replyText,
        imageUrl: uploadedImage?.url || undefined,
        imageKey: uploadedImage?.key || undefined,
        parentId: parentComment.id,
      });
      setReplyText('');
      setImagePreview(null);
      setUploadedImage(null);

      // addComment 완료 후 (fetchComments 포함) 다음 렌더링에서 스크롤
      requestAnimationFrame(() => {
        scrollRef.current?.scrollTo({
          top: scrollRef.current.scrollHeight,
          behavior: 'smooth',
        });
      });
    } catch (error) {
      console.error('Failed to add reply:', error);
    }
  }, [replyText, uploadedImage, isUploadingImage, postId, parentComment.id, addComment]);

  const handleCommentLike = useCallback((commentId: string) => {
    toggleCommentLike(commentId);
  }, [toggleCommentLike]);

  const openMenu = (id: string, authorId?: string) => {
    setMenuTarget({ id, authorId });
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
      console.error('Failed to block user:', err);
    }
  }, [menuTarget?.authorId]);

  const handleReportSubmit = useCallback(() => {
    setReportOpen(false);
    toast.success('Report has been submitted.');
  }, []);

  // 스토어에서 최신 부모 댓글의 replies 가져오기
  const currentParent = comments.find(c => c.id === parentComment.id);
  const replies = currentParent?.replies || parentComment.replies || [];

  return (
    <Container>
      <Header>
        <BackButton onClick={onBack}>
          <ChevronLeft />
        </BackButton>
        <HeaderTitle>Replies</HeaderTitle>
      </Header>

      <ScrollContent ref={scrollRef} className="no-scrollbar">
        <ParentCommentSection>
          <CommentHeader>
            <AuthorDisplay infoString={buildAuthorInfo(parentComment)} iconSize={32} adjustIconMargin />
            <MenuButton onClick={() => openMenu(parentComment.id, parentComment.authorId)}>
              <MoreHorizontal />
            </MenuButton>
          </CommentHeader>
          <CommentContent>{parentComment.content}</CommentContent>
          {parentComment.image && (
            <CommentImage>
              <img src={parentComment.image} alt="Comment" />
            </CommentImage>
          )}
          <CommentMeta>
            <span>{formatRelativeTime(parentComment.createdAt)}</span>
            <CommentAction onClick={() => handleCommentLike(parentComment.id)}>
              <ThumbsUp fill={parentComment.isLiked ? "currentColor" : "none"} />
              {parentComment.likeCount}
            </CommentAction>
          </CommentMeta>
        </ParentCommentSection>

        <RepliesSection>
          <RepliesHeader>{replies.length} Replies</RepliesHeader>
          {replies.length === 0 ? (
            <EmptyReplies>No replies yet. Be the first to reply!</EmptyReplies>
          ) : (
            replies.map((reply) => (
              <ReplyItem key={reply.id}>
                <CommentHeader>
                  <AuthorDisplay infoString={buildAuthorInfo(reply)} iconSize={32} adjustIconMargin />
                  <MenuButton onClick={() => openMenu(reply.id, reply.authorId)}>
                    <MoreHorizontal />
                  </MenuButton>
                </CommentHeader>
                <CommentContent>{reply.content}</CommentContent>
                <CommentMeta>
                  <span>{formatRelativeTime(reply.createdAt)}</span>
                  <CommentAction onClick={() => handleCommentLike(reply.id)}>
                    <ThumbsUp fill={reply.isLiked ? "currentColor" : "none"} />
                    {reply.likeCount}
                  </CommentAction>
                </CommentMeta>
              </ReplyItem>
            ))
          )}
        </RepliesSection>
      </ScrollContent>

      <InputWrapper>
        {imagePreview && (
          <ImagePreview>
            <img src={imagePreview} alt="Preview" />
            {isUploadingImage && (
              <UploadingOverlay>
                <Loader2 />
                Uploading...
              </UploadingOverlay>
            )}
            <RemovePreviewButton onClick={() => {
              setImagePreview(null);
              setUploadedImage(null);
            }}>
              <X />
            </RemovePreviewButton>
          </ImagePreview>
        )}
        <InputRow>
          <CameraButton onClick={() => fileRef.current?.click()}>
            <Camera />
          </CameraButton>
          <HiddenInput
            ref={fileRef}
            type="file"
            accept="image/*"
            onChange={handleImageSelect}
          />
          <InputContainer>
            <Input
              ref={inputRef}
              type="text"
              placeholder="Write a reply..."
              value={replyText}
              onChange={(e) => setReplyText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && !isSubmitting && handleSubmit()}
              disabled={isSubmitting}
            />
          </InputContainer>
          <SubmitButton
            $active={!!(replyText.trim() || uploadedImage) && !isUploadingImage}
            disabled={(!replyText.trim() && !uploadedImage) || isSubmitting || isUploadingImage}
            onClick={handleSubmit}
          >
            {isSubmitting ? <SpinnerIcon /> : 'Post'}
          </SubmitButton>
        </InputRow>
      </InputWrapper>

      <MenuBottomSheet
        isOpen={menuOpen}
        isComment={true}
        onClose={() => setMenuOpen(false)}
        onReport={() => setReportOpen(true)}
        onBlock={handleBlock}
      />

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={handleReportSubmit}
        targetType="COMMENT"
        commentId={menuTarget?.id}
        targetUserId={menuTarget?.authorId}
      />
    </Container>
  );
};

export default ReplyPage;
