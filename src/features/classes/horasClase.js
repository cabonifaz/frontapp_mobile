// Utilidades compartidas para el horario de una clase (horas consecutivas)

// Duración máxima de una clase. Debe coincidir con CFG_HORAS_MAX_CLASE (tabla maestro);
// la base de datos también lo valida al solicitar.
export const MAX_HORAS_CLASE = 2;
const MESES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
const DIAS  = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];

export function ordenarHoras(horas) {
  return [...(Array.isArray(horas) ? horas : horas ? [horas] : [])].sort();
}

// '08:00' + 2 horas -> '10:00'
export function sumarHoras(hora, cantidad) {
  const [h, m] = String(hora).split(':').map(Number);
  const total = h + cantidad;
  return `${String(total).padStart(2, '0')}:${String(m || 0).padStart(2, '0')}`;
}

export function resumenHorario(horas) {
  const lista = ordenarHoras(horas);
  if (!lista.length) return null;
  const inicio = lista[0];
  const fin = sumarHoras(inicio, lista.length);
  return {
    inicio,
    fin,
    duracionMinutos: lista.length * 60,
    texto: `${inicio} – ${fin}`,
    duracionTexto: lista.length === 1 ? '1 hora' : `${lista.length} horas`,
  };
}

// fecha: objeto { iso } de los chips o string 'YYYY-MM-DD'
export function formatFechaClase(fecha) {
  const iso = fecha?.iso ?? (typeof fecha === 'string' ? fecha.split('T')[0] : null);
  if (!iso) return '--';
  const [y, m, d] = iso.split('-').map(Number);
  const dt = new Date(y, m - 1, d);
  return `${DIAS[dt.getDay()]} ${d} ${MESES[m - 1]}`;
}