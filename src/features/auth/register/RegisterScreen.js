import React, { useState } from 'react';
import {
  View, Text, StyleSheet, ScrollView, TouchableOpacity, Alert, TextInput,
  Modal, KeyboardAvoidingView, Platform, ImageBackground,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { colors } from '../../../constants';
import { PrimaryButton } from '../../../components/common';
import { authService } from '../../../services/authService';

// --- Shared sub-components ---

function Stepper({ step }) {
  return (
    <View style={styles.stepper}>
      {[1, 2, 3, 4].map((s) => (
        <View key={s} style={[styles.stepBar, step >= s && styles.stepBarActive]} />
      ))}
    </View>
  );
}

function UnderlineField({ label, value, onChangeText, placeholder, keyboardType = 'default', secureTextEntry, autoCapitalize = 'sentences' }) {
  return (
    <View style={styles.fieldGroup}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TextInput
        style={styles.fieldInput}
        value={value}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.textSecondary}
        keyboardType={keyboardType}
        secureTextEntry={secureTextEntry}
        autoCapitalize={autoCapitalize}
      />
    </View>
  );
}

function DropdownField({ label, value, options, onSelect }) {
  const [open, setOpen] = useState(false);
  return (
    <View style={[styles.fieldGroup, open && { zIndex: 100 }]}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <TouchableOpacity
        style={styles.dropdownTrigger}
        onPress={() => setOpen(!open)}
        activeOpacity={0.7}
      >
        <Text style={[styles.dropdownValue, !value && { color: colors.textSecondary }]}>
          {value || label}
        </Text>
        <Ionicons name={open ? 'chevron-up' : 'chevron-down'} size={18} color={colors.textSecondary} />
      </TouchableOpacity>
      {open && (
        <View style={styles.dropdownList}>
          <ScrollView nestedScrollEnabled style={{ maxHeight: 200 }}>
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

function RadioGroup({ question, options, selected, onSelect }) {
  return (
    <View style={styles.radioGroup}>
      <Text style={styles.radioQuestion}>{question}</Text>
      {options.map((opt) => (
        <TouchableOpacity
          key={opt}
          style={[styles.radioRow, selected === opt && styles.radioRowSelected]}
          onPress={() => onSelect(opt)}
          activeOpacity={0.7}
        >
          <View style={[styles.radioOuter, selected === opt && styles.radioOuterSelected]}>
            {selected === opt && <View style={styles.radioInner} />}
          </View>
          <Text style={styles.radioLabel}>{opt}</Text>
        </TouchableOpacity>
      ))}
    </View>
  );
}

function CheckboxRow({ label, checked, onToggle }) {
  return (
    <TouchableOpacity style={styles.checkRow} onPress={onToggle} activeOpacity={0.7}>
      <View style={[styles.checkBox, checked && styles.checkBoxActive]}>
        {checked && <Text style={styles.checkMark}>✓</Text>}
      </View>
      <Text style={styles.checkLabel}>{label}</Text>
    </TouchableOpacity>
  );
}

// --- Step 1: Información básica ---

function Step1({ data, setData, onNext }) {
  const edades = Array.from({ length: 82 }, (_, i) => String(i + 13));
  const canContinue = data.terminos && data.nombre && data.apellido && data.correo && data.contrasena;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <Text style={styles.stepTitle}>Información básica</Text>

      <UnderlineField
        label="Nombre"
        value={data.nombre}
        onChangeText={(v) => setData({ ...data, nombre: v })}
        placeholder="Juan Pablo"
      />
      <UnderlineField
        label="Apellido"
        value={data.apellido}
        onChangeText={(v) => setData({ ...data, apellido: v })}
        placeholder="Varillas"
      />

      <View style={styles.halfRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <DropdownField
            label="Género"
            value={data.genero}
            options={['Hombre', 'Mujer', 'Otro']}
            onSelect={(v) => setData({ ...data, genero: v })}
          />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <DropdownField
            label="Edad"
            value={data.edad}
            options={edades}
            onSelect={(v) => setData({ ...data, edad: v })}
          />
        </View>
      </View>

      <UnderlineField
        label="Correo"
        value={data.correo}
        onChangeText={(v) => setData({ ...data, correo: v })}
        placeholder="jvarillas@icloud.com"
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <View style={styles.fieldGroup}>
        <Text style={styles.fieldLabel}>Celular</Text>
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
              value={data.celular}
              onChangeText={(v) => setData({ ...data, celular: v })}
              placeholder="967753444"
              placeholderTextColor={colors.textSecondary}
              keyboardType="phone-pad"
            />
          </View>
        </View>
      </View>

      <UnderlineField
        label="Contraseña"
        value={data.contrasena}
        onChangeText={(v) => setData({ ...data, contrasena: v })}
        placeholder="Mínimo 8 caracteres"
        secureTextEntry
        autoCapitalize="none"
      />

      <CheckboxRow
        label="Acepto los términos y condiciones de Avosports"
        checked={data.terminos}
        onToggle={() => setData({ ...data, terminos: !data.terminos })}
      />

      <View style={{ marginTop: 28 }}>
        <PrimaryButton title="Siguiente" onPress={onNext} disabled={!canContinue} />
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// --- Step 2: Selecciona un deporte ---

function Step2({ data, setData, onNext, onBack }) {
  const deportes = [
    {
      id: 'tenis',
      label: 'Tenis',
      uri: 'https://images.unsplash.com/photo-1622279457486-62dcc4a431d6?w=400&q=80',
    },
    {
      id: 'squash',
      label: 'Squash',
      uri: 'https://images.unsplash.com/photo-1740813402046-08ec3e0ce5d2?w=400&q=80',
    },
    {
      id: 'tenis_mesa',
      label: 'Tenis de mesa',
      uri: 'https://images.unsplash.com/photo-1611251135345-18c56206b863?w=400&q=80',
    },
    {
      id: 'padel',
      label: 'Padel',
      uri: 'https://images.unsplash.com/photo-1646649853703-7645147474ba?w=400&q=80',
    },
  ];

  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.stepTitle}>Selecciona un deporte para empezar</Text>
      <Text style={styles.stepSubtitle}>Luego podrás seleccionar más deportes para jugar.</Text>

      <View style={styles.sportGrid}>
        {deportes.map((d) => (
          <TouchableOpacity
            key={d.id}
            style={[styles.sportCard, data.deporte === d.id && styles.sportCardSelected]}
            onPress={() => setData({ ...data, deporte: d.id })}
            activeOpacity={0.8}
          >
            <ImageBackground
              source={{ uri: d.uri }}
              style={styles.sportCardImage}
              imageStyle={{ borderRadius: 13 }}
            >
              <View style={styles.sportOverlay} />
              {data.deporte === d.id && (
                <View style={styles.sportCheck}>
                  <Text style={{ color: colors.white, fontWeight: 'bold' }}>✓</Text>
                </View>
              )}
              <Text style={styles.sportLabel}>{d.label}</Text>
            </ImageBackground>
          </TouchableOpacity>
        ))}
      </View>

      <View style={styles.navRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <PrimaryButton title="Atrás" onPress={onBack} variant="outline" />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <PrimaryButton title="Siguiente" onPress={onNext} disabled={!data.deporte} />
        </View>
      </View>
    </View>
  );
}

// --- Step 3: Determina tu nivel ---

function Step3({ data, setData, onNext, onBack }) {
  const canContinue = data.nivel && data.partidos_semana && data.nivel_fisico;

  return (
    <ScrollView
      showsVerticalScrollIndicator={false}
      keyboardShouldPersistTaps="handled"
      automaticallyAdjustKeyboardInsets
    >
      <Text style={styles.stepTitle}>Determina tu nivel</Text>
      <Text style={styles.stepSubtitle}>
        Con esta información, podremos determinar tu nivel de juego y emparejarte con jugadores similares.
      </Text>

      <RadioGroup
        question="¿Cuál es tu nivel del juego?"
        options={['Principiante', 'Intermedio', 'Avanzado', 'Elite']}
        selected={data.nivel}
        onSelect={(v) => setData({ ...data, nivel: v })}
      />
      <RadioGroup
        question="¿Cuántos partidos has tenido en promedio por semana el último año?"
        options={['0', '1', '2 o más']}
        selected={data.partidos_semana}
        onSelect={(v) => setData({ ...data, partidos_semana: v })}
      />
      <RadioGroup
        question="¿Has recibido lecciones el último año? ¿Cuántas lecciones por semana?"
        options={['0', '1', '2 o más']}
        selected={data.lecciones}
        onSelect={(v) => setData({ ...data, lecciones: v })}
      />
      <RadioGroup
        question="¿Cómo es tu nivel físico?"
        options={['Malo', 'Regular', 'Bueno']}
        selected={data.nivel_fisico}
        onSelect={(v) => setData({ ...data, nivel_fisico: v })}
      />

      <CheckboxRow
        label="Deseo ser profesor"
        checked={data.es_profesor}
        onToggle={() => setData({ ...data, es_profesor: !data.es_profesor })}
      />

      {data.es_profesor && (
        <View style={[styles.fieldGroup, { marginTop: 12 }]}>
          <Text style={[styles.fieldLabel, { fontWeight: '700' }]}>Mayores Logros</Text>
          <TextInput
            style={styles.logrosInput}
            value={data.logros}
            onChangeText={(v) => setData({ ...data, logros: v })}
            placeholder="Cuéntanos tus mayores logros como profesor"
            placeholderTextColor={colors.textSecondary}
            multiline
            textAlignVertical="top"
          />
        </View>
      )}

      <View style={[styles.navRow, { marginTop: 24 }]}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <PrimaryButton title="Atrás" onPress={onBack} variant="outline" />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <PrimaryButton title="Siguiente" onPress={onNext} disabled={!canContinue} />
        </View>
      </View>
      <View style={{ height: 40 }} />
    </ScrollView>
  );
}

// --- Step 4: Foto de perfil ---

function Step4({ onFinish, onBack, loading }) {
  return (
    <View style={{ flex: 1 }}>
      <Text style={styles.stepTitle}>Elige una foto de perfil</Text>
      <Text style={styles.stepSubtitle}>Tranquilo, luego puedes volver a cambiarla.</Text>
      <Text style={[styles.stepSubtitle, { color: colors.accent, marginBottom: 0 }]}>Opcional*</Text>

      <View style={styles.avatarWrapper}>
        <TouchableOpacity style={styles.avatarCircle} activeOpacity={0.8}>
          <Text style={styles.avatarIcon}>👤</Text>
          <View style={styles.avatarPlusBadge}>
            <Text style={styles.avatarPlusText}>+</Text>
          </View>
        </TouchableOpacity>
        <Text style={styles.avatarHint}>Toca para subir</Text>
      </View>

      <View style={styles.navRow}>
        <View style={{ flex: 1, marginRight: 8 }}>
          <PrimaryButton title="Atrás" onPress={onBack} variant="outline" />
        </View>
        <View style={{ flex: 1, marginLeft: 8 }}>
          <PrimaryButton title="Confirmar" onPress={onFinish} loading={loading} />
        </View>
      </View>
    </View>
  );
}

// --- Step 5: Nivel revelado ---

function StepNivel({ nivel, onStart }) {
  return (
    <View style={styles.nivelScreen}>
      <View style={styles.nivelCircle}>
        <View style={styles.nivelStarWrapper}>
          <Text style={styles.nivelStarEmoji}>⭐</Text>
          <Text style={styles.nivelNumber}>{nivel}</Text>
        </View>
      </View>

      <Text style={styles.nivelTitle}>¡Genial! Eres nivel {nivel}</Text>
      <Text style={styles.nivelSubtitle}>
        Te hemos otorgado 100 pts.{'\n'}Juega partidas y gana más.
      </Text>

      <TouchableOpacity style={styles.nivelBtn} onPress={onStart} activeOpacity={0.85}>
        <Text style={styles.nivelBtnText}>Empezar a jugar</Text>
      </TouchableOpacity>
    </View>
  );
}

// --- Main Screen ---

const STEP_TITLES = ['Registro', 'Selecciona un deporte', 'Determina tu nivel', 'Foto de perfil'];

export function RegisterScreen({ navigation }) {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [nivelObtenido, setNivelObtenido] = useState(null);
  const [data, setData] = useState({
    nombre: '', apellido: '', genero: '', edad: '',
    correo: '', celular: '', contrasena: '',
    terminos: false,
    deporte: '',
    nivel: '', partidos_semana: '', lecciones: '', nivel_fisico: '',
    es_profesor: false, logros: '',
  });

  function validateStep1() {
    if (!data.nombre || !data.apellido || !data.correo || !data.contrasena) {
      Alert.alert('Campos requeridos', 'Completa todos los campos obligatorios.');
      return false;
    }
    if (!data.terminos) {
      Alert.alert('Términos y condiciones', 'Debes aceptar los términos y condiciones para continuar.');
      return false;
    }
    return true;
  }

  async function handleFinish() {
    try {
      setLoading(true);
      await authService.registrar({
      ...data,
      apellidos: data.apellido,
      telefono: data.celular || null,
    });
      setNivelObtenido(12);
      setStep(5);
    } catch (error) {
      Alert.alert('Error', error.message);
    } finally {
      setLoading(false);
    }
  }

  // Pantalla de nivel revelado (sin header/stepper)
  if (step === 5) {
    return (
      <StepNivel
        nivel={nivelObtenido || 12}
        onStart={() => navigation.replace('MainTabs')}
      />
    );
  }

  return (
    <View style={styles.screen}>
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => step === 1 ? navigation.goBack() : setStep(step - 1)}
          hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
        >
          <Ionicons name="arrow-back" size={24} color={colors.textPrimary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{STEP_TITLES[step - 1]}</Text>
        <View style={{ width: 24 }} />
      </View>

      <View style={styles.content}>
        <Stepper step={step} />

        <View style={{ flex: 1, marginTop: 24 }}>
          {step === 1 && (
            <Step1
              data={data}
              setData={setData}
              onNext={() => validateStep1() && setStep(2)}
            />
          )}
          {step === 2 && (
            <Step2
              data={data}
              setData={setData}
              onNext={() => setStep(3)}
              onBack={() => setStep(1)}
            />
          )}
          {step === 3 && (
            <Step3
              data={data}
              setData={setData}
              onNext={() => setStep(4)}
              onBack={() => setStep(2)}
            />
          )}
          {step === 4 && (
            <Step4
              onFinish={handleFinish}
              onBack={() => setStep(3)}
              loading={loading}
            />
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: colors.background,
    paddingTop: 60,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    marginBottom: 16,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
  },

  // Stepper
  stepper: {
    flexDirection: 'row',
    gap: 6,
  },
  stepBar: {
    flex: 1,
    height: 6,
    borderRadius: 3,
    backgroundColor: colors.border,
  },
  stepBarActive: {
    backgroundColor: colors.accent,
  },

  // Step typography
  stepTitle: {
    fontSize: 22,
    fontWeight: 'bold',
    color: colors.textPrimary,
    marginBottom: 8,
  },
  stepSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: 8,
    lineHeight: 20,
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

  // Dropdown
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
  chevron: {
    fontSize: 13,
    color: colors.textSecondary,
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
  halfRow: {
    flexDirection: 'row',
    overflow: 'visible',
  },

  // Checkbox
  checkRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 12,
    marginTop: 12,
  },
  checkBox: {
    width: 22,
    height: 22,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
    flexShrink: 0,
  },
  checkBoxActive: {
    backgroundColor: colors.accent,
    borderColor: colors.accent,
  },
  checkMark: {
    fontSize: 13,
    color: colors.primary,
    fontWeight: 'bold',
  },
  checkLabel: {
    flex: 1,
    fontSize: 14,
    color: colors.textPrimary,
    lineHeight: 21,
  },

  // Step 2 sports
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

  // Step 3 radio
  radioGroup: {
    marginBottom: 20,
  },
  radioQuestion: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
    marginBottom: 10,
    lineHeight: 20,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 14,
    backgroundColor: colors.surface,
    borderRadius: 10,
    marginBottom: 6,
    gap: 12,
  },
  radioRowSelected: {
    backgroundColor: '#FFF5D6',
  },
  radioOuter: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioOuterSelected: {
    borderColor: colors.accent,
  },
  radioInner: {
    width: 10,
    height: 10,
    borderRadius: 5,
    backgroundColor: colors.accent,
  },
  radioLabel: {
    fontSize: 14,
    color: colors.textPrimary,
  },

  // Step 4 avatar
  avatarWrapper: {
    alignItems: 'center',
    marginTop: 48,
    marginBottom: 48,
  },
  avatarCircle: {
    width: 160,
    height: 160,
    borderRadius: 80,
    backgroundColor: colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarIcon: {
    fontSize: 64,
  },
  avatarPlusBadge: {
    position: 'absolute',
    bottom: 4,
    right: 4,
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarPlusText: {
    color: colors.white,
    fontSize: 22,
    fontWeight: 'bold',
    lineHeight: 26,
  },
  avatarHint: {
    marginTop: 14,
    fontSize: 14,
    fontWeight: '600',
    color: colors.textPrimary,
  },

  // Shared nav
  navRow: {
    flexDirection: 'row',
    gap: 0,
  },

  // Dropdown modal
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  modalSheet: {
    backgroundColor: colors.background,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '60%',
    paddingBottom: 32,
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  modalOption: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderBottomWidth: 1,
    borderBottomColor: colors.surface,
  },
  modalOptionText: {
    fontSize: 16,
    color: colors.textPrimary,
  },
  modalOptionSelected: {
    color: colors.accent,
    fontWeight: '600',
  },

  // Step 5: nivel revelado
  nivelScreen: {
    flex: 1,
    backgroundColor: colors.background,
    alignItems: 'center',
    paddingHorizontal: 32,
    paddingTop: 80,
    paddingBottom: 48,
  },
  nivelCircle: {
    width: 220,
    height: 220,
    borderRadius: 110,
    backgroundColor: colors.accentLight,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nivelStarWrapper: {
    width: 120,
    height: 120,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nivelStarEmoji: {
    fontSize: 100,
    lineHeight: 120,
    textAlign: 'center',
  },
  nivelNumber: {
    position: 'absolute',
    fontSize: 36,
    fontWeight: 'bold',
    color: colors.primary,
    textAlign: 'center',
    top: 30,
  },
  nivelTitle: {
    fontSize: 26,
    fontWeight: 'bold',
    color: colors.textPrimary,
    textAlign: 'center',
    marginTop: 36,
  },
  nivelSubtitle: {
    fontSize: 15,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginTop: 12,
  },
  nivelBtn: {
    position: 'absolute',
    bottom: 48,
    left: 32,
    right: 32,
    backgroundColor: colors.accent,
    borderRadius: 30,
    paddingVertical: 18,
    alignItems: 'center',
  },
  nivelBtnText: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.primary,
  },
});
