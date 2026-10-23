// NUEVO (043): captura la tarjeta del resultado y abre el menú de compartir del sistema
// (desde ahí el jugador elige Instagram → Historia).
// Los módulos nativos se cargan aquí dentro: si alguien usa un APK viejo sin ellos,
// se le avisa que actualice en lugar de cerrarse la app.
import { Alert } from 'react-native';
import i18n from '../i18n';

export async function compartirTarjeta(ref) {
  let captureRef;
  let Sharing;
  try {
    ({ captureRef } = require('react-native-view-shot'));
    Sharing = require('expo-sharing');
  } catch {
    Alert.alert(i18n.t('historia.titulo'), i18n.t('historia.actualizaApp'));
    return;
  }

  try {
    if (!(await Sharing.isAvailableAsync())) {
      Alert.alert(i18n.t('historia.titulo'), i18n.t('historia.noDisponible'));
      return;
    }
    const uri = await captureRef(ref, {
      format: 'png',
      quality: 1,
      width: 1080,
      height: 1920,
      result: 'tmpfile',
    });
    await Sharing.shareAsync(uri, {
      mimeType: 'image/png',
      dialogTitle: i18n.t('historia.titulo'),
      UTI: 'public.png',
    });
  } catch (e) {
    const msg = String(e?.message ?? '');
    const faltaModulo = /native module|RNViewShot|ExpoSharing|null is not an object/i.test(msg);
    Alert.alert(i18n.t('historia.titulo'), i18n.t(faltaModulo ? 'historia.actualizaApp' : 'historia.error'));
  }
}
