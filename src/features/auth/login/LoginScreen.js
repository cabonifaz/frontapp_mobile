import React, { useState } from 'react';
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ScrollView, Alert,
  KeyboardAvoidingView, Platform,
} from 'react-native';
import { MaterialCommunityIcons, Ionicons, FontAwesome5 } from '@expo/vector-icons';
import Svg, { Path } from 'react-native-svg';
import { colors } from '../../../constants';
import { authService } from '../../../services/authService';

// NUEVO: Importaciones del SDK de Facebook
import { LoginManager, AccessToken } from 'react-native-fbsdk-next';

function GoogleIcon({ size = 28 }) {
  return (
    <Svg width={size} height={size} viewBox="0 0 24 24">
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </Svg>
  );
}

const BG = '#0D1C27';

function DiagonalBackground() {
  return (
    <View style={[StyleSheet.absoluteFill, { backgroundColor: BG, overflow: 'hidden' }]}>
      <View style={styles.band1} />
      <View style={styles.band2} />
      <View style={styles.band3} />
      <View style={styles.band4} />
    </View>
  );
}

function Field({ label, value, onChangeText, placeholder, secureTextEntry, keyboardType = 'default' }) {
  const [show, setShow] = useState(false);
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.fieldRow}>
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="rgba(255,255,255,0.3)"
          keyboardType={keyboardType}
          secureTextEntry={secureTextEntry && !show}
          autoCapitalize="none"
          autoCorrect={false}
        />
        {secureTextEntry && (
          <TouchableOpacity onPress={() => setShow(!show)} style={{ padding: 4 }}>
            <Ionicons
              name={show ? 'eye-off-outline' : 'eye-outline'}
              size={22}
              color="rgba(255,255,255,0.45)"
            />
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

export function LoginScreen({ navigation }) {
  const [correo, setCorreo] = useState('');
  const [contrasena, setContrasena] = useState('');
  const [loading, setLoading] = useState(false);

  // Login normal (Correo / Contraseña)
  async function handleLogin() {
    if (!correo || !contrasena) {
      Alert.alert('Campos requeridos', 'Ingresa tu correo y contraseña.');
      return;
    }
    try {
      setLoading(true);
      await authService.login(correo, contrasena);
      navigation.replace('MainTabs');
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  // NUEVO: Login Social con Facebook
  async function handleFacebookLogin() {
    try {
      setLoading(true);
      
      // 1. Abrir modal nativo de Facebook
      const result = await LoginManager.logInWithPermissions(['public_profile', 'email']);
      
      if (result.isCancelled) {
        setLoading(false);
        return; // El usuario cerró la ventana de login
      }

      // 2. Extraer el token si fue exitoso
      const data = await AccessToken.getCurrentAccessToken();
      if (!data) {
        throw new Error('No se pudo obtener el token de acceso de Facebook.');
      }

      // 3. Enviar token al Backend (.NET)
      await authService.loginFacebook(data.accessToken);
      
      // 4. Redirigir al inicio si todo salió bien
      navigation.replace('MainTabs');

    } catch (error) {
      Alert.alert('Error de Facebook', error.message || 'No se pudo iniciar sesión.');
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <View style={styles.root}>
      <DiagonalBackground />
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.brand}>
          <MaterialCommunityIcons name="tennis" size={52} color="#FFFFFF" style={{ marginBottom: 12 }} />
          <Text style={styles.brandName}>Avosports</Text>
          <Text style={styles.brandTagline}>
            Encuentra compañeros de juego,{'\n'}desafía a otros jugadores y{'\n'}asciende en el ranking.
          </Text>
        </View>

        <Field
          label="Correo electrónico"
          value={correo}
          onChangeText={setCorreo}
          placeholder="correo@ejemplo.com"
          keyboardType="email-address"
        />
        <Field
          label="Contraseña"
          value={contrasena}
          onChangeText={setContrasena}
          placeholder="Contraseña"
          secureTextEntry
        />

        <TouchableOpacity
          style={[styles.btnPrimary, loading && { opacity: 0.7 }]}
          onPress={handleLogin}
          disabled={loading}
          activeOpacity={0.85}
        >
          <Text style={styles.btnPrimaryText}>
            {loading ? 'Cargando...' : 'Iniciar sesión'}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnOutline}
          onPress={() => navigation.navigate('Register')}
          activeOpacity={0.85}
        >
          <Text style={styles.btnOutlineText}>Registrarme</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.btnDemo}
          onPress={() => navigation.replace('MainTabs')}
          activeOpacity={0.7}
        >
          <Text style={styles.btnDemoText}>Acceder como demo →</Text>
        </TouchableOpacity>

        <Text style={styles.socialLabel}>O continúa con</Text>
        <View style={styles.socialRow}>
          <TouchableOpacity
            style={[styles.socialBox, { backgroundColor: '#FFFFFF' }]}
            activeOpacity={0.8}
            onPress={() => {}}
          >
            <GoogleIcon size={30} />
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.socialBox, { backgroundColor: '#000000' }]}
            activeOpacity={0.8}
            onPress={() => {}}
          >
            <Ionicons name="logo-apple" size={32} color="#FFFFFF" />
          </TouchableOpacity>

          {/* BOTÓN DE FACEBOOK ACTUALIZADO */}
          <TouchableOpacity
            style={[styles.socialBox, { backgroundColor: '#1877F2' }, loading && { opacity: 0.5 }]}
            activeOpacity={0.8}
            onPress={handleFacebookLogin}
            disabled={loading}
          >
            <FontAwesome5 name="facebook-f" size={28} color="#FFFFFF" />
          </TouchableOpacity>
        </View>
      </ScrollView>
      </KeyboardAvoidingView>
    </View>
  );
}

