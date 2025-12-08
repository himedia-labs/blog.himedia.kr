import { AxiosError, InternalAxiosRequestConfig } from 'axios';
import { axiosBare, axiosInstance } from './axios.config';

type RetriableConfig = InternalAxiosRequestConfig & {
  _retry?: boolean;
};

axiosInstance.interceptors.request.use(
  (config: RetriableConfig) => config,
  error => Promise.reject(error),
);

axiosInstance.interceptors.response.use(
  response => response,
  async (error: AxiosError) => {
    const originalRequest = error.config as RetriableConfig | undefined;

    if (error.response?.status === 401 && originalRequest && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        await axiosBare.post('/auth/refresh');
        return axiosInstance(originalRequest);
      } catch (refreshError) {
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  },
);

export default axiosInstance;
