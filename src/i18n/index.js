// Configuración de idiomas de Ranked (español / inglés)
import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import * as SecureStore from 'expo-secure-store';
import es from './es.json';
import en from './en.json';

export const IDIOMAS = [
  { codigo: 'es', nombre: 'Español' },
  { codigo: 'en', nombre: 'English' },
];

const CLAVE_IDIOMA = 'idioma';

i18n.use(initReactI18next).init({
  resources: {
    es: { translation: es },
    en: { translation: en },
  },
  lng: 'es',
  fallbackLng: 'es',               // si falta un texto en inglés, se muestra en español
  interpolation: { escapeValue: false },
  returnNull: false,
});

// Se llama al abrir la app (SplashScreen): aplica el idioma que eligió el usuario
export async function cargarIdiomaGuardado() {
  try {
    const idioma = await SecureStore.getItemAsync(CLAVE_IDIOMA);
    if (idioma && idioma !== i18n.language) {
      await i18n.changeLanguage(idioma);
    }
  } catch {
    // si no se puede leer, se queda en español
  }
}

// Cambia el idioma de toda la app al instante y lo recuerda para la próxima vez
export async function cambiarIdioma(idioma) {
  await i18n.changeLanguage(idioma);
  try {
    await SecureStore.setItemAsync(CLAVE_IDIOMA, idioma);
  } catch {
    // si no se puede guardar, el cambio igual aplica en esta sesión
  }
}

export default i18n;