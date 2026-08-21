import * as Crypto from 'expo-crypto';
import * as SecureStore from 'expo-secure-store';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';
import { Platform } from 'react-native';
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

  async loginSocial(correo, idProveedor) {
    const data = await api.post('/api/Auth/login-social', { correo, id_proveedor: idProveedor });
    await SecureStore.setItemAsync('jwt_token', data.token);
    await SecureStore.setItemAsync('id_usuario', String(data.idUsuario));
    return data;
  },

  async loginFacebook(accessToken) {
    const data = await api.post('/api/Auth/facebook', { accessToken });
    await SecureStore.setItemAsync('jwt_token', data.token);
    if (data.idUsuario) {
      await SecureStore.setItemAsync('id_usuario', String(data.idUsuario));
    }
    return data;
  },

  async iniciarSesionFacebook() {
    try {
      // 1. Verificar si ya existe una sesión de Facebook activa (por haber usado "Cerrar sesión" normal)
      let fbData = await AccessToken.getCurrentAccessToken();

      // 2. Si NO hay sesión (se usó "Cambiar cuenta" o es la primera vez), solicitamos inicio
      if (!fbData) {
        if (Platform.OS === 'android') {
          LoginManager.setLoginBehavior('web_only');
        }

        const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
        if (result.isCancelled) return null;

        fbData = await AccessToken.getCurrentAccessToken();
      }

      if (!fbData?.accessToken) {
        throw new Error('No se pudo obtener el token de Facebook');
      }

      // 3. Autenticar con el backend
      return await this.loginFacebook(fbData.accessToken);

    } catch (error) {
      console.error('Error en Facebook Login:', error);
      throw error;
    }
  },

  async loginGoogle(idToken) {
    const data = await api.post('/api/Auth/google', { idToken });
    await SecureStore.setItemAsync('jwt_token', data.token);
    if (data.idUsuario) {
      await SecureStore.setItemAsync('id_usuario', String(data.idUsuario));
    }
    return data;
  },

  // 1. Cierra sesión en la app pero MANTIENE la credencial social para reingreso rápido
  async logout() {
    await SecureStore.deleteItemAsync('jwt_token');
    await SecureStore.deleteItemAsync('id_usuario');
  },

  // 2. Cierra sesión en la app Y BORRA las credenciales sociales para exigir elección de cuenta
  async logoutAndSwitch() {
    await SecureStore.deleteItemAsync('jwt_token');
    await SecureStore.deleteItemAsync('id_usuario');

    try {
      await GoogleSignin.signOut();
    } catch (error) {
      console.log('Google signOut error:', error);
    }

    try {
      LoginManager.logOut(); // Al borrar el token de FB, el próximo intento activará el selector
    } catch (error) {
      console.log('Facebook logOut error:', error);
    }
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