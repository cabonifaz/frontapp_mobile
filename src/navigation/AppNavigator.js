import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants';

import { LoginScreen } from '../features/auth/login/LoginScreen';
import { RegisterScreen } from '../features/auth/register/RegisterScreen';
import { ForgotPasswordScreen } from '../features/auth/forgot_password/ForgotPasswordScreen';
import { HomeScreen } from '../features/home/HomeScreen';
import { RankingScreen } from '../features/ranking/RankingScreen';
import { ResultadosScreen } from '../features/results/ResultadosScreen';
import { PartidosScreen } from '../features/matches/PartidosScreen';

const Stack = createNativeStackNavigator();
const Tab = createBottomTabNavigator();

function MainTabs() {
  const insets = useSafeAreaInsets();
  const tabBarHeight = 54 + insets.bottom;

  return (
    <Tab.Navigator
      screenOptions={({ route }) => ({
        headerShown: false,
        tabBarStyle: {
          backgroundColor: colors.dark,
          borderTopWidth: 0,
          paddingTop: 8,
          paddingBottom: insets.bottom > 0 ? insets.bottom : 8,
          height: tabBarHeight,
        },
        tabBarActiveTintColor: '#FFFFFF',
        tabBarInactiveTintColor: '#666666',
        tabBarLabelStyle: {
          fontSize: 11,
          marginTop: 2,
          fontWeight: '500',
        },
        tabBarIcon: ({ focused, color, size }) => {
          const s = 24;
          if (route.name === 'Home') {
            return <Ionicons name={focused ? 'home' : 'home-outline'} size={s} color={color} />;
          }
          if (route.name === 'Ranking') {
            return <Ionicons name={focused ? 'trophy' : 'trophy-outline'} size={s} color={color} />;
          }
          if (route.name === 'Resultados') {
            return <MaterialCommunityIcons name="scoreboard" size={s} color={color} />;
          }
          if (route.name === 'Partidos') {
            return <MaterialCommunityIcons name="tennis" size={s} color={color} />;
          }
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Ranking" component={RankingScreen} options={{ title: 'Ranking' }} />
      <Tab.Screen name="Resultados" component={ResultadosScreen} options={{ title: 'Resultados' }} />
      <Tab.Screen name="Partidos" component={PartidosScreen} options={{ title: 'Partidos' }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Login">
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
