import api from './api';

export const solicitudService = {
  async misSolicitudes() {
    return api.get('/api/Solicitud/mis-solicitudes');
  },

  async aceptar(idSolicitud, idRetador) {
    return api.post(`/api/Solicitud/${idSolicitud}/aceptar/${idRetador}`);
  },

  async rechazar(idSolicitud, idRetador) {
    return api.post(`/api/Solicitud/${idSolicitud}/rechazar/${idRetador}`);
  },
};
