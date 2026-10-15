import api from './api';
import { DEPORTE_DEFAULT } from '../constants/maestro';

// NUEVO (APP-AVO-037): seguir jugadores para ver sus resultados sin retarlos
export const seguimientoService = {
  // { siguiendo: boolean, seguidores: number }
  async estado(idUsuario) {
    return api.get(`/api/Seguimiento/estado/${idUsuario}`);
  },

  async seguir(idUsuario) {
    return api.post(`/api/Seguimiento/${idUsuario}`);
  },

  async dejarDeSeguir(idUsuario) {
    return api.delete(`/api/Seguimiento/${idUsuario}`);
  },

  async siguiendo(idDeporte = DEPORTE_DEFAULT) {
    return api.get(`/api/Seguimiento/siguiendo?id_deporte=${idDeporte}`);
  },
};
