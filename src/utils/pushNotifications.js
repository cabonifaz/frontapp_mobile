// NUEVO (APP-AVO-041): notificaciones push con expo-notifications.
//
// Requiere:  npx expo install expo-notifications   y un APK nuevo (eas build).
// Si la app corre en un APK anterior (sin el módulo nativo), todo esto se desactiva solo
// y la app sigue funcionando: la bandeja de notificaciones dentro de la app funciona igual.
import { Platform } from 'react-native';
import Constants from 'expo-constants';
import * as SecureStore from 'expo-secure-store';
import i18n from '../i18n';
import { notificacionService } from '../services/notificacionService';
import { navegar } from '../navigation/navigationRef';

let Notifications = null;
try {
  Notifications = require('expo-notifications');
} catch {
  Notifications = null;   // APK sin el módulo nativo
}

const CLAVE_TOKEN = 'push_token';
let configurado = false;

// Cómo se muestra un aviso cuando la app está abierta
export function configurarNotificaciones() {
  if (!Notifications || configurado) return;
  configurado = true;
  try {
    Notifications.setNotificationHandler({
      handleNotification: async () => ({
        shouldShowBanner: true,
        shouldShowList:   true,
        shouldPlaySound:  true,
        shouldSetBadge:   true,
      }),
    });

    // Al tocar un aviso se abre la bandeja de notificaciones
    Notifications.addNotificationResponseReceivedListener(() => {
      navegar('Notificaciones');
    });
  } catch (e) {
    console.log('Notificaciones no disponibles:', e?.message);
  }
}

// Si la app estaba cerrada y se abrió tocando un aviso
export async function abrirSiVinoDeNotificacion() {
  if (!Notifications) return;
  try {
    const resp = await Notifications.getLastNotificationResponseAsync();
    if (resp) navegar('Notificaciones');
  } catch {}
}

// Pide permiso, obtiene el token de Expo y lo guarda en el backend.
// Se llama al entrar al Home (el usuario ya inició sesión).
export async function registrarPush() {
  if (!Notifications) return null;
  try {
    if (Platform.OS === 'android') {
      await Notifications.setNotificationChannelAsync('default', {
        name: 'Ranked',
        importance: Notifications.AndroidImportance.HIGH,
      });
    }

    let { status } = await Notifications.getPermissionsAsync();
    if (status !== 'granted') {
      ({ status } = await Notifications.requestPermissionsAsync());
    }
    if (status !== 'granted') return null;

    const projectId = Constants.expoConfig?.extra?.eas?.projectId ?? Constants.easConfig?.projectId;
    const { data: token } = await Notifications.getExpoPushTokenAsync({ projectId });
    if (!token) return null;

    await notificacionService.registrarToken({
      token,
      plataforma: Platform.OS,
      idioma: i18n.language === 'en' ? 'en' : 'es',
    });
    await SecureStore.setItemAsync(CLAVE_TOKEN, token);
    return token;
  } catch (e) {
    // Emulador sin Google Play, sin internet, sin credenciales FCM, etc.
    console.log('No se pudo registrar push:', e?.message);
    return null;
  }
}

// Al cerrar sesión: este celular deja de recibir avisos de esta cuenta
export async function desregistrarPush() {
  try {
    const token = await SecureStore.getItemAsync(CLAVE_TOKEN);
    if (token) {
      await notificacionService.desactivarToken(token).catch(() => {});
      await SecureStore.deleteItemAsync(CLAVE_TOKEN);
    }
  } catch {}
}

// Número del ícono de la app (iOS)
export async function actualizarBadge(total) {
  if (!Notifications) return;
  try { await Notifications.setBadgeCountAsync(total ?? 0); } catch {}
}
