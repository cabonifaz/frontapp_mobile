import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
  ActivityIndicator, Image,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { SharedHeader, HEADER_BG } from '../../components/common/SharedHeader';
import { TABS } from '../../data/partidosData';
import { partidoService } from '../../services/partidoService';
import { useUsuario } from '../../hooks/useUsuario';

const AVATARES_LOCALES = {
  avatar_general:     require('../../../assets/avatar_general.png'),
  avatar_masculino_1: require('../../../assets/avatar_masculino_1.png'),
  avatar_masculino_2: require('../../../assets/avatar_masculino_2.png'),
  avatar_masculino_3: require('../../../assets/avatar_masculino_3.png'),
  avatar_femenino_1:  require('../../../assets/avatar_femenino_1.png'),
  avatar_femenino_2:  require('../../../assets/avatar_femenino_2.png'),
  avatar_femenino_3:  require('../../../assets/avatar_femenino_3.png'),
};

function fuenteAvatar(foto) {
  if (foto && (foto.startsWith('http://') || foto.startsWith('https://'))) return { uri: foto };
  if (foto && AVATARES_LOCALES[foto]) return AVATARES_LOCALES[foto];
  return AVATARES_LOCALES.avatar_general;
}

function formatSectionDate(dateStr) {
  if (!dateStr) return 'Sin fecha';
  const d = new Date(dateStr);
  const days = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const months = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];
  return `${days[d.getDay()]} ${d.getDate()} ${months[d.getMonth()]}, ${d.getFullYear()}`;
}

function groupByDate(items) {
  const map = {};
  items.forEach(item => {
    const key = item.fecha_partido ?? 'Sin fecha';
    if (!map[key]) map[key] = { section: formatSectionDate(key), items: [] };
    map[key].items.push(item);
  });
  return Object.values(map);
}

const ESTADO_COLORES = [
  { keys: ['buscando'],                     bg: '#FFF3CD', text: '#856404' },
  { keys: ['pendiente', 'solicitada'],      bg: '#CCE5FF', text: '#004085' },
  { keys: ['confirmado', 'aceptada'],       bg: '#D4EDDA', text: '#155724' },
  { keys: ['finalizado', 'completado'],     bg: '#E2E3E5', text: '#383D41' },
  { keys: ['cancelado'],                    bg: '#F8D7DA', text: '#721C24' },
];

function getEstadoBadge(item) {
  // El SP devuelve el nombre del estado en el campo "estado"
  const label = item.estado ?? item.nombre_estado ?? item.estado_nombre ?? null;
  if (!label) return null;
  const lower = label.toLowerCase();
  const config = ESTADO_COLORES.find(c => c.keys.some(k => lower.includes(k)));
  return {
    label,
    bg:   config?.bg   ?? '#E2E3E5',
    text: config?.text ?? '#383D41',
  };
}

function AppointmentCard({ item, onPress }) {
  const esClase      = item.categoria_tab === 'CLASE';
  const nombreRival  = item.nombre_rival ?? item.rival ?? item.participante ?? null;
  const fotoRival    = item.foto_perfil_url_rival ?? item.foto_rival ?? item.foto_perfil_url ?? null;
  const rankingRival = item.ranking_rival ?? item.ranking ?? null;
  const tieneNotif   = item.tiene_mensajes_nuevos === 1 || item.tiene_mensajes_nuevos === true;
  const estadoBadge  = getEstadoBadge(item);

  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={0.75}>
      {/* Avatar del rival */}
      <Image source={fuenteAvatar(fotoRival)} style={styles.cardAvatar} />

      <View style={styles.cardInfo}>
        {/* Cabecera de la Info (Nombre + Etiqueta de Estado) */}
        <View style={styles.cardHeaderInfo}>
          <View style={{ flex: 1 }}>
            <View style={styles.nameRow}>
              <Text style={styles.cardName} numberOfLines={1}>
                {nombreRival ?? item.tipo_reto ?? 'Partido'}
              </Text>
              {rankingRival != null && (
                <View style={styles.rankRow}>
                  <Ionicons name="trophy" size={11} color={colors.textPrimary} />
                  <Text style={styles.cardRanking}> {rankingRival}</Text>
                </View>
              )}
            </View>
            <Text style={styles.cardClub} numberOfLines={1}>{item.lugar ?? item.nombre_cancha ?? ''}</Text>
          </View>

          {estadoBadge && (
            <View style={[styles.statusBadge, { backgroundColor: estadoBadge.bg }]}>
              <Text style={[styles.statusText, { color: estadoBadge.text }]}>{estadoBadge.label}</Text>
            </View>
          )}
        </View>

        {/* Fecha + hora */}
        <View style={styles.cardDateRow}>
          <Ionicons name="calendar-outline" size={12} color={colors.textSecondary} />
          <Text style={styles.cardMeta}> {formatSectionDate(item.fecha_partido)}</Text>
          <Text style={{ width: 8 }} />
          <Ionicons name="time-outline" size={12} color={colors.textSecondary} />
          <Text style={styles.cardMeta}> {(item.hora_partido ?? '').substring(0, 5)}</Text>
        </View>
      </View>

      {/* Punto rojo de notificación */}
      {tieneNotif && <View style={styles.notifDot} />}
    </TouchableOpacity>
  );
}

