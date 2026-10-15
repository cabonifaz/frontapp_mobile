// NUEVO: fotos del encuentro (elegir de la galería, reducir tamaño y subir a Cloudinary)
import { Alert } from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { manipulateAsync, SaveFormat } from 'expo-image-manipulator';
import i18n from '../i18n';
import { uploadImage } from '../services/cloudinaryService';
import { resultadoService } from '../services/resultadoService';

export const MAX_FOTOS = 5;

// Abre la galería y devuelve las rutas locales elegidas (hasta "cupo")
export async function elegirFotos(cupo) {
  if (cupo <= 0) {
    Alert.alert(i18n.t('fotos.titulo'), i18n.t('fotos.maximo', { n: MAX_FOTOS }));
    return [];
  }
  const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
  if (status !== 'granted') {
    Alert.alert(i18n.t('fotos.titulo'), i18n.t('fotos.permiso'));
    return [];
  }
  const res = await ImagePicker.launchImageLibraryAsync({
    mediaTypes: ['images'],
    allowsMultipleSelection: true,
    selectionLimit: cupo,
    quality: 1,
  });
  if (res.canceled) return [];
  return (res.assets ?? []).slice(0, cupo).map(a => a.uri);
}

// Reduce la foto (máx. 1280 px de ancho, JPG 70%) para que suba rápido
async function reducir(uri) {
  try {
    const r = await manipulateAsync(uri, [{ resize: { width: 1280 } }], {
      compress: 0.7,
      format: SaveFormat.JPEG,
    });
    return r.uri;
  } catch {
    return uri;   // si no se puede reducir, se sube la original
  }
}

// Sube las fotos y las asocia al partido. Devuelve cuántas se guardaron.
export async function subirFotosPartido(idPartido, uris) {
  let ok = 0;
  for (const uri of uris) {
    try {
      const url = await uploadImage(await reducir(uri));
      await resultadoService.agregarFoto(idPartido, url);
      ok += 1;
    } catch (e) {
      console.log('No se pudo subir una foto:', e?.message);
    }
  }
  return ok;
}
