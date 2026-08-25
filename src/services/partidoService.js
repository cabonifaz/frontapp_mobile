import api from './api';
import { DEPORTE_DEFAULT } from '../constants/maestro';

export const partidoService = {
  async buscarRankeado({ idDeporte = DEPORTE_DEFAULT, idCancha = null, fecha = null, hora = null, idTipoJuego = null } = {}) {
    const params = new URLSearchParams({ id_deporte: idDeporte });
    if (idCancha) params.append('id_cancha', idCancha);
    if (fecha) params.append('fecha', fecha);
    if (hora) params.append('hora', hora);
    if (idTipoJuego) params.append('id_tipo_juego', idTipoJuego);
    return api.get(`/api/PartidoRankeado/buscar?${params}`);
  },

  async buscarAmistoso({ idDeporte = DEPORTE_DEFAULT, idCancha = null, fecha = null, hora = null, idTipoJuego = null } = {}) {
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

  // Método específico para consolidar el flujo de Retar / Postular a un partido existente
  async retarJugador(idPartido) {
    return api.post(`/api/Partido/postular/${idPartido}`);
  },

  async cancelar(idPartido) {
    return api.post(`/api/Partido/${idPartido}/cancelar`);
  },

  async listarMisPartidos(idDeporte = DEPORTE_DEFAULT) {
    return api.get(`/api/GestionPartido?id_deporte=${idDeporte}`);
  },

  async detalle(idPartido) {
    return api.get(`/api/GestionPartido/${idPartido}`);
  },

  async marcarLeido(idPartido) {
    return api.post(`/api/GestionPartido/${idPartido}/marcar-leido`);
  },

  // ── Métodos de Chat (NoSQL) ─────────────────────────
  async obtenerMensajesChat(idPartido) {
    return api.get(`/api/Chat/partido/${idPartido}`);
  },

  async enviarMensajeChat(idPartido, mensaje) {
    return api.post('/api/Chat/enviar', { idPartido, mensaje });
  },
};