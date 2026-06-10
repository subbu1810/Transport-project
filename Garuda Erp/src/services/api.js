import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Fallback to production URL if local isn't set
export const API_URL = process.env.EXPO_PUBLIC_API_URL || 'https://api.lifetransport.ssquareg.com/api/v1';

const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
    'Accept': 'application/json',
  },
});

// Add a request interceptor to automatically attach the token
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error fetching token from storage', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Add interceptors for Auth token here when ready
// api.interceptors.request.use(config => { ... });

export default api;
