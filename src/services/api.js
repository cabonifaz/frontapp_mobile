import axios from 'axios';
import * as SecureStore from 'expo-secure-store';

// Cambia esta URL cuando el backend esté en servidor
const BASE_URL = 'http://localhost:3000/api';

const api = axios.create({
  baseURL: BASE_URL,
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Adjunta el JWT en cada petición automáticamente
api.interceptors.request.use(async (config) => {
  const token = await SecureStore.getItemAsync('jwt_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Maneja errores globales (ej. token expirado)
api.interceptors.response.use(
  (response) => response.data,
  (error) => {
    const message = error.response?.data?.message || 'Error de conexión';
    return Promise.reject(new Error(message));
  }
);

export default api;
