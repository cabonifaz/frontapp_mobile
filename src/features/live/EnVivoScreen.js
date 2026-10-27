// NUEVO (07): partidos EN VIVO de amigos y jugadores que sigo (el admin ve todos).
// También muestra "Para iniciar hoy": partidos confirmados de hoy que aún no se transmiten
// (los míos; el admin ve todos) para ponerlos en vivo.
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ScrollView, Image, ActivityIndicator, RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import i18n from '../../i18n';
import { colors } from '../../constants';
import { enVivoService } from '../../services/enVivoService';
import { getAvatarSource } from '../../utils/avatars';
import { PuntoEnVivo } from './PartidoEnVivoScreen';

const REFRESCO_MS = 15000;

const nombresCortos = (txt) => String(txt ?? '')
  .split(' y ')
  .map(n => n.trim().split(' ')[0])
  .filter(Boolean)
  .join(' y ');

function formatFecha(f) {
  if (!f) return '';
  const [, m, d] = String(f).split('T')[0].split('-').map(Number);
  const meses = i18n.t('fechas.mesesAbrev', { returnObjects: true });
  return `${d} ${Array.isArray(meses) ? meses[m - 1] : m}`;
}

function TarjetaVivo({ p, onPress }) {
  const { t } = useTranslation();
  const enJuego = p.estado_vivo === 'EN_JUEGO';
  const s1 = Number(p.sets_lado1 ?? 0);
  const s2 = Number(p.sets_lado2 ?? 0);
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.85}>
      <View style={styles.cardTop}>
        <View style={[styles.chip, enJuego ? styles.chipVivo : styles.chipFin]}>
          {enJuego && <PuntoEnVivo size={7} />}
          <Text style={[styles.chipTxt, enJuego && { color: '#FFFFFF' }]}>
            {enJuego ? t('vivo.enVivo') : t('vivo.finalizado')}
          </Text>
        </View>
        {Number(p.es_dobles) === 1 && <Text style={styles.tag}>{t('vivo.dobles')}</Text>}
        {Number(p.es_rankeado) === 1 && <Text style={styles.tag}>{t('vivo.rankeado')}</Text>}
        <View style={{ flex: 1 }} />
        {enJuego && <Text style={styles.setTxt}>{t('vivo.set', { n: p.set_actual })}</Text>}
      </View>

      <View style={styles.fila}>
        <Image source={getAvatarSource(p.foto_lado1)} style={styles.avatar} />
        <Text style={[styles.nombre, !enJuego && s1 > s2 && styles.ganador]} numberOfLines={1}>{nombresCortos(p.nombre_lado1)}</Text>
        {enJuego && <Text style={styles.ptsActual}>{p.puntos_actual_lado1 ?? 0}</Text>}
        <Text style={[styles.sets, s1 > s2 && styles.setsLider]}>{s1}</Text>
      </View>
      <View style={styles.fila}>
        <Image source={getAvatarSource(p.foto_lado2)} style={styles.avatar} />
        <Text style={[styles.nombre, !enJuego && s2 > s1 && styles.ganador]} numberOfLines={1}>{nombresCortos(p.nombre_lado2)}</Text>
        {enJuego && <Text style={styles.ptsActual}>{p.puntos_actual_lado2 ?? 0}</Text>}
        <Text style={[styles.sets, s2 > s1 && styles.setsLider]}>{s2}</Text>
      </View>

      <View style={styles.pie}>
        <Ionicons name="location-outline" size={13} color={colors.textSecondary} />
        <Text style={styles.pieTxt} numberOfLines={1}>{p.nombre_cancha}</Text>
        {Number(p.puedo_marcar) === 1 && enJuego && (
          <Text style={styles.marcarTxt}>{t('vivo.tocaParaMarcar')}</Text>
        )}
      </View>
    </TouchableOpacity>
  );
}

