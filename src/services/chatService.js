import api from './api';

export const chatService = {
  async listar(idPartido) {
    return api.get(`/api/Chat/partido/${idPartido}`);
  },
  async enviar(idPartido, mensaje) {
    // El backend espera un objeto con { partidoId, mensaje } según el DTO
    return api.post('/api/Chat/enviar', { 
      partidoId: idPartido, 
      mensaje: mensaje 
    });
  },
};