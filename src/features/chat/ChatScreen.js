import React, { useState, useEffect, useRef } from 'react';
import {
  View, Text, StyleSheet, FlatList, TextInput, TouchableOpacity,
  SafeAreaView, Image, KeyboardAvoidingView, Platform, ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../../constants';
import { chatService } from '../../services/chatService';

function formatTime(dateStr) {
  if (!dateStr) return '';
  const d = new Date(dateStr);
  return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
}

function Bubble({ msg, rivalAvatar }) {
  const isMine = msg.es_mio;
  return (
    <View style={[styles.bubbleRow, isMine ? styles.bubbleRowMine : styles.bubbleRowRival]}>
      {!isMine && (
        <Image
          source={{ uri: rivalAvatar ?? msg.foto_perfil_url ?? 'https://i.pravatar.cc/150?img=17' }}
          style={styles.bubbleAvatar}
        />
      )}
      <View style={[styles.bubble, isMine ? styles.bubbleMine : styles.bubbleRival]}>
        <Text style={[styles.bubbleText, isMine ? styles.bubbleTextMine : styles.bubbleTextRival]}>
          {msg.mensaje}
        </Text>
        <Text style={[styles.bubbleTime, isMine ? styles.bubbleTimeMine : styles.bubbleTimeRival]}>
          {formatTime(msg.fecha_envio)}
        </Text>
      </View>
    </View>
  );
}

export function ChatScreen({ navigation, route }) {
  const { idPartido, rival } = route.params ?? {};
  const [mensajes, setMensajes] = useState([]);
  const [texto, setTexto] = useState('');
  const [loading, setLoading] = useState(true);
  const [enviando, setEnviando] = useState(false);
  const flatRef = useRef(null);
  const intervalRef = useRef(null);
  const insets = useSafeAreaInsets();

  async function cargar(silent = false) {
    try {
      if (!silent) setLoading(true);
      const res = await chatService.listar(idPartido);
      if (Array.isArray(res)) setMensajes(res);
    } catch {
      // poll silently
    } finally {
      if (!silent) setLoading(false);
    }
  }

  useEffect(() => {
    cargar();
    intervalRef.current = setInterval(() => cargar(true), 5000);
    return () => clearInterval(intervalRef.current);
  }, []);

  useEffect(() => {
    if (mensajes.length > 0) {
      setTimeout(() => flatRef.current?.scrollToEnd({ animated: false }), 100);
    }
  }, [mensajes]);

  async function handleEnviar() {
    const trimmed = texto.trim();
    if (!trimmed || !idPartido || enviando) return;
    setTexto('');
    try {
      setEnviando(true);
      await chatService.enviar(idPartido, trimmed);
      await cargar(true);
    } catch {
      setTexto(trimmed);
    } finally {
      setEnviando(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => navigation.goBack()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        {rival?.avatar ? (
          <Image source={{ uri: rival.avatar }} style={styles.headerAvatar} />
        ) : (
          <View style={[styles.headerAvatar, styles.headerAvatarPlaceholder]}>
            <Ionicons name="person" size={20} color={colors.textSecondary} />
          </View>
        )}
        <View style={{ flex: 1 }}>
          <Text style={styles.headerName} numberOfLines={1}>{rival?.name ?? 'Chat'}</Text>
          <Text style={styles.headerSub}>Partido programado</Text>
        </View>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 0 : 20}
      >
        {loading ? (
          <View style={styles.loadingWrap}>
            <ActivityIndicator size="large" color={colors.accent} />
          </View>
        ) : (
          <FlatList
            ref={flatRef}
            data={mensajes}
            keyExtractor={(m, i) => String(m.id_mensaje ?? m.id ?? i)}
            renderItem={({ item }) => <Bubble msg={item} rivalAvatar={rival?.avatar} />}
            contentContainerStyle={[
              styles.listContent,
              mensajes.length === 0 && styles.listContentEmpty,
            ]}
            ListEmptyComponent={
              <View style={styles.emptyWrap}>
                <Ionicons name="chatbubbles-outline" size={52} color={colors.textSecondary} />
                <Text style={styles.emptyText}>Sé el primero en escribir</Text>
                <Text style={styles.emptySubtext}>
                  Coordina los detalles del partido con tu rival
                </Text>
              </View>
            }
            onContentSizeChange={() => flatRef.current?.scrollToEnd({ animated: false })}
          />
        )}

        <View style={[styles.inputRow, { paddingBottom: Math.max(insets.bottom, 12) }]}>
          <TextInput
            style={styles.input}
            placeholder="Escribe un mensaje..."
            placeholderTextColor="#9E9E9E"
            value={texto}
            onChangeText={setTexto}
            multiline
            maxLength={500}
          />
          <TouchableOpacity
            style={[styles.sendBtn, (!texto.trim() || enviando) && styles.sendBtnDisabled]}
            onPress={handleEnviar}
            disabled={!texto.trim() || enviando}
          >
            {enviando
              ? <ActivityIndicator size="small" color={colors.primary} />
              : <Ionicons name="send" size={20} color={colors.primary} />
            }
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
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
    paddingBottom: 14,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: colors.border,
  },
  headerAvatar: { width: 42, height: 42, borderRadius: 21, backgroundColor: '#ccc' },
  headerAvatarPlaceholder: {
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerName: { fontSize: 16, fontWeight: '700', color: colors.textPrimary },
  headerSub: { fontSize: 12, color: colors.textSecondary, marginTop: 1 },

  loadingWrap: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  listContent: { paddingHorizontal: 16, paddingTop: 12, paddingBottom: 8 },
  listContentEmpty: { flex: 1 },

  emptyWrap: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 10,
    paddingHorizontal: 32,
  },
  emptyText: { fontSize: 16, fontWeight: '600', color: colors.textPrimary, textAlign: 'center' },
  emptySubtext: { fontSize: 13, color: colors.textSecondary, textAlign: 'center', lineHeight: 19 },

  bubbleRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    marginBottom: 10,
    gap: 8,
  },
  bubbleRowMine: { justifyContent: 'flex-end' },
  bubbleRowRival: { justifyContent: 'flex-start' },

  bubbleAvatar: { width: 30, height: 30, borderRadius: 15, backgroundColor: '#ccc' },

  bubble: { maxWidth: '72%', borderRadius: 18, paddingHorizontal: 14, paddingVertical: 10 },
  bubbleMine: { backgroundColor: colors.dark, borderBottomRightRadius: 4 },
  bubbleRival: { backgroundColor: colors.surface, borderBottomLeftRadius: 4 },

  bubbleText: { fontSize: 15, lineHeight: 21 },
  bubbleTextMine: { color: '#FFFFFF' },
  bubbleTextRival: { color: colors.textPrimary },

  bubbleTime: { fontSize: 10, marginTop: 4, alignSelf: 'flex-end' },
  bubbleTimeMine: { color: 'rgba(255,255,255,0.55)' },
  bubbleTimeRival: { color: colors.textSecondary },

  inputRow: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    paddingHorizontal: 16,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 10,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 24,
    paddingHorizontal: 16,
    paddingVertical: 10,
    fontSize: 15,
    color: colors.textPrimary,
    maxHeight: 100,
  },
  sendBtn: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendBtnDisabled: { opacity: 0.35 },
});