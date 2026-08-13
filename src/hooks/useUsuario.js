import { useState, useEffect } from 'react';
import { usuarioService } from '../services/usuarioService';

export function useUsuario() {
  const [usuario, setUsuario] = useState(null);

  useEffect(() => {
    usuarioService.menuPrincipal()
      .then(raw => {
        if (!raw) return;
        setUsuario({
          nombre:          raw.nombre_usuario    ?? raw.nombre           ?? null,
          foto_perfil_url: raw.foto_perfil_url   ?? null,
          deporte:         raw.deporte            ?? 'Frontón',
          ranking:         raw.posicion_ranking   ?? raw.ranking          ?? null,
          calificacion:    raw.calificacion_promedio ?? raw.calificacion  ?? null,
          nivel:           raw.nivel_actual       ?? raw.nivel_calculado  ?? raw.nivel  ?? null,
          puntos:          raw.puntos_totales     ?? raw.puntaje_total    ?? raw.puntos ?? null,
        });
      })
      .catch(() => {});
  }, []);

  return usuario;
}
