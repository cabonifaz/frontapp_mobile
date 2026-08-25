import api from './api';

export const chatService = {
  async listar(idPartido) {
    return api.get(`/api/Chat/${idPartido}/mensajes`);
  },
  async enviar(idPartido, mensaje) {
    return api.post(`/api/Chat/${idPartido}/mensajes`, { mensaje });
  },
};