export function EnVivoScreen({ navigation, route }) {
  const { t } = useTranslation();
  const modoAdmin = !!route?.params?.admin;
  const [vivos, setVivos] = useState([]);
  const [paraIniciar, setParaIniciar] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [refrescando, setRefrescando] = useState(false);

  const cargar = useCallback(async () => {
    const [v, p] = await Promise.all([
      enVivoService.listar().catch(() => null),
      enVivoService.paraIniciar().catch(() => null),
    ]);
    if (Array.isArray(v)) setVivos(v);
    if (Array.isArray(p)) setParaIniciar(p);
    setCargando(false);
    setRefrescando(false);
  }, []);

  useFocusEffect(useCallback(() => {
    cargar();
    const timer = setInterval(cargar, REFRESCO_MS);
    return () => clearInterval(timer);
  }, [cargar]));

  const enJuego = vivos.filter(v => v.estado_vivo === 'EN_JUEGO');
  const terminados = vivos.filter(v => v.estado_vivo !== 'EN_JUEGO');
  const abrir = (id) => navigation.navigate('PartidoEnVivo', { idPartido: id });

  return (
    <SafeAreaView style={styles.safe} edges={['top']}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitulo}>{modoAdmin ? t('admin.vivoTitulo') : t('vivo.listaTitulo')}</Text>
        <View style={{ width: 24 }} />
      </View>

      {cargando ? (
        <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <ScrollView
          contentContainerStyle={styles.contenido}
          refreshControl={<RefreshControl refreshing={refrescando} onRefresh={() => { setRefrescando(true); cargar(); }} tintColor={colors.accent} />}
        >
          <Text style={styles.seccion}>{t('vivo.ahora')}</Text>
          {enJuego.length === 0 ? (
            <View style={styles.vacio}>
              <MaterialCommunityIcons name="broadcast-off" size={36} color={colors.textSecondary} />
              <Text style={styles.vacioTxt}>{modoAdmin ? t('admin.sinVivos') : t('vivo.sinVivos')}</Text>
            </View>
          ) : enJuego.map(p => <TarjetaVivo key={p.id_partido} p={p} onPress={() => abrir(p.id_partido)} />)}

          {paraIniciar.length > 0 && (
            <>
              <Text style={styles.seccion}>{t('vivo.paraIniciar')}</Text>
              {paraIniciar.map(p => (
                <TouchableOpacity key={p.id_partido} style={styles.cardIniciar} onPress={() => abrir(p.id_partido)} activeOpacity={0.85}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.iniciarNombres} numberOfLines={2}>
                      {nombresCortos(p.nombre_lado1)}  vs  {nombresCortos(p.nombre_lado2)}
                    </Text>
                    <Text style={styles.iniciarMeta}>
                      {formatFecha(p.fecha_partido)} · {String(p.hora_partido ?? '').substring(0, 5)} · {p.nombre_cancha}
                    </Text>
                  </View>
                  <View style={styles.btnIniciar}>
                    <PuntoEnVivo size={8} />
                    <Text style={styles.btnIniciarTxt}>{t('vivo.iniciarCorto')}</Text>
                  </View>
                </TouchableOpacity>
              ))}
            </>
          )}

          {terminados.length > 0 && (
            <>
              <Text style={styles.seccion}>{t('vivo.recientes')}</Text>
              {terminados.map(p => <TarjetaVivo key={p.id_partido} p={p} onPress={() => abrir(p.id_partido)} />)}
            </>
          )}
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingVertical: 14 },
  headerTitulo: { fontSize: 18, fontWeight: '800', color: colors.textPrimary },
  contenido: { paddingHorizontal: 16, paddingBottom: 40 },
  seccion: { fontSize: 16, fontWeight: '800', color: colors.textPrimary, marginTop: 14, marginBottom: 10 },

  vacio: { alignItems: 'center', backgroundColor: colors.surface, borderRadius: 16, padding: 24, gap: 10 },
  vacioTxt: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20 },

  card: { backgroundColor: colors.dark, borderRadius: 18, padding: 14, marginBottom: 12 },
  cardTop: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 10 },
  chip: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 3 },
  chipVivo: { backgroundColor: 'rgba(255,59,48,0.25)' },
  chipFin: { backgroundColor: 'rgba(255,255,255,0.15)' },
  chipTxt: { fontSize: 11, fontWeight: '800', color: 'rgba(255,255,255,0.8)', letterSpacing: 0.6 },
  tag: { fontSize: 11, fontWeight: '700', color: colors.accent, borderWidth: 1, borderColor: colors.accent, borderRadius: 10, paddingHorizontal: 7, paddingVertical: 2 },
  setTxt: { fontSize: 12, fontWeight: '700', color: 'rgba(255,255,255,0.7)' },
  fila: { flexDirection: 'row', alignItems: 'center', paddingVertical: 5, gap: 10 },
  avatar: { width: 32, height: 32, borderRadius: 16, backgroundColor: '#1E2433' },
  nombre: { flex: 1, fontSize: 15, fontWeight: '600', color: '#FFFFFF' },
  ganador: { fontWeight: '900' },
  ptsActual: { fontSize: 15, fontWeight: '700', color: 'rgba(255,255,255,0.75)', minWidth: 26, textAlign: 'center' },
  sets: { fontSize: 22, fontWeight: '900', color: '#FFFFFF', minWidth: 28, textAlign: 'center' },
  setsLider: { color: colors.accent },
  pie: { flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 8 },
  pieTxt: { flex: 1, fontSize: 12, color: 'rgba(255,255,255,0.55)' },
  marcarTxt: { fontSize: 12, fontWeight: '700', color: colors.accent },

  cardIniciar: {
    flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: colors.surface,
    borderRadius: 16, padding: 14, marginBottom: 10,
  },
  iniciarNombres: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  iniciarMeta: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
  btnIniciar: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: colors.dark, borderRadius: 18, paddingHorizontal: 12, paddingVertical: 8 },
  btnIniciarTxt: { fontSize: 13, fontWeight: '800', color: '#FFFFFF' },
});
