import api from './api';
import { DEPORTE_DEFAULT } from '../constants/maestro';

// Partidos de dobles (amistoso)
export const doblesService = {
  // Convocatoria: sin idRival1/idRival2. Directo: con ambos rivales.
  async crear({ idCompanero, idRival1 = null, idRival2 = null, idCancha, fecha, hora, numSets = 5, idDeporte = DEPORTE_DEFAULT }) {
    return api.post('/api/PartidoAmistoso/crear-dobles', {
      id_companero: idCompanero,
      id_rival1:    idRival1,
      id_rival2:    idRival2,
      id_deporte:   idDeporte,
      id_cancha:    idCancha,
      fecha,
      hora,
      num_sets:     numSets,
    });
  },

  // Convocatorias de dobles publicadas (para Buscar partido)
  async convocatorias(idDeporte = DEPORTE_DEFAULT) {
    return api.get(`/api/Dobles/convocatorias?id_deporte=${idDeporte}`);
  },

  // Invitaciones recibidas + parejas que retan mis convocatorias
  async pendientes(idDeporte = DEPORTE_DEFAULT) {
    return api.get(`/api/Dobles/pendientes?id_deporte=${idDeporte}`);
  },

  async participantes(idPartido) {
    return api.get(`/api/Dobles/${idPartido}/participantes`);
  },

  async responderInvitacion(idPartido, aceptar) {
    return api.post(`/api/Dobles/${idPartido}/responder-invitacion`, { aceptar });
  },

  // Retar una convocatoria de dobles junto a un compañero
  async postular(idPartido, idCompanero) {
    return api.post(`/api/Dobles/${idPartido}/postular`, { id_companero: idCompanero });
  },

  // El creador o su compañero aprueba/rechaza a una pareja retadora
  async responderPareja(idPartido, idLider, aceptar) {
    return api.post(`/api/Dobles/${idPartido}/responder-pareja`, { id_lider: idLider, aceptar });
  },
};

// Utilidades compartidas
export const esDobles = (p) =>
  Number(p?.es_dobles ?? 0) === 1 ||
  p?.tipo_juego_codigo === 'JUEGO_DOBLES' ||
  String(p?.tipo_juego ?? p?.nombre_tipo_juego ?? '').toLowerCase().includes('doble');

export const primerNombre = (n) => String(n ?? '').trim().split(' ')[0] || 'Jugador';