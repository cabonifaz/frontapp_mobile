import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TouchableOpacity, Alert, ScrollView, TextInput,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants';
import { authService } from '../../../services/authService';

export function ForgotPasswordScreen({ navigation }) {
  const [correo, setCorreo] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);

  async function handleRecuperar() {
    if (!correo) {
      Alert.alert('Campo requerido', 'Ingresa tu correo electrónico.');
      return;
    }
    try {
      setLoading(true);
      await authService.recuperarContrasena(correo);
      setSent(true);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  if (sent) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successEmoji}>📧</Text>
        <Text style={styles.successTitle}>Correo enviado</Text>
        <Text style={styles.successSubtitle}>
          Revisa tu bandeja de entrada y sigue el enlace para restablecer tu contraseña.
        </Text>
        <TouchableOpacity style={styles.btn} onPress={() => navigation.navigate('Login')}>
          <Text style={styles.btnText}>Volver al inicio</Text>
        </TouchableOpacity>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.back}>
        <Ionicons name="arrow-back" size={24} color="#FFFFFF" />
      </TouchableOpacity>

      <Text style={styles.title}>Recuperar contraseña</Text>
      <Text style={styles.subtitle}>
        Ingresa tu correo y te enviaremos un enlace para restablecer tu contraseña.
      </Text>

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Correo electrónico</Text>
        <TextInput
          style={styles.fieldInput}
          value={correo}
          onChangeText={setCorreo}
          placeholder="correo@ejemplo.com"
          placeholderTextColor="rgba(255,255,255,0.3)"
          keyboardType="email-address"
          autoCapitalize="none"
          autoCorrect={false}
        />
      </View>

      <TouchableOpacity
        style={[styles.btn, loading && { opacity: 0.7 }]}
        onPress={handleRecuperar}
        disabled={loading}
        activeOpacity={0.85}
      >
        <Text style={styles.btnText}>{loading ? 'Enviando...' : 'Enviar enlace'}</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flexGrow: 1,
    backgroundColor: '#0D1C27',
    paddingHorizontal: 28,
    paddingTop: 60,
    paddingBottom: 48,
  },
  back: {
    marginBottom: 40,
  },
  title: {
    fontSize: 28,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 15,
    color: '#FFFFFF',
    marginBottom: 40,
    lineHeight: 22,
  },
  fieldGroup: {
    marginBottom: 36,
  },
  fieldLabel: {
    fontSize: 13,
    color: '#FFFFFF',
    marginBottom: 10,
  },
  fieldInput: {
    fontSize: 16,
    color: '#FFFFFF',
    borderBottomWidth: 1,
    borderBottomColor: '#FFFFFF',
    paddingVertical: 10,
    paddingHorizontal: 2,
  },
  btn: {
    backgroundColor: colors.accent,
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
  successContainer: {
    flex: 1,
    backgroundColor: '#0D1C27',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: 24,
  },
  successTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#FFFFFF',
    marginBottom: 12,
  },
  successSubtitle: {
    fontSize: 15,
    color: '#FFFFFF',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 40,
  },
});
