import { useState, useEffect } from 'react';
import { usuarioService } from '../services/usuarioService';

// Caché compartida: varias pantallas (y la barra superior) usan este hook;
// así se evita repetir la misma petición y todas muestran el mismo dato.
let cacheUsuario = null;
let peticionEnCurso = null;

function normalizar(raw) {
  return {
    nombre:          raw.nombre_usuario    ?? raw.nombre           ?? raw.nombre_completo?.split(' ')[0] ?? null,
    foto_perfil_url: raw.foto_perfil_url   ?? null,
    deporte:         raw.deporte            ?? 'Frontón',
    ranking:         raw.posicion_ranking   ?? raw.ranking          ?? null,
    // NUEVO: la estrella principal es la calificación como JUGADOR
    calificacion:    raw.calificacion_jugador ?? null,
    totalCalificaciones: raw.total_calificaciones_jugador ?? 0,
    // NUEVO: calificación como PROFESOR (solo si es profesor)
    esProfesor:      Number(raw.es_profesor ?? 0) === 1,
    calificacionProfesor: raw.calificacion_profesor ?? null,
    nivel:           raw.nivel_actual       ?? raw.nivel_calculado  ?? raw.nivel  ?? null,
    puntos:          raw.puntos_totales     ?? raw.puntaje_total    ?? raw.puntos ?? 0,
  };
}

async function cargarUsuario() {
  if (!peticionEnCurso) {
    peticionEnCurso = (async () => {
      try {
        let raw = await usuarioService.menuPrincipal();
        if (!raw) raw = await usuarioService.perfil();
        if (raw) cacheUsuario = normalizar(raw);
      } catch {
        try {
          const raw = await usuarioService.perfil();
          if (raw) cacheUsuario = normalizar(raw);
        } catch {}
      } finally {
        setTimeout(() => { peticionEnCurso = null; }, 0);
      }
      return cacheUsuario;
    })();
  }
  return peticionEnCurso;
}

export function useUsuario() {
  const [usuario, setUsuario] = useState(cacheUsuario);

  useEffect(() => {
    let activo = true;
    cargarUsuario().then(u => { if (activo && u) setUsuario(u); });
    return () => { activo = false; };
  }, []);

  return usuario;
}