function Section({ data, onPressItem }) {
  return (
    <>
      {data.map((section) => (
        <View key={section.section}>
          <Text style={styles.sectionLabel}>{section.section}</Text>
          {section.items.map((item, i) => (
            <AppointmentCard
              key={item.id_encuentro ?? i}
              item={item}
              onPress={onPressItem ? () => onPressItem(item) : null}
            />
          ))}
        </View>
      ))}
    </>
  );
}

export function PartidosScreen({ navigation }) {
  const usuario = useUsuario();
  const [activeTab, setActiveTab] = useState('Partidos');
  const [partidos, setPartidos] = useState([]);
  const [clases, setClases] = useState([]);
  const [loading, setLoading] = useState(true);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      partidoService.listarMisPartidos()
        .then(res => {
          if (Array.isArray(res) && res.length) {
            const todosPartidos = res.filter(r => r.categoria_tab === 'PARTIDO');
            const todasClases  = res.filter(r => r.categoria_tab === 'CLASE');
            setPartidos(groupByDate(todosPartidos));
            setClases(groupByDate(todasClases));
          } else {
            setPartidos([]);
            setClases([]);
          }
        })
        .catch(() => { setPartidos([]); setClases([]); })
        .finally(() => setLoading(false));
    }, [])
  );

  const currentData = activeTab === 'Partidos' ? partidos : clases;

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
        <View style={styles.tabBar}>
          {TABS.map((t) => (
            <TouchableOpacity key={t} style={styles.tabItem} onPress={() => setActiveTab(t)}>
              <Text style={[styles.tabText, activeTab === t && styles.tabTextActive]}>{t}</Text>
              {activeTab === t && <View style={styles.tabIndicator} />}
            </TouchableOpacity>
          ))}
        </View>

        <ScrollView showsVerticalScrollIndicator={false} style={{ paddingHorizontal: 20 }}>
          <View style={styles.titleRow}>
            <Text style={styles.pageTitle}>{activeTab}</Text>
            {activeTab === 'Partidos' && (
              <TouchableOpacity
                style={styles.solicitudesBtn}
                onPress={() => navigation.navigate('MisSolicitudes')}
              >
                <Ionicons name="people-outline" size={16} color={colors.primary} />
                <Text style={styles.solicitudesBtnText}>Solicitudes</Text>
              </TouchableOpacity>
            )}
          </View>
          {loading ? (
            <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
          ) : currentData.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="calendar-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.emptyText}>No tienes {activeTab.toLowerCase()} programados</Text>
            </View>
          ) : (
            <Section
              data={currentData}
              onPressItem={(item) =>
                item.categoria_tab === 'CLASE'
                  ? navigation.navigate('DetalleClase', { clase: item })
                  : navigation.navigate('DetallePartido', { partido: item })
              }
            />
          )}
          <View style={{ height: 32 }} />
        </ScrollView>
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
    overflow: 'hidden',
  },
  tabBar: {
    flexDirection: 'row',
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
    paddingHorizontal: 20,
  },
  tabItem: { flex: 1, alignItems: 'center', paddingVertical: 16, position: 'relative' },
  tabText: { fontSize: 16, fontWeight: '500', color: colors.textSecondary },
  tabTextActive: { color: colors.textPrimary, fontWeight: '600' },
  tabIndicator: {
    position: 'absolute', bottom: 0, left: 0, right: 0,
    height: 3, backgroundColor: colors.accent, borderRadius: 2,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginTop: 20,
    marginBottom: 12,
  },
  pageTitle: {
    fontSize: 22, fontWeight: 'bold', color: colors.textPrimary,
  },
  solicitudesBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: colors.accentLight,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 8,
  },
  solicitudesBtnText: { fontSize: 13, fontWeight: '600', color: colors.primary },
  sectionLabel: {
    fontSize: 15, fontWeight: 'bold', color: colors.textPrimary,
    marginTop: 8, marginBottom: 10,
  },
  card: {
    flexDirection: 'row', backgroundColor: colors.surface,
    borderRadius: 16, padding: 14, marginBottom: 12,
    alignItems: 'center', gap: 12,
  },
  cardAvatar: {
    width: 52, height: 52, borderRadius: 26, backgroundColor: '#ccc',
  },
  cardIconWrap: {
    width: 52, height: 52, borderRadius: 26,
    backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  // 🟢 Estilo para envolver nombre y badge en la misma línea
  cardHeaderInfo: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'flex-start' 
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 3 },
  cardName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, flexShrink: 1 },
  rankRow: { flexDirection: 'row', alignItems: 'center' },
  cardRanking: { fontSize: 13, fontWeight: '600', color: colors.textPrimary },
  cardClub: { fontSize: 13, color: colors.textSecondary, marginBottom: 5, fontStyle: 'italic' },
  // 🟢 Estilos para el Badge
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 12,
    marginLeft: 8,
    marginTop: 2
  },
  statusText: {
    fontSize: 10,
    fontWeight: 'bold',
    textTransform: 'uppercase',
  },
  cardDateRow: { flexDirection: 'row', alignItems: 'center' },
  cardMeta: { fontSize: 12, color: colors.textSecondary },
  notifDot: {
    width: 10, height: 10, borderRadius: 5,
    backgroundColor: '#E53935',
    alignSelf: 'center',
  },
  estadoBadge: {
    alignSelf: 'flex-start',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 2,
    marginTop: 5,
  },
  estadoBadgeText: {
    fontSize: 11,
    fontWeight: '600',
  },
  emptyState: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: colors.textSecondary },
});