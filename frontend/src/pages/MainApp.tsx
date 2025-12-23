import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { useNavigate } from 'react-router-dom';
import { Search, X, Edit3 } from 'lucide-react';
import { OffcastLogo } from '../components/icons/PlatformIcons';
import { BottomNav } from '../components/layout/BottomNav';
import { WriteModal } from '../components/post/WriteModal';
import { FeedView, ChannelsView, MyPageView } from './views';
import type { CurrentUser, ApiPost, CreatePostDto } from '../types';
import { usePostStore, useChannelStore, useAuthStore } from '../stores';
import { incrementAppHistory } from '../App';

interface MainAppProps {
  currentUser: CurrentUser;
  initialTab?: 'home' | 'topics' | 'my';
}

const AppContainer = styled.div`
  min-height: 100vh;
  background-color: black;
  max-width: 768px;
  margin: 0 auto;
`;

const Header = styled.header`
  position: sticky;
  top: 0;
  z-index: 40;
  background-color: rgba(0, 0, 0, 0.8);
  backdrop-filter: blur(8px);
  border-bottom: 1px solid #1f2937;
  height: 56px;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 16px;
`;

const HeaderLeft = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
`;

const LogoWrapper = styled.div`
  width: 28px;
  height: 28px;
  background-color: #00D4AA;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
`;

const HeaderTitle = styled.h1`
  font-size: 20px;
  font-weight: 700;
  letter-spacing: -0.025em;
  color: white;
`;

const PageTitle = styled.h1`
  font-size: 18px;
  font-weight: 700;
  color: white;
`;

const SearchWrapper = styled.div`
  display: flex;
  align-items: center;
  gap: 8px;
  width: 100%;
  animation: fadeSlideIn 0.2s ease-out;

  @keyframes fadeSlideIn {
    from {
      opacity: 0;
      transform: translateX(20px);
    }
    to {
      opacity: 1;
      transform: translateX(0);
    }
  }
`;

const SearchInput = styled.input`
  flex: 1;
  background-color: #111827;
  border: 1px solid #374151;
  border-radius: 9999px;
  padding: 8px 16px;
  font-size: 14px;
  color: white;
  outline: none;

  &:focus {
    border-color: #00D4AA;
  }

  &::placeholder {
    color: #9ca3af;
  }
`;

const IconButton = styled.button`
  color: #9ca3af;
  padding: 8px;

  &:hover {
    color: white;
  }

  svg {
    width: 20px;
    height: 20px;
  }
`;

const CloseButton = styled.button`
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

const Main = styled.main`
  min-height: 100vh;
`;

const FABContainer = styled.div`
  position: fixed;
  bottom: 96px;
  left: 50%;
  transform: translateX(-50%);
  width: 100%;
  max-width: 768px;
  z-index: 40;
  pointer-events: none;
  padding: 0 16px;
  display: flex;
  justify-content: flex-end;
`;

