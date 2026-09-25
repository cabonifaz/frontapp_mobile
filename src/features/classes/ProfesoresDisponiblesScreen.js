import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { claseService } from '../../services/claseService';
import { getAvatarSource } from '../../utils/avatars';
import { resumenHorario, formatFechaClase } from './horasClase';

function ProfesorCard({ profesor, onSolicitar, cargando }) {
  const nombre = profesor.nombre ?? profesor.nombre_completo ?? profesor.name ?? 'Profesor';

  // CORREGIDO: la estrella es la calificación como profesor (antes mostraba el ranking)
  const calif = profesor.calificacion_promedio;
  const totalCalif = Number(profesor.total_calificaciones ?? 0);
  const tieneCalif = calif != null && Number(calif) > 0;
  const ranking = profesor.ranking;
  const tarifa = profesor.tarifa_referencial;
  const tieneTarifa = tarifa != null && Number(tarifa) > 0;

  return (
    <View style={styles.card}>
      <Image
        source={getAvatarSource(profesor.foto_perfil_url ?? profesor.avatar)}
        style={styles.cardAvatar}
      />
      <View style={styles.cardInfo}>
        <Text style={styles.cardName} numberOfLines={1}>{nombre}</Text>

        {/* Línea 1: calificación como profesor */}
        <View style={styles.metaRow}>
          <Ionicons name="star" size={13} color={colors.accent} />
          {tieneCalif ? (
            <Text style={styles.califText}>
              {' '}{Number(calif).toFixed(1)}
              <Text style={styles.califCount}> ({totalCalif})</Text>
            </Text>
          ) : (
            <Text style={styles.sinCalif}> Sin calificaciones</Text>
          )}
        </View>

        {/* Línea 2: ranking y tarifa (cada dato en un bloque que no se parte) */}
        {(ranking != null || tieneTarifa) && (
          <View style={styles.extrasRow}>
            {ranking != null && (
              <View style={styles.extra}>
                <Ionicons name="trophy-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.extraText}>Puesto {ranking}</Text>
              </View>
            )}
            {tieneTarifa && (
              <View style={styles.extra}>
                <Ionicons name="cash-outline" size={12} color={colors.textSecondary} />
                <Text style={styles.extraText}>S/ {Number(tarifa).toFixed(0)} / hora</Text>
              </View>
            )}
          </View>
        )}
      </View>

      <TouchableOpacity
        style={[styles.solicitarBtn, cargando && { opacity: 0.5 }]}
        onPress={onSolicitar}
        disabled={cargando}
      >
        {cargando
          ? <ActivityIndicator size="small" color={colors.textPrimary} />
          : <Text style={styles.solicitarText}>Solicitar</Text>
        }
      </TouchableOpacity>
    </View>
  );
}

function SuccessScreen({ profesor, horario, onPress }) {
  const nombre = (profesor.nombre ?? profesor.name ?? 'El profesor').split(' ')[0];
  return (
    <View style={styles.successContainer}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={styles.successCircle}>
          <Image
            source={getAvatarSource(profesor.foto_perfil_url ?? profesor.avatar)}
            style={styles.successAvatar}
          />
        </View>
        <Text style={styles.successTitle}>{'¡Genial!\n'}{nombre} recibió tu solicitud</Text>
        <Text style={styles.successSubtitle}>
          {horario ? `Clase de ${horario.texto}. ` : ''}
          Cuando la acepte podrán coordinar por el chat desde "Mis partidos → Clases".
        </Text>
      </View>
      <TouchableOpacity style={styles.accentBtn} onPress={onPress}>
        <Text style={styles.accentBtnText}>Ir a mis partidos</Text>
      </TouchableOpacity>
    </View>
  );
}

