import api from './api';

export const maestroService = {
  async canchas(busqueda = null) {
    const params = busqueda ? `?busqueda=${encodeURIComponent(busqueda)}` : '';
    return api.get(`/api/Maestro/canchas${params}`);
  },

  async deportes() {
    return api.get('/api/Maestro/deportes');
  },
};
