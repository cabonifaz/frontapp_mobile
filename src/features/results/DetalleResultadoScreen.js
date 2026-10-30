import React, { useState, useEffect, useCallback, useRef } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import * as SecureStore from 'expo-secure-store';
import { colors } from '../../constants';
import { resultadoService } from '../../services/resultadoService';
import { getAvatarSource } from '../../utils/avatars';
// NUEVO: fotos del encuentro
import { VisorFoto } from '../../components/common/VisorFoto';
import { elegirFotos, subirFotosPartido, MAX_FOTOS } from '../../utils/fotosEncuentro';
// NUEVO (043): compartir el resultado en historias
import { TarjetaHistoriaResultado } from '../../components/common/TarjetaHistoriaResultado';
import { compartirTarjeta } from '../../utils/compartirHistoria';
import { doblesService } from '../../services/doblesService';   // CORREGIDO: saber si jugué en dobles
import { adminService } from '../../services/adminService';     // NUEVO (08): el admin comparte cualquier resultado

// NUEVO: galería de fotos del encuentro. Los jugadores del partido pueden agregar
// (hasta 5) y borrar las suyas manteniendo presionada la foto.
function FotosEncuentro({ idPartido }) {
  const { t } = useTranslation();
  const [fotos, setFotos] = useState([]);
  const [puedeSubir, setPuedeSubir] = useState(false);
  const [cargando, setCargando] = useState(true);
  const [subiendo, setSubiendo] = useState(false);
  const [verUrl, setVerUrl] = useState(null);

  const cargar = useCallback(async () => {
    if (!idPartido) { setCargando(false); return; }
    try {
      const res = await resultadoService.fotos(idPartido);
      setFotos(Array.isArray(res?.fotos) ? res.fotos : []);
      setPuedeSubir(!!res?.puedeSubir);
    } catch {
      setFotos([]);
    } finally {
      setCargando(false);
    }
  }, [idPartido]);

  useEffect(() => { cargar(); }, [cargar]);

  async function agregar() {
    const uris = await elegirFotos(MAX_FOTOS - fotos.length);
    if (!uris.length) return;
    setSubiendo(true);
    const ok = await subirFotosPartido(idPartido, uris);
    setSubiendo(false);
    if (ok < uris.length) Alert.alert(t('fotos.titulo'), t('fotos.errorSubirDetalle'));
    cargar();
  }

  function eliminar(foto) {
    if (Number(foto.es_mia) !== 1) return;
    Alert.alert(t('fotos.eliminarTitulo'), t('fotos.eliminarMensaje'), [
      { text: t('comun.cancelar'), style: 'cancel' },
      {
        text: t('fotos.eliminar'), style: 'destructive',
        onPress: async () => {
          try { await resultadoService.eliminarFoto(foto.id_partido_foto); } catch (e) { Alert.alert(t('comun.error'), e.message); }
          cargar();
        },
      },
    ]);
  }

  if (cargando) return <ActivityIndicator color={colors.accent} style={{ marginVertical: 24 }} />;

  if (!fotos.length && !puedeSubir) {
    return (
      <View style={styles.photosPlaceholder}>
        <Ionicons name="image-outline" size={36} color={colors.textSecondary} />
        <Text style={styles.photosPlaceholderText}>{t('fotos.sinFotos')}</Text>
      </View>
    );
  }

  return (
    <>
      <Text style={styles.sectionTitle}>{t('colocar.fotosTitulo')}</Text>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.galeria} style={styles.galeriaScroll}>
        {fotos.map(f => (
          <TouchableOpacity
            key={f.id_partido_foto}
            onPress={() => setVerUrl(f.url)}
            onLongPress={() => eliminar(f)}
            activeOpacity={0.85}
          >
            <Image source={{ uri: f.url }} style={styles.galeriaFoto} />
          </TouchableOpacity>
        ))}
        {puedeSubir && (
          <TouchableOpacity style={[styles.galeriaFoto, styles.galeriaAgregar]} onPress={agregar} disabled={subiendo}>
            {subiendo
              ? <ActivityIndicator color={colors.accent} />
              : <>
                  <Ionicons name="add" size={28} color={colors.textSecondary} />
                  <Text style={styles.galeriaAgregarText}>{t('fotos.agregar')}</Text>
                </>}
          </TouchableOpacity>
        )}
      </ScrollView>
      {fotos.some(f => Number(f.es_mia) === 1) && <Text style={styles.galeriaHint}>{t('fotos.hintEliminar')}</Text>}
      <VisorFoto url={verUrl} onClose={() => setVerUrl(null)} />
    </>
  );
}

