import axios, { type AxiosInstance, type AxiosError, type InternalAxiosRequestConfig } from 'axios';
import { toast } from '../stores/toastStore';

// API 기본 URL (백엔드 포트: 8080)
const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

// Axios 인스턴스 생성
const apiClient: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// 토큰 저장소 (Zustand store에서 관리하지만, 초기화 전에도 사용 가능하도록)
let authToken: string | null = null;

// 토큰 설정 함수
export const setAuthToken = (token: string | null) => {
  authToken = token;
  if (token) {
    localStorage.setItem('accessToken', token);
  } else {
    localStorage.removeItem('accessToken');
  }
};

// 토큰 가져오기
export const getAuthToken = (): string | null => {
  if (authToken) return authToken;
  return localStorage.getItem('accessToken');
};

// 요청 인터셉터: JWT 토큰 자동 추가
apiClient.interceptors.request.use(
  (config: InternalAxiosRequestConfig) => {
    const token = getAuthToken();
    if (token && config.headers) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error: AxiosError) => {
    return Promise.reject(error);
  }
);

/**
 * API 에러 메시지를 사용자 친화적으로 변환
 */
const getUserFriendlyMessage = (status: number | undefined, serverMessage: string): string => {
  // 서버 메시지 매핑 (영어 -> 한글, 기술적 -> 친화적)
  const messageMap: Record<string, string> = {
    // 채널/게시글 관련
    'Channel not found': '채널을 찾을 수 없습니다.',
    'Post not found': '게시글을 찾을 수 없습니다.',
    'User not found': '사용자를 찾을 수 없습니다.',
    'Comment not found': '댓글을 찾을 수 없습니다.',
    'You do not have access to this channel': '이 채널에 접근 권한이 없습니다.',
    'Insufficient subscriber count': '구독자 수가 부족합니다.',
    // 인증 관련
    'Unauthorized': '로그인이 필요합니다.',
    'Invalid token': '로그인 정보가 유효하지 않습니다.',
    'Token expired': '로그인이 만료되었습니다.',
    // 입력 검증
    'Bad Request': '입력 정보를 확인해주세요.',
    'Validation failed': '입력 정보를 확인해주세요.',
    // 서버 에러
    'Internal server error': '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  };

  // 정확히 일치하는 메시지 찾기
  if (messageMap[serverMessage]) {
    return messageMap[serverMessage];
  }

  // 부분 일치 검색
  for (const [key, value] of Object.entries(messageMap)) {
    if (serverMessage.toLowerCase().includes(key.toLowerCase())) {
      return value;
    }
  }

  // HTTP 상태 코드 기반 기본 메시지
  const statusMessages: Record<number, string> = {
    400: '요청 정보를 확인해주세요.',
    403: '접근 권한이 없습니다.',
    404: '요청한 정보를 찾을 수 없습니다.',
    409: '이미 처리된 요청입니다.',
    429: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
    500: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
    502: '서버에 연결할 수 없습니다.',
    503: '서비스 점검 중입니다.',
  };

  if (status && statusMessages[status]) {
    return statusMessages[status];
  }

  // 기본 메시지
  return '요청 처리 중 오류가 발생했습니다.';
};

// 응답 인터셉터: 에러 처리 및 토큰 만료 처리
apiClient.interceptors.response.use(
  (response) => response,
  async (error: AxiosError) => {
    // 에러 메시지 추출 (message가 배열일 수도 있음 - NestJS validation)
    const errorData = error.response?.data as { message?: string | string[] } | undefined;
    let serverMessage = '';
    if (Array.isArray(errorData?.message)) {
      serverMessage = errorData.message[0] || '';
    } else {
      serverMessage = errorData?.message || error.message || '';
    }
    const userMessage = getUserFriendlyMessage(error.response?.status, serverMessage);

    // 401 에러: 토큰 만료 또는 인증 실패
    if (error.response?.status === 401) {
      // 토큰 제거 및 로그인 페이지로 리다이렉트
      setAuthToken(null);

      // 이벤트 발생 (App에서 처리)
      window.dispatchEvent(new CustomEvent('auth:logout'));
      toast.error('로그인이 만료되었습니다. 다시 로그인해주세요.');
    } else if (!error.response) {
      // 네트워크 에러
      console.error('Network error:', error.message);
      toast.error('서버에 연결할 수 없습니다. 네트워크를 확인해주세요.');
    } else {
      // 기타 에러 - 사용자 친화적 메시지 표시
      toast.error(userMessage);
    }

    return Promise.reject(error);
  }
);

/**
 * API 에러에서 메시지를 추출하는 헬퍼 함수
 */
export interface ApiErrorResponse {
  response?: {
    data?: {
      message?: string;
    };
    status?: number;
  };
}

export const getErrorMessage = (error: unknown, defaultMessage: string): string => {
  if (error && typeof error === 'object' && 'response' in error) {
    const apiError = error as ApiErrorResponse;
    return apiError.response?.data?.message || defaultMessage;
  }
  return defaultMessage;
};

export const isUnauthorizedError = (error: unknown): boolean => {
  if (error && typeof error === 'object' && 'response' in error) {
    const apiError = error as ApiErrorResponse;
    return apiError.response?.status === 401;
  }
  return false;
};

export default apiClient;
