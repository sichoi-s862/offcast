import React, { memo, useCallback, useMemo } from 'react';
import styled from 'styled-components';
import { ThumbsUp, MessageCircle, Eye, Lock } from 'lucide-react';
import { AuthorDisplay } from '../common/AuthorDisplay';
import type { ApiPost, CurrentUser } from '../../types';
import { useChannelStore, toast } from '../../stores';
import { formatRelativeTime, formatCount, formatSubscriberCount } from '../../utils/format';

interface PostCardProps {
  post: ApiPost;
  currentUser: CurrentUser;
  onPostClick: (post: ApiPost) => void;
  onLike: () => void;
}

const CardContainer = styled.div`
  padding: 16px;
  border-bottom: 1px solid #1f2937;
  cursor: pointer;
  position: relative;
  transition: background-color 0.2s;

  &:hover {
    background-color: rgba(17, 24, 39, 0.5);
  }
`;

const CardHeader = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 8px;
`;

const ChannelBadge = styled.span<{ $hasAccess: boolean }>`
  font-size: 14px;
  font-weight: 600;
  border-radius: 4px;
  color: #d1d5db;
  background-color: ${props => props.$hasAccess ? 'rgba(0, 212, 170, 0.1)' : '#1f2937'};
`;

const TimeText = styled.span`
  font-size: 12px;
  color: #9ca3af;
`;

const AuthorWrapper = styled.div<{ $blur: boolean }>`
  margin-bottom: 12px;
  filter: ${props => props.$blur ? 'blur(4px)' : 'none'};
`;

const ContentWrapper = styled.div<{ $blur: boolean }>`
  display: flex;
  justify-content: space-between;
  gap: 16px;
  margin-bottom: 12px;
  filter: ${props => props.$blur ? 'blur(4px)' : 'none'};
  user-select: ${props => props.$blur ? 'none' : 'auto'};
`;

const TextContent = styled.div`
  flex: 1;
`;

const PostTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #d1d5db;
  margin-bottom: 4px;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const PostContent = styled.p`
  font-size: 14px;
  color: #9ca3af;
  line-height: 1.5;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const Thumbnail = styled.div`
  width: 96px;
  height: 96px;
  border-radius: 8px;
  background-color: #1f2937;
  flex-shrink: 0;
  overflow: hidden;
  border: 1px solid #1f2937;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
`;

const LockOverlay = styled.div`
  position: absolute;
  inset: 0;
  display: flex;
  align-items: center;
  justify-content: center;
  z-index: 10;
`;

const LockBadge = styled.div`
  background-color: rgba(17, 24, 39, 0.9);
  border: 1px solid #374151;
  padding: 8px 16px;
  border-radius: 9999px;
  display: flex;
  align-items: center;
  gap: 8px;
  box-shadow: 0 20px 25px -5px rgba(0, 0, 0, 0.1);

  svg {
    width: 16px;
    height: 16px;
    color: #9ca3af;
  }

  span {
    font-size: 14px;
    font-weight: 700;
    color: #d1d5db;
  }
`;

const ActionsRow = styled.div<{ $blur: boolean }>`
  display: flex;
  align-items: center;
  gap: 20px;
  filter: ${props => props.$blur ? 'blur(4px)' : 'none'};
`;

const ActionButton = styled.button<{ $active?: boolean }>`
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 14px;
  color: ${props => props.$active ? '#00D4AA' : '#9ca3af'};
  transition: color 0.2s;
  padding: 8px;
  margin: -8px;
  border-radius: 8px;
  min-height: 44px;
  min-width: 44px;

  &:hover {
    color: ${props => props.$active ? '#00D4AA' : '#d1d5db'};
    background-color: rgba(255, 255, 255, 0.05);
  }

  &:active {
    background-color: rgba(255, 255, 255, 0.1);
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

// 작성자 정보 문자열 생성 (AuthorDisplay 컴포넌트용)
const buildAuthorInfo = (post: ApiPost): string => {
  if (post.author) {
    const account = post.author.accounts?.[0];
    const provider = account?.provider || 'YOUTUBE';
    const nickname = post.author.nickname;
    const subCount = account?.subscriberCount || 0;
    return `${provider}|${nickname}|${formatSubscriberCount(subCount)}`;
  }
  return 'YOUTUBE|Anonymous|0';
};

// Check if user has access to channel (subscriber count + provider)
const checkChannelAccess = (channel: ReturnType<typeof useChannelStore.getState>['channels'][0] | undefined, currentUser: CurrentUser): boolean => {
  if (!channel) return true;

  // Check subscriber count
  const hasSubAccess = currentUser.rawSubCount >= channel.minSubscribers;

  // Check provider restriction
  const hasProviderAccess = !channel.providerOnly ||
    (currentUser.providers?.includes(channel.providerOnly) ?? false);

  return hasSubAccess && hasProviderAccess;
};

const PostCardComponent: React.FC<PostCardProps> = ({
  post,
  currentUser,
  onPostClick,
  onLike
}) => {
  const { getChannelById } = useChannelStore();
  const channel = getChannelById(post.channelId);
  const hasAccess = useMemo(
    () => checkChannelAccess(channel, currentUser),
    [channel, currentUser]
  );

  const handleClick = useCallback(() => {
    if (hasAccess) {
      onPostClick(post);
    } else {
      toast.warning("You don't have access to this channel.");
    }
  }, [hasAccess, onPostClick, post]);

  const handleLikeClick = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (hasAccess) {
      onLike();
    }
  }, [hasAccess, onLike]);

  const authorInfo = useMemo(() => buildAuthorInfo(post), [post]);
  const thumbnail = post.images?.[0]?.url || null;
  const relativeTime = useMemo(() => formatRelativeTime(post.createdAt), [post.createdAt]);

  return (
    <CardContainer onClick={handleClick}>
      <CardHeader>
        <ChannelBadge $hasAccess={hasAccess}>
          {channel?.name || 'General'}
        </ChannelBadge>
        <TimeText>{relativeTime}</TimeText>
      </CardHeader>

      <AuthorWrapper $blur={!hasAccess}>
        <AuthorDisplay infoString={authorInfo} iconSize={32} adjustIconMargin />
      </AuthorWrapper>

      <ContentWrapper $blur={!hasAccess}>
        <TextContent>
          <PostTitle>{post.title}</PostTitle>
          <PostContent>{post.content}</PostContent>
        </TextContent>
        {thumbnail && (
          <Thumbnail>
            <img src={thumbnail} alt="thumbnail" loading="lazy" />
          </Thumbnail>
        )}
      </ContentWrapper>

      {!hasAccess && (
        <LockOverlay>
          <LockBadge>
            <Lock />
            <span>No Access</span>
          </LockBadge>
        </LockOverlay>
      )}

      <ActionsRow $blur={!hasAccess}>
        <ActionButton $active={post.isLiked} onClick={handleLikeClick} aria-label={`Like, ${post.likeCount} likes`}>
          <ThumbsUp fill={post.isLiked ? "currentColor" : "none"} />
          {formatCount(post.likeCount)}
        </ActionButton>
        <ActionButton aria-label={`Comments, ${post.commentCount} comments`}>
          <MessageCircle />
          {formatCount(post.commentCount)}
        </ActionButton>
        <ActionButton aria-label={`Views, ${post.viewCount} views`}>
          <Eye />
          {formatCount(post.viewCount)}
        </ActionButton>
      </ActionsRow>
    </CardContainer>
  );
};

export const PostCard = memo(PostCardComponent);

export default PostCard;
