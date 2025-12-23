import { create } from 'zustand';
import { getChannels, getAccessibleChannels } from '../api';
import { getErrorMessage } from '../api/client';
import type { ApiChannel } from '../types';

interface ChannelState {
  // 상태
  channels: ApiChannel[];
  accessibleChannels: ApiChannel[];
  selectedChannelId: string | null;
  isLoading: boolean;
  error: string | null;
  _fetchPromise: Promise<void> | null; // 중복 요청 방지
  _lastFetchTime: number; // 마지막 요청 시간

  // 액션
  fetchChannels: () => Promise<void>;
  fetchAccessibleChannels: () => Promise<void>;
  selectChannel: (channelId: string | null) => void;
  getChannelById: (id: string) => ApiChannel | undefined;
  isChannelAccessible: (channelId: string) => boolean;
  clearError: () => void;
}

// 캐시 유효 시간 (5분)
const CACHE_TTL = 5 * 60 * 1000;

export const useChannelStore = create<ChannelState>((set, get) => ({
  // 초기 상태
  channels: [],
  accessibleChannels: [],
  selectedChannelId: null,
  isLoading: false,
  error: null,
  _fetchPromise: null,
  _lastFetchTime: 0,

  // 전체 채널 목록 조회 - 중복 요청 및 캐시 처리
  fetchChannels: async () => {
    const state = get();

    // 이미 진행 중인 요청이 있으면 그 Promise 반환
    if (state._fetchPromise) {
      return state._fetchPromise;
    }

    // 캐시가 유효하면 스킵 (5분 이내 요청)
    const now = Date.now();
    if (state.channels.length > 0 && now - state._lastFetchTime < CACHE_TTL) {
      return;
    }

    const fetchPromise = (async () => {
      set({ isLoading: true, error: null });
      try {
        const data = await getChannels();
        set({
          channels: data,
          isLoading: false,
          _fetchPromise: null,
          _lastFetchTime: Date.now(),
        });
      } catch (error: unknown) {
        const errorMessage = getErrorMessage(error, 'Failed to load channels.');
        set({ error: errorMessage, isLoading: false, _fetchPromise: null });
      }
    })();

    set({ _fetchPromise: fetchPromise });
    return fetchPromise;
  },

  // 접근 가능한 채널 목록 조회
  fetchAccessibleChannels: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await getAccessibleChannels();
      set({
        accessibleChannels: data,
        isLoading: false,
      });
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, 'Failed to load accessible channels.');
      set({ error: errorMessage, isLoading: false });
    }
  },

  // 채널 선택
  selectChannel: (channelId) => {
    set({ selectedChannelId: channelId });
  },

  // ID로 채널 찾기
  getChannelById: (id) => {
    return get().channels.find((channel) => channel.id === id);
  },

  // 채널 접근 가능 여부 확인
  isChannelAccessible: (channelId) => {
    return get().accessibleChannels.some((channel) => channel.id === channelId);
  },

  // 에러 클리어
  clearError: () => {
    set({ error: null });
  },
}));
