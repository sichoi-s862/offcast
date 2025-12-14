import React, { useState, useRef, useEffect } from 'react';
import styled, { keyframes } from 'styled-components';
import {
  ChevronLeft,
  MoreVertical,
  ThumbsUp,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Camera,
  X
} from 'lucide-react';
import { AuthorDisplay } from '../components/common/AuthorDisplay';
import { DetailSkeleton } from '../components/common/Skeleton';
import { MenuBottomSheet } from '../components/modals/MenuBottomSheet';
import { ReportModal } from '../components/modals/ReportModal';
import type { Post, Comment, CurrentUser } from '../types';
import { CHANNELS } from '../constants';

interface PostDetailProps {
  post: Post;
  currentUser: CurrentUser;
  onBack: () => void;
}

const MOCK_COMMENTS: Comment[] = [
  {
    id: 1,
    authorInfo: 'YouTube|반도체장인|100명+',
    content: '저도 그 마음 이해합니다 ㅠㅠ 힘내세요!',
    time: '5분 전',
    likes: 12,
    image: null,
    replies: [
      { id: 101, authorInfo: 'Instagram|직장인A|100명 미만', content: '감사합니다.. 버텨봐야죠 ㅠㅠ', time: '방금 전', likes: 2, image: null }
    ]
  },
  {
    id: 2,
    authorInfo: 'Chzzk|치즈도둑|150만명+',
    content: '와 형님 팬입니다!!',
    time: '12분 전',
    likes: 8,
    image: null,
    replies: []
  },
];

const fadeIn = keyframes`
  from { opacity: 0; transform: translateX(20px); }
  to { opacity: 1; transform: translateX(0); }
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

const AuthorMeta = styled.div`
  display: flex;
  flex-direction: column;
`;

const TimeText = styled.div`
  font-size: 12px;
  color: #6b7280;
  margin-top: 4px;
  padding-left: 30px;
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
  font-weight:400;
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
`;

const HiddenInput = styled.input`
  display: none;
`;

const Spacer = styled.div`
  height: 80px;
