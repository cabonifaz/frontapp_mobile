import api from './api';

// NUEVO (07): partidos en vivo
export const enVivoService = {
  // Partidos en vivo de mis amigos, jugadores que sigo y míos (el admin ve todos)
  async listar() {
    return api.get('/api/EnVivo');
  },

  // Partidos confirmados de hoy que aún no están en vivo (jugador: los suyos; admin: todos)
  async paraIniciar() {
    return api.get('/api/EnVivo/para-iniciar');
  },

  // { estado_vivo, set_actual, sets_lado1, sets_lado2, num_sets, es_dobles, puntos_set,
  //   puedo_marcar, jugadores: [{ id_usuario, nombre, foto, lado }], sets: [{ numero_set, puntos_lado1, puntos_lado2, terminado }] }
  async detalle(idPartido) {
    return api.get(`/api/EnVivo/${idPartido}`);
  },

  async iniciar(idPartido) {
    return api.post(`/api/EnVivo/${idPartido}/iniciar`);
  },

  async marcar(idPartido, numeroSet, puntosLado1, puntosLado2) {
    return api.post(`/api/EnVivo/${idPartido}/marcar`, {
      numero_set: numeroSet,
      puntos_lado1: puntosLado1,
      puntos_lado2: puntosLado2,
    });
  },

  // Botones + / −: se envía solo el cambio y el servidor lo aplica al set en juego
  async sumar(idPartido, lado, delta) {
    return api.post(`/api/EnVivo/${idPartido}/sumar`, { lado, delta });
  },

  async finalizar(idPartido) {
    return api.post(`/api/EnVivo/${idPartido}/finalizar`);
  },
};
