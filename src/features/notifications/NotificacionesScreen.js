// NUEVO (APP-AVO-041 / 042): bandeja de notificaciones dentro de la app
import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity, SafeAreaView,
  ActivityIndicator, Image, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants';
import { notificacionService } from '../../services/notificacionService';
import { getAvatarSource } from '../../utils/avatars';
import { actualizarBadge } from '../../utils/pushNotifications';

// Ícono por tipo (los tipos vienen del backend y no se traducen; solo su texto)
const ICONO = {
  RESULTADO_POR_CONFIRMAR: 'alert-circle',
  RESULTADO_CONFIRMADO:    'checkmark-circle',
  RESULTADO_AMIGO:         'trophy',
  NUEVO_SEGUIDOR:          'eye',
  // NUEVO (07)
  RETO_RECIBIDO:           'flash',
  RETO_DIRECTO:            'flash',
  RETO_ACEPTADO:           'calendar',
  PARTIDO_AMIGO:           'calendar',
  PARTIDO_EN_VIVO:         'radio',
  INSCRIPCION_ACTIVA:      'checkmark-done',
  INSCRIPCION_RECHAZADA:   'close-circle',
};

function tiempoRelativo(fecha, t) {
  if (!fecha) return '';
  const d = new Date(String(fecha).replace(' ', 'T'));
  const min = Math.max(0, Math.floor((Date.now() - d.getTime()) / 60000));
  if (min < 1) return t('notif.tiempo.ahora');
  if (min < 60) return t('notif.tiempo.minutos', { n: min });
  const h = Math.floor(min / 60);
  if (h < 24) return t('notif.tiempo.horas', { n: h });
  return t('notif.tiempo.dias', { n: Math.floor(h / 24) });
}

function FilaNotificacion({ item, onPress }) {
  const { t } = useTranslation();
  const noLeida = Number(item.leida ?? 0) === 0;
  const nombre = item.actor_nombre ? String(item.actor_nombre).split(' ')[0] : null;
  const texto = nombre
    ? t(`notif.tipos.${item.tipo}`, { nombre, defaultValue: t('notif.generica') })
    : t(`notif.tiposSinNombre.${item.tipo}`, { defaultValue: t('notif.generica') });

  return (
    <TouchableOpacity style={[styles.fila, noLeida && styles.filaNoLeida]} onPress={() => onPress(item)} activeOpacity={0.75}>
      <View>
        <Image source={getAvatarSource(item.actor_foto)} style={styles.avatar} />
        <View style={styles.iconoTipo}>
          <Ionicons name={ICONO[item.tipo] ?? 'notifications'} size={14} color={colors.primary} />
        </View>
      </View>
      <View style={{ flex: 1 }}>
        <Text style={[styles.texto, noLeida && styles.textoNoLeido]}>{texto}</Text>
        <Text style={styles.tiempo}>{tiempoRelativo(item.fecha_creacion, t)}</Text>
      </View>
      {noLeida && <View style={styles.punto} />}
    </TouchableOpacity>
  );
}