`;

export const PostDetail: React.FC<PostDetailProps> = ({ post, currentUser, onBack }) => {
  const [commentText, setCommentText] = useState('');
  const [commentImage, setCommentImage] = useState<string | null>(null);
  const [replyingTo, setReplyingTo] = useState<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [localComments, setLocalComments] = useState<Comment[]>(MOCK_COMMENTS);
  const [menuOpen, setMenuOpen] = useState(false);
  const [menuTarget, setMenuTarget] = useState<{ type: 'post' | 'comment'; id: number } | null>(null);
  const [reportOpen, setReportOpen] = useState(false);
  const [isLiked, setIsLiked] = useState(post.isLiked);
  const [likeCount, setLikeCount] = useState(post.likes);

  const commentFileRef = useRef<HTMLInputElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const channel = CHANNELS.find(c => c.id === post.channelId);
  const totalComments = localComments.reduce((acc, cur) => acc + 1 + cur.replies.length, 0);

  useEffect(() => {
    const timer = setTimeout(() => setIsLoading(false), 500);
    return () => clearTimeout(timer);
  }, []);

  const handleCommentImageSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setCommentImage(URL.createObjectURL(e.target.files[0]));
    }
  };

  const handleReplyClick = (commentId: number) => {
    setReplyingTo(commentId);
    inputRef.current?.focus();
  };

  const handleCommentSubmit = () => {
    if (!commentText.trim() && !commentImage) return;

    const authorString = `${currentUser.provider}|${currentUser.nickname}|${currentUser.subscriberCount}`;
    const newComment = {
      id: Date.now(),
      authorInfo: authorString,
      content: commentText,
      time: '방금 전',
      likes: 0,
      image: commentImage,
      replies: []
    };

    if (replyingTo) {
      setLocalComments(localComments.map(comment =>
        comment.id === replyingTo
          ? { ...comment, replies: [...comment.replies, { ...newComment, replies: undefined } as any] }
          : comment
      ));
      setReplyingTo(null);
    } else {
      setLocalComments([...localComments, newComment]);
    }
    setCommentText('');
    setCommentImage(null);
  };

  const openMenu = (type: 'post' | 'comment', id: number, _onReply?: () => void) => {
    setMenuTarget({ type, id });
    setMenuOpen(true);
  };

  const handleLike = () => {
    setIsLiked(!isLiked);
    setLikeCount(isLiked ? likeCount - 1 : likeCount + 1);
  };

  return (
    <Container>
      <Header>
        <BackButton onClick={onBack}>
          <ChevronLeft />
        </BackButton>
        <HeaderTitle>{channel?.name || '게시글'}</HeaderTitle>
        <MenuButton onClick={() => openMenu('post', post.id)}>
          <MoreVertical />
        </MenuButton>
      </Header>

      {isLoading ? (
        <DetailSkeleton />
      ) : (
        <ScrollContent className="no-scrollbar">
          <PostSection>
            <AuthorRow>
              <AuthorDisplay infoString={post.authorInfo} iconSize={32} time={post.time} adjustIconMargin />
            </AuthorRow>
            <PostTitle>{post.title}</PostTitle>
            <PostContent>{post.content}</PostContent>
            {post.image && (
              <PostImage>
                <img src={post.image} alt="Post content" />
              </PostImage>
            )}
            <ActionRow>
              <ActionButton $active={isLiked} onClick={handleLike}>
                <ThumbsUp fill={isLiked ? "currentColor" : "none"} /> {likeCount}
              </ActionButton>
              <ActionButton>
                <MessageCircle /> {totalComments}
              </ActionButton>
              <ActionButton>
                <Share2 /> 공유
              </ActionButton>
            </ActionRow>
          </PostSection>

          <CommentsSection>
            <CommentsHeader>댓글 {totalComments}</CommentsHeader>
            {localComments.map((comment) => (
              <React.Fragment key={comment.id}>
                <CommentItem>
                  <CommentHeader>
                    <AuthorDisplay infoString={comment.authorInfo} iconSize={32} adjustIconMargin />
                    <CommentMenuButton onClick={() => openMenu('comment', comment.id)}>
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
                    <span>{comment.time}</span>
                    <CommentAction>
                      <ThumbsUp /> {comment.likes}
                    </CommentAction>
                    <ReplyButton onClick={() => handleReplyClick(comment.id)}>
                      답글 쓰기
                    </ReplyButton>
                  </CommentMeta>
                </CommentItem>
                {comment.replies.map((reply) => (
                  <CommentItem key={reply.id} $isReply>
                    <CommentHeader>
                      <AuthorDisplay infoString={reply.authorInfo} iconSize={32} adjustIconMargin />
                      <CommentMenuButton onClick={() => openMenu('comment', reply.id)}>
                        <MoreHorizontal />
                      </CommentMenuButton>
                    </CommentHeader>
                    <CommentContent>{reply.content}</CommentContent>
                    <CommentMeta>
                      <span>{reply.time}</span>
                      <CommentAction>
                        <ThumbsUp /> {reply.likes}
                      </CommentAction>
                    </CommentMeta>
                  </CommentItem>
                ))}
              </React.Fragment>
            ))}
            <Spacer />
          </CommentsSection>
        </ScrollContent>
      )}

      {!isLoading && (
        <CommentInputWrapper>
          {replyingTo && (
            <ReplyIndicator>
              <span>답글 작성 중...</span>
              <ReplyCloseButton onClick={() => setReplyingTo(null)}>
                <X />
              </ReplyCloseButton>
            </ReplyIndicator>
          )}
          {commentImage && (
            <ImagePreview>
              <img src={commentImage} alt="Preview" />
              <RemovePreviewButton onClick={() => setCommentImage(null)}>
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
                placeholder={replyingTo ? "답글을 입력하세요." : "댓글을 남겨주세요."}
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCommentSubmit()}
              />
            </InputContainer>
            <SubmitCommentButton
              $active={!!(commentText.trim() || commentImage)}
              disabled={!commentText.trim() && !commentImage}
              onClick={handleCommentSubmit}
            >
              등록
            </SubmitCommentButton>
          </InputRow>
        </CommentInputWrapper>
      )}

      <MenuBottomSheet
        isOpen={menuOpen}
        isComment={menuTarget?.type === 'comment'}
        onClose={() => setMenuOpen(false)}
        onReply={menuTarget?.type === 'comment' ? () => handleReplyClick(menuTarget.id) : undefined}
        onReport={() => setReportOpen(true)}
        onBlock={() => alert("차단되었습니다.")}
      />

      <ReportModal
        isOpen={reportOpen}
        onClose={() => setReportOpen(false)}
        onSubmit={() => {
          setReportOpen(false);
          alert("신고가 접수되었습니다.");
        }}
      />
    </Container>
  );
};

export default PostDetail;
