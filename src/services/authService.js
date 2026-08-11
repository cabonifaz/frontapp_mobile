import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import api from './api';

async function hashPassword(password) {
  return Crypto.digestStringAsync(Crypto.CryptoDigestAlgorithm.SHA256, password);
}

export const authService = {
  async login(correo, contrasena) {
    const contrasena_hash = await hashPassword(contrasena);
    const data = await api.post('/api/Auth/login', { correo, contrasena_hash });
    await SecureStore.setItemAsync('jwt_token', data.token);
    await SecureStore.setItemAsync('id_usuario', String(data.idUsuario));
    return data;
  },

  async registrar(datos) {
    const contrasena_hash = await hashPassword(datos.contrasena);
    const data = await api.post('/api/Auth/registrar', {
      nombre:            datos.nombre,
      apellidos:         datos.apellidos,
      correo:            datos.correo,
      contrasena_hash,
      telefono:          datos.telefono ?? null,
      direccion:         null,
      foto_perfil_url:   null,
      id_proveedor_auth: null,
      id_pais:           null,
      id_ciudad:         null,
      id_distrito:       null,
      es_profesor:       datos.es_profesor ? 1 : 0,
    });
    return data;
  },

  async verificarCorreo(correo) {
    const data = await api.get(`/api/Auth/verificar-correo?correo=${encodeURIComponent(correo)}`);
    return data.disponible;
  },

  async logout() {
    await SecureStore.deleteItemAsync('jwt_token');
    await SecureStore.deleteItemAsync('id_usuario');
  },

  async getToken() {
    return SecureStore.getItemAsync('jwt_token');
  },

  async getUserId() {
    const id = await SecureStore.getItemAsync('id_usuario');
    return id ? parseInt(id) : null;
  },

  async isLoggedIn() {
    const token = await SecureStore.getItemAsync('jwt_token');
    return !!token;
  },
};
