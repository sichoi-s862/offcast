import React, { useState, useEffect, useCallback } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { GlobalStyle } from './styles/GlobalStyle';
import { SplashScreen } from './pages/SplashScreen';
import { LoginScreen } from './pages/LoginScreen';
import { NicknameScreen } from './pages/NicknameScreen';
import { MainApp } from './pages/MainApp';
import { ToastProvider } from './components/common/Toast';
import type { Provider } from './types';
import { useAuthStore, useChannelStore, toast } from './stores';

type AppState = 'splash' | 'login' | 'nickname' | 'main';

const AppContent: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('splash');
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Zustand 스토어
  const {
    user: currentUser,
    isAuthenticated,
    isLoading,
    login,
    logout,
    initAuth,
    setUser,
  } = useAuthStore();

  const { fetchChannels } = useChannelStore();

  // 앱 시작 시 인증 초기화
  useEffect(() => {
    const init = async () => {
      const hasAuth = await initAuth();
      if (hasAuth) {
        // 채널 목록 미리 로드
        fetchChannels();
      }
    };
    init();
  }, [initAuth, fetchChannels]);

  // 인증 상태 변경 감지 (로그아웃 이벤트)
  useEffect(() => {
    const handleLogoutEvent = () => {
      setAppState('login');
    };

    window.addEventListener('auth:logout', handleLogoutEvent);
    return () => {
      window.removeEventListener('auth:logout', handleLogoutEvent);
    };
  }, []);

  // OAuth 콜백 처리
  useEffect(() => {
    const urlToken = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      toast.error(`로그인 실패: ${decodeURIComponent(error)}`);
      setAppState('login');
      navigate('/', { replace: true });
      return;
    }

    if (urlToken) {
      // 기존 OAuth 토큰 처리 로직 유지 (YouTube 등)
      localStorage.setItem('accessToken', urlToken);
      initAuth();
      navigate('/', { replace: true });
    }
  }, [searchParams, navigate, initAuth]);

  // 스플래시 완료 핸들러
  const handleSplashFinish = useCallback(() => {
    if (isAuthenticated && currentUser) {
      setAppState('main');
    } else if (isLoading) {
      // 로딩 중이면 대기
    } else {
      setAppState('login');
    }
  }, [isAuthenticated, currentUser, isLoading]);

  // 로그인 핸들러 (개발용 API 사용)
  const handleLogin = useCallback(async (provider: Provider | string) => {
    const providerUpper = provider.toUpperCase();

    try {
      // 개발용 로그인 API 호출
      await login({
        provider: providerUpper,
        nickname: getDefaultNickname(providerUpper),
        subscriberCount: getDefaultSubscriberCount(providerUpper),
      });

      // 채널 목록 로드
      fetchChannels();
      setAppState('main');
    } catch (error) {
      console.error('Login failed:', error);
      toast.error('로그인에 실패했습니다. 다시 시도해주세요.');
    }
  }, [login, fetchChannels]);

  // 닉네임 설정 완료 핸들러
  const handleNicknameComplete = useCallback((nickname: string) => {
    if (currentUser) {
      setUser({ ...currentUser, nickname });
    }
    setAppState('main');
  }, [currentUser, setUser]);

  // 로그아웃 핸들러
  const handleLogout = useCallback(() => {
    logout();
    setAppState('login');
  }, [logout]);

  // 닉네임 업데이트 핸들러
  const handleUpdateNickname = useCallback((nickname: string) => {
    if (currentUser) {
      setUser({ ...currentUser, nickname });
    }
  }, [currentUser, setUser]);

  // 렌더링
  if (appState === 'splash') {
    return <SplashScreen onFinish={handleSplashFinish} />;
  }

  if (appState === 'login') {
    return <LoginScreen onLogin={handleLogin} />;
  }

  if (appState === 'nickname' && currentUser) {
    return <NicknameScreen onComplete={handleNicknameComplete} />;
  }

  if (appState === 'main' && currentUser) {
    return (
      <MainApp
        currentUser={currentUser}
        onLogout={handleLogout}
        onUpdateNickname={handleUpdateNickname}
      />
    );
  }

  // 기본 로딩 상태
  return <SplashScreen onFinish={handleSplashFinish} />;
};

// 플랫폼별 기본 닉네임
const getDefaultNickname = (provider: string): string => {
  const nicknames: Record<string, string> = {
    YOUTUBE: '유튜버',
    TIKTOK: '틱톡커',
    CHZZK: '치지직스트리머',
    SOOP: '숲방송러',
  };
  return nicknames[provider] || '크리에이터';
};

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

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <GlobalStyle />
      <ToastProvider />
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/auth/callback" element={<AppContent />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
