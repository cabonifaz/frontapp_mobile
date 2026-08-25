import api from './api';

export const chatService = {
  async listar(idPartido) {
    return api.get(`/api/Chat/partido/${idPartido}`);
  },
  async enviar(idPartido, mensaje) {
    return api.post('/api/Chat/enviar', { idPartido, mensaje });
  },
};
