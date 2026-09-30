import React, { useState, useEffect } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity,
  TextInput, Image, SafeAreaView, KeyboardAvoidingView,
  Platform, Alert, ImageBackground, ActivityIndicator,
} from 'react-native';
import * as ImagePicker from 'expo-image-picker';
import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { colors } from '../../constants';
import { PROFILE_MOCK } from '../../data/profileData';
import { PrimaryButton } from '../../components/common';
import { CircularCropModal } from '../../components/CircularCropModal';
import { usuarioService } from '../../services/usuarioService';
import { uploadImage } from '../../services/cloudinaryService';

// "label" se mantiene en español: se usa para reconocer el deporte guardado en el perfil.
// El texto visible sale de las traducciones (deportes.<id>).
const DEPORTES = [
  { id: 'tenis',      label: 'Tenis',         uri: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=400&q=80' },
  { id: 'squash',     label: 'Squash',        uri: 'https://images.unsplash.com/photo-1740813402046-08ec3e0ce5d2?w=400&q=80' },
  { id: 'tenis_mesa', label: 'Tenis de mesa', uri: 'https://images.unsplash.com/photo-1611251135345-18c56206b863?w=400&q=80' },
  { id: 'padel',      label: 'Padel',         uri: 'https://images.unsplash.com/photo-1646649853703-7645147474ba?w=400&q=80' },
];

const DIAS  = Array.from({ length: 31 }, (_, i) => String(i + 1));
const currentYear = new Date().getFullYear();
const AÑOS  = Array.from({ length: 80 }, (_, i) => String(currentYear - 13 - i));

// ─── Underline field ──────────────────────────────────────────────────────────
function UnderlineField({ label, value, onChangeText, placeholder, keyboardType = 'default', multiline }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      {multiline ? (
        <TextInput
          style={styles.logrosInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          multiline
          textAlignVertical="top"
        />
      ) : (
        <TextInput
          style={styles.fieldInput}
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={colors.textSecondary}
          keyboardType={keyboardType}
        />
      )}
    </View>
  );
}

// ─── Dropdown field ───────────────────────────────────────────────────────────
function DropdownField({ label, value, options, onSelect, flex }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={[styles.fieldGroup, { flex, overflow: 'visible' }, open && { zIndex: 100 }]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity style={styles.dropdownTrigger} onPress={() => setOpen(!open)} activeOpacity={0.7}>
        <Text style={[styles.dropdownValue, !value && { color: colors.textSecondary }]}>
          {value || label}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdownList}>
          <ScrollView nestedScrollEnabled style={{ maxHeight: 180 }}>
            {options.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.dropdownItem}
                onPress={() => { onSelect(opt); setOpen(false); }}
                activeOpacity={0.7}
              >
                <Text style={[styles.dropdownItemText, value === opt && { color: colors.accent, fontWeight: '600' }]}>
                  {opt}
                </Text>
                {value === opt && <Ionicons name="checkmark" size={16} color={colors.accent} />}
              </TouchableOpacity>
            ))}
          </ScrollView>
        </View>
      )}
    </View>
  );
}

// ─── Sport card ───────────────────────────────────────────────────────────────
function SportGrid({ selected, onSelect }) {
  const { t } = useTranslation();
  return (
    <View style={styles.sportGrid}>
      {DEPORTES.map((d) => (
        <TouchableOpacity
          key={d.id}
          style={[styles.sportCard, selected === d.id && styles.sportCardSelected]}
          onPress={() => onSelect(d.id)}
          activeOpacity={0.8}
        >
          <ImageBackground source={{ uri: d.uri }} style={styles.sportCardImage} imageStyle={{ borderRadius: 13 }}>
            <View style={styles.sportOverlay} />
            {selected === d.id && (
              <View style={styles.sportCheck}>
                <Text style={{ color: colors.white, fontWeight: 'bold' }}>✓</Text>
              </View>
            )}
            <Text style={styles.sportLabel}>{t(`deportes.${d.id}`, { defaultValue: d.label })}</Text>
          </ImageBackground>
        </TouchableOpacity>
      ))}
    </View>
  );
}

