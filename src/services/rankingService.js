import api from './api';

export const rankingService = {
  async listar({ idDeporte = 1, filtroGenero = null, pagina = 1, tamanoPagina = 20 } = {}) {
    const params = new URLSearchParams({ id_deporte: idDeporte, pagina, tamano_pagina: tamanoPagina });
    if (filtroGenero) params.append('filtro_genero', filtroGenero);
    return api.get(`/api/Ranking?${params}`);
  },

  async miPosicion(idDeporte = 1) {
    return api.get(`/api/Ranking/mi-posicion?id_deporte=${idDeporte}`);
  },

  async perfil(idUsuario, idDeporte = 1) {
    return api.get(`/api/Ranking/${idUsuario}?id_deporte=${idDeporte}`);
  },
};
