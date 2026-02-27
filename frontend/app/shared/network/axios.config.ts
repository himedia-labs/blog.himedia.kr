import axios from 'axios';

const API_BASE_URL = process.env.NEXT_PUBLIC_HM_API_BASE_URL;
const AXIOS_TIMEOUT_MS = process.env.NEXT_PUBLIC_HM_AXIOS_TIMEOUT_MS;

const axiosConfig = {
  baseURL: API_BASE_URL,
  timeout: Number(AXIOS_TIMEOUT_MS),
  headers: {
    'Content-Type': 'application/json',
  },
  withCredentials: true,
};

export const axiosBare = axios.create({ ...axiosConfig });
export const axiosInstance = axios.create({ ...axiosConfig });
