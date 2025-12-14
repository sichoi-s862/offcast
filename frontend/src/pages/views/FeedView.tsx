import React from 'react';
import styled, { keyframes } from 'styled-components';
import { Lock, Loader2 } from 'lucide-react';
import { PostCard } from '../../components/post/PostCard';
import { PostSkeleton } from '../../components/common/Skeleton';
import type { Post, CurrentUser } from '../../types';
import { CHANNELS } from '../../constants';

interface FeedViewProps {
  posts: Post[];
  currentUser: CurrentUser;
  displayCount: number;
  isLoading: boolean;
  isSearching: boolean;
  onPostClick: (post: Post) => void;
  onLike: (id: number) => void;
}

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

const Container = styled.div`
  padding-bottom: 80px;
  animation: ${fadeIn} 0.5s ease-out;
`;

const ChannelTabs = styled.div`
  display: flex;
  overflow-x: auto;
  padding: 12px 16px;
  gap: 8px;
  border-bottom: 1px solid #1f2937;

  &::-webkit-scrollbar {
    display: none;
  }
`;

const ChannelTab = styled.button<{ $locked: boolean }>`
  white-space: nowrap;
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid ${props => props.$locked ? '#1f2937' : '#374151'};
  background-color: ${props => props.$locked ? '#111827' : '#1f2937'};
  color: ${props => props.$locked ? '#6b7280' : '#d1d5db'};
  transition: background-color 0.2s;

  &:hover {
    background-color: ${props => props.$locked ? '#111827' : '#374151'};
  }

  svg {
    width: 12px;
    height: 12px;
  }
`;

const PostList = styled.div`
  display: flex;
  flex-direction: column;
`;

const LoadingMore = styled.div`
  padding: 24px;
  display: flex;
  justify-content: center;

  svg {
    width: 24px;
    height: 24px;
    color: #4b5563;
    animation: spin 1s linear infinite;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }
`;

export const FeedView: React.FC<FeedViewProps> = ({
  posts,
  currentUser,
  displayCount,
  isLoading,
  isSearching,
  onPostClick,
  onLike
}) => {
  const showSkeleton = isSearching || isLoading;
  const displayPosts = posts.slice(0, displayCount);

  return (
    <Container>
      <ChannelTabs className="no-scrollbar">
        {CHANNELS.map((c) => {
          const isLocked = currentUser.rawSubCount < c.minSubs;
          return (
            <ChannelTab key={c.id} $locked={isLocked}>
              {isLocked && <Lock />}
              {c.name}
            </ChannelTab>
          );
        })}
      </ChannelTabs>

      {showSkeleton ? (
        <PostList>
          {Array.from({ length: 10 }).map((_, i) => (
            <PostSkeleton key={i} />
          ))}
        </PostList>
      ) : (
        <>
          <PostList>
            {displayPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                onPostClick={onPostClick}
                onLike={onLike}
              />
            ))}
          </PostList>
          {displayCount < posts.length && (
            <LoadingMore>
              <Loader2 />
            </LoadingMore>
          )}
        </>
      )}
    </Container>
  );
};

export default FeedView;
