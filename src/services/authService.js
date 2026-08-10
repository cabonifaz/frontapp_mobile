import * as SecureStore from 'expo-secure-store';
import api from './api';

export const authService = {
  async login(correo, contrasena) {
    const data = await api.post('/auth/login', { correo, contrasena });
    await SecureStore.setItemAsync('jwt_token', data.token);
    return data;
  },

  async loginOAuth(provider, token) {
    const data = await api.post('/auth/oauth', { provider, token });
    await SecureStore.setItemAsync('jwt_token', data.token);
    return data;
  },

  async registro(datos) {
    const data = await api.post('/auth/registro', datos);
    await SecureStore.setItemAsync('jwt_token', data.token);
    return data;
  },

  async recuperarContrasena(correo) {
    return api.post('/auth/recuperar', { correo });
  },

  async logout() {
    await SecureStore.deleteItemAsync('jwt_token');
  },

  async getToken() {
    return SecureStore.getItemAsync('jwt_token');
  },

  async isLoggedIn() {
    const token = await SecureStore.getItemAsync('jwt_token');
    return !!token;
  },
};