function formatFecha(dateStr) {
  if (!dateStr) return '--';
  const [year, month, day] = (String(dateStr).split('T')[0]).split('-').map(Number);
  const months = i18n.t('fechas.mesesAbrev', { returnObjects: true });
  return `${day} ${months[month - 1]} ${year}`;
}

function RankingBadge({ ranking }) {
  if (ranking == null) return null;
  return (
    <View style={styles.rankBadge}>
      <Ionicons name="trophy" size={13} color={colors.primary} />
      <Text style={styles.rankBadgeText}> {ranking}</Text>
    </View>
  );
}

// NUEVO: avatar de un lado (1 foto en singles, 2 superpuestas en dobles)
function AvatarLado({ foto, foto2, esDobles, ranking }) {
  if (esDobles) {
    return (
      <View style={styles.avatarWrap}>
        <View style={styles.parejaWrap}>
          <Image source={getAvatarSource(foto)} style={[styles.parejaAvatar, { left: 0, top: 0 }]} />
          <Image source={getAvatarSource(foto2)} style={[styles.parejaAvatar, { right: 0, bottom: 0 }]} />
        </View>
      </View>
    );
  }
  return (
    <View style={styles.avatarWrap}>
      <Image source={getAvatarSource(foto)} style={styles.heroAvatar} />
      <RankingBadge ranking={ranking} />
    </View>
  );
}

