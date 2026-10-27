import api from './api';
import { deporteActivo } from '../utils/deporteActivo';   // NUEVO (07): deporte elegido al entrar

export const rankingService = {
  async listar({ idDeporte = deporteActivo(), filtroGenero = null, pagina = 1, tamanoPagina = 20 } = {}) {
    const params = new URLSearchParams({ id_deporte: idDeporte, pagina, tamano_pagina: tamanoPagina });
    if (filtroGenero) params.append('filtro_genero', filtroGenero);
    return api.get(`/api/Ranking?${params}`);
  },

  async miPosicion(idDeporte = deporteActivo()) {
    return api.get(`/api/Ranking/mi-posicion?id_deporte=${idDeporte}`);
  },

  async perfil(idUsuario, idDeporte = deporteActivo()) {
    return api.get(`/api/Ranking/${idUsuario}?id_deporte=${idDeporte}`);
  },

  async validarReto(idUsuario, idDeporte = deporteActivo()) {
    return api.get(`/api/Ranking/${idUsuario}/validar-reto?id_deporte=${idDeporte}`);
  },

  async obtenerResultados(idUsuario, idDeporte = deporteActivo()) {
    return api.get(`/api/Ranking/${idUsuario}/resultados?id_deporte=${idDeporte}`);
  },
};
