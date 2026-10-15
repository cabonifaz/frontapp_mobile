// NUEVO: muestra una foto del encuentro a pantalla completa
import React from 'react';
import { Modal, View, Image, TouchableOpacity, StyleSheet, StatusBar } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export function VisorFoto({ url, onClose }) {
  return (
    <Modal visible={!!url} transparent animationType="fade" onRequestClose={onClose}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      <View style={styles.fondo}>
        {url ? <Image source={{ uri: url }} style={styles.foto} resizeMode="contain" /> : null}
        <TouchableOpacity style={styles.cerrar} onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
          <Ionicons name="close" size={28} color="#FFFFFF" />
        </TouchableOpacity>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  fondo: { flex: 1, backgroundColor: '#000', alignItems: 'center', justifyContent: 'center' },
  foto: { width: '100%', height: '100%' },
  cerrar: {
    position: 'absolute', top: 48, right: 20,
    width: 44, height: 44, borderRadius: 22,
    backgroundColor: 'rgba(255,255,255,0.15)', alignItems: 'center', justifyContent: 'center',
  },
});
