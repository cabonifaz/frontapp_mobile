// NUEVO (07): reglas del marcador de un set (las mismas que valida el backend).
//  - Individual a 15 y dobles a 21.
//  - No hay empates.
//  - El ganador llega al puntaje con el rival 2 o más abajo (15-13, 15-4).
//  - Si empatan a uno del final (14-14 / 20-20) se sigue hasta sacar 2 de diferencia
//    (16-14, 17-15, 22-20...).

import api from '../services/api';

// Puntos para ganar un set. Se leen de la configuración (Administración > Configuración)
// para que la app y el servidor usen siempre la misma regla; 15 / 21 si no hay conexión.
const metas = { singles: 15, dobles: 21 };
let cargado = false;

export async function cargarReglasSet() {
  if (cargado) return metas;
  try {
    const lista = await api.get('/api/Maestro/configuraciones');
    for (const c of Array.isArray(lista) ? lista : []) {
      const v = Number(c.valor_numerico);
      if (!Number.isFinite(v) || v <= 1) continue;
      if (c.codigo === 'CFG_PUNTOS_SET_SINGLES') metas.singles = v;
      if (c.codigo === 'CFG_PUNTOS_SET_DOBLES') metas.dobles = v;
    }
    cargado = true;
  } catch {
    // se usan los valores por defecto
  }
  return metas;
}

export function puntosParaGanar(esDobles) {
  return esDobles ? metas.dobles : metas.singles;
}

/**
 * Devuelve null si el set es válido; si no, { clave, params } para i18n.
 */
export function validarSet(a, b, esDobles) {
  const meta = puntosParaGanar(esDobles);
  const x = Number(a);
  const y = Number(b);
  if (!Number.isInteger(x) || !Number.isInteger(y) || x < 0 || y < 0) {
    return { clave: 'reglasSet.invalido' };
  }
  if (x === y) return { clave: 'reglasSet.empate' };

  const gana = Math.max(x, y);
  const pierde = Math.min(x, y);
  if (gana < meta) return { clave: 'reglasSet.incompleto', params: { meta } };
  if (gana === meta && pierde <= meta - 2) return null;
  if (gana > meta && gana - pierde === 2) return null;
  return { clave: 'reglasSet.diferencia', params: { meta, empate: meta - 1, ejemplo: `${meta + 1}-${meta - 1}` } };
}

// ¿El set terminó con este marcador? (para el marcador en vivo)
export function setTerminado(a, b, esDobles) {
  return validarSet(a, b, esDobles) === null;
}
