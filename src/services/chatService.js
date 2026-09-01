import api from './api';

export const chatService = {
  async listar(idPartido) {
    return api.get(`/api/Chat/partido/${idPartido}`);
  },
  async enviar(idPartido, mensaje) {
    return api.post('/api/Chat/enviar', { partidoId: idPartido, mensaje });
  },

  async listarClase(idClase) {
    return api.get(`/api/Chat/clase/${idClase}`);
  },
  async enviarClase(idClase, mensaje) {
    return api.post('/api/Chat/enviar', { claseId: idClase, mensaje });
  },
};