import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devLogin, getProfile, type DevLoginRequest } from '../api';
import { setAuthToken, getAuthToken, getErrorMessage, isUnauthorizedError } from '../api/client';
import type { CurrentUser, Provider } from '../types';

// 구독자 수 포맷팅 함수
const formatSubscriberCount = (count: number): string => {
  if (count >= 1000000) {
    return `${Math.floor(count / 10000)}만명+`;
  }
  if (count >= 10000) {
    return `${Math.floor(count / 10000)}만명+`;
  }
  if (count >= 1000) {
    return `${Math.floor(count / 1000)}천명+`;
  }
  return `${count}명`;
};

interface AuthState {
  // 상태
  token: string | null;
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;

  // 액션
  setToken: (token: string | null) => void;
  setUser: (user: CurrentUser | null) => void;
  login: (request: DevLoginRequest) => Promise<void>;
  logout: () => void;
  loadProfile: () => Promise<void>;
  initAuth: () => Promise<boolean>;
  clearError: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      // 초기 상태
      token: null,
      user: null,
      isAuthenticated: false,
      isLoading: false,
      error: null,

      // 토큰 설정
      setToken: (token) => {
        setAuthToken(token);
        set({ token, isAuthenticated: !!token });
      },

      // 사용자 설정
      setUser: (user) => {
        set({ user });
      },

      // 개발용 로그인
      login: async (request) => {
        set({ isLoading: true, error: null });
        try {
          const response = await devLogin(request);
          const { user: apiUser, token: tokenData } = response;

          // API 사용자 정보를 CurrentUser 형식으로 변환
          const primaryAccount = apiUser.accounts?.[0];
          const subscriberCount = primaryAccount?.subscriberCount || request.subscriberCount;

          const currentUser: CurrentUser = {
            id: apiUser.id,
            provider: (primaryAccount?.provider?.toLowerCase() || request.provider.toLowerCase()) as Provider,
            nickname: apiUser.nickname,
            subscriberCount: formatSubscriberCount(subscriberCount),
            rawSubCount: subscriberCount,
          };

          setAuthToken(tokenData.accessToken);
          set({
            token: tokenData.accessToken,
            user: currentUser,
            isAuthenticated: true,
            isLoading: false,
          });
        } catch (error: unknown) {
          const errorMessage = getErrorMessage(error, '로그인에 실패했습니다.');
          set({ error: errorMessage, isLoading: false });
          throw error;
        }
      },

      // 로그아웃
      logout: () => {
        setAuthToken(null);
        set({
          token: null,
          user: null,
          isAuthenticated: false,
          error: null,
        });
      },

      // 프로필 로드
      loadProfile: async () => {
        const token = get().token || getAuthToken();
        if (!token) return;

        set({ isLoading: true });
        try {
          const { user: apiUser } = await getProfile();
          const primaryAccount = apiUser.accounts?.[0];
          const subscriberCount = primaryAccount?.subscriberCount || 0;

          const currentUser: CurrentUser = {
            id: apiUser.id,
            provider: (primaryAccount?.provider?.toLowerCase() || 'youtube') as Provider,
            nickname: apiUser.nickname,
            subscriberCount: formatSubscriberCount(subscriberCount),
            rawSubCount: subscriberCount,
          };

          set({ user: currentUser, isLoading: false });
        } catch (error: unknown) {
          console.error('Failed to load profile:', error);
          set({ isLoading: false });
          // 토큰이 유효하지 않으면 로그아웃
          if (isUnauthorizedError(error)) {
            get().logout();
          }
        }
      },

      // 인증 초기화 (앱 시작 시)
      initAuth: async () => {
        const storedToken = getAuthToken();
        if (!storedToken) {
          set({ isAuthenticated: false });
          return false;
        }

        set({ token: storedToken, isLoading: true });
        try {
          await get().loadProfile();
          set({ isAuthenticated: true, isLoading: false });
          return true;
        } catch (error) {
          get().logout();
          return false;
        }
      },

      // 에러 클리어
      clearError: () => {
        set({ error: null });
      },
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        token: state.token,
        user: state.user,
        isAuthenticated: state.isAuthenticated,
      }),
    }
  )
);
