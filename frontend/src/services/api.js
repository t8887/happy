import { Platform } from 'react-native';
import axios from 'axios';
import useAuthStore from '../store/authStore';

const PROD_URL = 'https://happy-g8kd.onrender.com/api';
const DEV_URL =
  Platform.OS === 'android'
    ? 'http://10.0.2.2:5000/api'   // Android emulator alias for localhost
    : 'http://localhost:5000/api';

const BASE_URL = __DEV__ ? DEV_URL : PROD_URL;

const api = axios.create({
  baseURL: BASE_URL,
  headers: { 'Content-Type': 'application/json' },
});

// Attach JWT token to every request automatically
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().token;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;
