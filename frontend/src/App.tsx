import React, { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, useNavigate, useSearchParams } from 'react-router-dom';
import { GlobalStyle } from './styles/GlobalStyle';
import { SplashScreen } from './pages/SplashScreen';
import { LoginScreen } from './pages/LoginScreen';
import { NicknameScreen } from './pages/NicknameScreen';
import { MainApp } from './pages/MainApp';
import type { CurrentUser, Provider } from './types';
import { getMe, getAllStats, getLoginUrl as getApiLoginUrl } from './api/auth';
import { formatSubscriberCount } from './utils/format';

type AppState = 'splash' | 'login' | 'nickname' | 'main';

const AppContent: React.FC = () => {
  const [appState, setAppState] = useState<AppState>('splash');
  const [currentUser, setCurrentUser] = useState<CurrentUser | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // Check for existing token on mount
  useEffect(() => {
    const savedToken = localStorage.getItem('token');
    if (savedToken) {
      // 더미 토큰인 경우
      if (savedToken.startsWith('dummy_')) {
        const savedDummyUser = localStorage.getItem('dummyUser');
        if (savedDummyUser) {
          setToken(savedToken);
          setCurrentUser(JSON.parse(savedDummyUser));
          setAppState('main');
          return;
        }
      }
      // 실제 토큰인 경우
      setToken(savedToken);
      loadUserData(savedToken);
    }
  }, []);

  // Handle OAuth callback
  useEffect(() => {
    const urlToken = searchParams.get('token');
    const error = searchParams.get('error');

    if (error) {
      alert(`로그인 실패: ${decodeURIComponent(error)}`);
      setAppState('login');
      navigate('/', { replace: true });
      return;
    }

    if (urlToken) {
      localStorage.setItem('token', urlToken);
      setToken(urlToken);
      loadUserData(urlToken);
      navigate('/', { replace: true });
    }
  }, [searchParams, navigate]);

  const loadUserData = async (authToken: string) => {
    try {
      const user = await getMe(authToken);
      const stats = await getAllStats(authToken);

      if (user.accounts && user.accounts.length > 0) {
        const account = user.accounts[0];
        const statData = stats.find(s => s.provider.toLowerCase() === account.provider.toLowerCase());

        // Get subscriber/follower count
        let rawSubCount = 0;
        if (statData) {
          rawSubCount = statData.subscriberCount || statData.followerCount || statData.fanCount || 0;
        }

        const userData: CurrentUser = {
          provider: account.provider,
          nickname: account.profileName || `User${user.id.slice(0, 6)}`,
          subscriberCount: formatSubscriberCount(rawSubCount),
          rawSubCount: rawSubCount,
        };

        setCurrentUser(userData);
        setAppState('main');
      }
    } catch (error) {
      console.error('Failed to load user data:', error);
      localStorage.removeItem('token');
      setToken(null);
      setAppState('login');
    }
  };

  const handleSplashFinish = () => {
    if (token && currentUser) {
      setAppState('main');
    } else if (token) {
      // Token exists but user not loaded yet, wait
    } else {
      setAppState('login');
    }
  };

  const handleLogin = (provider: Provider | string) => {
    const providerLower = provider.toLowerCase();

    // YouTube만 실제 OAuth, 나머지는 더미 데이터
    if (providerLower === 'youtube') {
      window.location.href = getApiLoginUrl(providerLower as Provider);
    } else {
      // 더미 로그인 처리
      const dummyUsers: Record<string, CurrentUser> = {
        instagram: {
          provider: 'Instagram',
          nickname: '인스타그래머',
          subscriberCount: formatSubscriberCount(15000),
          rawSubCount: 15000,
        },
        tiktok: {
          provider: 'TikTok',
          nickname: '틱톡커',
          subscriberCount: formatSubscriberCount(50000),
          rawSubCount: 50000,
        },
        chzzk: {
          provider: 'Chzzk',
          nickname: '치지직스트리머',
          subscriberCount: formatSubscriberCount(8000),
          rawSubCount: 8000,
        },
        soop: {
          provider: 'SOOP',
          nickname: '숲방송러',
          subscriberCount: formatSubscriberCount(120000),
          rawSubCount: 120000,
        },
      };

      const dummyUser = dummyUsers[providerLower];
      if (dummyUser) {
        localStorage.setItem('token', `dummy_${providerLower}_token`);
        localStorage.setItem('dummyUser', JSON.stringify(dummyUser));
        setToken(`dummy_${providerLower}_token`);
        setCurrentUser(dummyUser);
        setAppState('main');
      }
    }
  };

  const handleNicknameComplete = (nickname: string) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, nickname });
    }
    setAppState('main');
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    setToken(null);
    setCurrentUser(null);
    setAppState('login');
  };

  const handleUpdateNickname = (nickname: string) => {
    if (currentUser) {
      setCurrentUser({ ...currentUser, nickname });
    }
  };

  // Render based on app state
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

  // Default loading state
  return <SplashScreen onFinish={handleSplashFinish} />;
};

const App: React.FC = () => {
  return (
    <BrowserRouter>
      <GlobalStyle />
      <Routes>
        <Route path="/" element={<AppContent />} />
        <Route path="/auth/callback" element={<AppContent />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
};

export default App;
