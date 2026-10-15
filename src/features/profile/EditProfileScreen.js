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
import { MANOS_DOMINANTES } from '../../constants/maestro';   // NUEVO (036)
import { getAvatarSource } from '../../utils/avatars';

const DIAS  = Array.from({ length: 31 }, (_, i) => String(i + 1));
const currentYear = new Date().getFullYear();
const AÑOS  = Array.from({ length: 83 }, (_, i) => String(currentYear - 18 - i));   // mínimo 18 años

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

// NUEVO (036): selector de mano dominante (Diestro / Zurdo / Ambidiestro)
function ManoDominanteSelector({ selected, onSelect }) {
  const { t } = useTranslation();
  return (
    <View style={styles.manoRow}>
      {MANOS_DOMINANTES.map((codigo) => (
        <TouchableOpacity
          key={codigo}
          style={[styles.manoChip, selected === codigo && styles.manoChipSel]}
          onPress={() => onSelect(codigo)}
          activeOpacity={0.8}
        >
          <Text style={[styles.manoChipText, selected === codigo && styles.manoChipTextSel]}>
            {t(`mano.${codigo}`)}
          </Text>
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
  // NUEVO: fecha guardada 'AAAA-MM-DD' -> día / mes / año de los selectores
  const [fy, fm, fd] = (initial.fechaNacimiento ?? '').split('-');

  const [nombre,    setNombre]    = useState(initial.nombrePila ?? parts[0] ?? '');
  const [apellidos, setApellidos] = useState(initial.apellidos ?? parts.slice(1).join(' '));
  const [telefono,  setTelefono]  = useState(initial.telefono ?? '');
  const [sobreMi,   setSobreMi]   = useState(initial.sobreMi ?? '');

  const [dia,  setDia]  = useState(fd ? String(Number(fd)) : '');
  const [mes,  setMes]  = useState(fm && Array.isArray(MESES) ? (MESES[Number(fm) - 1] ?? '') : '');
  const [año,  setAño]  = useState(fy ?? '');

  const [avatarUri,   setAvatarUri]   = useState(initial.avatar ?? null);
  const [rawUri,      setRawUri]      = useState(null);
  const [cropParams,  setCropParams]  = useState(null);
  const [fotoCambiada, setFotoCambiada] = useState(false);   // CORREGIDO: solo se sube si eligió una foto nueva
  const [saving,      setSaving]      = useState(false);
  const [mano,        setMano]        = useState(initial.manoDominante ?? null);   // NUEVO (036)

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
    // NUEVO: validaciones antes de enviar
    if (!nombre.trim() || !apellidos.trim()) {
      Alert.alert(t('comun.error'), t('editarPerfil.errorNombre'));
      return;
    }
    const algunaFecha = dia || mes || año;
    const fechaCompleta = dia && mes && año;
    if (algunaFecha && !fechaCompleta) {
      Alert.alert(t('comun.error'), t('editarPerfil.errorFechaIncompleta'));
      return;
    }
    let fechaNacimiento = null;
    if (fechaCompleta) {
      const m = (Array.isArray(MESES) ? MESES.indexOf(mes) : -1) + 1;
      const fecha = new Date(Number(año), m - 1, Number(dia));
      if (m < 1 || fecha.getMonth() !== m - 1) {   // ej. 31 de febrero
        Alert.alert(t('comun.error'), t('editarPerfil.errorFechaInvalida'));
        return;
      }
      fechaNacimiento = `${año}-${String(m).padStart(2, '0')}-${String(dia).padStart(2, '0')}`;
    }

    setSaving(true);
    try {
      // NUEVO: nombre, apellidos, celular, fecha de nacimiento y sobre mí
      await usuarioService.actualizarPerfil({ nombre, apellidos, telefono, fechaNacimiento, sobreMi });

      // CORREGIDO: antes un avatar de la app ('avatar_masculino_2') se tomaba como foto nueva
      // y fallaba al subirlo; ahora solo se sube si el usuario eligió una foto.
      const isNewPhoto = fotoCambiada && avatarUri;
      if (isNewPhoto) {
        const url = await uploadImage(avatarUri, cropParams);
        await usuarioService.actualizarFoto(url);
        setAvatarUri(url);
      }
      // NUEVO (036): mano dominante
      if (mano && mano !== (initial.manoDominante ?? null)) {
        await usuarioService.actualizarManoDominante(mano);
      }
      Alert.alert(t('editarPerfil.actualizado'), t('editarPerfil.actualizadoMensaje'), [
        { text: t('editarPerfil.ok'), onPress: () => navigation.goBack() },
      ]);
    } catch (e) {
      Alert.alert(t('comun.error'), e?.message || t('editarPerfil.errorGuardar'));
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
        onCrop={(uri, params) => { setAvatarUri(uri); setCropParams(params); setRawUri(null); setFotoCambiada(true); }}
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
                  return <Image source={fotoCambiada ? { uri: avatarUri } : getAvatarSource(avatarUri)} style={styles.avatar} />;
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

          {/* NUEVO (036): Mano dominante */}
          <Text style={styles.sectionTitle}>{t('mano.titulo')}</Text>
          <ManoDominanteSelector selected={mano} onSelect={setMano} />

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

  // NUEVO (036): mano dominante
  manoRow: { flexDirection: 'row', gap: 10, marginBottom: 20, marginTop: 4 },
  manoChip: {
    flex: 1, alignItems: 'center', paddingVertical: 12, borderRadius: 24,
    borderWidth: 1.5, borderColor: colors.border, backgroundColor: colors.background,
  },
  manoChipSel: { backgroundColor: colors.accent, borderColor: colors.accent },
  manoChipText: { fontSize: 14, fontWeight: '600', color: colors.textPrimary },
  manoChipTextSel: { color: colors.primary, fontWeight: '700' },

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