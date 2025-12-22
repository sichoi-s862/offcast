import React, { useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { FileText, ThumbsUp, MessageCircle, Loader2, RefreshCw } from 'lucide-react';
import { SubPageHeader } from '../../components/common/SubPageHeader';
import type { ApiPost, CurrentUser } from '../../types';
import { usePostStore } from '../../stores';
import { formatRelativeTime, formatCount } from '../../utils/format';

interface MyPostsPageProps {
  currentUser: CurrentUser;
  onBack: () => void;
  onPostClick: (post: ApiPost) => void;
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
  min-height: 100vh;
  background-color: black;
  padding-bottom: 80px;
  animation: ${slideIn} 0.3s ease-out;
  max-width: 768px;
  margin: 0 auto;
`;

const PostList = styled.div`
  & > * + * {
    border-top: 1px solid #1f2937;
  }
`;

const PostItem = styled.div`
  padding: 16px;
  cursor: pointer;

  &:hover {
    background-color: rgba(17, 24, 39, 0.5);
  }
`;

const PostTitle = styled.h3`
  font-size: 18px;
  font-weight: 700;
  color: #f3f4f6;
  margin-bottom: 4px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const PostContent = styled.p`
  font-size: 14px;
  color: #9ca3af;
  margin-bottom: 8px;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  overflow: hidden;
`;

const PostMeta = styled.div`
  display: flex;
  align-items: center;
  gap: 12px;
  font-size: 12px;
  color: #6b7280;
`;

const MetaItem = styled.span`
  display: flex;
  align-items: center;
  gap: 4px;

  svg {
    width: 12px;
    height: 12px;
  }
`;

const EmptyState = styled.div`
  padding: 80px 20px;
  text-align: center;
  color: #6b7280;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;

  svg {
    width: 48px;
    height: 48px;
    opacity: 0.2;
  }
`;

const LoadingState = styled.div`
  padding: 60px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
  color: #6b7280;

  svg {
    width: 32px;
    height: 32px;
    animation: ${spin} 1s linear infinite;
  }
`;

const LoadMoreButton = styled.button`
  width: 100%;
  padding: 16px;
  display: flex;
  align-items: center;
  justify-content: center;
  gap: 8px;
  color: #00D4AA;
  font-size: 14px;
  border-top: 1px solid #1f2937;

  &:hover {
    background-color: rgba(0, 212, 170, 0.1);
  }

  svg {
    width: 16px;
    height: 16px;
  }

  &.loading svg {
    animation: ${spin} 1s linear infinite;
  }
`;

export const MyPostsPage: React.FC<MyPostsPageProps> = ({
  onBack,
  onPostClick
}) => {
  const {
    myPosts,
    total,
    page,
    isLoading,
    isLoadingMore,
    fetchMyPosts,
  } = usePostStore();

  // 컴포넌트 마운트 시 내 게시글 로드
  useEffect(() => {
    fetchMyPosts(1);
  }, [fetchMyPosts]);

  // 더 불러오기
  const handleLoadMore = useCallback(() => {
    if (!isLoadingMore) {
      fetchMyPosts(page + 1, true);
    }
  }, [page, isLoadingMore, fetchMyPosts]);

  const hasMore = myPosts.length < total;

  // 로딩 상태
  if (isLoading && myPosts.length === 0) {
    return (
      <Container>
        <SubPageHeader title="My Posts" onBack={onBack} />
        <LoadingState>
          <Loader2 />
          <span>Loading...</span>
        </LoadingState>
      </Container>
    );
  }

  return (
    <Container>
      <SubPageHeader title="My Posts" onBack={onBack} />
      {myPosts.length > 0 ? (
        <>
          <PostList>
            {myPosts.map(post => (
              <PostItem key={post.id} onClick={() => onPostClick(post)}>
                <PostTitle>{post.title}</PostTitle>
                <PostContent>{post.content}</PostContent>
                <PostMeta>
                  <span>{formatRelativeTime(post.createdAt)}</span>
                  <MetaItem>
                    <ThumbsUp /> {formatCount(post.likeCount)}
                  </MetaItem>
                  <MetaItem>
                    <MessageCircle /> {formatCount(post.commentCount)}
                  </MetaItem>
                </PostMeta>
              </PostItem>
            ))}
          </PostList>
          {hasMore && (
            <LoadMoreButton
              onClick={handleLoadMore}
              className={isLoadingMore ? 'loading' : ''}
              disabled={isLoadingMore}
            >
              {isLoadingMore ? (
                <>
                  <Loader2 />
                  Loading...
                </>
              ) : (
                <>
                  <RefreshCw />
                  Load More
                </>
              )}
            </LoadMoreButton>
          )}
        </>
      ) : (
        <EmptyState>
          <FileText />
          <p>No posts yet.</p>
        </EmptyState>
      )}
    </Container>
  );
};

export default MyPostsPage;
