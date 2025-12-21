const API_URL = 'http://localhost:8080';

export type Provider = 'youtube' | 'tiktok' | 'twitter';

export interface UserAccount {
  id: string;
  provider: string;
  providerAccountId: string;
  profileName: string | null;
  profileImage: string | null;
}

export interface User {
  id: string;
  accounts: UserAccount[];
}

export interface SocialStats {
  provider: string;
  subscriberCount?: number;
  followerCount?: number;
  viewCount?: number;
  videoCount?: number;
  fanCount?: number;
  error?: string;
}

export interface AllStatsResponse {
  youtube?: SocialStats;
  tiktok?: SocialStats;
  twitter?: SocialStats;
}

export const getLoginUrl = (provider: Provider): string => {
  return `${API_URL}/auth/${provider}`;
};

export const getMe = async (token: string): Promise<User> => {
  const response = await fetch(`${API_URL}/auth/me`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch user');
  }
  return response.json();
};

export const getAllStats = async (token: string): Promise<SocialStats[]> => {
  const response = await fetch(`${API_URL}/social/all`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }
  const data: AllStatsResponse = await response.json();

  // 객체를 배열로 변환
  const statsArray: SocialStats[] = [];
  const providers = ['youtube', 'tiktok', 'twitter'] as const;

  for (const provider of providers) {
    if (data[provider]) {
      statsArray.push({ ...data[provider]!, provider });
    }
  }

  return statsArray;
};

export const getStatsByProvider = async (
  token: string,
  provider: Provider
): Promise<SocialStats> => {
  const response = await fetch(`${API_URL}/social/${provider}/stats`, {
    headers: {
      Authorization: `Bearer ${token}`,
    },
  });
  if (!response.ok) {
    throw new Error('Failed to fetch stats');
  }
  return response.json();
};
