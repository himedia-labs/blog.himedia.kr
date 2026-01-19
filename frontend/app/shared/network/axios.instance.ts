import { AxiosError, isAxiosError } from 'axios';

import { useAuthStore } from '../store/authStore';
import { axiosBare, axiosInstance } from './axios.config';
import { PUBLIC_AUTH_PATHS } from '../constants/config/publicPaths.config';

import type { RetriableConfig } from '../types/axios';

let refreshPromise: Promise<string | null> | null = null;

const refreshAccessToken = async (): Promise<string | null> => {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const refreshResponse = await axiosBare.post('/auth/refresh');
        if (refreshResponse.status === 204) return null;
        return (refreshResponse.data as { accessToken?: string })?.accessToken ?? null;
      } catch (error) {
        if (isAxiosError(error) && error.response?.status === 401) {
          try {
            await axiosBare.post('/auth/logout');
          } catch {
            // 쿠키 정리 실패는 무시
          }
        }
        return null;
      } finally {
        refreshPromise = null;
      }
    })();
  }

  return refreshPromise;
};

// Request 인터셉터
// - 일반 요청에 accessToken을 Authorization 헤더로 추가
// - /auth/refresh 요청에는 토큰을 붙이지 않아 만료 토큰 401 반복 방지
axiosInstance.interceptors.request.use(
  (config: RetriableConfig) => {
    const isRefreshRequest = config.url?.includes('/auth/refresh');
    const isPublicAuthRequest = PUBLIC_AUTH_PATHS.some(path => config.url?.includes(path));
    const accessToken = useAuthStore.getState().accessToken;

    if (accessToken && !isRefreshRequest && !isPublicAuthRequest) {
      config.headers = config.headers ?? {};
      config.headers.Authorization = `Bearer ${accessToken}`;
    }

    return config;
  },
  error => Promise.reject(error),
);

// Response 인터셉터
// - 401 응답 시 /auth/refresh 요청을 보내 토큰 갱신 시도
// - 갱신 성공 시 원래 요청을 새로운 토큰으로 재시도
// - 갱신 실패 시 에러 반환
axiosInstance.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined;
    const { setAccessToken } = useAuthStore.getState();

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      const isPublicAuthRequest = PUBLIC_AUTH_PATHS.some(path => originalRequest.url?.includes(path));
      if (isPublicAuthRequest) {
        return Promise.reject(error);
      }

      originalRequest._retry = true;

      const newAccessToken = await refreshAccessToken();

      if (!newAccessToken) {
        setAccessToken(null);
        return Promise.reject(error);
      }

      setAccessToken(newAccessToken);
      return axiosInstance(originalRequest);
    }

    return Promise.reject(error);
  },
);

export { refreshAccessToken };
export { axiosInstance };
export default axiosInstance;
