// IDs de la tabla maestra de la base de datos

// CAT_DEPORTE (id_maestro_padre = 1)
export const DEPORTES = {
  FRONTON: 17,
  TENIS:   18,
  PADEL:   19,
};

// CAT_GENERO (id_maestro_padre = 2)
export const GENEROS = {
  MASCULINO: 20,
  FEMENINO:  21,
};

// CAT_NIVEL_JUEGO (id_maestro_padre = 3)
export const NIVELES_JUEGO = {
  PRINCIPIANTE: 22,
  INTERMEDIO:   23,
  AVANZADO:     24,
};

// CAT_TIPO_RETO (id_maestro_padre = 4)
export const TIPOS_RETO = {
  AMISTOSO: 25,
  RANKEADO: 26,
  CLASE:    27,
};

// CAT_ESTADO_PARTIDO (id_maestro_padre = 5)
export const ESTADOS_PARTIDO = {
  BUSCANDO:   28,
  PENDIENTE:  29,
  CONFIRMADO: 30,
  FINALIZADO: 31,
  CANCELADO:  32,
};

// CAT_ESTADO_PARTICIPANTE (id_maestro_padre = 6)
export const ESTADOS_PARTICIPANTE = {
  CREADOR:    33,
  POSTULANTE: 34,
  ACEPTADO:   35,
  RECHAZADO:  36,
};

// CAT_ESTADO_RESULTADO (id_maestro_padre = 7)
export const ESTADOS_RESULTADO = {
  PUBLICADO:   37,
  EN_REVISION: 38,
  CONFIRMADO:  39,
  VENCIDO:     40,
};

// CAT_ESTADO_CLASE (id_maestro_padre = 8)
export const ESTADOS_CLASE = {
  SOLICITADA: 41,
  ACEPTADA:   42,
  CANCELADA:  43,
  COMPLETADA: 44,
};

// CAT_TIPO_JUEGO (id_maestro_padre = 10)
export const TIPOS_JUEGO = {
  SINGLES: 45,
  DOBLES:  46,
};

// CAT_PROVEEDOR_AUTH (id_maestro_padre = 14)
export const PROVEEDORES_AUTH = {
  LOCAL:    47,
  GOOGLE:   48,
  APPLE:    49,
  FACEBOOK: 50,
};

// CAT_MOTIVO_MOVIMIENTO_PUNTOS (id_maestro_padre = 15)
export const MOTIVOS_PUNTOS = {
  SET_GANADO:        51,
  SET_PERDIDO:       52,
  CLASE_COMPLETADA:  53,
  AJUSTE_MANUAL:     54,
};

// CAT_PAIS (id_maestro_padre = 11)
export const PAISES = {
  PERU:  55,
  CHILE: 56,
};

// CAT_CIUDAD (id_maestro_padre = 12)
export const CIUDADES = {
  LIMA: 57,
};

// CAT_DISTRITO (id_maestro_padre = 13)
export const DISTRITOS = {
  MIRAFLORES: 58,
  SAN_ISIDRO: 59,
};

// CAT_CONFIGURACION (id_maestro_padre = 16) — valores por defecto según BD
export const CFG = {
  PORC_MATCHMAKING_AMISTOSO:  { id: 60, valor: 15 },
  POS_MATCHMAKING_RANKEADO:   { id: 61, valor: 5 },
  PUNTOS_POR_SET:             { id: 62, valor: 0.001 },
  HORAS_LIMITE_REVISION:      { id: 63, valor: 12 },
  VIAJES_MAX_REVISION:        { id: 64, valor: 3 },
  MINUTOS_CANCELACION_CLASE:  { id: 65, valor: 15 },
  PUNTOS_POR_CLASE:           { id: 66, valor: 100 },
  PARTIDOS_POR_RETO_RIESGO:   { id: 67, valor: 5 },
};

// Deporte por defecto de la app
export const DEPORTE_DEFAULT = DEPORTES.FRONTON;
