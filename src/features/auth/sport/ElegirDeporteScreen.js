// NUEVO (07): al iniciar sesión, antes del Home, el jugador elige el deporte (el "universo"
// en el que va a jugar). Cada deporte tiene su propio ranking, nivel, partidos y resultados.
// Los deportes que aún no están habilitados aparecen como "Próximamente".
import React, { useEffect, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons, MaterialCommunityIcons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { RankedLogo, RANKED_LIME } from '../../../components/common/RankedLogo';
import api from '../../../services/api';
import { authService } from '../../../services/authService';
import { DEPORTES } from '../../../constants/maestro';
import { guardarDeporteActivo, deporteActivo } from '../../../utils/deporteActivo';

const BG = '#0D1C27';

const ICONO = {
  DEPORTE_FRONTON: 'racquetball',
  DEPORTE_TENIS:   'tennis',
  DEPORTE_PADEL:   'tennis-ball',
};
const CLAVE_NOMBRE = {
  DEPORTE_FRONTON: 'deportes.fronton',
  DEPORTE_TENIS:   'deportes.tenis',
  DEPORTE_PADEL:   'deportes.padel',
};

// Si no hay conexión: solo frontón habilitado (igual que en la base de datos)
const RESPALDO = [
  { id_deporte: DEPORTES.FRONTON, codigo: 'DEPORTE_FRONTON', habilitado: 1, tengo_perfil: 1 },
  { id_deporte: DEPORTES.TENIS,   codigo: 'DEPORTE_TENIS',   habilitado: 0, tengo_perfil: 0 },
  { id_deporte: DEPORTES.PADEL,   codigo: 'DEPORTE_PADEL',   habilitado: 0, tengo_perfil: 0 },
];

export function ElegirDeporteScreen({ navigation, route }) {
  const { t } = useTranslation();
  const desdeAjustes = !!route?.params?.desdeAjustes;
  const [deportes, setDeportes] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    api.get('/api/Usuario/deportes-disponibles')
      .then(res => setDeportes(Array.isArray(res) && res.length ? res : RESPALDO))
      .catch(() => setDeportes(RESPALDO))
      .finally(() => setCargando(false));
  }, []);

  async function salir() {
    await authService.logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }

  const nombre = (d) => (CLAVE_NOMBRE[d.codigo] ? t(CLAVE_NOMBRE[d.codigo]) : d.nombre);

  async function elegir(d) {
    if (Number(d.habilitado) !== 1) return;
    // Si aún no tiene perfil en el deporte (por ejemplo, entró con Google/Facebook y no completó
    // el cuestionario) igual entra, como antes; el Home muestra sus datos vacíos.
    await guardarDeporteActivo(d.id_deporte, nombre(d));
    navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] });
  }

  return (
    <SafeAreaView style={styles.root}>
      <View style={styles.band1} />
      <View style={styles.band2} />

      {desdeAjustes && (
        <TouchableOpacity style={styles.back} onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
        </TouchableOpacity>
      )}

      <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.logo}><RankedLogo size={30} /></View>
        <Text style={styles.titulo}>{t('elegirDeporte.titulo')}</Text>
        <Text style={styles.subtitulo}>{t('elegirDeporte.subtitulo')}</Text>

        {cargando ? (
          <ActivityIndicator size="large" color={RANKED_LIME} style={{ marginTop: 40 }} />
        ) : deportes.map(d => {
          const habilitado = Number(d.habilitado) === 1;
          const elegido = desdeAjustes && Number(d.id_deporte) === Number(deporteActivo());
          return (
            <TouchableOpacity
              key={d.id_deporte}
              style={[styles.card, !habilitado && styles.cardOff, elegido && styles.cardElegida]}
              onPress={() => elegir(d)}
              disabled={!habilitado}
              activeOpacity={0.85}
            >
              <View style={[styles.icono, habilitado && styles.iconoOn]}>
                <MaterialCommunityIcons name={ICONO[d.codigo] ?? 'trophy'} size={30} color={habilitado ? BG : 'rgba(255,255,255,0.5)'} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={styles.nombre}>{nombre(d)}</Text>
                {habilitado ? (
                  <Text style={styles.detalle}>
                    {Number(d.tengo_perfil) === 1
                      ? t('elegirDeporte.miNivel', {
                          nivel: d.nivel_calculado ?? '--',
                          pts: Number(d.puntaje_total ?? 0).toFixed(1),
                        }) + (d.posicion_ranking ? `  ·  #${d.posicion_ranking}` : '')
                      : t('elegirDeporte.sinPerfilCorto')}
                  </Text>
                ) : (
                  <View style={styles.chip}><Text style={styles.chipTexto}>{t('elegirDeporte.proximamente')}</Text></View>
                )}
              </View>
              {habilitado && <Ionicons name={elegido ? 'checkmark-circle' : 'chevron-forward'} size={22} color={RANKED_LIME} />}
            </TouchableOpacity>
          );
        })}

        <Text style={styles.nota}>{t('elegirDeporte.nota')}</Text>

        {!desdeAjustes && (
          <TouchableOpacity style={styles.salir} onPress={salir}>
            <Text style={styles.salirTxt}>{t('ajustes.cerrarSesion')}</Text>
          </TouchableOpacity>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  band1: {
    position: 'absolute', width: 350, height: 1600, backgroundColor: 'rgba(255,255,255,0.045)',
    transform: [{ rotate: '32deg' }], top: -500, left: -80,
  },
  band2: {
    position: 'absolute', width: 350, height: 1600, backgroundColor: 'rgba(255,255,255,0.03)',
    transform: [{ rotate: '32deg' }], top: -300, left: 230,
  },
  back: { position: 'absolute', top: 52, left: 20, zIndex: 2 },
  content: { paddingHorizontal: 22, paddingTop: 70, paddingBottom: 40 },
  logo: { alignItems: 'center', marginBottom: 34 },
  titulo: { fontSize: 26, fontWeight: '800', color: '#FFFFFF', textAlign: 'center' },
  subtitulo: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 8, marginBottom: 28, lineHeight: 20 },

  card: {
    flexDirection: 'row', alignItems: 'center', gap: 14,
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 16, padding: 16, marginBottom: 12,
    borderWidth: 1.5, borderColor: 'rgba(255,255,255,0.08)',
  },
  cardOff: { opacity: 0.55 },
  cardElegida: { borderColor: RANKED_LIME },
  icono: {
    width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center',
    backgroundColor: 'rgba(255,255,255,0.1)',
  },
  iconoOn: { backgroundColor: RANKED_LIME },
  nombre: { fontSize: 18, fontWeight: '800', color: '#FFFFFF' },
  detalle: { fontSize: 13, color: 'rgba(255,255,255,0.65)', marginTop: 3 },
  chip: {
    alignSelf: 'flex-start', marginTop: 5, borderRadius: 10, paddingHorizontal: 8, paddingVertical: 2,
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.4)',
  },
  chipTexto: { fontSize: 11, fontWeight: '700', color: 'rgba(255,255,255,0.8)', letterSpacing: 0.4 },
  salir: { alignSelf: 'center', marginTop: 22, padding: 8 },
  salirTxt: { fontSize: 14, color: 'rgba(255,255,255,0.6)', textDecorationLine: 'underline' },
  nota: { fontSize: 12, color: 'rgba(255,255,255,0.45)', textAlign: 'center', marginTop: 18, lineHeight: 18 },
});
