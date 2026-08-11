import api from './api';
import { DEPORTE_DEFAULT } from '../constants/maestro';

export const usuarioService = {
  async menuPrincipal(idDeporte = DEPORTE_DEFAULT) {
    return api.get(`/api/Usuario/menu-principal?id_deporte=${idDeporte}`);
  },

  async cuestionario({ idDeporte, nivelFisico, idNivelJuego, partidosSemanales, leccionesSemanales, edad, idGenero }) {
    return api.post('/api/Usuario/cuestionario', {
      id_deporte:          idDeporte,
      nivel_fisico:        nivelFisico,
      id_nivel_juego:      idNivelJuego,
      partidos_semanales:  partidosSemanales,
      lecciones_semanales: leccionesSemanales,
      edad,
      id_genero:           idGenero,
    });
  },

  async actualizarFoto(fotoPerfliUrl) {
    return api.put('/api/Usuario/foto-perfil', { foto_perfil_url: fotoPerfliUrl });
  },

  async perfil(idDeporte = DEPORTE_DEFAULT) {
    return api.get(`/api/Usuario/perfil?id_deporte=${idDeporte}`);
  },

  async deportes() {
    return api.get('/api/Usuario/deportes');
  },

  async misResultados({ pagina = 1, tamanoPagina = 10 } = {}) {
    return api.get(`/api/Usuario/mis-resultados?pagina=${pagina}&tamano_pagina=${tamanoPagina}`);
  },

  async crearPerfilProfesor({ aniosExperiencia, descripcion, tarifaReferencial }) {
    return api.post('/api/Usuario/perfil-profesor', {
      anios_experiencia:  aniosExperiencia,
      descripcion,
      tarifa_referencial: tarifaReferencial,
    });
  },
};
