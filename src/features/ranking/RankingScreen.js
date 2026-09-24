import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, ActivityIndicator, Linking, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { SharedHeader, HEADER_BG } from '../../components/common/SharedHeader';
import { useUsuario } from '../../hooks/useUsuario';
import { ligaService } from '../../services/ligaService';
import { TIPOS_JUEGO } from '../../constants/maestro';
import { SponsorLogo, formatMoneda, formatRangoFechas } from './ligaUtils';

const MODALIDADES = [
  { key: 'singles', label: 'Singles', idTipoJuego: TIPOS_JUEGO.SINGLES },
  { key: 'dobles',  label: 'Dobles',  idTipoJuego: TIPOS_JUEGO.DOBLES },
];

function EstadoInscripcion({ liga }) {
  const estado = liga.mi_estado_inscripcion;
  if (estado === 'INSC_ACTIVA') {
    return (
      <View style={[styles.miEstado, styles.miEstadoActivo]}>
        <Ionicons name="checkmark-circle" size={14} color={colors.primary} />
        <Text style={styles.miEstadoTextoOscuro}>
          {liga.mi_posicion ? `Vas ${liga.mi_posicion}° · ${liga.mis_puntos ?? 0} pts` : 'Inscrito'}
        </Text>
      </View>
    );
  }
  if (estado === 'INSC_PENDIENTE_PAGO') {
    return (
      <View style={styles.miEstado}>
        <Ionicons name="time-outline" size={14} color="#FFFFFF" />
        <Text style={styles.miEstadoTexto}>Pago en validación</Text>
      </View>
    );
  }
  const nivel = liga.mi_nivel;
  if (nivel != null && (nivel < liga.nivel_min || nivel > liga.nivel_max)) {
    return (
      <View style={styles.miEstado}>
        <Ionicons name="lock-closed-outline" size={13} color="rgba(255,255,255,0.7)" />
        <Text style={[styles.miEstadoTexto, { color: 'rgba(255,255,255,0.7)' }]}>Tu nivel es {nivel}</Text>
      </View>
    );
  }
  return null;
}

function SponsorLiga({ liga }) {
  if (!liga.auspiciador_nombre) return null;
  const web = liga.auspiciador_sitio_web;
  return (
    <TouchableOpacity
      style={[styles.ligaSponsor, liga.auspiciador_color ? { backgroundColor: liga.auspiciador_color } : null]}
      activeOpacity={web ? 0.7 : 1}
      onPress={() => web && Linking.openURL(web).catch(() => {})}
    >
      <SponsorLogo nombre={liga.auspiciador_nombre} logoUrl={liga.auspiciador_logo_url} size={34} />
      <View style={{ flex: 1 }}>
        <Text style={styles.ligaSponsorLabel}>Presentado por</Text>
        <Text style={styles.ligaSponsorNombre} numberOfLines={1}>{liga.auspiciador_nombre}</Text>
      </View>
      {web ? <Ionicons name="open-outline" size={16} color="rgba(255,255,255,0.7)" /> : null}
    </TouchableOpacity>
  );
}

function LigaCard({ liga, onPress }) {
  const cupo = liga.cupo_maximo ? `${liga.inscritos}/${liga.cupo_maximo}` : `${liga.inscritos}`;
  return (
    <TouchableOpacity style={styles.ligaCard} activeOpacity={0.85} onPress={onPress}>
      <SponsorLiga liga={liga} />
      <View style={styles.ligaTop}>
        <View style={styles.nivelBlock}>
          <Text style={styles.nivelLabel}>Nivel</Text>
          <Text style={styles.nivelRango} numberOfLines={1} adjustsFontSizeToFit minimumFontScale={0.6}>
            {liga.nivel_min}–{liga.nivel_max}
          </Text>
        </View>

        <View style={styles.ligaInfo}>
          <Text style={styles.ligaNombre} numberOfLines={2}>{liga.nombre_oficial}</Text>
          <View style={styles.ligaMetaRow}>
            <Ionicons name="calendar-outline" size={13} color="rgba(255,255,255,0.7)" />
            <Text style={styles.ligaMeta}>{formatRangoFechas(liga.fecha_inicio, liga.fecha_fin)}</Text>
          </View>
          <View style={styles.ligaMetaRow}>
            <Ionicons name="people-outline" size={13} color="rgba(255,255,255,0.7)" />
            <Text style={styles.ligaMeta}>{cupo} jugadores</Text>
            <Text style={styles.ligaMetaSep} />
            <Ionicons name="ticket-outline" size={13} color="rgba(255,255,255,0.7)" />
            <Text style={styles.ligaMeta}>{formatMoneda(liga.cuota_inscripcion, liga.moneda)}</Text>
          </View>
          <EstadoInscripcion liga={liga} />
        </View>

        <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.5)" />
      </View>

      {liga.premio ? (
        <View style={styles.premioRow}>
          <Ionicons name="trophy" size={13} color={colors.accent} />
          <Text style={styles.premioText} numberOfLines={1}>Premio: {liga.premio}</Text>
        </View>
      ) : null}
    </TouchableOpacity>
  );
}

