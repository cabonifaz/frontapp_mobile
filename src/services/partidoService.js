import api from './api';

export const partidoService = {
  async buscarRankeado({ idDeporte = 1, idCancha = null, fecha = null, hora = null, idTipoJuego = null } = {}) {
    const params = new URLSearchParams({ id_deporte: idDeporte });
    if (idCancha) params.append('id_cancha', idCancha);
    if (fecha) params.append('fecha', fecha);
    if (hora) params.append('hora', hora);
    if (idTipoJuego) params.append('id_tipo_juego', idTipoJuego);
    return api.get(`/api/PartidoRankeado/buscar?${params}`);
  },

  async buscarAmistoso({ idDeporte = 1, idCancha = null, fecha = null, hora = null, idTipoJuego = null } = {}) {
    const params = new URLSearchParams({ id_deporte: idDeporte });
    if (idCancha) params.append('id_cancha', idCancha);
    if (fecha) params.append('fecha', fecha);
    if (hora) params.append('hora', hora);
    if (idTipoJuego) params.append('id_tipo_juego', idTipoJuego);
    return api.get(`/api/PartidoAmistoso/buscar?${params}`);
  },

  async crearRankeado(datos) {
    return api.post('/api/PartidoRankeado/crear', datos);
  },

  async crearAmistoso(datos) {
    return api.post('/api/PartidoAmistoso/crear', datos);
  },

  async postular(idPartido) {
    return api.post(`/api/Partido/postular/${idPartido}`);
  },

  async listarMisPartidos(idDeporte = 1) {
    return api.get(`/api/GestionPartido?id_deporte=${idDeporte}`);
  },

  async detalle(idPartido) {
    return api.get(`/api/GestionPartido/${idPartido}`);
  },
};
