// Selector de idioma para la pantalla de Ajustes.
// Uso: <SelectorIdioma />  (no necesita props)
import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants';
import { IDIOMAS, cambiarIdioma } from '../../i18n';

export function SelectorIdioma() {
  const { t, i18n } = useTranslation();

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <Ionicons name="language-outline" size={20} color={colors.textPrimary} />
        <Text style={styles.titulo}>{t('ajustes.idioma')}</Text>
      </View>
      <Text style={styles.descripcion}>{t('ajustes.idiomaDescripcion')}</Text>

      <View style={styles.opciones}>
        {IDIOMAS.map(({ codigo, nombre }) => {
          const activo = i18n.language === codigo;
          return (
            <TouchableOpacity
              key={codigo}
              style={[styles.opcion, activo && styles.opcionActiva]}
              onPress={() => cambiarIdioma(codigo)}
              activeOpacity={0.8}
            >
              <Text style={[styles.opcionTexto, activo && styles.opcionTextoActivo]}>{nombre}</Text>
              {activo && <Ionicons name="checkmark" size={16} color={colors.primary} />}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: { backgroundColor: colors.surface, borderRadius: 14, padding: 16, marginBottom: 16 },
  header: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  titulo: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  descripcion: { fontSize: 13, color: colors.textSecondary, marginTop: 4, marginBottom: 12 },
  opciones: { flexDirection: 'row', gap: 10 },
  opcion: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6,
    paddingVertical: 11, borderRadius: 24, borderWidth: 1, borderColor: colors.border,
    backgroundColor: colors.background,
  },
  opcionActiva: { backgroundColor: colors.accent, borderColor: colors.accent },
  opcionTexto: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  opcionTextoActivo: { color: colors.primary, fontWeight: '800' },
});