import api from './api';
import { DEPORTE_DEFAULT } from '../constants/maestro';

export const amistadService = {
  // Lista de amigos aceptados (con ranking/puntaje del deporte)
  async listarAmigos(idDeporte = DEPORTE_DEFAULT) {
    return api.get(`/api/Amistad?id_deporte=${idDeporte}`);
  },

  // Solicitudes que otros jugadores me enviaron y están pendientes
  async solicitudesRecibidas(idDeporte = DEPORTE_DEFAULT) {
    return api.get(`/api/Amistad/solicitudes-recibidas?id_deporte=${idDeporte}`);
  },

  // { estado: 'NINGUNA' | 'PENDIENTE_ENVIADA' | 'PENDIENTE_RECIBIDA' | 'AMIGOS' | 'MISMO_USUARIO', idAmistad }
  async estado(idUsuario) {
    return api.get(`/api/Amistad/estado/${idUsuario}`);
  },

  // Devuelve { exito, mensaje, estado } — estado puede ser 'AMIGOS' si el otro ya me había enviado solicitud
  async enviarSolicitud(idUsuario) {
    return api.post(`/api/Amistad/solicitud/${idUsuario}`);
  },

  async responder(idAmistad, aceptar) {
    return api.post(`/api/Amistad/${idAmistad}/responder`, { aceptar });
  },

  // Elimina la amistad o cancela una solicitud que yo envié
  async eliminar(idUsuario) {
    return api.delete(`/api/Amistad/${idUsuario}`);
  },
};