import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { getCachedApiUrl, getTransportConfig } from './transportConfig';

// Fallback URL if defined in env
export const DEFAULT_API_URL = process.env.EXPO_PUBLIC_API_URL || '';

// Alias used by screens that import { API_URL }
export const API_URL = DEFAULT_API_URL;

const api = axios.create({
  baseURL: DEFAULT_API_URL || undefined,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
  timeout: 30000,
});

// Request interceptor: dynamically attaches baseURL and Auth token before every request
api.interceptors.request.use(
  async (config) => {
    try {
      // 1. Resolve active dynamic baseURL
      let activeUrl = getCachedApiUrl();
      if (!activeUrl) {
        const transport = await getTransportConfig();
        activeUrl = transport?.apiUrl || DEFAULT_API_URL;
      }
      config.baseURL = activeUrl;

      // 2. Attach Authorization token if logged in
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error in request interceptor:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

export default api;