export function NotificacionesScreen({ navigation }) {
  const { t } = useTranslation();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const cargar = useCallback(async () => {
    try {
      const res = await notificacionService.listar(50);
      setItems(Array.isArray(res) ? res : []);
    } catch {
      setItems([]);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useFocusEffect(useCallback(() => { cargar(); }, [cargar]));

  const hayNoLeidas = items.some(i => Number(i.leida ?? 0) === 0);

  async function marcarTodas() {
    setItems(prev => prev.map(i => ({ ...i, leida: 1 })));
    actualizarBadge(0);
    await notificacionService.marcarLeidas().catch(() => {});
  }

  async function abrir(item) {
    if (Number(item.leida ?? 0) === 0) {
      setItems(prev => prev.map(i => (i.id_notificacion === item.id_notificacion ? { ...i, leida: 1 } : i)));
      notificacionService.marcarLeidas(item.id_notificacion).catch(() => {});
    }

    switch (item.tipo) {
      case 'RESULTADO_POR_CONFIRMAR':
        // Se confirma desde el partido, en la pestaña Partidos
        navigation.navigate('MainTabs', { screen: 'Partidos' });
        break;
      case 'RESULTADO_CONFIRMADO':
      case 'RESULTADO_AMIGO':
        if (item.id_partido) navigation.navigate('DetalleResultado', { match: { id_partido: item.id_partido } });
        break;
      // NUEVO (07): retos → Mis solicitudes (si siguen pendientes) o el partido
      case 'RETO_RECIBIDO':
      case 'RETO_DIRECTO':
        if (['ESTADO_BUSCANDO', 'ESTADO_PENDIENTE'].includes(item.estado_partido_codigo)) {
          navigation.navigate('MisSolicitudes');
        } else if (item.id_partido) {
          navigation.navigate('DetallePartido', { partido: { id_partido: item.id_partido } });
        }
        break;
      case 'RETO_ACEPTADO':
        if (item.id_partido) navigation.navigate('DetallePartido', { partido: { id_partido: item.id_partido } });
        break;
      case 'PARTIDO_AMIGO':
      case 'PARTIDO_EN_VIVO':
        if (item.id_partido) navigation.navigate('PartidoEnVivo', { idPartido: item.id_partido });
        break;
      case 'INSCRIPCION_ACTIVA':
      case 'INSCRIPCION_RECHAZADA':
        navigation.navigate('MainTabs', { screen: 'Ranking' });
        break;
      case 'NUEVO_SEGUIDOR':
        if (item.id_actor) {
          navigation.navigate('PlayerProfile', {
            player: { id_usuario: item.id_actor, nombre: item.actor_nombre, avatar: item.actor_foto },
          });
        }
        break;
      default:
        break;
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{t('notif.titulo')}</Text>
        {hayNoLeidas ? (
          <TouchableOpacity onPress={marcarTodas} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
            <Ionicons name="checkmark-done" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
        ) : <View style={{ width: 24 }} />}
      </View>

      {loading ? (
        <ActivityIndicator size="large" color={colors.accent} style={{ marginTop: 40 }} />
      ) : (
        <FlatList
          data={items}
          keyExtractor={(i) => String(i.id_notificacion)}
          renderItem={({ item }) => <FilaNotificacion item={item} onPress={abrir} />}
          contentContainerStyle={items.length === 0 ? { flex: 1 } : { paddingBottom: 32 }}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={() => { setRefreshing(true); cargar(); }} tintColor={colors.accent} />
          }
          ListEmptyComponent={
            <View style={styles.vacio}>
              <Ionicons name="notifications-off-outline" size={48} color={colors.textSecondary} />
              <Text style={styles.vacioText}>{t('notif.vacio')}</Text>
            </View>
          }
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between',
    paddingHorizontal: 20, paddingTop: 16, paddingBottom: 12,
  },
  headerTitle: { fontSize: 18, fontWeight: 'bold', color: colors.textPrimary },

  fila: {
    flexDirection: 'row', alignItems: 'center', gap: 12,
    paddingHorizontal: 20, paddingVertical: 14,
    borderBottomWidth: 1, borderBottomColor: colors.border,
  },
  filaNoLeida: { backgroundColor: colors.surface },
  avatar: { width: 46, height: 46, borderRadius: 23, backgroundColor: '#ccc' },
  iconoTipo: {
    position: 'absolute', right: -4, bottom: -4,
    width: 22, height: 22, borderRadius: 11,
    backgroundColor: colors.accent, alignItems: 'center', justifyContent: 'center',
    borderWidth: 2, borderColor: colors.background,
  },
  texto: { fontSize: 14, color: colors.textPrimary, lineHeight: 20 },
  textoNoLeido: { fontWeight: '700' },
  tiempo: { fontSize: 12, color: colors.textSecondary, marginTop: 3 },
  punto: { width: 10, height: 10, borderRadius: 5, backgroundColor: colors.accent },

  vacio: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: 12 },
  vacioText: { fontSize: 15, color: colors.textSecondary },
});
