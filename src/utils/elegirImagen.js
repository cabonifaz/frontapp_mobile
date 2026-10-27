// NUEVO (07): tomar la foto con la cámara o elegirla de la galería.
// Primero pregunta el origen; devuelve una lista de rutas locales (vacía si cancela).
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import i18n from '../i18n';

// Muestra "Tomar foto / Elegir de la galería / Cancelar". Resuelve 'camara' | 'galeria' | null
export function preguntarOrigen(titulo) {
  return new Promise(resolve => {
    Alert.alert(
      titulo ?? i18n.t('imagen.titulo'),
      undefined,
      [
        { text: i18n.t('imagen.camara'),  onPress: () => resolve('camara') },
        { text: i18n.t('imagen.galeria'), onPress: () => resolve('galeria') },
        { text: i18n.t('comun.cancelar'), style: 'cancel', onPress: () => resolve(null) },
      ],
      { cancelable: true, onDismiss: () => resolve(null) },
    );
  });
}

async function desdeCamara() {
  const { status } = await ImagePicker.requestCameraPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(i18n.t('imagen.titulo'), i18n.t('imagen.permisoCamara'));
    return [];
  }
  const res = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
  if (res.canceled) return [];
  return (res.assets ?? []).map(a => a.uri);
}

async function desdeGaleria(cupo) {
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(i18n.t('imagen.titulo'), i18n.t('imagen.permisoGaleria'));
    return [];
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: cupo > 1,
    selectionLimit: cupo > 1 ? cupo : 1,
    quality: 1,
  });
  if (res.canceled) return [];
  return (res.assets ?? []).slice(0, cupo).map(a => a.uri);
}

/**
 * Pregunta el origen y devuelve las fotos elegidas.
 * cupo: cuántas fotos como máximo (la cámara siempre devuelve 1).
 */
export async function elegirImagenes({ cupo = 1, titulo } = {}) {
  const origen = await preguntarOrigen(titulo);
  if (!origen) return [];
  try {
    return origen === 'camara' ? await desdeCamara() : await desdeGaleria(cupo);
  } catch (e) {
    Alert.alert(i18n.t('imagen.titulo'), e?.message ?? i18n.t('imagen.error'));
    return [];
  }
}

// Atajo para una sola foto (perfil). Devuelve la ruta o null.
export async function elegirUnaImagen(titulo) {
  const [uri] = await elegirImagenes({ cupo: 1, titulo });
  return uri ?? null;
}
