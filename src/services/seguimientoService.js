import api from './api';
import { deporteActivo } from '../utils/deporteActivo';   // NUEVO (07): deporte elegido al entrar

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

  async siguiendo(idDeporte = deporteActivo()) {
    return api.get(`/api/Seguimiento/siguiendo?id_deporte=${idDeporte}`);
  },
};
