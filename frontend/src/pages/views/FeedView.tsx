import React, { useEffect, useCallback, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Lock, Loader2, RefreshCw } from 'lucide-react';
import { PostCard } from '../../components/post/PostCard';
import { PostSkeleton } from '../../components/common/Skeleton';
import type { CurrentUser, ApiPost } from '../../types';
import { usePostStore, useChannelStore } from '../../stores';

interface FeedViewProps {
  currentUser: CurrentUser;
  searchQuery?: string;
  onPostClick: (post: ApiPost) => void;
}

const fadeIn = keyframes`
  from { opacity: 0; transform: translateY(16px); }
  to { opacity: 1; transform: translateY(0); }
`;

const fadeOut = keyframes`
  from { opacity: 1; transform: translateY(0); }
  to { opacity: 0; transform: translateY(-8px); }
`;

const contentFadeIn = keyframes`
  from { opacity: 0; transform: translateY(8px); }
  to { opacity: 1; transform: translateY(0); }
`;

const spin = keyframes`
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
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

const ChannelTab = styled.button<{ $locked: boolean; $active: boolean }>`
  white-space: nowrap;
  padding: 6px 12px;
  border-radius: 9999px;
  font-size: 12px;
  font-weight: 700;
  display: flex;
  align-items: center;
  gap: 4px;
  border: 1px solid ${props => props.$active ? '#6366f1' : props.$locked ? '#1f2937' : '#374151'};
  background-color: ${props => props.$active ? '#4f46e5' : props.$locked ? '#111827' : '#1f2937'};
  color: ${props => props.$active ? '#fff' : props.$locked ? '#6b7280' : '#d1d5db'};
  cursor: ${props => props.$locked ? 'not-allowed' : 'pointer'};
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.$active ? '#4338ca' : props.$locked ? '#111827' : '#374151'};
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

const SkeletonWrapper = styled.div<{ $fading: boolean }>`
  animation: ${props => props.$fading ? fadeOut : 'none'} 0.4s ease-out forwards;
`;

const ContentWrapper = styled.div<{ $entering: boolean }>`
  animation: ${props => props.$entering ? contentFadeIn : 'none'} 0.4s ease-out;
`;

const LoadingMore = styled.div`
  padding: 24px;
  display: flex;
  justify-content: center;

  svg {
    width: 24px;
    height: 24px;
    color: #4b5563;
    animation: ${spin} 1s linear infinite;
  }
`;

const EmptyState = styled.div`
  padding: 60px 20px;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 16px;
`;

const EmptyText = styled.p`
  color: #6b7280;
  font-size: 14px;
  text-align: center;
`;

const RefreshButton = styled.button`
  display: flex;
  align-items: center;
  gap: 8px;
  padding: 10px 20px;
  background-color: #374151;
  border: none;
  border-radius: 8px;
  color: white;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.2s;

  &:hover {
    background-color: #4b5563;
  }

  svg {
    width: 16px;
    height: 16px;
  }

  &.loading svg {
    animation: ${spin} 1s linear infinite;
  }
`;

const PullToRefresh = styled.div<{ $visible: boolean }>`
  height: ${props => props.$visible ? '50px' : '0'};
  display: flex;
  align-items: center;
  justify-content: center;
  overflow: hidden;
  transition: height 0.2s;
  color: #6b7280;
  font-size: 12px;

  svg {
    width: 20px;
    height: 20px;
    margin-right: 8px;
    animation: ${spin} 1s linear infinite;
  }
`;

// 새로고침 주기 (30초)
const REFRESH_INTERVAL = 30 * 1000;

