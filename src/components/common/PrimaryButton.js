import React from 'react';
import { TouchableOpacity, Text, StyleSheet, ActivityIndicator } from 'react-native';
import { colors } from '../../constants';

export function PrimaryButton({ title, onPress, loading = false, disabled = false, variant = 'filled' }) {
  const isDisabled = disabled || loading;

  return (
    <TouchableOpacity
      style={[
        styles.button,
        variant === 'outline' && styles.outline,
        isDisabled && styles.disabled,
      ]}
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'outline' ? colors.primary : colors.primary} />
      ) : (
        <Text style={[styles.text, variant === 'outline' && styles.textOutline]}>
          {title}
        </Text>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    backgroundColor: colors.accent,
    borderRadius: 30,
    paddingVertical: 16,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  outline: {
    backgroundColor: 'transparent',
    borderWidth: 1.5,
    borderColor: colors.primary,
  },
  disabled: {
    backgroundColor: colors.surface,
  },
  text: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.primary,
  },
  textOutline: {
    color: colors.primary,
  },
});
