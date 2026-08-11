import api from './api';

export const resultadoService = {
  async listar({ filtroFecha = null, busquedaNombre = null } = {}) {
    const params = new URLSearchParams();
    if (filtroFecha) params.append('filtro_fecha', filtroFecha);
    if (busquedaNombre) params.append('busqueda_nombre', busquedaNombre);
    return api.get(`/api/Resultado?${params}`);
  },

  async detalle(idPartido) {
    return api.get(`/api/Resultado/${idPartido}`);
  },
};
