import React, { useState, useEffect, useCallback } from 'react';
import styled, { keyframes } from 'styled-components';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useSearchParams, useParams, useLocation } from 'react-router-dom';
import { ShieldX } from 'lucide-react';
import { GlobalStyle } from './styles/GlobalStyle';
import { SplashScreen } from './pages/SplashScreen';
import { LoginScreen } from './pages/LoginScreen';
import { NicknameScreen } from './pages/NicknameScreen';
import { MainApp } from './pages/MainApp';
import { PostDetail } from './pages/PostDetail';
import { PrivacyPage, TermsPage } from './pages/subpages';
import { ToastProvider } from './components/common/Toast';
import type { Provider } from './types';
import { useAuthStore, useChannelStore, toast } from './stores';

// 권한 없음 페이지 스타일
const fadeIn = keyframes`
  from { opacity: 0; }
  to { opacity: 1; }
`;

const AccessDeniedContainer = styled.div`
  min-height: 100vh;
  background-color: black;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 24px;
  animation: ${fadeIn} 0.3s ease-out;
  max-width: 768px;
  margin: 0 auto;
`;

const IconWrapper = styled.div`
  width: 80px;
  height: 80px;
  background-color: #1f2937;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 24px;

  svg {
    width: 40px;
    height: 40px;
    color: #f87171;
  }
`;

const AccessDeniedTitle = styled.h1`
  font-size: 24px;
  font-weight: 700;
  color: white;
  margin-bottom: 12px;
  text-align: center;
`;

const AccessDeniedMessage = styled.p`
  font-size: 14px;
  color: #9ca3af;
  text-align: center;
  line-height: 1.6;
  margin-bottom: 32px;
`;

const BackButton = styled.button`
  background-color: #7c3aed;
  color: white;
  padding: 12px 32px;
  border-radius: 8px;
  font-size: 14px;
  font-weight: 700;

  &:hover {
    background-color: #6d28d9;
  }
`;

// 플랫폼별 기본 구독자 수 (테스트용)
const getDefaultSubscriberCount = (provider: string): number => {
  const counts: Record<string, number> = {
    YOUTUBE: 25000,
    TIKTOK: 50000,
    CHZZK: 8000,
    SOOP: 120000,
  };
  return counts[provider] || 10000;
};

// 권한 없음 페이지 컴포넌트
const AccessDeniedPage: React.FC<{ onBack: () => void }> = ({ onBack }) => {
  return (
    <AccessDeniedContainer>
      <IconWrapper>
        <ShieldX />
      </IconWrapper>
      <AccessDeniedTitle>접근 권한이 없습니다</AccessDeniedTitle>
      <AccessDeniedMessage>
        이 게시글이 속한 채널에 접근할 권한이 없습니다.<br />
        구독자 수에 따라 접근 가능한 채널이 다릅니다.
      </AccessDeniedMessage>
      <BackButton onClick={onBack}>홈으로 돌아가기</BackButton>
    </AccessDeniedContainer>
  );
};

// 앱 내부 네비게이션 히스토리 추적
let appHistoryCount = 0;

// 앱 히스토리 증가 (앱 내부 이동 시 호출)
export const incrementAppHistory = () => {
  appHistoryCount++;
};

// 앱 히스토리 감소
const decrementAppHistory = () => {
  if (appHistoryCount > 0) appHistoryCount--;
};

// 안전한 뒤로가기 (앱 외부로 나가면 홈으로)
const useSafeBack = () => {
  const navigate = useNavigate();

  return useCallback(() => {
    if (appHistoryCount > 0) {
      decrementAppHistory();
      navigate(-1);
    } else {
      navigate('/home', { replace: true });
    }
  }, [navigate]);
};

// URL로 직접 접근 가능한 게시글 상세 페이지
const PostDetailRoute: React.FC = () => {
  const { postId } = useParams<{ postId: string }>();
  const location = useLocation();
  const safeBack = useSafeBack();
  const { user: currentUser, isAuthenticated, isLoading, initAuth } = useAuthStore();
  const [authChecked, setAuthChecked] = useState(false);
  const [accessDenied, setAccessDenied] = useState(false);

  // 인증 초기화
  useEffect(() => {
    const checkAuth = async () => {
      await initAuth();
      setAuthChecked(true);
    };
    checkAuth();
  }, [initAuth]);

  // postId가 없으면 홈으로
  if (!postId) {
    return <Navigate to="/home" replace />;
  }

  // 인증 체크 중이면 로딩 표시
  if (!authChecked || isLoading) {
    return <SplashScreen onFinish={() => {}} />;
  }

  // 로그인 안 되어있으면 로그인 페이지로 (현재 경로 저장)
  if (!isAuthenticated || !currentUser) {
    // 로그인 후 돌아올 경로를 sessionStorage에 저장
    sessionStorage.setItem('redirectAfterLogin', location.pathname);
    return <Navigate to="/home" replace />;
  }

  // 권한 없음 상태
  if (accessDenied) {
    return <AccessDeniedPage onBack={safeBack} />;
  }

  return (
    <PostDetail
      postId={postId}
      currentUser={currentUser}
      onBack={safeBack}
      onAccessDenied={() => setAccessDenied(true)}
    />
  );
};

// URL로 직접 접근 가능한 개인정보 처리방침 페이지
const PrivacyRoute: React.FC = () => {
  const safeBack = useSafeBack();
  return <PrivacyPage onBack={safeBack} />;
};

