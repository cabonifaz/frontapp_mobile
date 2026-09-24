import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { ligaService } from '../../services/ligaService';
import { getAvatarSource } from '../../utils/avatars';
import {
  SponsorLogo, MOTIVOS_BLOQUEO, formatMoneda, formatRangoFechas,
  formatFechaCorta, formatHora, formatPuntos,
} from './ligaUtils';

const TABS = ['Tabla', 'Partidos', 'Reglas'];

// Anchos de columna de la tabla (compartidos por cabecera y filas)
const COL = { pos: 22, num: 28, pts: 34, accion: 66 };

const PUNTAJE = [
  { resultado: '3-0', gana: '+3', pierde: '-3' },
  { resultado: '3-1', gana: '+2', pierde: '-2' },
  { resultado: '3-2', gana: '+1', pierde: '-1' },
];

// ── Inscripción ─────────────────────────────────────────────────────────────
function PanelInscripcion({ liga, inscribiendo, onInscribirse }) {
  const estado = liga.mi_estado_inscripcion;
  const nivel = liga.mi_nivel;
  const fueraDeNivel = nivel != null && (nivel < liga.nivel_min || nivel > liga.nivel_max);
  const abierta = ['LIGA_INSCRIPCION_ABIERTA', 'LIGA_EN_CURSO'].includes(liga.estado_liga);

  if (estado === 'INSC_ACTIVA') {
    return (
      <View style={[styles.panel, styles.panelActivo]}>
        <View style={styles.panelPos}>
          <Text style={styles.panelPosNum}>{liga.mi_posicion ?? '-'}°</Text>
        </View>
        <View style={{ flex: 1 }}>
          <Text style={styles.panelTitulo}>Estás inscrito</Text>
          <Text style={styles.panelTexto}>
            Llevas {liga.mis_puntos ?? 0} puntos de liga. Reta a los jugadores habilitados en la tabla.
          </Text>
        </View>
      </View>
    );
  }

  if (estado === 'INSC_PENDIENTE_PAGO') {
    return (
      <View style={styles.panel}>
        <Ionicons name="time-outline" size={24} color={colors.textPrimary} />
        <View style={{ flex: 1 }}>
          <Text style={styles.panelTitulo}>Pago en validación</Text>
          <Text style={styles.panelTexto}>
            Tu inscripción se activará cuando confirmemos el pago de {formatMoneda(liga.cuota_inscripcion, liga.moneda)}.
          </Text>
          {liga.instrucciones_pago ? (
            <Text style={styles.panelInstrucciones}>{liga.instrucciones_pago}</Text>
          ) : null}
        </View>
      </View>
    );
  }

  if (!abierta) {
    return (
      <View style={styles.panel}>
        <Ionicons name="lock-closed-outline" size={22} color={colors.textSecondary} />
        <Text style={[styles.panelTexto, { flex: 1 }]}>Las inscripciones para esta liga no están abiertas.</Text>
      </View>
    );
  }

  if (fueraDeNivel) {
    return (
      <View style={styles.panel}>
        <Ionicons name="lock-closed-outline" size={22} color={colors.textSecondary} />
        <Text style={[styles.panelTexto, { flex: 1 }]}>
          Esta liga es para niveles {liga.nivel_min} a {liga.nivel_max}. Tu nivel actual es {nivel}.
        </Text>
      </View>
    );
  }

  return (
    <TouchableOpacity style={styles.inscribirBtn} onPress={onInscribirse} disabled={inscribiendo} activeOpacity={0.85}>
      {inscribiendo ? (
        <ActivityIndicator size="small" color={colors.primary} />
      ) : (
        <>
          <Ionicons name="person-add" size={18} color={colors.primary} />
          <Text style={styles.inscribirText}>
            Inscribirme · {formatMoneda(liga.cuota_inscripcion, liga.moneda)}
          </Text>
        </>
      )}
    </TouchableOpacity>
  );
}

