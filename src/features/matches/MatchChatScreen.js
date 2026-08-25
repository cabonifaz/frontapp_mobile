import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  FlatList, SafeAreaView, ActivityIndicator, KeyboardAvoidingView, Platform
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../constants';
import { partidoService } from '../../services/partidoService';

export function MatchChatScreen({ navigation, route }) {
  const { partidoId, rivalName } = route.params ?? {};
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);

  const cargarMensajes = async () => {
    if (!partidoId) return;
    try {
      const res = await partidoService.obtenerMensajesChat(partidoId);
      setMensajes(res.data ?? res ?? []);
    } catch (error) {
      console.log('Error al obtener mensajes:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    cargarMensajes();
    const interval = setInterval(cargarMensajes, 4000);
    return () => clearInterval(interval);
  }, [partidoId]);

  const handleEnviar = async () => {
    if (!texto.trim() || enviando) return;
    const msg = texto.trim();
    setTexto('');
    setEnviando(true);
    try {
      await partidoService.enviarMensajeChat(partidoId, msg);
      await cargarMensajes();
    } catch (error) {
      console.log('Error enviando mensaje:', error);
    } finally {
      setEnviando(false);
    }
  };

  return (
    <SafeAreaView style={styles.root}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity style={styles.backBtn} onPress={() => navigation.goBack()}>
          <Ionicons name="arrow-back" size={22} color="#FFFFFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>
          Chat - {rivalName ?? 'Partido'}
        </Text>
        <View style={{ width: 38 }} />
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {loading ? (
          <ActivityIndicator size="large" color={colors.accent} style={styles.loader} />
        ) : (
          <FlatList
            data={mensajes}
            keyExtractor={(item, index) => item.id ?? item._id ?? index.toString()}
            contentContainerStyle={styles.listContent}
            renderItem={({ item }) => (
              <View style={[styles.bubble, item.esMio ? styles.myBubble : styles.otherBubble]}>
                {!item.esMio && <Text style={styles.sender}>{item.nombreUsuario ?? 'Rival'}</Text>}
                <Text style={styles.msgText}>{item.mensaje}</Text>
              </View>
            )}
          />
        )}

        {/* Input Bar */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Escribe un mensaje..."
            placeholderTextColor={colors.textSecondary}
            value={texto}
            onChangeText={setTexto}
          />
          <TouchableOpacity
            style={[styles.sendBtn, !texto.trim() && { opacity: 0.5 }]}
            onPress={handleEnviar}
            disabled={!texto.trim() || enviando}
          >
            <Ionicons name="send" size={18} color={colors.primary ?? '#FFF'} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.background },
  flex: { flex: 1 },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 19,
    backgroundColor: colors.surface,
    alignItems: 'center', justifyContent: 'center',
  },
  headerTitle: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  loader: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  listContent: { padding: 16, gap: 10 },
  bubble: { padding: 12, borderRadius: 14, maxWidth: '80%' },
  myBubble: { backgroundColor: colors.accent, alignSelf: 'flex-end' },
  otherBubble: { backgroundColor: colors.surface, alignSelf: 'flex-start' },
  sender: { fontSize: 10, fontWeight: 'bold', color: colors.textSecondary, marginBottom: 2 },
  msgText: { fontSize: 14, color: colors.textPrimary },
  inputContainer: {
    flexDirection: 'row',
    padding: 12,
    backgroundColor: colors.surface,
    alignItems: 'center',
    gap: 8,
  },
  input: {
    flex: 1,
    backgroundColor: colors.background,
    color: colors.textPrimary,
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    fontSize: 14,
  },
  sendBtn: {
    backgroundColor: colors.accent,
    width: 40, height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
});