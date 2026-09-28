import api from './api';
import { DEPORTE_DEFAULT } from '../constants/maestro';

export const ligaService = {
  // Ligas de un deporte y modalidad (idTipoJuego: 45 singles, 46 dobles)
  async listar({ idDeporte = DEPORTE_DEFAULT, idTipoJuego = null } = {}) {
    const params = new URLSearchParams({ id_deporte: idDeporte });
    if (idTipoJuego) params.append('id_tipo_juego', idTipoJuego);
    return api.get(`/api/Liga?${params}`);
  },

  async detalle(idLiga) {
    return api.get(`/api/Liga/${idLiga}`);
  },

  // Posiciones con motivo_bloqueo por fila ('OK' = se puede retar)
  async tabla(idLiga) {
    return api.get(`/api/Liga/${idLiga}/tabla`);
  },

  async partidos(idLiga) {
    return api.get(`/api/Liga/${idLiga}/partidos`);
  },

  // Devuelve { exito, mensaje, estadoInscripcion: 'INSC_ACTIVA' | 'INSC_PENDIENTE_PAGO' }
  async inscribirse(idLiga) {
    return api.post(`/api/Liga/${idLiga}/inscribirse`);
  },

  // NUEVO: ligas de dobles — el capitán inscribe al equipo con su compañero
  async inscribirseDobles(idLiga, idCompanero) {
    return api.post(`/api/Liga/${idLiga}/inscribirse-dobles`, { id_companero: idCompanero });
  },

  // NUEVO: el compañero acepta o rechaza formar el equipo
  async responderEquipo(idInscripcion, aceptar) {
    return api.post(`/api/Liga/inscripcion/${idInscripcion}/responder`, { aceptar });
  },

  // datos: { id_rival, id_cancha, fecha: 'YYYY-MM-DD', hora: 'HH:mm' }
  // En ligas de dobles, id_rival es cualquier jugador del equipo rival (la tabla envía al capitán).
  async retar(idLiga, datos) {
    return api.post(`/api/Liga/${idLiga}/retar`, datos);
  },
};