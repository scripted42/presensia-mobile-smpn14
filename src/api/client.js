import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';

// Base URL pointed directly to the production school server with SSL
export const BASE_URL = 'https://presensia.smpn14-surabaya.sch.id/api/mobile';

const client = axios.create({
  baseURL: BASE_URL,
  timeout: 15000,
  headers: {
    'Accept': 'application/json',
    'Content-Type': 'application/json',
    'X-Requested-With': 'XMLHttpRequest',
    'User-Agent': 'PresensiaMobile/1.0.0 (Android)',
  },
});

// Auto-attach Bearer token and User-Agent to every authenticated request
client.interceptors.request.use(
  async (config) => {
    try {
      config.headers['User-Agent'] = 'PresensiaMobile/1.0.0 (Android)';
      const token = await AsyncStorage.getItem('auth_token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (e) {
      console.warn('Error reading auth token:', e);
    }
    return config;
  },
  (error) => Promise.reject(error)
);

// Response interceptor for clear error formatting
client.interceptors.response.use(
  (response) => response,
  (error) => {
    console.log('[API Error]', error?.message, error?.code, error?.response?.status, error?.config?.url);
    let message = 'Terjadi kesalahan jaringan. Silakan coba lagi.';
    if (error.response) {
      // Server responded with an error status (4xx, 5xx)
      message = error.response.data?.message || `Error ${error.response.status}: Permintaan gagal diproses.`;
    } else if (error.request) {
      // The request was made but no response was received
      message = error.message 
        ? `Tidak dapat terhubung ke server Presensia (${error.message}). Pastikan internet aktif.` 
        : 'Tidak dapat terhubung ke server Presensia. Pastikan internet Anda aktif.';
    }
    error.formattedMessage = message;
    return Promise.reject(error);
  }
);

export default client;
