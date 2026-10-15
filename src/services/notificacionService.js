import api from './api';

// NUEVO (APP-AVO-041 / 042): bandeja de notificaciones y registro del celular para push
export const notificacionService = {
  async listar(limite = 50) {
    return api.get(`/api/Notificacion?limite=${limite}`);
  },

  // { total }
  async noLeidas() {
    return api.get('/api/Notificacion/no-leidas');
  },

  // Sin id = marca todas como leídas
  async marcarLeidas(idNotificacion = null) {
    return api.post('/api/Notificacion/leidas', idNotificacion ? { id_notificacion: idNotificacion } : {});
  },

  async registrarToken({ token, plataforma, idioma }) {
    return api.post('/api/Notificacion/push-token', { token, plataforma, idioma });
  },

  async desactivarToken(token) {
    return api.post('/api/Notificacion/push-token/desactivar', { token });
  },
};