export function DetalleResultadoScreen({ navigation, route }) {
  const { t } = useTranslation();   // NUEVO: idiomas
  const { match } = route.params ?? {};
  const [detalle, setDetalle] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('Resultados');
  const [idUsuarioActual, setIdUsuarioActual] = useState(null);
  // NUEVO (043): tarjeta para historias
  const tarjetaRef = useRef(null);
  const [mostrarTarjeta, setMostrarTarjeta] = useState(false);
  const [fondoHistoria, setFondoHistoria] = useState(null);
  const [compartiendo, setCompartiendo] = useState(false);
  const imagenesListas = useRef(0);

  useEffect(() => {
    SecureStore.getItemAsync('id_usuario').then(id => setIdUsuarioActual(Number(id)));
  }, []);

  useEffect(() => {
    if (!match?.id_partido) { setLoading(false); return; }
    resultadoService.detalle(match.id_partido)
      .then(res => setDetalle(res ?? null))
      .catch(() => setDetalle(null))
      .finally(() => setLoading(false));
  }, [match?.id_partido]);

  const d = detalle ?? match ?? {};
  const esDobles = Number(d.es_dobles ?? 0) === 1;

  // CORREGIDO (043): solo los jugadores del partido pueden compartirlo en sus historias.
  // Singles: comparo con los dos jugadores del resultado. Dobles: pregunto quiénes jugaron.
  const [jugueDobles, setJugueDobles] = useState(false);
  const idPartidoActual = match?.id_partido ?? d.id_partido;
  useEffect(() => {
    if (!esDobles || !idPartidoActual) return;
    doblesService.participantes(idPartidoActual)
      .then(lista => setJugueDobles(Array.isArray(lista) && lista.some(j =>
        Number(j.es_yo) === 1 && ['PART_CREADOR', 'PART_ACEPTADO'].includes(j.estado_codigo))))
      .catch(() => setJugueDobles(false));
  }, [esDobles, idPartidoActual]);
  // NUEVO (08): la cuenta admin (la oficial de Ranked) puede compartir cualquier resultado
  const [esAdmin, setEsAdmin] = useState(false);
  useEffect(() => { adminService.esAdmin().then(setEsAdmin).catch(() => {}); }, []);
  const soyJugador = esDobles
    ? jugueDobles
    : idUsuarioActual != null && [d.id_jugador_local, d.id_jugador_visitante]
        .some(id => id != null && Number(id) === idUsuarioActual);

  // ¿Mi lado es el visitante? La base de datos lo indica (soy_local), también en dobles.
  // Respaldo: comparar con el jugador local (versión anterior del SP).
  const soyVisitante = d.soy_local != null
    ? Number(d.soy_local) === 0
    : (idUsuarioActual != null && d.id_jugador_local != null && Number(d.id_jugador_local) !== idUsuarioActual);

  const jugadorYo     = soyVisitante ? (d.jugador_visitante ?? t('detalleRes.jugador2')) : (d.jugador_local     ?? t('detalleRes.jugador1'));
  const jugadorRival  = soyVisitante ? (d.jugador_local     ?? t('detalleRes.jugador1')) : (d.jugador_visitante ?? t('detalleRes.jugador2'));
  const fotoYo        = soyVisitante ? (d.foto_visitante    ?? null)        : (d.foto_local        ?? null);
  const fotoRival     = soyVisitante ? (d.foto_local        ?? null)        : (d.foto_visitante    ?? null);
  const fotoYo2       = soyVisitante ? (d.foto_visitante_2  ?? null)        : (d.foto_local_2      ?? null);
  const fotoRival2    = soyVisitante ? (d.foto_local_2      ?? null)        : (d.foto_visitante_2  ?? null);
  const puntosYo      = soyVisitante ? (d.puntos_visitante  ?? '--')        : (d.puntos_local      ?? '--');
  const puntosRival   = soyVisitante ? (d.puntos_local      ?? '--')        : (d.puntos_visitante  ?? '--');
  const rankingYo     = soyVisitante ? (d.ranking_visitante ?? null)        : (d.ranking_local     ?? null);
  const rankingRival  = soyVisitante ? (d.ranking_local     ?? null)        : (d.ranking_visitante ?? null);

  const sets = [1, 2, 3, 4, 5].map(n => soyVisitante
    ? [d[`set${n}_visitante`] ?? match?.[`set${n}_visitante`], d[`set${n}_local`] ?? match?.[`set${n}_local`]]
    : [d[`set${n}_local`]     ?? match?.[`set${n}_local`],     d[`set${n}_visitante`] ?? match?.[`set${n}_visitante`]]
  ).filter(([l, v]) => l != null || v != null);

  const setsYo    = soyVisitante ? (d.sets_visitante ?? match?.sets_visitante ?? 0) : (d.sets_local     ?? match?.sets_local     ?? 0);
  const setsRival = soyVisitante ? (d.sets_local     ?? match?.sets_local     ?? 0) : (d.sets_visitante ?? match?.sets_visitante ?? 0);

  // Nombre abreviado (R. Pino). En dobles se muestra la pareja completa ("Beto y Ana").
  function abreviar(nombre) {
    if (!nombre) return '';
    if (esDobles) return nombre;
    const partes = nombre.trim().split(' ');
    if (partes.length === 1) return partes[0];
    return `${partes[0][0]}. ${partes.slice(1).join(' ')}`;
  }

  // NUEVO (043): arma la tarjeta fuera de pantalla, espera las fotos y la comparte
  async function compartirHistoria() {
    if (compartiendo) return;
    setCompartiendo(true);
    try {
      let fondo = null;
      try {
        const res = await resultadoService.fotos(match?.id_partido ?? d.id_partido);
        fondo = res?.fotos?.[0]?.url ?? null;
      } catch { fondo = null; }
      const remotas = [fondo, fotoYo, fotoRival, esDobles ? fotoYo2 : null, esDobles ? fotoRival2 : null]
        .filter(u => typeof u === 'string' && u.startsWith('http'));
      await Promise.all(remotas.map(u => Promise.race([
        Image.prefetch(u).catch(() => null),
        new Promise(r => setTimeout(r, 6000)),
      ])));

      imagenesListas.current = 0;
      setFondoHistoria(fondo);
      setMostrarTarjeta(true);
      const esperadas = (esDobles ? 4 : 2) + (fondo ? 1 : 0);
      const inicio = Date.now();
      while (imagenesListas.current < esperadas && Date.now() - inicio < 4000) {
        await new Promise(r => setTimeout(r, 100));
      }
      await new Promise(r => setTimeout(r, 250));   // un cuadro extra para que termine de pintarse
      await compartirTarjeta(tarjetaRef);
    } finally {
      setMostrarTarjeta(false);
      setCompartiendo(false);
    }
  }

  const formatPts = (v) => (v === '--' || v == null ? '--' : Number(v).toFixed(1));

  return (
    <SafeAreaView style={styles.safe}>
      {/* Hero */}
      <View style={styles.hero}>
        <TouchableOpacity
          style={styles.backBtn}
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>

        {esDobles && (
          <View style={styles.doblesChip}>
            <Ionicons name="people" size={12} color={colors.accent} />
            <Text style={styles.doblesChipText}>{t('detalleRes.dobles')}</Text>
          </View>
        )}

        <View style={styles.playersRow}>
          {/* Mi lado */}
          <View style={styles.playerCol}>
            <AvatarLado foto={fotoYo} foto2={fotoYo2} esDobles={esDobles} ranking={rankingYo} />
            <Text style={styles.heroName} numberOfLines={2}>{abreviar(jugadorYo)}</Text>
            {!esDobles && <Text style={styles.heroPts}>{formatPts(puntosYo)} pts</Text>}
          </View>

          <Text style={styles.vsLabel}>VS</Text>

          {/* Rival */}
          <View style={styles.playerCol}>
            <AvatarLado foto={fotoRival} foto2={fotoRival2} esDobles={esDobles} ranking={rankingRival} />
            <Text style={[styles.heroName, styles.heroNameBold]} numberOfLines={2}>{abreviar(jugadorRival)}</Text>
            {!esDobles && <Text style={styles.heroPts}>{formatPts(puntosRival)} pts</Text>}
          </View>
        </View>
      </View>

      {/* Sheet */}
      <View style={styles.sheet}>
        <View style={styles.tabBar}>
          {['Resultados', 'Detalles'].map(tb => (
            <TouchableOpacity key={tb} style={styles.tabItem} onPress={() => setActiveTab(tb)}>
              <Text style={[styles.tabText, activeTab === tb && styles.tabTextActive]}>{t(`detalleRes.tabs.${tb}`)}</Text>
              {activeTab === tb && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
            {activeTab === 'Resultados' ? (
              <>
                <Text style={styles.sectionTitle}>{t('detalleRes.resultadoFinal')}</Text>
                <View style={styles.resultadoFinalRow}>
                  <Text style={styles.resultadoFinalNum}>{setsYo}</Text>
                  <Text style={styles.resultadoFinalSep}> – </Text>
                  <Text style={styles.resultadoFinalNum}>{setsRival}</Text>
                </View>

                {sets.length === 0 ? (
                  <Text style={styles.noDataText}>{t('detalleRes.sinSets')}</Text>
                ) : (
                  <>
                    <Text style={[styles.sectionTitle, { marginTop: 16 }]}>{t('detalleRes.sets')}</Text>
                    {sets.map(([l, v], i) => (
                      <View key={i} style={styles.setRow}>
                        <Text style={styles.setLabel}>{t('detalleRes.set', { n: i + 1 })}</Text>
                        <Image source={getAvatarSource(fotoYo)} style={styles.setAvatar} />
                        <View style={styles.scoreBox}>
                          <Text style={styles.scoreNum}>{l ?? '-'}</Text>
                        </View>
                        <Text style={styles.scoreSep}>–</Text>
                        <View style={styles.scoreBox}>
                          <Text style={styles.scoreNum}>{v ?? '-'}</Text>
                        </View>
                        <Image source={getAvatarSource(fotoRival)} style={styles.setAvatar} />
                      </View>
                    ))}
                  </>
                )}

                {/* NUEVO (043): compartir en historias (solo si jugué este partido) */}
                {sets.length > 0 && (soyJugador || esAdmin) && (
                  <TouchableOpacity
                    style={[styles.historiaBtn, compartiendo && { opacity: 0.6 }]}
                    onPress={compartirHistoria}
                    disabled={compartiendo}
                    activeOpacity={0.85}
                  >
                    {compartiendo
                      ? <ActivityIndicator size="small" color={colors.primary} />
                      : <Ionicons name="logo-instagram" size={20} color={colors.primary} />}
                    <Text style={styles.historiaBtnText}>{t('historia.boton')}</Text>
                  </TouchableOpacity>
                )}
              </>
            ) : (
              <>
                {/* NUEVO: fotos del encuentro */}
                <FotosEncuentro idPartido={match?.id_partido ?? d.id_partido} />

                {/* Comentario: lo escribió quien publicó el resultado (lado local) */}
                {d.comentario_rival ? (
                  <>
                    <Text style={styles.sectionTitle}>{t('detalleRes.comentarios')}</Text>
                    <View style={styles.comentarioCard}>
                      <Image source={getAvatarSource(d.foto_local)} style={styles.comentAvatar} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.comentNombre}>
                          {esDobles ? String(d.jugador_local ?? '').split(' y ')[0] : d.jugador_local}
                        </Text>
                        <Text style={styles.comentTexto}>{d.comentario_rival}</Text>
                      </View>
                    </View>
                  </>
                ) : null}

                <Text style={styles.sectionTitle}>{t('detalleRes.detalles')}</Text>
                <View style={styles.detalleCard}>
                  <Text style={styles.canchaName}>{d.nombre_cancha ?? '--'}</Text>
                  {d.cancha_direccion && !String(d.cancha_direccion).startsWith('http') ? (
                    <View style={styles.detalleRow}>
                      <Ionicons name="location-outline" size={15} color={colors.textSecondary} />
                      <Text style={styles.detalleText}> {d.cancha_direccion}</Text>
                    </View>
                  ) : null}
                </View>

                <View style={styles.detalleMetaRow}>
                  <View style={styles.detalleMetaBox}>
                    <Ionicons name="calendar-outline" size={18} color={colors.textPrimary} />
                    <Text style={styles.detalleMetaText}>{formatFecha(d.fecha_partido ?? match?.fecha_partido)}</Text>
                  </View>
                  <View style={styles.detalleMetaBox}>
                    <Ionicons name="time-outline" size={18} color={colors.textPrimary} />
                    <Text style={styles.detalleMetaText}>{String(d.hora_partido ?? '--').substring(0, 5)}</Text>
                  </View>
                </View>
              </>
            )}

            <View style={{ height: 32 }} />
          </ScrollView>
        )}
      </View>

      {/* NUEVO (043): tarjeta fuera de la pantalla, solo mientras se comparte */}
      {mostrarTarjeta && (
        <View style={styles.fueraDePantalla} pointerEvents="none">
          <TarjetaHistoriaResultado
            ref={tarjetaRef}
            yo={{ nombre: abreviar(jugadorYo), foto: fotoYo, foto2: fotoYo2 }}
            rival={{ nombre: abreviar(jugadorRival), foto: fotoRival, foto2: fotoRival2 }}
            setsYo={setsYo}
            setsRival={setsRival}
            sets={sets}
            esDobles={esDobles}
            fecha={formatFecha(d.fecha_partido ?? match?.fecha_partido)}
            tipo={t(esDobles ? 'historia.dobles' : 'historia.individual')}
            fondo={fondoHistoria}
            textos={{ gane: t('historia.victoria'), perdi: t('historia.derrota'), final: t('historia.resultadoFinal') }}
            onImagenLista={() => { imagenesListas.current += 1; }}
          />
        </View>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.dark },

  // NUEVO (043)
  historiaBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    backgroundColor: colors.accent, borderRadius: 12, paddingVertical: 14, marginTop: 24,
  },
  historiaBtnText: { fontSize: 15, fontWeight: '800', color: colors.primary },
  fueraDePantalla: { position: 'absolute', left: -10000, top: 0 },

  hero: { backgroundColor: colors.dark, paddingTop: 8, paddingBottom: 28, paddingHorizontal: 20 },
  backBtn: { marginBottom: 12 },

  doblesChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'center',
    borderWidth: 1, borderColor: colors.accent, borderRadius: 12,
    paddingHorizontal: 10, paddingVertical: 3, marginBottom: 12,
  },
  doblesChipText: { fontSize: 11, fontWeight: '800', color: '#FFFFFF', letterSpacing: 0.6 },

  playersRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  playerCol: { alignItems: 'center', flex: 1 },
  avatarWrap: { alignItems: 'center', marginBottom: 8 },
  heroAvatar: {
    width: 100, height: 100, borderRadius: 50,
    borderWidth: 3, borderColor: '#FFFFFF', backgroundColor: '#555',
  },
  // NUEVO: dos fotos superpuestas para una pareja
  parejaWrap: { width: 110, height: 100 },
  parejaAvatar: {
    position: 'absolute', width: 70, height: 70, borderRadius: 35,
    borderWidth: 3, borderColor: colors.dark, backgroundColor: '#555',
  },
  rankBadge: {
    flexDirection: 'row', alignItems: 'center', backgroundColor: colors.accent,
    borderRadius: 20, paddingHorizontal: 10, paddingVertical: 4, marginTop: -16,
  },
  rankBadgeText: { fontSize: 13, fontWeight: '700', color: colors.primary },
  heroName: { fontSize: 16, fontWeight: '500', color: '#FFFFFF', marginTop: 4, textAlign: 'center' },
  heroNameBold: { fontWeight: '700' },
  heroPts: { fontSize: 13, color: '#AAAAAA', marginTop: 2 },
  vsLabel: { fontSize: 18, fontWeight: '700', color: '#AAAAAA', marginHorizontal: 8 },

  sheet: {
    flex: 1, backgroundColor: colors.background,
    borderTopLeftRadius: 24, borderTopRightRadius: 24, overflow: 'hidden',
  },

  tabBar: { flexDirection: 'row', borderBottomWidth: 1, borderBottomColor: colors.border, paddingHorizontal: 20 },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 16, position: 'relative' },
  tabText: { fontSize: 16, fontWeight: '500', color: colors.textSecondary },
  tabTextActive: { color: colors.textPrimary, fontWeight: '600' },
  tabIndicator: { position: 'absolute', bottom: 0, left: 0, right: 0, height: 3, backgroundColor: colors.accent, borderRadius: 2 },

  content: { paddingHorizontal: 20, paddingTop: 20 },

  sectionTitle: { fontSize: 17, fontWeight: 'bold', color: colors.textPrimary, marginBottom: 16, marginTop: 8 },

  resultadoFinalRow: { flexDirection: 'row', justifyContent: 'center', alignItems: 'center', marginBottom: 8 },
  resultadoFinalNum: { fontSize: 72, fontWeight: 'bold', color: colors.textPrimary },
  resultadoFinalSep: { fontSize: 48, fontWeight: 'bold', color: colors.textSecondary, marginHorizontal: 4 },

  setRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 10 },
  setLabel: { fontSize: 13, fontWeight: '600', color: colors.textSecondary, width: 52, marginRight: 4 },
  setAvatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#ccc' },
  scoreBox: { width: 48, height: 48, borderRadius: 10, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  scoreNum: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  scoreSep: { fontSize: 20, fontWeight: 'bold', color: colors.textSecondary },

  noDataText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', marginTop: 20 },

  photosPlaceholder: {
    backgroundColor: colors.surface, borderRadius: 14, height: 140,
    alignItems: 'center', justifyContent: 'center', gap: 10, marginBottom: 20,
  },
  photosPlaceholderText: { fontSize: 14, color: colors.textSecondary },

  // NUEVO: galería de fotos del encuentro
  galeriaScroll: { marginHorizontal: -20, marginBottom: 6 },
  galeria: { paddingHorizontal: 20, gap: 10 },
  galeriaFoto: { width: 150, height: 150, borderRadius: 14, backgroundColor: colors.surface },
  galeriaAgregar: {
    alignItems: 'center', justifyContent: 'center', gap: 4,
    borderWidth: 1.5, borderColor: colors.border, borderStyle: 'dashed',
  },
  galeriaAgregarText: { fontSize: 12, color: colors.textSecondary },
  galeriaHint: { fontSize: 11, color: colors.textSecondary, marginBottom: 20 },

  comentarioCard: {
    flexDirection: 'row', backgroundColor: colors.surface, borderRadius: 14,
    padding: 14, gap: 12, alignItems: 'flex-start', marginBottom: 12,
  },
  comentAvatar: { width: 40, height: 40, borderRadius: 20, backgroundColor: '#ccc' },
  comentNombre: { fontSize: 14, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  comentTexto: { fontSize: 13, color: colors.textSecondary, lineHeight: 18 },

  detalleCard: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 12 },
  canchaName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary, marginBottom: 8 },
  detalleRow: { flexDirection: 'row', alignItems: 'center' },
  detalleText: { fontSize: 13, color: colors.textSecondary },

  detalleMetaRow: { flexDirection: 'row', gap: 12 },
  detalleMetaBox: {
    flex: 1, flexDirection: 'row', alignItems: 'center', gap: 8,
    backgroundColor: colors.surface, borderRadius: 14, padding: 16,
  },
  detalleMetaText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
});