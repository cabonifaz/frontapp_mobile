// NUEVO (07): deporte elegido al iniciar sesión ("universo" en el que se juega).
// Cada deporte tiene su propio ranking, nivel, partidos y resultados en la base de datos,
// así que todas las pantallas consultan con el deporte activo.
import * as SecureStore from 'expo-secure-store';
import { DEPORTE_DEFAULT } from '../constants/maestro';

const CLAVE = 'deporte_activo';
let actual = null;   // { id, nombre }

// Id del deporte activo (lo usan los servicios como valor por defecto)
export function deporteActivo() {
  return actual?.id ?? DEPORTE_DEFAULT;
}

export function nombreDeporteActivo() {
  return actual?.nombre ?? null;
}

// Lee el deporte guardado en el celular. Devuelve null si nunca eligió uno.
export async function cargarDeporteActivo() {
  try {
    const guardado = await SecureStore.getItemAsync(CLAVE);
    actual = guardado ? JSON.parse(guardado) : null;
  } catch {
    actual = null;
  }
  return actual;
}

export async function guardarDeporteActivo(id, nombre = null) {
  actual = { id: Number(id), nombre };
  try { await SecureStore.setItemAsync(CLAVE, JSON.stringify(actual)); } catch {}
}

// Al cerrar sesión se vuelve a preguntar el deporte en el próximo inicio
export async function limpiarDeporteActivo() {
  actual = null;
  try { await SecureStore.deleteItemAsync(CLAVE); } catch {}
}