// URL로 직접 접근 가능한 서비스 이용약관 페이지
const TermsRoute: React.FC = () => {
  const safeBack = useSafeBack();
  return <TermsPage onBack={safeBack} />;
};

// 스플래시 + 인증 체크 라우트
const SplashRoute: React.FC = () => {
  const navigate = useNavigate();
  const { isAuthenticated, initAuth } = useAuthStore();
  const { fetchChannels } = useChannelStore();
  const [splashDone, setSplashDone] = useState(false);
  const [authChecked, setAuthChecked] = useState(false);

  // 인증 초기화
  useEffect(() => {
    const init = async () => {
      const hasAuth = await initAuth();
      if (hasAuth) {
        fetchChannels();
      }
      setAuthChecked(true);
    };
    init();
  }, [initAuth, fetchChannels]);

  // 스플래시 완료 후 이동
  useEffect(() => {
    if (splashDone && authChecked) {
      if (isAuthenticated) {
        navigate('/home', { replace: true });
      } else {
        // 로그인 필요 - LoginRedirect로 이동하지 않고 여기서 처리
        navigate('/home', { replace: true });
      }
    }
  }, [splashDone, authChecked, isAuthenticated, navigate]);

  return <SplashScreen onFinish={() => setSplashDone(true)} />;
};

// 메인 탭 라우트 (홈, 채널, 마이페이지)
const MainTabRoute: React.FC<{ tab: 'home' | 'topics' | 'my' }> = ({ tab }) => {
  const { user: currentUser, isAuthenticated, isLoading, initAuth } = useAuthStore();
  const { fetchChannels } = useChannelStore();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const [authChecked, setAuthChecked] = useState(false);

  // 인증 초기화
  useEffect(() => {
    const init = async () => {
      const hasAuth = await initAuth();
      if (hasAuth) {
        fetchChannels();
      }
      setAuthChecked(true);
    };
    init();
  }, [initAuth, fetchChannels]);

  // OAuth 콜백 처리
  useEffect(() => {
    const urlToken = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error(`로그인 실패: ${decodeURIComponent(error)}`);
      navigate('/home', { replace: true });
      return;
    }

    if (urlToken) {
      localStorage.setItem('accessToken', urlToken);
      initAuth();
      navigate('/home', { replace: true });
    }
  }, [searchParams, navigate, initAuth]);

  // 인증 체크 중이면 빈 화면 (스플래시에서 이미 봤으므로)
  if (!authChecked || isLoading) {
    return null;
  }

  // 로그인 안 되어있으면 로그인 페이지로
  if (!isAuthenticated || !currentUser) {
    return <LoginRedirect />;
  }

  return <MainApp currentUser={currentUser} initialTab={tab} />;
};

// 로그인 리다이렉트 컴포넌트
const LoginRedirect: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { login, initAuth } = useAuthStore();
  const { fetchChannels } = useChannelStore();
  const [appState, setAppState] = useState<'login' | 'nickname'>('login');
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);

  // OAuth 콜백 처리
  useEffect(() => {
    const urlToken = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error(`로그인 실패: ${decodeURIComponent(error)}`);
      navigate('/home', { replace: true });
      return;
    }

    if (urlToken) {
      localStorage.setItem('accessToken', urlToken);
      initAuth().then(() => {
        const redirectPath = sessionStorage.getItem('redirectAfterLogin');
        if (redirectPath) {
          sessionStorage.removeItem('redirectAfterLogin');
          navigate(redirectPath, { replace: true });
        } else {
          navigate('/home', { replace: true });
        }
      });
    }
  }, [searchParams, navigate, initAuth]);

  const handleLogin = useCallback((provider: Provider | string) => {
    const providerUpper = provider.toUpperCase();
    setSelectedProvider(providerUpper);
    setAppState('nickname');
  }, []);

  const handleNicknameComplete = useCallback(async (nickname: string) => {
    if (!selectedProvider) {
      setAppState('login');
      return;
    }

    try {
      await login({
        provider: selectedProvider,
        nickname,
        subscriberCount: getDefaultSubscriberCount(selectedProvider),
      });

      fetchChannels();

      const redirectPath = sessionStorage.getItem('redirectAfterLogin');
      if (redirectPath) {
        sessionStorage.removeItem('redirectAfterLogin');
        navigate(redirectPath, { replace: true });
      } else {
        navigate('/home', { replace: true });
      }
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('로그인에 실패했습니다. 다시 시도해주세요.');
      setAppState('login');
    }
  }, [selectedProvider, login, fetchChannels, navigate]);

  if (appState === 'nickname') {
    return (
      <NicknameScreen
        onComplete={handleNicknameComplete}
        onBack={() => setAppState('login')}
      />
    );
  }

  return <LoginScreen onLogin={handleLogin} />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <GlobalStyle />
      <ToastProvider />
      <Routes>
        <Route path="/" element={<SplashRoute />} />
        <Route path="/home" element={<MainTabRoute tab="home" />} />
        <Route path="/channels" element={<MainTabRoute tab="topics" />} />
        <Route path="/my" element={<MainTabRoute tab="my" />} />
        <Route path="/auth/callback" element={<LoginRedirect />} />
        <Route path="/post/:postId" element={<PostDetailRoute />} />
        <Route path="/privacy" element={<PrivacyRoute />} />
        <Route path="/terms" element={<TermsRoute />} />
        <Route path="*" element={<Navigate to="/home" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