// ─── Pantalla principal ────────────────────────────────────────────────────────
export function EditProfileScreen({ navigation, route }) {
  const { t } = useTranslation();   // NUEVO: idiomas
  const MESES = t('fechas.meses', { returnObjects: true });
  const initial = route.params?.profile ?? PROFILE_MOCK;
  const parts = (initial.nombre ?? '').split(' ');

  const [nombre,    setNombre]    = useState(parts[0] ?? '');
  const [apellidos, setApellidos] = useState(parts.slice(1).join(' '));
  const [telefono,  setTelefono]  = useState(initial.telefono ?? '');
  const [sobreMi,   setSobreMi]   = useState(initial.sobreMi ?? '');
  const [deporte,   setDeporte]   = useState(
    DEPORTES.find(d => d.label.toLowerCase() === initial.deporte?.toLowerCase())?.id ?? ''
  );

  const [dia,  setDia]  = useState('');
  const [mes,  setMes]  = useState('');
  const [año,  setAño]  = useState('');

  const [avatarUri,   setAvatarUri]   = useState(initial.avatar ?? null);
  const [rawUri,      setRawUri]      = useState(null);
  const [cropParams,  setCropParams]  = useState(null);
  const [saving,      setSaving]      = useState(false);

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== 'granted') {
      Alert.alert(t('registro.permisoTitulo'), t('editarPerfil.permisoMensaje'));
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: false,
      quality: 1,
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setRawUri(result.assets[0].uri);
    }
  }

  async function handleGuardar() {
    setSaving(true);
    try {
      const isNewPhoto = avatarUri && !avatarUri.startsWith('http');
      if (isNewPhoto) {
        const url = await uploadImage(avatarUri, cropParams);
        await usuarioService.actualizarFoto(url);
        setAvatarUri(url);
      }
      Alert.alert(t('editarPerfil.actualizado'), t('editarPerfil.actualizadoMensaje'), [
        { text: t('editarPerfil.ok'), onPress: () => navigation.goBack() },
      ]);
    } catch {
      Alert.alert(t('comun.error'), t('editarPerfil.errorFoto'));
    } finally {
      setSaving(false);
    }
  }

  return (
    <SafeAreaView style={styles.safe}>
      <CircularCropModal
        visible={!!rawUri}
        imageUri={rawUri}
        onCancel={() => setRawUri(null)}
        onCrop={(uri, params) => { setAvatarUri(uri); setCropParams(params); setRawUri(null); }}
      />
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>

        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => navigation.goBack()}
            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
          >
            <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>{t('editarPerfil.titulo')}</Text>
          <View style={{ width: 24 }} />
        </View>

        <ScrollView
          style={{ flex: 1 }}
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* Avatar */}
          <View style={styles.avatarSection}>
            <View style={styles.avatarWrap}>
              <View style={[styles.avatar, { overflow: 'hidden' }]}>
                {avatarUri && (() => {
                  const PREVIEW = 100;
                  const cp = cropParams;
                  if (cp?.naturalW) {
                    const s = PREVIEW / cp.w;
                    return (
                      <Image
                        source={{ uri: avatarUri }}
                        style={{
                          position: 'absolute',
                          width: cp.naturalW * s,
                          height: cp.naturalH * s,
                          left: -cp.x * s,
                          top: -cp.y * s,
                        }}
                      />
                    );
                  }
                  return <Image source={{ uri: avatarUri }} style={styles.avatar} />;
                })()}
              </View>
              <TouchableOpacity style={styles.cameraBtn} onPress={pickImage}>
                <Ionicons name="camera" size={18} color={colors.primary} />
              </TouchableOpacity>
            </View>
            <Text style={styles.cambiarFotoText}>{t('editarPerfil.cambiarFoto')}</Text>
          </View>

          {/* Información personal */}
          <Text style={styles.sectionTitle}>{t('editarPerfil.infoPersonal')}</Text>

          <UnderlineField label={t('editarPerfil.nombre')}    value={nombre}    onChangeText={setNombre}    placeholder="Juan Pablo" />
          <UnderlineField label={t('editarPerfil.apellidos')} value={apellidos} onChangeText={setApellidos} placeholder="Varillas" />
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>{t('editarPerfil.celular')}</Text>
            <View style={[styles.halfRow, { gap: 8 }]}>
              <View style={{ width: 80 }}>
                <View style={styles.dropdownTrigger}>
                  <Text style={styles.dropdownValue}>PE</Text>
                  <Ionicons name="chevron-down" size={18} color={colors.textSecondary} />
                </View>
              </View>
              <View style={{ flex: 1 }}>
                <TextInput
                  style={styles.fieldInput}
                  value={telefono}
                  onChangeText={setTelefono}
                  placeholder="967753444"
                  placeholderTextColor={colors.textSecondary}
                  keyboardType="phone-pad"
                />
              </View>
            </View>
          </View>

          {/* Fecha de nacimiento */}
          <Text style={styles.fieldLabel}>{t('editarPerfil.fechaNacimiento')}</Text>
          <View style={[styles.halfRow, { gap: 12, marginBottom: 16 }]}>
            <DropdownField label={t('editarPerfil.dia')}  value={dia}  options={DIAS}   onSelect={setDia}  flex={1} />
            <DropdownField label={t('editarPerfil.mes')}  value={mes}  options={Array.isArray(MESES) ? MESES : []}  onSelect={setMes}  flex={2} />
            <DropdownField label={t('editarPerfil.anio')} value={año}  options={AÑOS}   onSelect={setAño}  flex={1.5} />
          </View>

          {/* Deporte favorito */}
          <Text style={styles.sectionTitle}>{t('editarPerfil.deporteFavorito')}</Text>
          <Text style={[styles.fieldLabel, { color: colors.textSecondary, marginBottom: 0 }]}>
            {t('editarPerfil.masDeportes')}
          </Text>
          <SportGrid selected={deporte} onSelect={setDeporte} />

          {/* Sobre mí */}
          <Text style={styles.sectionTitle}>{t('editarPerfil.sobreMi')}</Text>
          <UnderlineField
            label={t('editarPerfil.cuentanos')}
            value={sobreMi}
            onChangeText={setSobreMi}
            placeholder={t('editarPerfil.escribeAlgo')}
            multiline
          />

          <View style={{ marginTop: 12 }}>
            <PrimaryButton title={t('editarPerfil.guardar')} onPress={handleGuardar} disabled={saving} loading={saving} />
          </View>

          <View style={{ height: 40 }} />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: Platform.OS === 'android' ? 32 : 0,
  },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingTop: 8,
    paddingBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  content: {
    paddingHorizontal: 24,
    paddingBottom: 24,
  },

  // Avatar
  avatarSection: {
    alignItems: 'center',
    marginBottom: 28,
  },
  avatarWrap: {
    position: 'relative',
    marginBottom: 10,
  },
  avatar: {
    width: 100,
    height: 100,
    borderRadius: 50,
    backgroundColor: '#ccc',
  },
  cameraBtn: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: colors.background,
  },
  cambiarFotoText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.accent,
  },

  // Section title
  sectionTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
    marginTop: 8,
  },

  // Underline input
  fieldGroup: {
    marginBottom: 16,
  },
  fieldLabel: {
    fontSize: 13,
    color: colors.textPrimary,
    marginBottom: 8,
  },
  fieldInput: {
    fontSize: 15,
    color: colors.textPrimary,
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1C',
    paddingVertical: 10,
    paddingHorizontal: 2,
  },
  logrosInput: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 14,
    minHeight: 110,
    fontSize: 15,
    color: colors.textPrimary,
    marginTop: 4,
  },

  // Dropdown
  halfRow: {
    flexDirection: 'row',
    overflow: 'visible',
  },
  dropdownTrigger: {
    flexDirection: 'row',
    alignItems: 'center',
    borderBottomWidth: 1,
    borderBottomColor: '#1C1C1C',
    paddingVertical: 10,
    paddingHorizontal: 2,
  },
  dropdownValue: {
    flex: 1,
    fontSize: 15,
    color: colors.textPrimary,
  },
  dropdownList: {
    position: 'absolute',
    top: 58,
    left: 0,
    right: 0,
    backgroundColor: colors.background,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.border,
    zIndex: 1000,
    elevation: 10,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.12,
    shadowRadius: 8,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 13,
    paddingHorizontal: 14,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  dropdownItemText: {
    fontSize: 15,
    color: colors.textPrimary,
  },

  // Sport grid
  sportGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 12,
    marginTop: 16,
    marginBottom: 24,
  },
  sportCard: {
    width: '47.5%',
    height: 140,
    borderRadius: 16,
    overflow: 'hidden',
  },
  sportCardSelected: {
    borderWidth: 3,
    borderColor: colors.accent,
  },
  sportCardImage: {
    flex: 1,
    justifyContent: 'flex-end',
    padding: 14,
  },
  sportOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: 'rgba(0,0,0,0.38)',
    borderRadius: 13,
  },
  sportCheck: {
    position: 'absolute',
    top: 10,
    right: 10,
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sportLabel: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.white,
  },
});