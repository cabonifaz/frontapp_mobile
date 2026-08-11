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

  async publicar(idPartido, { idRival, calificacionRival, comentario, sets }) {
    return api.post(`/api/GestionResultado/${idPartido}/publicar`, {
      id_rival:          idRival,
      calificacion_rival: calificacionRival,
      comentario,
      sets: JSON.stringify(sets),
    });
  },

  async confirmar(idPartido, { estaDeAcuerdo, idRival, sets }) {
    return api.post(`/api/GestionResultado/${idPartido}/confirmar`, {
      esta_de_acuerdo: estaDeAcuerdo,
      id_rival:        idRival,
      sets:            JSON.stringify(sets),
    });
  },
};
