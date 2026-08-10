import { StyleSheet } from 'react-native';
import { colors } from './colors';

export const typography = StyleSheet.create({
  h1: {
    fontSize: 28,
    fontWeight: 'bold',
    color: colors.textPrimary,
  },
  h2: {
    fontSize: 22,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  h3: {
    fontSize: 18,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  body: {
    fontSize: 14,
    fontWeight: '400',
    color: colors.textPrimary,
  },
  caption: {
    fontSize: 12,
    fontWeight: '400',
    color: colors.textSecondary,
  },
  label: {
    fontSize: 14,
    fontWeight: '500',
    color: colors.textPrimary,
  },
});
