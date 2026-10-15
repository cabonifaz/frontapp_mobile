import api from './api';

export const resultadoService = {
  async listar({ filtroFecha = null, busquedaNombre = null } = {}) {
    const params = new URLSearchParams();
    if (filtroFecha) params.append('filtro_fecha', filtroFecha);
    if (busquedaNombre) params.append('busqueda_nombre', busquedaNombre);
    return api.get(`/api/Resultado?${params}`);
  },

  // NUEVO (APP-AVO-040): carrusel del Home (amigos y seguidos primero)
  async feed(limite = 20) {
    return api.get(`/api/Resultado/feed?limite=${limite}`);
  },

  // NUEVO (APP-AVO-039): resultados confirmados de otro jugador
  async deJugador(idJugador, limite = 50) {
    return api.get(`/api/Resultado/jugador/${idJugador}?limite=${limite}`);
  },

  // NUEVO (fotos del encuentro) -> { fotos: [...], puedeSubir }
  async fotos(idPartido) {
    return api.get(`/api/Resultado/${idPartido}/fotos`);
  },

  async agregarFoto(idPartido, url) {
    return api.post(`/api/GestionResultado/${idPartido}/fotos`, { url });
  },

  async eliminarFoto(idFoto) {
    return api.delete(`/api/GestionResultado/fotos/${idFoto}`);
  },

  async detalle(idPartido) {
    return api.get(`/api/Resultado/${idPartido}`);
  },

  async publicar(idPartido, { idRival, calificacionRival, comentario, sets }) {
    return api.post(`/api/GestionResultado/${idPartido}/publicar`, {
      id_rival:          idRival,
      calificacion_rival: calificacionRival,
      comentario,
      sets:              sets, // <-- ¡SOLO PASA LA VARIABLE!
    });
  },

  async confirmar(idPartido, { estaDeAcuerdo, idRival, sets }) {
    return api.post(`/api/GestionResultado/${idPartido}/confirmar`, {
      esta_de_acuerdo:   estaDeAcuerdo,
      id_rival:          idRival,
      sets:              sets, // <-- ¡AQUÍ TAMBIÉN!
    });
  },
};