// ── Tab Tabla ───────────────────────────────────────────────────────────────
function FilaJugador({ fila, onPerfil, onRetar }) {
  const esYo = Number(fila.es_yo) === 1;
  const motivo = MOTIVOS_BLOQUEO[fila.motivo_bloqueo] ?? { corto: 'Bloqueado', largo: null };
  const puedeRetar = fila.motivo_bloqueo === 'OK';

  return (
    <View style={[styles.fila, esYo && styles.filaYo]}>
      <Text style={[styles.filaPos, fila.posicion <= 3 && styles.filaPosTop]}>{fila.posicion}</Text>
      <TouchableOpacity style={styles.filaJugador} onPress={onPerfil} activeOpacity={0.7}>
        <Image source={getAvatarSource(fila.foto_perfil_url)} style={styles.filaAvatar} />
        <Text style={styles.filaNombre} numberOfLines={2}>{fila.nombre_completo}</Text>
      </TouchableOpacity>
      <Text style={styles.filaNum}>{fila.partidos_jugados ?? 0}</Text>
      <Text style={styles.filaNum}>{fila.partidos_ganados ?? 0}</Text>
      <Text style={styles.filaPts}>{fila.puntos}</Text>
      <View style={styles.filaAccion}>
        {puedeRetar ? (
          <TouchableOpacity style={styles.retarBtn} onPress={onRetar}>
            <Text style={styles.retarText}>Retar</Text>
          </TouchableOpacity>
        ) : esYo ? (
          <Text style={styles.tuText}>Tú</Text>
        ) : (
          <TouchableOpacity
            style={styles.bloqueado}
            onPress={() => motivo.largo && Alert.alert(motivo.corto ?? 'No disponible', motivo.largo)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <Ionicons name="lock-closed" size={13} color={colors.textSecondary} />
            <Text style={styles.bloqueadoText} numberOfLines={2}>{motivo.corto}</Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

function TabTabla({ tabla, liga, navigation }) {
  if (!tabla.length) {
    return (
      <View style={styles.vacio}>
        <Ionicons name="podium-outline" size={40} color={colors.textSecondary} />
        <Text style={styles.vacioText}>Aún no hay jugadores activos en esta liga.</Text>
      </View>
    );
  }

  return (
    <View>
      <View style={styles.tablaHeader}>
        <Text style={[styles.thText, { width: COL.pos }]}>#</Text>
        <Text style={[styles.thText, { flex: 1 }]}>Jugador</Text>
        <Text style={[styles.thText, styles.thNum, { width: COL.num }]}>PJ</Text>
        <Text style={[styles.thText, styles.thNum, { width: COL.num }]}>PG</Text>
        <Text style={[styles.thText, styles.thNum, { width: COL.pts }]}>Pts</Text>
        <View style={{ width: COL.accion }} />
      </View>
      {tabla.map(f => (
        <FilaJugador
          key={f.id_usuario}
          fila={f}
          onPerfil={() => navigation.navigate('PlayerProfile', {
            player: {
              nombre: f.nombre_completo,
              avatar: f.foto_perfil_url,
              id_usuario: f.id_usuario,
            },
          })}
          onRetar={() => navigation.navigate('CrearPartido', {
            tipo: 'Liga',
            liga: {
              id_liga: liga.id_liga,
              nombre_oficial: liga.nombre_oficial,
              fecha_inicio: liga.fecha_inicio,
              fecha_fin: liga.fecha_fin,
            },
            rival: {
              id_usuario: f.id_usuario,
              nombre_completo: f.nombre_completo,
              foto_perfil_url: f.foto_perfil_url,
              posicion: f.posicion,
              puntos: f.puntos,
            },
          })}
        />
      ))}
      <Text style={styles.leyenda}>PJ: partidos jugados · PG: partidos ganados · Pts: puntos de liga</Text>
    </View>
  );
}

// ── Tab Partidos ────────────────────────────────────────────────────────────
function JugadorResultado({ nombre, foto, sets, puntos, ganador }) {
  return (
    <View style={styles.pjRow}>
      <Image source={getAvatarSource(foto)} style={styles.pjAvatar} />
      <Text style={[styles.pjNombre, ganador && styles.pjGanador]} numberOfLines={1}>{nombre}</Text>
      {puntos != null && (
        <Text style={[styles.pjPuntos, puntos > 0 ? styles.pjPuntosMas : styles.pjPuntosMenos]}>
          {formatPuntos(puntos)}
        </Text>
      )}
      <View style={[styles.pjSets, ganador && styles.pjSetsGanador]}>
        <Text style={[styles.pjSetsText, ganador && { color: colors.primary }]}>{sets ?? '-'}</Text>
      </View>
    </View>
  );
}

function TabPartidos({ partidos }) {
  if (!partidos.length) {
    return (
      <View style={styles.vacio}>
        <Ionicons name="tennisball-outline" size={40} color={colors.textSecondary} />
        <Text style={styles.vacioText}>Todavía no hay partidos en esta liga.</Text>
      </View>
    );
  }
  return (
    <View>
      {partidos.map(p => {
        const finalizado = p.estado_codigo === 'ESTADO_FINALIZADO';
        const s1 = p.sets_jugador1;
        const s2 = p.sets_jugador2;
        return (
          <View key={p.id_partido} style={styles.partidoCard}>
            <View style={styles.partidoHead}>
              <Text style={styles.partidoFecha}>
                {formatFechaCorta(p.fecha_partido)} · {formatHora(p.hora_partido)} · {p.nombre_cancha}
              </Text>
              <View style={[styles.estadoChip, finalizado ? styles.estadoFin : styles.estadoProg]}>
                <Text style={styles.estadoChipText}>{finalizado ? 'Finalizado' : 'Por jugar'}</Text>
              </View>
            </View>
            <JugadorResultado
              nombre={p.jugador1}
              foto={p.foto_jugador1}
              sets={finalizado ? s1 : null}
              puntos={p.puntos_jugador1}
              ganador={finalizado && s1 > s2}
            />
            <JugadorResultado
              nombre={p.jugador2}
              foto={p.foto_jugador2}
              sets={finalizado ? s2 : null}
              puntos={p.puntos_jugador2}
              ganador={finalizado && s2 > s1}
            />
          </View>
        );
      })}
    </View>
  );
}

// ── Tab Reglas ──────────────────────────────────────────────────────────────
function TabReglas({ liga }) {
  return (
    <View>
      <Text style={styles.reglaTitulo}>Puntaje por partido</Text>
      <View style={styles.puntajeTabla}>
        <View style={[styles.puntajeFila, styles.puntajeHeader]}>
          <Text style={styles.puntajeTh}>Resultado</Text>
          <Text style={styles.puntajeTh}>Ganador</Text>
          <Text style={styles.puntajeTh}>Perdedor</Text>
        </View>
        {PUNTAJE.map(r => (
          <View key={r.resultado} style={styles.puntajeFila}>
            <Text style={styles.puntajeCelda}>{r.resultado}</Text>
            <Text style={[styles.puntajeCelda, styles.pjPuntosMas]}>{r.gana}</Text>
            <Text style={[styles.puntajeCelda, styles.pjPuntosMenos]}>{r.pierde}</Text>
          </View>
        ))}
      </View>

      <Text style={styles.reglaTitulo}>Cómo funciona</Text>
      {[
        'Todos empiezan la liga con 0 puntos. Estos puntos son solo de la liga y no cambian tu puntaje general.',
        `Modalidad singles, siempre al mejor de ${liga.num_sets ?? 5} sets (gana quien llega a 3).`,
        liga.max_diferencia_posiciones
          ? `Puedes retar a jugadores que estén hasta ${liga.max_diferencia_posiciones} posiciones arriba o abajo de ti.`
          : 'Puedes retar a cualquier jugador activo de la liga.',
        'No puedes volver a retar a un jugador mientras tengan un reto pendiente o un partido por jugar.',
        `Los retos se habilitan cuando la liga tiene al menos ${liga.minimo_jugadores} jugadores activos.`,
        'El resultado se publica y confirma igual que en cualquier partido; los puntos se aplican al confirmarse.',
      ].map((t, i) => (
        <View key={i} style={styles.reglaItem}>
          <View style={styles.reglaDot} />
          <Text style={styles.reglaTexto}>{t}</Text>
        </View>
      ))}

      <Text style={styles.reglaTitulo}>Datos de la liga</Text>
      <View style={styles.datosCard}>
        <Dato icon="calendar-outline" label="Fechas" valor={formatRangoFechas(liga.fecha_inicio, liga.fecha_fin)} />
        <Dato icon="stats-chart-outline" label="Nivel requerido" valor={`${liga.nivel_min} a ${liga.nivel_max}`} />
        <Dato icon="people-outline" label="Participantes" valor={liga.cupo_maximo ? `Máximo ${liga.cupo_maximo}` : 'Sin límite'} />
        <Dato icon="person-outline" label="Mínimo para empezar" valor={`${liga.minimo_jugadores} jugadores`} />
        <Dato icon="ticket-outline" label="Inscripción" valor={formatMoneda(liga.cuota_inscripcion, liga.moneda)} />
        <Dato icon="trophy-outline" label="Premio" valor={liga.premio ?? 'Por anunciar'} ultimo />
      </View>
    </View>
  );
}

function Dato({ icon, label, valor, ultimo }) {
  return (
    <View style={[styles.datoRow, !ultimo && styles.datoBorde]}>
      <Ionicons name={icon} size={18} color={colors.textSecondary} />
      <Text style={styles.datoLabel}>{label}</Text>
      <Text style={styles.datoValor} numberOfLines={2}>{valor}</Text>
    </View>
  );
}

// ── Pantalla ────────────────────────────────────────────────────────────────
export function LigaDetalleScreen({ navigation, route }) {
  const insets = useSafeAreaInsets();
  const idLiga = route?.params?.idLiga;
  const [liga, setLiga] = useState(null);
  const [tabla, setTabla] = useState([]);
  const [partidos, setPartidos] = useState([]);
  const [tab, setTab] = useState('Tabla');
  const [loading, setLoading] = useState(true);
  const [refrescando, setRefrescando] = useState(false);
  const [inscribiendo, setInscribiendo] = useState(false);

  const cargar = useCallback(async () => {
    const [rLiga, rTabla, rPartidos] = await Promise.allSettled([
      ligaService.detalle(idLiga),
      ligaService.tabla(idLiga),
      ligaService.partidos(idLiga),
    ]);
    if (rLiga.status === 'fulfilled') setLiga(rLiga.value);
    setTabla(rTabla.status === 'fulfilled' && Array.isArray(rTabla.value) ? rTabla.value : []);
    setPartidos(rPartidos.status === 'fulfilled' && Array.isArray(rPartidos.value) ? rPartidos.value : []);
    setLoading(false);
    setRefrescando(false);
  }, [idLiga]);

  useFocusEffect(
    useCallback(() => {
      cargar();
    }, [cargar])
  );

  function confirmarInscripcion() {
    const cuota = Number(liga.cuota_inscripcion ?? 0);
    const mensaje = cuota > 0
      ? `La inscripción cuesta ${formatMoneda(cuota, liga.moneda)}. Quedará pendiente hasta que validemos tu pago.` +
        (liga.instrucciones_pago ? `\n\n${liga.instrucciones_pago}` : '')
      : 'La inscripción es gratuita y quedará activa de inmediato.';

    Alert.alert(`Inscribirme en ${liga.nombre_oficial}`, mensaje, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Inscribirme',
        onPress: async () => {
          try {
            setInscribiendo(true);
            const res = await ligaService.inscribirse(idLiga);
            Alert.alert(
              res?.estadoInscripcion === 'INSC_ACTIVA' ? '¡Listo!' : 'Inscripción registrada',
              res?.mensaje ?? 'Inscripción registrada.'
            );
            await cargar();
          } catch (e) {
            Alert.alert('No se pudo inscribir', e.message ?? 'Intenta nuevamente.');
          } finally {
            setInscribiendo(false);
          }
        },
      },
    ]);
  }

  if (loading || !liga) {
    return (
      <SafeAreaView style={[styles.safe, { alignItems: 'center', justifyContent: 'center' }]}>
        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} />
        ) : (
          <Text style={styles.vacioText}>No se pudo cargar la liga.</Text>
        )}
      </SafeAreaView>
    );
  }

  return (
    <View style={styles.safe}>
      {/* Cabecera: nombre oficial + auspiciador (siempre visible) */}
      <View style={[styles.header, { paddingTop: insets.top + 12 }]}>
        <View style={styles.headerTop}>
          <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
          </TouchableOpacity>
          <View style={styles.headerNivel}>
            <Text style={styles.headerNivelText}>Nivel {liga.nivel_min}–{liga.nivel_max}</Text>
          </View>
        </View>
        <Text style={styles.headerTitulo} numberOfLines={2}>{liga.nombre_oficial}</Text>
        <Text style={styles.headerSub}>
          Singles · 3 de 5 sets · {formatRangoFechas(liga.fecha_inicio, liga.fecha_fin)}
        </Text>
        {liga.auspiciador_nombre ? (
          <View style={styles.headerSponsor}>
            <SponsorLogo nombre={liga.auspiciador_nombre} logoUrl={liga.auspiciador_logo_url} size={22} dark />
            <Text style={styles.headerSponsorText} numberOfLines={1}>Presentado por {liga.auspiciador_nombre}</Text>
          </View>
        ) : null}
      </View>

      <ScrollView
        style={styles.sheet}
        contentContainerStyle={styles.sheetContent}
        showsVerticalScrollIndicator={false}
        refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => { setRefrescando(true); cargar(); }} />}
      >
        <PanelInscripcion liga={liga} inscribiendo={inscribiendo} onInscribirse={confirmarInscripcion} />

        <View style={styles.tabBar}>
          {TABS.map(t => (
            <TouchableOpacity key={t} style={styles.tabItem} onPress={() => setTab(t)}>
              <Text style={[styles.tabText, tab === t && styles.tabTextActive]}>
                {t}{t === 'Tabla' ? ` (${tabla.length})` : ''}
              </Text>
              {tab === t && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        {tab === 'Tabla'    && <TabTabla tabla={tabla} liga={liga} navigation={navigation} />}
        {tab === 'Partidos' && <TabPartidos partidos={partidos} />}
        {tab === 'Reglas'   && <TabReglas liga={liga} />}

        <View style={{ height: 40 + insets.bottom }} />
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.dark },

  header: { paddingHorizontal: 24, paddingBottom: 30 },
  headerTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 14 },
  headerNivel: { backgroundColor: colors.accent, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 4 },
  headerNivelText: { fontSize: 12, fontWeight: '800', color: colors.primary },
  headerTitulo: { fontSize: 20, fontWeight: '800', color: '#FFFFFF', lineHeight: 26 },
  headerSub: { fontSize: 12, color: 'rgba(255,255,255,0.7)', marginTop: 4 },
  headerSponsor: {
    flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: 'flex-start', maxWidth: '100%',
    backgroundColor: 'rgba(255,255,255,0.08)', borderRadius: 10,
    paddingHorizontal: 10, paddingVertical: 5, marginTop: 12,
  },
  headerSponsorText: { fontSize: 12, fontWeight: '700', color: '#FFFFFF', flexShrink: 1 },

  sheet: {
    flex: 1, backgroundColor: colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, marginTop: -14,
  },
  sheetContent: { paddingHorizontal: 24, paddingTop: 22 },

  // Panel inscripción
  panel: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 12,
    backgroundColor: colors.surface, borderRadius: 16, padding: 16, marginBottom: 18,
  },
  panelActivo: { backgroundColor: colors.accentLight, alignItems: 'center' },
  panelPos: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: colors.accent,
    alignItems: 'center', justifyContent: 'center',
  },
  panelPosNum: { fontSize: 20, fontWeight: '900', color: colors.primary },
  panelTitulo: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginBottom: 3 },
  panelTexto: { fontSize: 13, color: colors.textSecondary, lineHeight: 19 },
  panelInstrucciones: {
    fontSize: 13, color: colors.textPrimary, lineHeight: 19, marginTop: 10,
    backgroundColor: colors.background, borderRadius: 10, padding: 10,
  },
  inscribirBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.accent, borderRadius: 30, paddingVertical: 14, marginBottom: 18, minHeight: 50,
  },
  inscribirText: { fontSize: 15, fontWeight: '800', color: colors.primary },

  // Tabs
  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, marginBottom: 12 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 12 },
  tabText: { fontSize: 14, fontWeight: '500', color: colors.textSecondary },
  tabTextActive: { color: colors.textPrimary, fontWeight: '700' },
  tabIndicator: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: colors.accent, borderRadius: 2 },

  // Tabla
  tablaHeader: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: 8, paddingBottom: 6 },
  thText: { fontSize: 12, fontWeight: '700', color: colors.textSecondary },
  thNum: { textAlign: 'center' },
  fila: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 10, paddingHorizontal: 8, borderRadius: 14, marginBottom: 6,
    backgroundColor: colors.surface,
  },
  filaYo: { backgroundColor: colors.accentLight },
  filaPos: { width: COL.pos, fontSize: 14, fontWeight: '700', color: colors.textSecondary },
  filaPosTop: { color: colors.textPrimary, fontWeight: '900' },
  filaJugador: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8, paddingRight: 4 },
  filaAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#ccc' },
  filaNombre: { flex: 1, fontSize: 13, fontWeight: '700', color: colors.textPrimary, lineHeight: 17 },
  filaNum: { width: COL.num, textAlign: 'center', fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  filaPts: { width: COL.pts, textAlign: 'center', fontSize: 16, fontWeight: '900', color: colors.textPrimary },
  filaAccion: { width: COL.accion, alignItems: 'flex-end' },
  retarBtn: {
    borderWidth: 1.5, borderColor: colors.textPrimary, borderRadius: 16,
    paddingHorizontal: 10, paddingVertical: 5,
  },
  retarText: { fontSize: 12, fontWeight: '700', color: colors.textPrimary },
  tuText: { fontSize: 13, fontWeight: '800', color: colors.textPrimary, paddingRight: 8 },
  bloqueado: { flexDirection: 'row', alignItems: 'center', gap: 3, maxWidth: COL.accion },
  bloqueadoText: { fontSize: 10, color: colors.textSecondary, fontWeight: '600', flexShrink: 1, lineHeight: 12 },
  leyenda: { fontSize: 11, color: colors.textSecondary, marginTop: 8, textAlign: 'center' },

  // Partidos
  partidoCard: { backgroundColor: colors.surface, borderRadius: 16, padding: 14, marginBottom: 10, gap: 8 },
  partidoHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 8 },
  partidoFecha: { flex: 1, fontSize: 12, color: colors.textSecondary },
  estadoChip: { borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  estadoFin: { backgroundColor: colors.border },
  estadoProg: { backgroundColor: colors.accentLight },
  estadoChipText: { fontSize: 11, fontWeight: '700', color: colors.textPrimary },
  pjRow: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  pjAvatar: { width: 28, height: 28, borderRadius: 14, backgroundColor: '#ccc' },
  pjNombre: { flex: 1, fontSize: 14, color: colors.textPrimary },
  pjGanador: { fontWeight: '800' },
  pjPuntos: { fontSize: 12, fontWeight: '800', minWidth: 26, textAlign: 'right' },
  pjPuntosMas: { color: colors.positive },
  pjPuntosMenos: { color: colors.error },
  pjSets: {
    width: 28, height: 28, borderRadius: 6, backgroundColor: colors.border,
    alignItems: 'center', justifyContent: 'center',
  },
  pjSetsGanador: { backgroundColor: colors.accent },
  pjSetsText: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },

  // Reglas
  reglaTitulo: { fontSize: 15, fontWeight: '800', color: colors.textPrimary, marginTop: 8, marginBottom: 10 },
  puntajeTabla: { backgroundColor: colors.surface, borderRadius: 14, overflow: 'hidden', marginBottom: 16 },
  puntajeFila: { flexDirection: 'row', paddingVertical: 10, paddingHorizontal: 14 },
  puntajeHeader: { backgroundColor: colors.dark },
  puntajeTh: { flex: 1, fontSize: 12, fontWeight: '700', color: '#FFFFFF', textAlign: 'center' },
  puntajeCelda: { flex: 1, fontSize: 15, fontWeight: '800', color: colors.textPrimary, textAlign: 'center' },
  reglaItem: { flexDirection: 'row', gap: 10, marginBottom: 10 },
  reglaDot: { width: 6, height: 6, borderRadius: 3, backgroundColor: colors.accent, marginTop: 7 },
  reglaTexto: { flex: 1, fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  datosCard: { backgroundColor: colors.surface, borderRadius: 14, paddingHorizontal: 14 },
  datoRow: { flexDirection: 'row', alignItems: 'center', gap: 10, paddingVertical: 12 },
  datoBorde: { borderBottomWidth: 1, borderBottomColor: colors.border },
  datoLabel: { flex: 1, fontSize: 14, color: colors.textSecondary },
  datoValor: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, maxWidth: '55%', textAlign: 'right' },

  vacio: { alignItems: 'center', marginTop: 36, gap: 10 },
  vacioText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
});