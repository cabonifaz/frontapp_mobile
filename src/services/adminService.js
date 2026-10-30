import api from './api';

// NUEVO (07): perfil administrador (la cuenta se marca como admin por base de datos)
let cacheAdmin = null;

export const adminService = {
  // true | false. Se guarda en memoria mientras la app está abierta.
  async esAdmin({ refrescar = false } = {}) {
    if (cacheAdmin != null && !refrescar) return cacheAdmin;
    try {
      const res = await api.get('/api/Admin/yo');
      cacheAdmin = !!res?.esAdmin;
    } catch {
      cacheAdmin = false;
    }
    return cacheAdmin;
  },

  olvidar() {
    cacheAdmin = null;
  },

  // filtro: 'PENDIENTES' | 'ACTIVAS' | 'TODAS'
  async inscripciones(filtro = 'PENDIENTES') {
    return api.get(`/api/Admin/inscripciones?filtro=${filtro}`);
  },

  // monto vacío = cuota de la liga
  async validarPago(idInscripcion, { monto = null, referencia = null } = {}) {
    return api.post(`/api/Admin/inscripciones/${idInscripcion}/validar`, { monto, referencia });
  },

  async rechazar(idInscripcion) {
    return api.post(`/api/Admin/inscripciones/${idInscripcion}/rechazar`);
  },

  // NUEVO (08): solo lo necesario, agrupado por secciones
  async configuraciones() {
    return api.get('/api/Admin/configuracion');
  },

  // NUEVO (08): ligas y auspiciadores
  async ligas() {
    return api.get('/api/Admin/ligas');
  },

  async guardarLiga(datos) {
    return api.post('/api/Admin/ligas', datos);
  },

  async participantesLiga(idLiga) {
    return api.get(`/api/Admin/ligas/${idLiga}/participantes`);
  },

  async guardarConfiguracion({ codigo, valor = null, valorNumerico = null }) {
    return api.put('/api/Maestro/configuraciones', { codigo, valor, valor_numerico: valorNumerico });
  },
};
