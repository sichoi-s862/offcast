import React, { useState, useEffect, useRef, useCallback } from 'react';
import styled from 'styled-components';
import { Search, X, Edit3 } from 'lucide-react';
import { OffcastLogo } from '../components/icons/PlatformIcons';
import { BottomNav } from '../components/layout/BottomNav';
import { WriteModal } from '../components/post/WriteModal';
import { FeedView, ChannelsView, MyPageView } from './views';
import { PostDetail } from './PostDetail';
import {
  ContactPage,
  CustomerCenterPage,
  PrivacyPage,
  MyPostsPage,
  MyInfoPage,
  EditNickPage
} from './subpages';
import type { CurrentUser, ApiPost, CreatePostDto } from '../types';
import { usePostStore, useChannelStore } from '../stores';

interface MainAppProps {
  currentUser: CurrentUser;
  onLogout: () => void;
  onUpdateNickname: (nickname: string) => void;
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
  background-color: #7c3aed;
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
    border-color: #7c3aed;
  }

  &::placeholder {
    color: #6b7280;
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
  background-color: #7c3aed;
  border-radius: 50%;
  box-shadow: 0 20px 25px -5px rgba(124, 58, 237, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  pointer-events: auto;
  transition: all 0.2s;

  &:hover {
    background-color: #6d28d9;
  }

  &:active {
    transform: scale(0.95);
  }

  svg {
    width: 24px;
    height: 24px;
  }
`;

type Screen = 'main' | 'my_posts' | 'my_info' | 'edit_nick' | 'contact' | 'customer_center' | 'privacy';

export const MainApp: React.FC<MainAppProps> = ({
  currentUser,
  onLogout,
  onUpdateNickname
}) => {
  const [activeTab, setActiveTab] = useState('home');
  const [currentScreen, setCurrentScreen] = useState<Screen>('main');
  const [selectedPost, setSelectedPost] = useState<ApiPost | null>(null);
  const [isWriteOpen, setIsWriteOpen] = useState(false);

  const [searchTerm, setSearchTerm] = useState('');
  const [debouncedSearchTerm, setDebouncedSearchTerm] = useState('');
  const [isSearchActive, setIsSearchActive] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);
  const searchDebounceRef = useRef<NodeJS.Timeout | null>(null);

  // Zustand 스토어
  const { createNewPost, refreshPosts } = usePostStore();
  const { fetchChannels } = useChannelStore();

  // 초기 로드
  useEffect(() => {
    fetchChannels();
  }, [fetchChannels]);

  // Scroll to top on tab or screen change
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [activeTab, currentScreen]);

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
        channelId: channelId || 'free',
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

  // 게시글 클릭 핸들러
  const handlePostClick = useCallback((post: ApiPost) => {
    setSelectedPost(post);
  }, []);

  // 채널 선택 핸들러 (채널 탭에서 선택 시 홈으로 이동)
  const handleChannelSelect = useCallback((_channelId: string) => {
    setActiveTab('home');
    // FeedView에서 해당 채널 필터가 자동 적용됨
  }, []);

  // 게시글 상세 페이지
  if (selectedPost) {
    return (
      <PostDetail
        postId={selectedPost.id}
        currentUser={currentUser}
        onBack={() => setSelectedPost(null)}
      />
    );
  }

  // 서브 페이지들
  if (currentScreen === 'my_posts') {
    return (
      <MyPostsPage
        currentUser={currentUser}
        onBack={() => setCurrentScreen('main')}
        onPostClick={handlePostClick}
      />
    );
  }
  if (currentScreen === 'my_info') {
    return <MyInfoPage currentUser={currentUser} onBack={() => setCurrentScreen('main')} />;
  }
  if (currentScreen === 'edit_nick') {
    return (
      <EditNickPage
        currentUser={currentUser}
        onBack={() => setCurrentScreen('main')}
        onUpdateNickname={onUpdateNickname}
      />
    );
  }
  if (currentScreen === 'contact') {
    return <ContactPage onBack={() => setCurrentScreen('main')} />;
  }
  if (currentScreen === 'customer_center') {
    return <CustomerCenterPage onBack={() => setCurrentScreen('main')} />;
  }
  if (currentScreen === 'privacy') {
    return <PrivacyPage onBack={() => setCurrentScreen('main')} />;
  }

  return (
    <AppContainer>
      <Header>
        {isSearchActive ? (
          <SearchWrapper>
            <SearchInput
              ref={searchInputRef}
              type="text"
              placeholder="검색어 입력"
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
                <PageTitle>마이페이지</PageTitle>
              ) : activeTab === 'topics' ? (
                <PageTitle>채널</PageTitle>
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
            onPostClick={handlePostClick}
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
            onLogout={onLogout}
            onNavigate={setCurrentScreen}
          />
        )}
      </Main>

      {!selectedPost && activeTab !== 'my' && !isWriteOpen && (
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

      <BottomNav activeTab={activeTab} onTabChange={setActiveTab} />
    </AppContainer>
  );
};

export default MainApp;
