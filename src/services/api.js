import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Lee dinámicamente desde el .env o usa la IP local como fallback
const BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://192.168.100.10:5000';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 
    'Content-Type': 'application/json', 
    'ngrok-skip-browser-warning': 'true' 
  },
});

api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const mensaje = error.response?.data?.mensaje || 'Error de conexión con el servidor';
    return Promise.reject(new Error(mensaje));
  }
);

export default api;