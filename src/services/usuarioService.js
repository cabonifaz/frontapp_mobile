import api from './api';
import { deporteActivo } from '../utils/deporteActivo';   // NUEVO (07): deporte elegido al entrar

export const usuarioService = {
  async menuPrincipal(idDeporte = deporteActivo()) {
    return api.get(`/api/Usuario/menu-principal?id_deporte=${idDeporte}`);
  },

  async cuestionario({ idDeporte, nivelFisico, nivelJuego, partidosSemanales, leccionesSemanales, edad, idGenero }) {
    return api.post('/api/Usuario/cuestionario', {
      id_deporte:          idDeporte,
      nivel_fisico:        nivelFisico,
      nivel_juego:         nivelJuego,
      partidos_semanales:  partidosSemanales,
      lecciones_semanales: leccionesSemanales,
      edad,
      id_genero:           idGenero,
    });
  },

  async actualizarFoto(fotoPerfliUrl) {
    return api.put('/api/Usuario/foto-perfil', { foto_perfil_url: fotoPerfliUrl });
  },

  async perfil(idDeporte = deporteActivo()) {
    return api.get(`/api/Usuario/perfil?id_deporte=${idDeporte}`);
  },

  async deportes() {
    return api.get('/api/Usuario/deportes');
  },

  async misResultados({ pagina = 1, tamanoPagina = 10 } = {}) {
    return api.get(`/api/Usuario/mis-resultados?pagina=${pagina}&tamano_pagina=${tamanoPagina}`);
  },

  // NUEVO: datos privados (celular, fecha de nacimiento, sobre mí) para Editar perfil
  async misDatos() {
    return api.get('/api/Usuario/mis-datos');
  },

  // NUEVO: guarda Editar perfil. fechaNacimiento en formato 'AAAA-MM-DD' o null
  async actualizarPerfil({ nombre, apellidos, telefono, fechaNacimiento, sobreMi }) {
    return api.put('/api/Usuario/perfil', {
      nombre,
      apellidos,
      telefono:         telefono || null,
      fecha_nacimiento: fechaNacimiento || null,
      sobre_mi:         sobreMi || null,
    });
  },

  // NUEVO (APP-AVO-036): codigo = 'MANO_DIESTRO' | 'MANO_ZURDO' | 'MANO_AMBIDIESTRO'
  async actualizarManoDominante(codigo) {
    return api.put('/api/Usuario/mano-dominante', { codigo });
  },

  async crearPerfilProfesor({ aniosExperiencia, descripcion, tarifaReferencial }) {
    return api.post('/api/Usuario/perfil-profesor', {
      anios_experiencia:  aniosExperiencia,
      descripcion,
      tarifa_referencial: tarifaReferencial,
    });
  },
};
