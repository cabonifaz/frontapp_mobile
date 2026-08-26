import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

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
    // Muestra en consola la causa exacta del fallo de red
    console.log('🔴 DETALLE DEL ERROR AXIOS:', {
      code: error.code,
      message: error.message,
      url: error.config?.url,
      baseURL: error.config?.baseURL,
    });

    const mensaje = error.response?.data?.mensaje || error.message || 'Error de conexión con el servidor';
    return Promise.reject(new Error(mensaje));
  }
);

export default api;