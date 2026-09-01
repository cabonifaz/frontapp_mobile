import React, { useState, useEffect, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, ActivityIndicator, Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { claseService } from '../../services/claseService';
import { DEPORTE_DEFAULT } from '../../constants/maestro';
import { getAvatarSource } from '../../utils/avatars';

function ProfesorCard({ profesor, onSolicitar, cargando }) {
  const nombre = profesor.nombre ?? profesor.name ?? 'Profesor';
  const nombreCorto = nombre.split(' ').map((p, i) => i === 0 ? p[0] + '.' : p).join(' ');
  return (
    <View style={styles.card}>
      <Image
        source={getAvatarSource(profesor.foto_perfil_url ?? profesor.avatar)}
        style={styles.cardAvatar}
      />
      <View style={styles.cardInfo}>
        <View style={styles.nameRow}>
          <Text style={styles.cardName}>{nombreCorto}</Text>
          <Ionicons name="trophy" size={13} color={colors.textPrimary} style={{ marginLeft: 6 }} />
          <Text style={styles.cardRanking}> {profesor.ranking ?? '--'}</Text>
        </View>
        <Text style={styles.cardClub}>{profesor.nombre_cancha ?? profesor.club ?? ''}</Text>
        <View style={styles.dateRow}>
          <Ionicons name="calendar-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.cardMeta}> {profesor.fecha ?? profesor.date ?? '--'}</Text>
          <Text style={{ width: 10 }} />
          <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.cardMeta}> {profesor.hora ?? profesor.time ?? '--'}</Text>
        </View>
      </View>
      <View style={styles.cardRight}>
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
    </View>
  );
}

function SuccessScreen({ profesor, onPress }) {
  const nombre = profesor.nombre ?? profesor.name ?? 'El profesor';
  return (
    <View style={styles.successContainer}>
      <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center' }}>
        <View style={styles.successCircle}>
          <Image
            source={getAvatarSource(profesor.foto_perfil_url ?? profesor.avatar)}
            style={styles.successAvatar}
          />
        </View>
        <Text style={styles.successTitle}>{'¡Genial!\n'}{nombre} ha recibido tu solicitud</Text>
        <Text style={styles.successSubtitle}>
          Ponte de acuerdo con él desde "Mis partidos".
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

  const [profesores, setProfesores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [profesorAceptado, setProfesorAceptado] = useState(null);
  const [solicitandoId, setSolicitandoId] = useState(null);

  const cargar = useCallback(async () => {
    if (!cancha || !fecha) { setLoading(false); return; }
    try {
      const horaFiltro = Array.isArray(horas) ? horas[0] : horas;
      const res = await claseService.profesoresDisponibles({
        idCancha: cancha.id,
        fecha:    fecha.iso ?? fecha,
        hora:     horaFiltro,
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
      const horaFiltro = Array.isArray(horas) ? horas[0] : horas;
      await claseService.solicitar({
        idProfesor,
        idCancha:  cancha.id,
        fecha:     fecha.iso ?? fecha,
        hora:      horaFiltro,
      });
      setProfesorAceptado(profesor);
    } catch (e) {
      Alert.alert('Error', e.message ?? 'No se pudo solicitar la clase.');
    } finally {
      setSolicitandoId(null);
    }
  }

  if (profesorAceptado) {
    return (
      <SafeAreaView style={styles.safe}>
        <SuccessScreen
          profesor={profesorAceptado}
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

      {loading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.content}>
          {profesores.length === 0 ? (
            <View style={styles.emptyCard}>
              <Text style={styles.emptyText}>No hay profesores disponibles para esa fecha y hora</Text>
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
        </ScrollView>
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 12,
    gap: 16,
  },
  headerTitle: { fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },

  loadingContainer: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 20 },

  emptyCard: {
    backgroundColor: colors.surface, borderRadius: 16,
    padding: 24, alignItems: 'center',
  },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 21 },

  card: {
    flexDirection: 'row',
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    alignItems: 'center',
    gap: 12,
  },
  cardAvatar: { width: 56, height: 56, borderRadius: 28, backgroundColor: '#ccc' },
  cardInfo: { flex: 1 },
  nameRow: { flexDirection: 'row', alignItems: 'center', marginBottom: 3 },
  cardName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary },
  cardRanking: { fontSize: 14, fontWeight: '700', color: colors.textPrimary },
  cardClub: { fontSize: 13, color: colors.textSecondary, marginBottom: 5, fontStyle: 'italic' },
  dateRow: { flexDirection: 'row', alignItems: 'center' },
  cardMeta: { fontSize: 12, color: colors.textSecondary },
  cardRight: { alignItems: 'flex-end' },
  solicitarBtn: {
    borderWidth: 1.5, borderColor: colors.textPrimary,
    borderRadius: 20, paddingHorizontal: 16, paddingVertical: 8,
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
