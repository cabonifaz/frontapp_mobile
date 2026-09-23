import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  SafeAreaView, Image, ActivityIndicator, Alert, TextInput,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { amistadService } from '../../services/amistadService';
import { getAvatarSource } from '../../utils/avatars';

function AmigoRow({ amigo, onPerfil, onRetar, onOpciones }) {
  return (
    <TouchableOpacity style={styles.card} onPress={onPerfil} activeOpacity={0.75}>
      <Image source={getAvatarSource(amigo.foto_perfil_url)} style={styles.avatar} />
      <View style={styles.info}>
        <Text style={styles.name} numberOfLines={1}>{amigo.nombre_completo}</Text>
        <View style={styles.metaRow}>
          <Ionicons name="trophy" size={13} color={colors.textPrimary} />
          <Text style={styles.metaText}> {amigo.posicion_ranking ?? 'N/R'}</Text>
          <Text style={{ width: 10 }} />
          <Text style={styles.metaText}>{Number(amigo.puntaje_total ?? 0).toFixed(1)} pts</Text>
        </View>
      </View>
      <TouchableOpacity style={styles.retarBtn} onPress={onRetar}>
        <Text style={styles.retarText}>Retar</Text>
      </TouchableOpacity>
      <TouchableOpacity onPress={onOpciones} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
        <Ionicons name="ellipsis-vertical" size={18} color={colors.textSecondary} />
      </TouchableOpacity>
    </TouchableOpacity>
  );
}

