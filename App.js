import React, { useEffect } from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { GoogleSignin } from '@react-native-google-signin/google-signin';
import { AppNavigator } from './src/navigation/AppNavigator';

export default function App() {
  useEffect(() => {
    // Configuración inicial de Google Sign-In con el Web Client ID correcto
    GoogleSignin.configure({
      webClientId: '397110100401-uc2v8vi8tprl26e5po0fpe987hhtqpj9.apps.googleusercontent.com',
    });
  }, []);

  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <AppNavigator />
    </SafeAreaProvider>
  );
}