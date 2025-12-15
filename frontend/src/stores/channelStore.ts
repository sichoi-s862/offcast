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

  // 액션
  fetchChannels: () => Promise<void>;
  fetchAccessibleChannels: () => Promise<void>;
  selectChannel: (channelId: string | null) => void;
  getChannelById: (id: string) => ApiChannel | undefined;
  isChannelAccessible: (channelId: string) => boolean;
  clearError: () => void;
}

export const useChannelStore = create<ChannelState>((set, get) => ({
  // 초기 상태
  channels: [],
  accessibleChannels: [],
  selectedChannelId: null,
  isLoading: false,
  error: null,

  // 전체 채널 목록 조회
  fetchChannels: async () => {
    set({ isLoading: true, error: null });
    try {
      const data = await getChannels();
      set({
        channels: data,
        isLoading: false,
      });
    } catch (error: unknown) {
      const errorMessage = getErrorMessage(error, '채널 목록을 불러오는데 실패했습니다.');
      set({ error: errorMessage, isLoading: false });
    }
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
      const errorMessage = getErrorMessage(error, '접근 가능한 채널 목록을 불러오는데 실패했습니다.');
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