const FAB = styled.button`
  width: 56px;
  height: 56px;
  background-color: #00D4AA;
  border-radius: 50%;
  box-shadow: 0 20px 25px -5px rgba(0, 212, 170, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  pointer-events: auto;
  transition: all 0.2s;

  &:hover {
    background-color: #00B894;
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

export const MainApp: React.FC<MainAppProps> = ({
  currentUser,
  initialTab = 'home'
}) => {
  const navigate = useNavigate();
  const [isWriteOpen, setIsWriteOpen] = useState(false);
  const [selectedChannelId, setSelectedChannelId] = useState<string | null>(null);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Zustand 스토어
  const { createNewPost, refreshPosts } = usePostStore();
  const { fetchChannels } = useChannelStore();
  const { logout } = useAuthStore();

  // URL 기반 탭 (initialTab을 사용)
  const activeTab = initialTab;

  // 탭 전환 핸들러 (URL로 이동)
  const handleTabChange = useCallback((tab: string) => {
    const routes: Record<string, string> = {
      'home': '/home',
      'topics': '/channels',
      'my': '/my'
    };
    navigate(routes[tab] || '/home');
  }, [navigate]);

  // 로그아웃 핸들러
  const handleLogout = useCallback(() => {
    logout();
    navigate('/home');
  }, [logout, navigate]);

  // 초기 로드 (캐시/중복 방지 적용됨)
  useEffect(() => {
    fetchChannels();
  }, []); // 마운트 시 1회만

  // Scroll to top on tab change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab]);

  // 검색어 디바운스 (300ms)
  useEffect(() => {
    if (searchDebounceRef.current) {
      clearTimeout(searchDebounceRef.current);
    }

    searchDebounceRef.current = setTimeout(() => {
      setDebouncedSearchTerm(searchTerm);
    }, 300);

    return () => {
      if (searchDebounceRef.current) {
        clearTimeout(searchDebounceRef.current);
      }
    };
  }, [searchTerm]);

  // 게시글 작성 핸들러
  const handlePostSubmit = useCallback(async (
    title: string,
    content: string,
    images: Array<{ url: string; key: string }>,
    channelId: string,
    hashtags: string[]
  ) => {
    try {
      const postData: CreatePostDto = {
        channelId,
        title,
        content,
        imageUrls: images.length > 0 ? images.map(img => img.url) : undefined,
        imageKeys: images.length > 0 ? images.map(img => img.key) : undefined,
        hashtags: hashtags.length > 0 ? hashtags : undefined,
      };

      await createNewPost(postData);
      setIsWriteOpen(false);
      // 피드 새로고침
      refreshPosts();
    } catch (error) {
      console.error('Failed to create post:', error);
      // 전역 인터셉터에서 토스트 처리
    }
  }, [createNewPost, refreshPosts]);

  // 검색 토글
  const toggleSearch = useCallback(() => {
    setIsSearchActive(!isSearchActive);
    if (!isSearchActive) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    } else {
      setSearchTerm('');
      setDebouncedSearchTerm('');
    }
  }, [isSearchActive]);

  // 게시글 클릭 핸들러 - URL로 이동
  const handlePostClick = useCallback((post: ApiPost) => {
    incrementAppHistory();
    navigate(`/post/${post.id}`);
  }, [navigate]);

  // 채널 선택 핸들러 (채널 탭에서 선택 시 홈으로 이동)
  const handleChannelSelect = useCallback((channelId: string) => {
    setSelectedChannelId(channelId);
    navigate('/home');
  }, [navigate]);

  // 채널 필터 해제
  const handleClearChannel = useCallback(() => {
    setSelectedChannelId(null);
  }, []);

  // 마이페이지 네비게이션 핸들러
  const handleMyPageNavigate = useCallback((screen: string) => {
    const routes: Record<string, string> = {
      'my_posts': '/my/posts',
      'my_info': '/my/info',
      'edit_nick': '/my/edit-nick',
      'contact': '/my/contact',
      'customer_center': '/my/help',
      'withdraw': '/my/withdraw',
      'agreements': '/my/agreements',
    };
    const route = routes[screen];
    if (route) {
      incrementAppHistory();
      navigate(route);
    }
  }, [navigate]);

  return (
    <AppContainer>
      <Header>
        {isSearchActive ? (
          <SearchWrapper>
            <SearchInput
              ref={searchInputRef}
              type="text"
              placeholder="Search..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <CloseButton onClick={toggleSearch}>
              <X />
            </CloseButton>
          </SearchWrapper>
        ) : (
          <>
            <HeaderLeft>
              {activeTab === 'my' ? (
                <PageTitle>My Page</PageTitle>
              ) : activeTab === 'topics' ? (
                <PageTitle>Channels</PageTitle>
              ) : (
                <>
                  <LogoWrapper>
                    <OffcastLogo size={18} />
                  </LogoWrapper>
                  <HeaderTitle>Offcast</HeaderTitle>
                </>
              )}
            </HeaderLeft>
            {activeTab === 'home' && (
              <IconButton onClick={toggleSearch}>
                <Search />
              </IconButton>
            )}
          </>
        )}
      </Header>

      <Main>
        {activeTab === 'home' && (
          <FeedView
            currentUser={currentUser}
            searchQuery={debouncedSearchTerm}
            selectedChannelId={selectedChannelId}
            onPostClick={handlePostClick}
            onClearChannel={handleClearChannel}
          />
        )}
        {activeTab === 'topics' && (
          <ChannelsView
            currentUser={currentUser}
            onChannelSelect={handleChannelSelect}
          />
        )}
        {activeTab === 'my' && (
          <MyPageView
            currentUser={currentUser}
            onLogout={handleLogout}
            onNavigate={handleMyPageNavigate}
          />
        )}
      </Main>

      {activeTab !== 'my' && !isWriteOpen && (
        <FABContainer>
          <FAB onClick={() => setIsWriteOpen(true)}>
            <Edit3 />
          </FAB>
        </FABContainer>
      )}

      <WriteModal
        isOpen={isWriteOpen}
        onClose={() => setIsWriteOpen(false)}
        onSubmit={handlePostSubmit}
        currentUser={currentUser}
      />

      <BottomNav activeTab={activeTab} onTabChange={handleTabChange} />
    </AppContainer>
  );
};

export default MainApp;