export function ProfesoresDisponiblesScreen({ navigation, route }) {
  const { cancha, fecha, horas } = route?.params ?? {};
  const horario = resumenHorario(horas);   // { inicio, fin, duracionMinutos, texto }

  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profesorAceptado, setProfesorAceptado] = useState(null);
  const [solicitandoId, setSolicitandoId] = useState(null);

  const cargar = useCallback(async () => {
    if (!cancha || !fecha || !horario) { setLoading(false); return; }
    try {
      const res = await claseService.profesoresDisponibles({
        idCancha:        cancha.id,
        fecha:           fecha.iso ?? fecha,
        hora:            horario.inicio,
        duracionMinutos: horario.duracionMinutos,
      });
      setProfesores(Array.isArray(res) ? res : res?.profesores ?? []);
    } catch {
      setProfesores([]);
    } finally {
      setLoading(false);
    }
  }, [cancha, fecha, horas]);

  useEffect(() => { cargar(); }, [cargar]);

  async function handleSolicitar(profesor) {
    const idProfesor = profesor.id_usuario ?? profesor.id;
    try {
      setSolicitandoId(idProfesor);
      await claseService.solicitar({
        idProfesor,
        idCancha:        cancha.id,
        fecha:           fecha.iso ?? fecha,
        hora:            horario.inicio,
        duracionMinutos: horario.duracionMinutos,
      });
      setProfesorAceptado(profesor);
    } catch (e) {
      Alert.alert('No se pudo solicitar', e.message ?? 'Intenta con otro horario o profesor.');
      cargar(); // refresca por si el profesor ya no está disponible
    } finally {
      setSolicitandoId(null);
    }
  }

  if (profesorAceptado) {
    return (
      <SafeAreaView style={styles.safe}>
        <SuccessScreen
          profesor={profesorAceptado}
          horario={horario}
          onPress={() => navigation.navigate('MainTabs', { screen: 'Partidos' })}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Profesores disponibles</Text>
      </View>

      {/* Resumen de la clase buscada (una sola vez, no repetido en cada tarjeta) */}
      <View style={styles.resumen}>
        <View style={styles.resumenItem}>
          <Ionicons name="location-outline" size={15} color={colors.textPrimary} />
          <Text style={styles.resumenText} numberOfLines={1}>{cancha?.nombre ?? 'Cancha'}</Text>
        </View>
        <View style={styles.resumenItem}>
          <Ionicons name="calendar-outline" size={15} color={colors.textPrimary} />
          <Text style={styles.resumenText}>{formatFechaClase(fecha)}</Text>
        </View>
        <View style={styles.resumenItem}>
          <Ionicons name="time-outline" size={15} color={colors.textPrimary} />
          <Text style={styles.resumenText}>{horario?.texto ?? '--'}</Text>
        </View>
      </View>

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {profesores.length === 0 ? (
            <View style={styles.emptyCard}>
              <Ionicons name="school-outline" size={36} color={colors.textSecondary} />
              <Text style={styles.emptyText}>
                No hay profesores libres en ese horario. Prueba con otra hora o fecha.
              </Text>
            </View>
          ) : (
            profesores.map((p, i) => {
              const id = p.id_usuario ?? p.id ?? String(i);
              return (
                <ProfesorCard
                  key={id}
                  profesor={p}
                  cargando={solicitandoId === id}
                  onSolicitar={() => handleSolicitar(p)}
                />
              );
            })
          )}
          <View style={{ height: 24 }} />
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

  resumen: {
    flexDirection: 'row', flexWrap: 'wrap', gap: 8,
    marginHorizontal: 20, marginBottom: 8,
    backgroundColor: colors.accentLight, borderRadius: 14, padding: 12,
  },
  resumenItem: { flexDirection: 'row', alignItems: 'center', gap: 5, maxWidth: '100%' },
  resumenText: { fontSize: 13, fontWeight: '700', color: colors.textPrimary },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 12 },

  emptyCard: {
    backgroundColor: colors.surface, borderRadius: 16,
    padding: 24, alignItems: 'center', gap: 10,
  },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },

  card: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: 16, padding: 14, marginBottom: 12,
    alignItems: 'center', gap: 12,
  },
  cardAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#ccc' },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center', flexWrap: 'wrap' },
  califText: { fontSize: 14, fontWeight: '800', color: colors.textPrimary },
  califCount: { fontSize: 12, fontWeight: '500', color: colors.textSecondary },
  sinCalif: { fontSize: 12, color: colors.textSecondary },
  extrasRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 10, marginTop: 5 },
  extra: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  extraText: { fontSize: 12, color: colors.textSecondary, fontWeight: '600' },

  solicitarBtn: {
    borderWidth: 1.5, borderColor: colors.textPrimary,
    borderRadius: 20, paddingHorizontal: 14, paddingVertical: 8,
    minWidth: 82, alignItems: 'center',
  },
  solicitarText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },

  successContainer: { flex: 1, paddingHorizontal: 32, paddingBottom: 40, paddingTop: 20 },
  successCircle: {
    width: 160, height: 160, borderRadius: 80,
    backgroundColor: '#E8E8E8', alignItems: 'center',
    justifyContent: 'center', marginBottom: 32,
  },
  successAvatar: { width: 120, height: 120, borderRadius: 60, backgroundColor: '#ccc' },
  successTitle: { fontSize: 22, fontWeight: 'bold', color: colors.textPrimary, textAlign: 'center', lineHeight: 30, marginBottom: 12 },
  successSubtitle: { fontSize: 15, color: colors.textSecondary, textAlign: 'center', lineHeight: 22 },
  accentBtn: { backgroundColor: colors.accent, borderRadius: 30, paddingVertical: 18, alignItems: 'center' },
  accentBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary },
});