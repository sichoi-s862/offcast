import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devLogin, getProfile, type DevLoginRequest } from '../api';
import { setAuthToken, getAuthToken, getErrorMessage, isUnauthorizedError } from '../api/client';
import type { CurrentUser, Provider } from '../types';

// Subscriber count formatting
const formatSubscriberCount = (count: number): string => {
  if (count >= 1000000) {
    return `${Math.floor(count / 1000000)}M+`;
  }
  if (count >= 1000) {
    return `${Math.floor(count / 1000)}K+`;
  }
  return `${count}`;
};

interface AuthState {
  // 상태
  token: string | null;
  user: CurrentUser | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
  _initPromise: Promise<boolean> | null; // 중복 요청 방지

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
      _initPromise: null,

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

          // Get all linked providers
          const providers = apiUser.accounts?.map(acc => acc.provider?.toUpperCase()) || [];

          const currentUser: CurrentUser = {
            id: apiUser.id,
            provider: (primaryAccount?.provider?.toLowerCase() || request.provider.toLowerCase()) as Provider,
            providers: providers.length > 0 ? providers : [request.provider.toUpperCase()],
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
          const errorMessage = getErrorMessage(error, 'Login failed.');
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

          // Get all linked providers
          const providers = apiUser.accounts?.map(acc => acc.provider?.toUpperCase()) || [];

          const currentUser: CurrentUser = {
            id: apiUser.id,
            provider: (primaryAccount?.provider?.toLowerCase() || 'youtube') as Provider,
            providers: providers.length > 0 ? providers : ['YOUTUBE'],
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

      // 인증 초기화 (앱 시작 시) - 중복 호출 방지
      initAuth: async () => {
        // 이미 진행 중인 초기화가 있으면 그 Promise 반환
        const existingPromise = get()._initPromise;
        if (existingPromise) {
          return existingPromise;
        }

        const storedToken = getAuthToken();
        if (!storedToken) {
          set({ isAuthenticated: false });
          return false;
        }

        const initPromise = (async () => {
          set({ token: storedToken, isLoading: true });
          try {
            await get().loadProfile();
            set({ isAuthenticated: true, isLoading: false, _initPromise: null });
            return true;
          } catch (error) {
            get().logout();
            set({ _initPromise: null });
            return false;
          }
        })();

        set({ _initPromise: initPromise });
        return initPromise;
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