export function AmigosScreen({ navigation }) {
  const [amigos, setAmigos] = useState([]);
  const [pendientes, setPendientes] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');

  const cargar = useCallback(async () => {
    const [resAmigos, resSolicitudes] = await Promise.allSettled([
      amistadService.listarAmigos(),
      amistadService.solicitudesRecibidas(),
    ]);
    setAmigos(resAmigos.status === 'fulfilled' && Array.isArray(resAmigos.value) ? resAmigos.value : []);
    setPendientes(resSolicitudes.status === 'fulfilled' && Array.isArray(resSolicitudes.value) ? resSolicitudes.value.length : 0);
    setLoading(false);
  }, []);

  useFocusEffect(
    useCallback(() => {
      setLoading(true);
      cargar();
    }, [cargar])
  );

  function abrirPerfil(a) {
    navigation.navigate('PlayerProfile', {
      player: {
        nombre: a.nombre_completo,
        pts: a.puntaje_total,
        ranking: a.posicion_ranking,
        avatar: a.foto_perfil_url,
        id_usuario: a.id_usuario,
      },
    });
  }

  function retar(a) {
    navigation.navigate('CrearPartido', { tipo: 'Amistoso', amigo: a });
  }

  function opciones(a) {
    const nombre = (a.nombre_completo ?? 'este jugador').split(' ')[0];
    Alert.alert(a.nombre_completo, undefined, [
      { text: 'Ver perfil', onPress: () => abrirPerfil(a) },
      {
        text: 'Eliminar de amigos',
        style: 'destructive',
        onPress: () => Alert.alert('Eliminar amigo', `¿Quieres eliminar a ${nombre} de tus amigos?`, [
          { text: 'Cancelar', style: 'cancel' },
          {
            text: 'Eliminar',
            style: 'destructive',
            onPress: async () => {
              try {
                await amistadService.eliminar(a.id_usuario);
                setAmigos(prev => prev.filter(x => x.id_usuario !== a.id_usuario));
              } catch (e) {
                Alert.alert('Error', e.message ?? 'No se pudo eliminar al amigo.');
              }
            },
          },
        ]),
      },
      { text: 'Cancelar', style: 'cancel' },
    ]);
  }

  const term = search.trim().toLowerCase();
  const filtrados = term
    ? amigos.filter(a => (a.nombre_completo ?? '').toLowerCase().includes(term))
    : amigos;

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Amigos</Text>
        <TouchableOpacity
          style={styles.solicitudesBtn}
          onPress={() => navigation.navigate('SolicitudesAmistad')}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="mail-outline" size={24} color={colors.textPrimary} />
          {pendientes > 0 && (
            <View style={styles.badge}>
              <Text style={styles.badgeText}>{pendientes > 9 ? '9+' : pendientes}</Text>
            </View>
          )}
        </TouchableOpacity>
      </View>

      {loading ? (
        <View style={styles.center}>
          <ActivityIndicator size="large" color={colors.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.content} showsVerticalScrollIndicator={false}>
          {amigos.length > 0 && (
            <View style={styles.searchBar}>
              <Ionicons name="search" size={18} color={colors.textPrimary} />
              <TextInput
                style={styles.searchInput}
                placeholder="Buscar amigo"
                placeholderTextColor="#9E9E9E"
                value={search}
                onChangeText={setSearch}
                autoCapitalize="none"
                underlineColorAndroid="transparent"
              />
            </View>
          )}

          {pendientes > 0 && (
            <TouchableOpacity style={styles.avisoCard} onPress={() => navigation.navigate('SolicitudesAmistad')}>
              <Ionicons name="person-add" size={18} color={colors.primary} />
              <Text style={styles.avisoText}>
                Tienes {pendientes} {pendientes === 1 ? 'solicitud' : 'solicitudes'} de amistad por responder
              </Text>
              <Ionicons name="chevron-forward" size={18} color={colors.primary} />
            </TouchableOpacity>
          )}

          {amigos.length === 0 ? (
            <View style={styles.emptyState}>
              <Ionicons name="people-outline" size={44} color={colors.textSecondary} />
              <Text style={styles.emptyTitle}>Aún no tienes amigos</Text>
              <Text style={styles.emptyText}>
                Entra al perfil de un jugador desde el ranking y envíale una solicitud de amistad.
              </Text>
              <TouchableOpacity
                style={styles.accentBtn}
                onPress={() => navigation.navigate('MainTabs', { screen: 'Ranking' })}
              >
                <Text style={styles.accentBtnText}>Ir al ranking</Text>
              </TouchableOpacity>
            </View>
          ) : filtrados.length === 0 ? (
            <Text style={styles.noResults}>Sin resultados para "{search}"</Text>
          ) : (
            filtrados.map(a => (
              <AmigoRow
                key={a.id_usuario}
                amigo={a}
                onPerfil={() => abrirPerfil(a)}
                onRetar={() => retar(a)}
                onOpciones={() => opciones(a)}
              />
            ))
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
  headerTitle: { flex: 1, fontSize: 20, fontWeight: 'bold', color: colors.textPrimary },
  solicitudesBtn: { position: 'relative' },
  badge: {
    position: 'absolute', top: -6, right: -8,
    minWidth: 18, height: 18, borderRadius: 9, paddingHorizontal: 4,
    backgroundColor: colors.notification, alignItems: 'center', justifyContent: 'center',
  },
  badgeText: { color: '#FFFFFF', fontSize: 10, fontWeight: 'bold' },

  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  content: { paddingHorizontal: 20, paddingTop: 12 },

  searchBar: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 28,
    paddingHorizontal: 16, paddingVertical: 12, gap: 10, marginBottom: 16,
  },
  searchInput: { flex: 1, fontSize: 15, color: colors.textPrimary },

  avisoCard: {
    flexDirection: 'row', alignItems: 'center', gap: 10,
    backgroundColor: colors.accentLight, borderRadius: 14,
    padding: 14, marginBottom: 16,
  },
  avisoText: { flex: 1, fontSize: 14, fontWeight: '600', color: colors.primary },

  card: {
    flexDirection: 'row', alignItems: 'center',
    backgroundColor: colors.surface, borderRadius: 16,
    padding: 14, gap: 12, marginBottom: 12,
  },
  avatar: { width: 52, height: 52, borderRadius: 26, backgroundColor: '#ccc' },
  info: { flex: 1 },
  name: { fontSize: 15, fontWeight: '700', color: colors.textPrimary, marginBottom: 4 },
  metaRow: { flexDirection: 'row', alignItems: 'center' },
  metaText: { fontSize: 13, color: colors.textSecondary },
  retarBtn: {
    borderWidth: 1.5, borderColor: colors.textPrimary, borderRadius: 20,
    paddingHorizontal: 16, paddingVertical: 7,
  },
  retarText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },

  emptyState: { alignItems: 'center', marginTop: 60, paddingHorizontal: 12, gap: 10 },
  emptyTitle: { fontSize: 18, fontWeight: '700', color: colors.textPrimary },
  emptyText: { fontSize: 14, color: colors.textSecondary, textAlign: 'center', lineHeight: 20, marginBottom: 12 },
  noResults: { textAlign: 'center', color: colors.textSecondary, marginTop: 32, fontSize: 15 },

  accentBtn: {
    backgroundColor: colors.accent, borderRadius: 30,
    paddingVertical: 16, paddingHorizontal: 40, alignItems: 'center',
  },
  accentBtnText: { fontSize: 16, fontWeight: '700', color: colors.primary },
});