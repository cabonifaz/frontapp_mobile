// NUEVO (07) / REDISEÑO (08): al iniciar sesión, antes del Home, el jugador elige el deporte:
// cada deporte es un "mundo" con su propia cancha animada. Se desliza entre mundos y, al entrar,
// la escena hace zoom como si se entrara a la cancha. Solo los deportes habilitados se pueden elegir;
// los demás se ven como "Próximamente".
import React, { useEffect, useRef, useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, FlatList, Animated, Dimensions, Easing,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { RankedLogo, RANKED_LIME } from '../../../components/common/RankedLogo';
import api from '../../../services/api';
import { authService } from '../../../services/authService';
import { DEPORTES } from '../../../constants/maestro';
import { guardarDeporteActivo, deporteActivo } from '../../../utils/deporteActivo';
import { MundoDeporte, MUNDOS, MUNDO_DEFECTO } from './MundoDeporte';

const { width: ANCHO, height: ALTO } = Dimensions.get('window');
const ALTO_ESCENA = Math.round(Math.min(ALTO * 0.5, ANCHO * 1.15));

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

function Dato({ valor, etiqueta, color }) {
  return (
    <View style={styles.dato}>
      <Text style={[styles.datoValor, { color }]}>{valor}</Text>
      <Text style={styles.datoEtiqueta}>{etiqueta}</Text>
    </View>
  );
}

export function ElegirDeporteScreen({ navigation, route }) {
  const { t } = useTranslation();
  const desdeAjustes = !!route?.params?.desdeAjustes;
  const [deportes, setDeportes] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [indice, setIndice] = useState(0);
  const [entrando, setEntrando] = useState(false);
  const zoom = useRef(new Animated.Value(0)).current;
  const aparecer = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    api.get('/api/Usuario/deportes-disponibles')
      .then(res => setDeportes(Array.isArray(res) && res.length ? res : RESPALDO))
      .catch(() => setDeportes(RESPALDO))
      .finally(() => setCargando(false));
  }, []);

  // Empieza en el deporte activo (si viene de Ajustes) o en el primero habilitado
  useEffect(() => {
    if (!deportes.length) return;
    const actual = deportes.findIndex(d => Number(d.id_deporte) === Number(deporteActivo()));
    const habil = deportes.findIndex(d => Number(d.habilitado) === 1);
    setIndice(desdeAjustes && actual >= 0 ? actual : Math.max(habil, 0));
    Animated.timing(aparecer, { toValue: 1, duration: 600, easing: Easing.out(Easing.cubic), useNativeDriver: true }).start();
  }, [deportes, desdeAjustes, aparecer]);

  const lista = useRef(null);
  useEffect(() => {
    if (deportes.length && lista.current) {
      lista.current.scrollToOffset({ offset: indice * ANCHO, animated: false });
    }
  }, [deportes.length]);

  async function salir() {
    await authService.logout();
    navigation.reset({ index: 0, routes: [{ name: 'Login' }] });
  }

  const nombre = (d) => (CLAVE_NOMBRE[d.codigo] ? t(CLAVE_NOMBRE[d.codigo]) : d.nombre);
  const d = deportes[indice];
  const mundo = (d && MUNDOS[d.codigo]) || MUNDO_DEFECTO;
  const habilitado = Number(d?.habilitado) === 1;

  async function entrar() {
    if (!d || !habilitado || entrando) return;
    setEntrando(true);
    await guardarDeporteActivo(d.id_deporte, nombre(d));
    // "Entrar al mundo": la cancha se acerca y se desvanece
    Animated.timing(zoom, { toValue: 1, duration: 650, easing: Easing.in(Easing.cubic), useNativeDriver: true })
      .start(() => navigation.reset({ index: 0, routes: [{ name: 'MainTabs' }] }));
  }

  const escalaEntrada = zoom.interpolate({ inputRange: [0, 1], outputRange: [1, 2.4] });
  const opacidadSalida = zoom.interpolate({ inputRange: [0, 0.7, 1], outputRange: [1, 0.6, 0] });

  return (
    <View style={[styles.root, { backgroundColor: mundo.fondo[0] }]}>
      <SafeAreaView style={{ flex: 1 }} edges={['top', 'bottom']}>
        <View style={styles.cabecera}>
          {desdeAjustes ? (
            <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
              <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
            </TouchableOpacity>
          ) : <View style={{ width: 24 }} />}
          <RankedLogo size={20} />
          <View style={{ width: 24 }} />
        </View>

        <Animated.Text style={[styles.titulo, { opacity: aparecer, transform: [{ translateY: aparecer.interpolate({ inputRange: [0, 1], outputRange: [14, 0] }) }] }]}>
          {t('elegirDeporte.titulo')}
        </Animated.Text>
        <Text style={styles.subtitulo}>{t('elegirDeporte.subtitulo')}</Text>

        {cargando ? (
          <ActivityIndicator size="large" color={RANKED_LIME} style={{ marginTop: 60 }} />
        ) : (
          <>
            <Animated.View style={{ opacity: opacidadSalida, transform: [{ scale: escalaEntrada }] }}>
              <FlatList
                ref={lista}
                data={deportes}
                horizontal
                pagingEnabled
                showsHorizontalScrollIndicator={false}
                keyExtractor={x => String(x.id_deporte)}
                getItemLayout={(_, i) => ({ length: ANCHO, offset: ANCHO * i, index: i })}
                onMomentumScrollEnd={e => setIndice(Math.round(e.nativeEvent.contentOffset.x / ANCHO))}
                scrollEnabled={!entrando}
                renderItem={({ item, index }) => {
                  const on = Number(item.habilitado) === 1;
                  return (
                    <View style={{ width: ANCHO, alignItems: 'center' }}>
                      <View style={styles.marco}>
                        <MundoDeporte
                          codigo={item.codigo}
                          width={ANCHO - 32}
                          height={ALTO_ESCENA}
                          activo={index === indice}
                          apagado={!on}
                        />
                        {!on && (
                          <View style={styles.candado}>
                            <Ionicons name="lock-closed" size={26} color="#FFFFFF" />
                            <Text style={styles.candadoTxt}>{t('elegirDeporte.proximamente')}</Text>
                          </View>
                        )}
                        <View style={styles.etiquetaMundo}>
                          <Text style={styles.nombreMundo}>{nombre(item).toUpperCase()}</Text>
                        </View>
                      </View>
                    </View>
                  );
                }}
              />
            </Animated.View>

            {/* Indicador de mundos */}
            <View style={styles.puntos}>
              {deportes.map((x, i) => (
                <TouchableOpacity
                  key={x.id_deporte}
                  onPress={() => { setIndice(i); lista.current?.scrollToOffset({ offset: i * ANCHO, animated: true }); }}
                  hitSlop={{ top: 8, bottom: 8, left: 6, right: 6 }}
                >
                  <View style={[styles.punto, i === indice && { width: 22, backgroundColor: mundo.acento }]} />
                </TouchableOpacity>
              ))}
            </View>

            {d && (
              <View style={styles.info}>
                <Text style={[styles.lema, { color: mundo.acento }]}>{t(mundo.lema)}</Text>
                {habilitado ? (
                  Number(d.tengo_perfil) === 1 ? (
                    <View style={styles.datos}>
                      <Dato valor={d.nivel_calculado ?? '--'} etiqueta={t('elegirDeporte.nivel')} color="#FFFFFF" />
                      <View style={styles.separador} />
                      <Dato valor={Number(d.puntaje_total ?? 0).toFixed(1)} etiqueta={t('elegirDeporte.puntos')} color="#FFFFFF" />
                      <View style={styles.separador} />
                      <Dato valor={d.posicion_ranking ? `#${d.posicion_ranking}` : '--'} etiqueta={t('elegirDeporte.ranking')} color="#FFFFFF" />
                    </View>
                  ) : (
                    <Text style={styles.sinPerfil}>{t('elegirDeporte.sinPerfilCorto')}</Text>
                  )
                ) : (
                  <Text style={styles.sinPerfil}>{t('elegirDeporte.proximamenteTexto', { deporte: nombre(d) })}</Text>
                )}

                <TouchableOpacity
                  style={[styles.boton, { backgroundColor: habilitado ? mundo.acento : 'rgba(255,255,255,0.12)' }]}
                  onPress={entrar}
                  disabled={!habilitado || entrando}
                  activeOpacity={0.85}
                >
                  {entrando ? <ActivityIndicator color="#0D111D" /> : (
                    <>
                      <Text style={[styles.botonTxt, !habilitado && { color: 'rgba(255,255,255,0.5)' }]}>
                        {habilitado ? t('elegirDeporte.entrar', { deporte: nombre(d) }) : t('elegirDeporte.bloqueado')}
                      </Text>
                      {habilitado && <Ionicons name="arrow-forward" size={20} color="#0D111D" />}
                    </>
                  )}
                </TouchableOpacity>

                {!desdeAjustes && (
                  <TouchableOpacity style={styles.salir} onPress={salir}>
                    <Text style={styles.salirTxt}>{t('ajustes.cerrarSesion')}</Text>
                  </TouchableOpacity>
                )}
              </View>
            )}
          </>
        )}
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1 },
  cabecera: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 20, paddingTop: 8 },
  titulo: { fontSize: 26, fontWeight: '900', color: '#FFFFFF', textAlign: 'center', marginTop: 14 },
  subtitulo: { fontSize: 13, color: 'rgba(255,255,255,0.6)', textAlign: 'center', marginTop: 4, marginBottom: 14, paddingHorizontal: 30 },

  marco: {
    width: ANCHO - 32, height: ALTO_ESCENA, borderRadius: 26, overflow: 'hidden',
    borderWidth: 1, borderColor: 'rgba(255,255,255,0.12)',
  },
  etiquetaMundo: { position: 'absolute', left: 16, top: 14 },
  nombreMundo: {
    fontSize: 30, fontWeight: '900', color: '#FFFFFF', letterSpacing: 2,
    textShadowColor: 'rgba(0,0,0,0.5)', textShadowRadius: 8, textShadowOffset: { width: 0, height: 2 },
  },
  candado: { position: 'absolute', top: '40%', alignSelf: 'center', alignItems: 'center', gap: 6 },
  candadoTxt: { color: '#FFFFFF', fontWeight: '900', letterSpacing: 2, fontSize: 13 },

  puntos: { flexDirection: 'row', justifyContent: 'center', gap: 8, marginTop: 14 },
  punto: { width: 8, height: 8, borderRadius: 4, backgroundColor: 'rgba(255,255,255,0.3)' },

  info: { paddingHorizontal: 24, marginTop: 14, alignItems: 'center' },
  lema: { fontSize: 15, fontWeight: '800', textAlign: 'center' },
  datos: {
    flexDirection: 'row', alignItems: 'center', marginTop: 14, paddingVertical: 10, paddingHorizontal: 18,
    backgroundColor: 'rgba(255,255,255,0.07)', borderRadius: 16,
  },
  dato: { alignItems: 'center', minWidth: 70 },
  datoValor: { fontSize: 20, fontWeight: '900' },
  datoEtiqueta: { fontSize: 11, color: 'rgba(255,255,255,0.55)', marginTop: 2, letterSpacing: 0.5 },
  separador: { width: 1, height: 28, backgroundColor: 'rgba(255,255,255,0.15)', marginHorizontal: 6 },
  sinPerfil: { color: 'rgba(255,255,255,0.65)', fontSize: 13, textAlign: 'center', marginTop: 12, lineHeight: 19 },

  boton: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8,
    alignSelf: 'stretch', borderRadius: 30, paddingVertical: 16, marginTop: 18,
  },
  botonTxt: { fontSize: 16, fontWeight: '900', color: '#0D111D', letterSpacing: 0.3 },
  salir: { marginTop: 14, padding: 6 },
  salirTxt: { fontSize: 13, color: 'rgba(255,255,255,0.55)', textDecorationLine: 'underline' },
});