export const FeedView: React.FC<FeedViewProps> = ({
  currentUser,
  searchQuery,
  onPostClick,
}) => {
  const {
    posts,
    isLoading,
    isLoadingMore,
    total,
    page,
    fetchPosts,
    toggleLike,
    setFilters,
    refreshPosts,
  } = usePostStore();

  const { channels } = useChannelStore();

  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isContentEntering, setIsContentEntering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const skeletonTimerRef = useRef<NodeJS.Timeout | null>(null);
  const loadStartTimeRef = useRef<number>(Date.now());

  // 초기 로드 및 채널 변경 시 게시글 로드
  useEffect(() => {
    const params = {
      channelId: selectedChannelId || undefined,
      keyword: searchQuery || undefined,
      page: 1,
    };
    setFilters(params);

    // 스켈레톤 표시 시작
    setShowSkeleton(true);
    setIsFadingOut(false);
    setIsContentEntering(false);
    loadStartTimeRef.current = Date.now();

    if (skeletonTimerRef.current) {
      clearTimeout(skeletonTimerRef.current);
    }

    fetchPosts(params).then(() => {
      // 로딩 완료 후, 최소 표시 시간(500ms) 보장
      const elapsed = Date.now() - loadStartTimeRef.current;
      const minDelay = Math.max(0, 500 - elapsed);

      skeletonTimerRef.current = setTimeout(() => {
        setIsFadingOut(true);
        // 페이드아웃 애니메이션(400ms) 후 콘텐츠 표시
        setTimeout(() => {
          setShowSkeleton(false);
          setIsFadingOut(false);
          setIsContentEntering(true);
          // 콘텐츠 진입 애니메이션 후 상태 정리
          setTimeout(() => setIsContentEntering(false), 400);
        }, 400);
      }, minDelay);
    });

    return () => {
      if (skeletonTimerRef.current) {
        clearTimeout(skeletonTimerRef.current);
      }
    };
  }, [selectedChannelId, searchQuery, fetchPosts, setFilters]);

  // 주기적 새로고침 (30초마다)
  useEffect(() => {
    const interval = setInterval(() => {
      // 사용자가 스크롤 중이 아닐 때만 새로고침
      if (!isLoading && !isLoadingMore) {
        refreshPosts();
      }
    }, REFRESH_INTERVAL);

    return () => clearInterval(interval);
  }, [isLoading, isLoadingMore, refreshPosts]);

  // 무한 스크롤
  useEffect(() => {
    const handleScroll = () => {
      if (isLoadingMore || isLoading) return;

      const scrollTop = window.scrollY;
      const scrollHeight = document.documentElement.scrollHeight;
      const clientHeight = window.innerHeight;

      // 스크롤이 하단 200px 이내에 도달하면 추가 로드
      if (scrollTop + clientHeight >= scrollHeight - 200) {
        const hasMore = posts.length < total;
        if (hasMore) {
          fetchPosts({ page: page + 1 }, true);
        }
      }

      lastScrollY.current = scrollTop;
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [posts.length, total, page, isLoading, isLoadingMore, fetchPosts]);

  // 채널 탭 클릭
  const handleChannelClick = useCallback((channelId: string | null, isLocked: boolean) => {
    if (isLocked) return;
    setSelectedChannelId(channelId === selectedChannelId ? null : channelId);
  }, [selectedChannelId]);

  // 좋아요 토글
  const handleLike = useCallback((postId: string) => {
    toggleLike(postId);
  }, [toggleLike]);

  // Pull to refresh
  const handlePullRefresh = useCallback(async () => {
    if (isPullRefreshing) return;
    setIsPullRefreshing(true);
    await refreshPosts();
    setIsPullRefreshing(false);
  }, [isPullRefreshing, refreshPosts]);

  // 포스트 클릭 (API 형식 -> 상세 페이지)
  const handlePostClick = useCallback((post: ApiPost) => {
    onPostClick(post);
  }, [onPostClick]);

  // 스켈레톤 표시 조건
  const shouldShowSkeleton = showSkeleton;
  const hasMorePosts = posts.length < total;

  return (
    <Container ref={containerRef}>
      <PullToRefresh $visible={isPullRefreshing}>
        <Loader2 />
        새로고침 중...
      </PullToRefresh>

      <ChannelTabs className="no-scrollbar">
        <ChannelTab
          $locked={false}
          $active={selectedChannelId === null}
          onClick={() => handleChannelClick(null, false)}
        >
          전체
        </ChannelTab>
        {channels.map((channel) => {
          const isLocked = currentUser.rawSubCount < channel.minSubscribers;
          return (
            <ChannelTab
              key={channel.id}
              $locked={isLocked}
              $active={selectedChannelId === channel.id}
              onClick={() => handleChannelClick(channel.id, isLocked)}
            >
              {isLocked && <Lock />}
              {channel.name}
            </ChannelTab>
          );
        })}
      </ChannelTabs>

      {shouldShowSkeleton ? (
        <SkeletonWrapper $fading={isFadingOut}>
          <PostList>
            {Array.from({ length: 5 }).map((_, i) => (
              <PostSkeleton key={i} />
            ))}
          </PostList>
        </SkeletonWrapper>
      ) : posts.length === 0 ? (
        <ContentWrapper $entering={isContentEntering}>
          <EmptyState>
            <EmptyText>
              {searchQuery
                ? `"${searchQuery}" 검색 결과가 없습니다.`
                : '아직 게시글이 없습니다.\n첫 번째 게시글을 작성해보세요!'}
            </EmptyText>
            <RefreshButton
              onClick={handlePullRefresh}
              className={isPullRefreshing ? 'loading' : ''}
            >
              <RefreshCw />
              새로고침
            </RefreshButton>
          </EmptyState>
        </ContentWrapper>
      ) : (
        <ContentWrapper $entering={isContentEntering}>
          <PostList>
            {posts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                onPostClick={handlePostClick}
                onLike={() => handleLike(post.id)}
              />
            ))}
          </PostList>
          {isLoadingMore && (
            <LoadingMore>
              <Loader2 />
            </LoadingMore>
          )}
          {!hasMorePosts && posts.length > 0 && (
            <EmptyState>
              <EmptyText>모든 게시글을 불러왔습니다.</EmptyText>
            </EmptyState>
          )}
        </ContentWrapper>
      )}
    </Container>
  );
};

export default FeedView;
