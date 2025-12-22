import React, { useEffect, useCallback, useRef, useState } from 'react';
import styled, { keyframes } from 'styled-components';
import { Loader2, RefreshCw, X } from 'lucide-react';
import { useChannelStore } from '../../stores';
import { PostCard } from '../../components/post/PostCard';
import { PostSkeleton } from '../../components/common/Skeleton';
import type { CurrentUser, ApiPost } from '../../types';
import { usePostStore } from '../../stores';

type SortType = 'latest' | 'popular';

interface FeedViewProps {
  currentUser: CurrentUser;
  searchQuery?: string;
  selectedChannelId?: string | null;
  onPostClick: (post: ApiPost) => void;
  onClearChannel?: () => void;
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

const FilterTabs = styled.div`
  display: flex;
  padding: 12px 16px;
  gap: 8px;
  border-bottom: 1px solid #1f2937;
`;

const FilterTab = styled.button<{ $active: boolean }>`
  padding: 6px 16px;
  border-radius: 9999px;
  font-size: 13px;
  font-weight: 600;
  border: 1px solid ${props => props.$active ? '#00D4AA' : '#374151'};
  background-color: ${props => props.$active ? '#00D4AA' : 'transparent'};
  color: ${props => props.$active ? '#fff' : '#9ca3af'};
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: ${props => props.$active ? '#00B894' : '#1f2937'};
  }
`;

const PostList = styled.div`
  display: flex;
  flex-direction: column;
`;

const ChannelHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 12px 16px;
  background-color: #1f2937;
  border-bottom: 1px solid #374151;
`;

const ChannelInfo = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const ChannelName = styled.span`
  font-size: 14px;
  font-weight: 600;
  color: #e5e7eb;
`;

const ChannelBadge = styled.span`
  font-size: 11px;
  color: #9ca3af;
  background-color: #374151;
  padding: 2px 8px;
  border-radius: 4px;
`;

const ClearButton = styled.button`
  display: flex;
  align-items: center;
  gap: 4px;
  padding: 6px 10px;
  background-color: transparent;
  border: 1px solid #374151;
  border-radius: 6px;
  color: #9ca3af;
  font-size: 12px;
  cursor: pointer;
  transition: all 0.2s;

  &:hover {
    background-color: #374151;
    color: #e5e7eb;
  }

  svg {
    width: 14px;
    height: 14px;
  }
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
  selectedChannelId,
  onPostClick,
  onClearChannel,
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
  const selectedChannel = selectedChannelId
    ? channels.find(c => c.id === selectedChannelId)
    : null;

  const [sortType, setSortType] = useState<SortType>('latest');
  const [isPullRefreshing, setIsPullRefreshing] = useState(false);
  const [showSkeleton, setShowSkeleton] = useState(true);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const [isContentEntering, setIsContentEntering] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const lastScrollY = useRef(0);
  const skeletonTimerRef = useRef<NodeJS.Timeout | null>(null);
  const loadStartTimeRef = useRef<number>(Date.now());

  // 채널 선택 시 최신순으로 리셋
  useEffect(() => {
    if (selectedChannelId) {
      setSortType('latest');
    }
  }, [selectedChannelId]);

  // 초기 로드 및 정렬/채널 변경 시 게시글 로드
  useEffect(() => {
    const params = {
      sort: selectedChannelId ? 'latest' as const : sortType,
      keyword: searchQuery || undefined,
      channelId: selectedChannelId || undefined,
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
  }, [sortType, searchQuery, selectedChannelId, fetchPosts, setFilters]);

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

  // 정렬 탭 클릭
  const handleSortChange = useCallback((sort: SortType) => {
    setSortType(sort);
  }, []);

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
        Refreshing...
      </PullToRefresh>

      {selectedChannel ? (
        <ChannelHeader>
          <ChannelInfo>
            <ChannelName>{selectedChannel.name}</ChannelName>
            <ChannelBadge>Latest</ChannelBadge>
          </ChannelInfo>
          <ClearButton onClick={onClearChannel}>
            <X />
            All Posts
          </ClearButton>
        </ChannelHeader>
      ) : (
        <FilterTabs>
          <FilterTab
            $active={sortType === 'latest'}
            onClick={() => handleSortChange('latest')}
          >
            Latest
          </FilterTab>
          <FilterTab
            $active={sortType === 'popular'}
            onClick={() => handleSortChange('popular')}
          >
            Popular
          </FilterTab>
        </FilterTabs>
      )}

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
                ? `No results for "${searchQuery}"`
                : 'No posts yet.\nBe the first to write!'}
            </EmptyText>
            <RefreshButton
              onClick={handlePullRefresh}
              className={isPullRefreshing ? 'loading' : ''}
            >
              <RefreshCw />
              Refresh
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
              <EmptyText>You've reached the end.</EmptyText>
            </EmptyState>
          )}
        </ContentWrapper>
      )}
    </Container>
  );
};

export default FeedView;