function ProximamenteCard({ titulo, subtitulo }) {
  return (
    <View style={styles.proxCard}>
      <View style={styles.proxNivel}>
        <Ionicons name="lock-closed" size={18} color={colors.textSecondary} />
      </View>
      <View style={{ flex: 1 }}>
        <Text style={styles.proxTitulo}>{titulo}</Text>
        {subtitulo ? <Text style={styles.proxSub}>{subtitulo}</Text> : null}
      </View>
      <View style={styles.proxBadge}>
        <Text style={styles.proxBadgeText}>Próximamente</Text>
      </View>
    </View>
  );
}

export function RankingScreen({ navigation }) {
  const usuario = useUsuario();
  const [modalidad, setModalidad] = useState('singles');
  const [ligas, setLigas] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const idTipoJuego = MODALIDADES.find(m => m.key === modalidad)?.idTipoJuego;

  const cargar = useCallback(async () => {
    try {
      const res = await ligaService.listar({ idTipoJuego });
      setLigas(Array.isArray(res) ? res : []);
    } catch {
      setLigas([]);
    } finally {
      setLoading(false);
      setRefrescando(false);
    }
  }, [idTipoJuego]);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      cargar();
    }, [cargar])
  );

  const activas = ligas.filter(l => l.estado_liga !== 'LIGA_PROXIMAMENTE');
  const proximas = ligas.filter(l => l.estado_liga === 'LIGA_PROXIMAMENTE');

  return (
    <SafeAreaView style={styles.safe}>
      <SharedHeader
        nombre={usuario?.nombre}
        deporte={usuario?.deporte}
        ranking={usuario?.ranking}
        calificacion={usuario?.calificacion}
        nivel={usuario?.nivel}
        puntos={usuario?.puntos}
        fotoPerfil={usuario?.foto_perfil_url}
      />
      <View style={styles.sheet}>
        <View style={styles.titleRow}>
          <Text style={styles.pageTitle}>Ranking</Text>
          <TouchableOpacity style={styles.generalBtn} onPress={() => navigation.navigate('RankingGeneral')}>
            <Ionicons name="podium-outline" size={16} color={colors.textPrimary} />
            <Text style={styles.generalBtnText}>Ranking general</Text>
          </TouchableOpacity>
        </View>

        <View style={styles.toggle}>
          {MODALIDADES.map(m => (
            <TouchableOpacity
              key={m.key}
              style={[styles.toggleBtn, modalidad === m.key && styles.toggleBtnActive]}
              onPress={() => setModalidad(m.key)}
            >
              <Text style={[styles.toggleText, modalidad === m.key && styles.toggleTextActive]}>{m.label}</Text>
            </TouchableOpacity>
          ))}
        </View>

        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
        ) : (
          <ScrollView
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl refreshing={refrescando} onRefresh={() => { setRefrescando(true); cargar(); }} />
            }
          >
            {activas.length === 0 && proximas.length === 0 ? (
              <ProximamenteCard
                titulo={modalidad === 'dobles' ? 'Ranking de dobles' : 'Ligas de singles'}
                subtitulo="Estamos preparando las primeras ligas."
              />
            ) : (
              <>
                {activas.length > 0 && (
                  <Text style={styles.sectionHint}>Elige la liga de tu nivel, inscríbete y reta a los demás jugadores.</Text>
                )}
                {activas.map(l => (
                  <LigaCard
                    key={l.id_liga}
                    liga={l}
                    onPress={() => navigation.navigate('LigaDetalle', { idLiga: l.id_liga, nombre: l.nombre_oficial })}
                  />
                ))}
                {proximas.map(l => (
                  <ProximamenteCard
                    key={l.id_liga}
                    titulo={l.nombre_oficial}
                    subtitulo={`Nivel ${l.nivel_min}–${l.nivel_max}`}
                  />
                ))}
              </>
            )}
            <View style={{ height: 32 }} />
          </ScrollView>
        )}
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: HEADER_BG },
  sheet: {
    flex: 1,
    backgroundColor: colors.background,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingHorizontal: 20,
    paddingTop: 22,
    overflow: 'hidden',
  },
  titleRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 },
  pageTitle: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary },
  generalBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    borderWidth: 1.5, borderColor: colors.textPrimary, borderRadius: 18,
    paddingHorizontal: 12, paddingVertical: 6,
  },
  generalBtnText: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },

  toggle: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: 30, padding: 4, marginBottom: 14,
  },
  toggleBtn: { flex: 1, paddingVertical: 12, alignItems: 'center', borderRadius: 28 },
  toggleBtnActive: { backgroundColor: colors.accent },
  toggleText: { fontSize: 15, fontWeight: '600', color: colors.textSecondary },
  toggleTextActive: { color: colors.primary, fontWeight: '700' },

  sectionHint: { fontSize: 13, color: colors.textSecondary, lineHeight: 19, marginBottom: 12 },

  // Tarjeta de liga
  ligaCard: {
    backgroundColor: colors.dark, borderRadius: 18,
    marginBottom: 14, overflow: 'hidden',
  },
  ligaTop: { flexDirection: 'row', alignItems: 'center', padding: 16, gap: 12 },
  nivelBlock: {
    width: 84, alignItems: 'center', justifyContent: 'center',
    borderRightWidth: 1, borderRightColor: 'rgba(255,255,255,0.12)', paddingRight: 10,
  },
  nivelLabel: { fontSize: 11, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  nivelRango: { fontSize: 26, fontWeight: '900', color: colors.accent, letterSpacing: -0.5, textAlign: 'center', width: '100%' },
  ligaInfo: { flex: 1, gap: 5 },
  ligaNombre: { fontSize: 15, fontWeight: '800', color: '#FFFFFF', marginBottom: 2 },
  ligaMetaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  ligaMeta: { fontSize: 12, color: 'rgba(255,255,255,0.75)' },
  ligaMetaSep: { width: 8 },
  miEstado: {
    flexDirection: 'row', alignItems: 'center', gap: 5, alignSelf: 'flex-start',
    backgroundColor: 'rgba(255,255,255,0.12)', borderRadius: 12,
    paddingHorizontal: 9, paddingVertical: 4, marginTop: 4,
  },
  miEstadoActivo: { backgroundColor: colors.accent },
  miEstadoTexto: { fontSize: 12, fontWeight: '700', color: '#FFFFFF' },
  miEstadoTextoOscuro: { fontSize: 12, fontWeight: '700', color: colors.primary },
  // Auspiciador propio de cada liga (franja superior de la tarjeta)
  ligaSponsor: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: 'rgba(255,255,255,0.08)',
    paddingHorizontal: 16, paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: 'rgba(255,255,255,0.08)',
  },
  ligaSponsorLabel: { fontSize: 10, color: 'rgba(255,255,255,0.6)', fontWeight: '600' },
  ligaSponsorNombre: { fontSize: 15, color: '#FFFFFF', fontWeight: '800' },
  premioRow: {
    flexDirection: 'row', alignItems: 'center', gap: 6,
    paddingHorizontal: 16, paddingBottom: 14, marginTop: -4,
  },
  premioText: { flex: 1, fontSize: 12, fontWeight: '700', color: colors.accent },

  // Próximamente
  proxCard: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    borderWidth: 1.5, borderStyle: 'dashed', borderColor: colors.border,
    borderRadius: 18, padding: 16, marginBottom: 12,
  },
  proxNivel: {
    width: 44, height: 44, borderRadius: 22, backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  proxTitulo: { fontSize: 15, fontWeight: '700', color: colors.textSecondary },
  proxSub: { fontSize: 12, color: colors.textSecondary, marginTop: 2 },
  proxBadge: { backgroundColor: colors.surface, borderRadius: 12, paddingHorizontal: 10, paddingVertical: 5 },
  proxBadgeText: { fontSize: 11, fontWeight: '700', color: colors.textSecondary },
});