const styles = StyleSheet.create({
  root: { flex: 1, backgroundColor: BG },
  band1: { position: 'absolute', width: 350, height: 1600, backgroundColor: 'rgba(255,255,255,0.045)', transform: [{ rotate: '32deg' }], top: -500, left: -80 },
  band2: { position: 'absolute', width: 350, height: 1600, backgroundColor: 'rgba(255,255,255,0.03)', transform: [{ rotate: '32deg' }], top: -300, left: 230 },
  band3: { position: 'absolute', width: 350, height: 1600, backgroundColor: 'rgba(255,255,255,0.025)', transform: [{ rotate: '32deg' }], top: -100, left: 540 },
  band4: { position: 'absolute', width: 200, height: 1600, backgroundColor: 'rgba(255,255,255,0.02)', transform: [{ rotate: '32deg' }], top: 100, left: 780 },
  container: { flexGrow: 1, paddingHorizontal: 28, paddingTop: 80, paddingBottom: 48 },
  brand: { marginBottom: 44 },
  brandName: { fontSize: 36, fontWeight: 'bold', color: '#FFFFFF', marginBottom: 12 },
  brandTagline: { fontSize: 15, color: '#FFFFFF', lineHeight: 23 },
  fieldGroup: { marginBottom: 28 },
  fieldLabel: { fontSize: 13, color: '#FFFFFF', marginBottom: 10 },
  fieldRow: { flexDirection: 'row', alignItems: 'center', borderBottomWidth: 1, borderBottomColor: '#FFFFFF', paddingBottom: 10 },
  fieldInput: { flex: 1, fontSize: 16, color: '#FFFFFF', paddingVertical: 0 },
  btnPrimary: { backgroundColor: colors.accent, borderRadius: 30, paddingVertical: 18, alignItems: 'center', marginTop: 10, marginBottom: 14 },
  btnPrimaryText: { fontSize: 16, fontWeight: '700', color: colors.primary },
  btnOutline: { borderWidth: 1.5, borderColor: '#FFFFFF', borderRadius: 30, paddingVertical: 18, alignItems: 'center', marginBottom: 36 },
  btnOutlineText: { fontSize: 16, fontWeight: '600', color: '#FFFFFF' },
  btnDemo: { alignItems: 'center', paddingVertical: 12, marginBottom: 16 },
  btnDemoText: { fontSize: 13, color: 'rgba(255,255,255,0.45)' },
  socialLabel: { fontSize: 14, color: '#FFFFFF', marginBottom: 18 },
  socialRow: { flexDirection: 'row', gap: 14 },
  socialBox: { width: 76, height: 76, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
});