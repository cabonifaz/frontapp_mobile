import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, ActivityIndicator, Alert,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { amistadService } from '../../services/amistadService';
import { getAvatarSource } from '../../utils/avatars';

function haceCuanto(fecha) {
  if (!fecha) return '';
  const d = new Date(fecha);
  if (isNaN(d)) return '';
  const min = Math.floor((Date.now() - d.getTime()) / 60000);
  if (min < 1) return 'Ahora';
  if (min < 60) return `Hace ${min} min.`;
  const h = Math.floor(min / 60);
  if (h < 24) return `Hace ${h} h`;
  const dias = Math.floor(h / 24);
  return dias === 1 ? 'Ayer' : `Hace ${dias} días`;
}

export function SolicitudesAmistadScreen({ navigation }) {
  const [solicitudes, setSolicitudes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [accionLoading, setAccionLoading] = useState(null);

  const cargar = useCallback(async () => {
    try {
      const res = await amistadService.solicitudesRecibidas();
      setSolicitudes(Array.isArray(res) ? res : []);
    } catch {
      setSolicitudes([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      cargar();
    }, [cargar])
  );

  async function responder(s, aceptar) {
    try {
      setAccionLoading(s.id_amistad);
      await amistadService.responder(s.id_amistad, aceptar);
      setSolicitudes(prev => prev.filter(x => x.id_amistad !== s.id_amistad));
      if (aceptar) {
        const nombre = (s.nombre_completo ?? 'este jugador').split(' ')[0];
        Alert.alert('Solicitud aceptada', `${nombre} ya está en tu lista de amigos. Ahora puedes retarlo directamente a un amistoso.`);
      }
    } catch (e) {
      Alert.alert('Error', e.message ?? 'No se pudo responder la solicitud.');
    } finally {
      setAccionLoading(null);
    }
  }

  function abrirPerfil(s) {
    navigation.navigate('PlayerProfile', {
      player: {
        nombre: s.nombre_completo,
        pts: s.puntaje_total,
        ranking: s.posicion_ranking,
        avatar: s.foto_perfil_url,
        id_usuario: s.id_usuario,
      },
    });
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Solicitudes de amistad</Text>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {solicitudes.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="mail-open-outline" size={36} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No tienes solicitudes de amistad pendientes</Text>
            </View>
          ) : (
            solicitudes.map(s => {
              const cargando = accionLoading === s.id_amistad;
              return (
                <TouchableOpacity key={s.id_amistad} style={styles.card} activeOpacity={0.75} onPress={() => abrirPerfil(s)}>
                  <Image source={getAvatarSource(s.foto_perfil_url)} style={styles.avatar} />
                  <View style={styles.info}>
                    <Text style={styles.name} numberOfLines={1}>{s.nombre_completo}</Text>
                    <View style={styles.metaRow}>
                      <Ionicons name="trophy" size={13} color={colors.textPrimary} />
                      <Text style={styles.metaText}> {s.posicion_ranking ?? 'N/R'}</Text>
                      <Text style={{ width: 10 }} />
                      <Text style={styles.metaText}>{haceCuanto(s.fecha_solicitud)}</Text>
                    </View>
                  </View>
                  <View style={styles.accionesCol}>
                    <TouchableOpacity
                      style={[styles.aceptarBtn, cargando && { opacity: 0.5 }]}
                      onPress={() => responder(s, true)}
                      disabled={cargando}
                    >
                      {cargando
                        ? <ActivityIndicator size="small" color={colors.textPrimary} />
                        : <Text style={styles.aceptarText}>Aceptar</Text>}
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={[styles.rechazarBtn, cargando && { opacity: 0.5 }]}
                      onPress={() => responder(s, false)}
                      disabled={cargando}
                    >
                      <Text style={styles.rechazarText}>Rechazar</Text>
                    </TouchableOpacity>
                  </View>
                </TouchableOpacity>
              );
            })
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12, gap: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 16 },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 16,
    padding: 14, gap: 12, marginBottom: 12,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#ccc' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 12, color: colors.textSecondary },

  accionesCol: { alignItems: 'center', gap: 8 },
  aceptarBtn: {
    borderWidth: 1.5, borderColor: colors.textPrimary,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
    minWidth: 84, alignItems: 'center',
  },
  aceptarText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  rechazarBtn: { borderRadius: 20, paddingHorizontal: 16, paddingVertical: 6, minWidth: 84, alignItems: 'center' },
  rechazarText: { fontSize: 13, fontWeight: '500', color: colors.textSecondary },

  emptyCard: {
    backgroundColor: colors.surface, borderRadius: 16,
    padding: 28, alignItems: 'center', gap: 10,
  },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center' },
});