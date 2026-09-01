import api from './api';
import { DEPORTE_DEFAULT } from '../constants/maestro';

export const claseService = {
  async profesoresDisponibles({ idDeporte = DEPORTE_DEFAULT, idCancha, fecha, hora }) {
    const params = new URLSearchParams({ id_deporte: idDeporte, id_cancha: idCancha, fecha, hora });
    return api.get(`/api/Clase/profesores-disponibles?${params}`);
  },

  async solicitar({ idProfesor, idDeporte = DEPORTE_DEFAULT, idCancha, fecha, hora, duracionMinutos = 60 }) {
    return api.post('/api/Clase/solicitar', {
      id_profesor:       idProfesor,
      id_deporte:        idDeporte,
      id_cancha:         idCancha,
      fecha,
      hora,
      duracion_minutos:  duracionMinutos,
    });
  },

  async aceptar(idClase) {
    return api.post(`/api/Clase/${idClase}/aceptar`);
  },

  async completar(idClase) {
    return api.post(`/api/Clase/${idClase}/completar`);
  },

  async cancelar(idClase) {
    return api.post(`/api/Clase/${idClase}/cancelar`);
  },

  async dejarFeedback(idClase, { calificacion, comentario }) {
    return api.post(`/api/Clase/${idClase}/feedback`, { calificacion, comentario });
  },

  async misClases(idDeporte = DEPORTE_DEFAULT) {
    return api.get(`/api/Clase/mis-clases?id_deporte=${idDeporte}`);
  },

  async detalle(idClase) {
    return api.get(`/api/Clase/${idClase}`);
  },

  async solicitudesProfesor(idDeporte = DEPORTE_DEFAULT) {
    return api.get(`/api/Clase/solicitudes-profesor?id_deporte=${idDeporte}`);
  },
};
