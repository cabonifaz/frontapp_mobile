import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

const BASE_URL = 'https://mumbling-unbounded-unbitten.ngrok-free.dev';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: { 'Content-Type': 'application/json', 'ngrok-skip-browser-warning': 'true' },
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
