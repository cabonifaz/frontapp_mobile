import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, SafeAreaView,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { SharedHeader, HEADER_BG } from '../../components/common/SharedHeader';
import { TABS } from '../../data/partidosData';
import { partidoService } from '../../services/partidoService';
import { useUsuario } from '../../hooks/useUsuario';

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

function AppointmentCard({ item, onPress }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPress} activeOpacity={onPress ? 0.75 : 1}>
      <View style={styles.cardIconWrap}>
        <Ionicons
          name={item.categoria_tab === 'CLASE' ? 'school-outline' : 'tennisball-outline'}
          size={26}
          color={colors.accent}
        />
      </View>
      <View style={styles.cardInfo}>
        <Text style={styles.cardName}>{item.tipo_reto ?? 'Partido'}</Text>
        <Text style={styles.cardClub}>{item.lugar ?? ''}</Text>
        <View style={styles.cardDateRow}>
          <Ionicons name="time-outline" size={13} color={colors.textSecondary} />
          <Text style={styles.cardMeta}> {item.hora_partido ?? ''}</Text>
        </View>
      </View>
      {item.estado ? (
        <View style={styles.estadoBadge}>
          <Text style={styles.estadoText}>{item.estado}</Text>
        </View>
      ) : null}
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

  useEffect(() => {
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
  }, []);

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
              onPressItem={(item) => navigation.navigate('DetallePartido', { partido: item })}
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
    alignItems: 'center', gap: 14,
  },
  cardIconWrap: {
    width: 48, height: 48, borderRadius: 24,
    backgroundColor: colors.background,
    alignItems: 'center', justifyContent: 'center',
  },
  cardInfo: { flex: 1 },
  cardName: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 3 },
  cardClub: { fontSize: 13, color: colors.textSecondary, marginBottom: 5, fontStyle: 'italic' },
  cardDateRow: { flexDirection: 'row', alignItems: 'center' },
  cardMeta: { fontSize: 13, color: colors.textSecondary },
  estadoBadge: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  estadoText: { fontSize: 11, color: colors.textSecondary, fontWeight: '600' },
  emptyState: { alignItems: 'center', marginTop: 60, gap: 12 },
  emptyText: { fontSize: 15, color: colors.textSecondary },
});
