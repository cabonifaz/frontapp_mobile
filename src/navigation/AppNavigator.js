import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Ionicons } from '@expo/vector-icons';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { colors } from '../constants';

import { SplashScreen } from '../features/auth/splash/SplashScreen';
import { LoginScreen } from '../features/auth/login/LoginScreen';
import { RegisterScreen } from '../features/auth/register/RegisterScreen';
import { ForgotPasswordScreen } from '../features/auth/forgot_password/ForgotPasswordScreen';
import { HomeScreen } from '../features/home/HomeScreen';
import { RankingScreen } from '../features/ranking/RankingScreen';
import { ResultadosScreen } from '../features/results/ResultadosScreen';
import { PartidosScreen } from '../features/matches/PartidosScreen';
import { BuscarPartidoScreen } from '../features/matches/BuscarPartidoScreen';
import { CrearPartidoScreen } from '../features/matches/CrearPartidoScreen';
import { RetarScreen } from '../features/matches/RetarScreen';
import { MisSolicitudesScreen } from '../features/matches/MisSolicitudesScreen';
import { DetallePartidoScreen } from '../features/matches/DetallePartidoScreen';
import { ColocarResultadosScreen } from '../features/matches/ColocarResultadosScreen';
import { MatchChatScreen } from '../features/matches/MatchChatScreen'; // <--- Importación añadida
import { TomarClaseScreen } from '../features/classes/TomarClaseScreen';
import { ProfesoresDisponiblesScreen } from '../features/classes/ProfesoresDisponiblesScreen';
import { DetalleClaseScreen } from '../features/classes/DetalleClaseScreen';
import { ProfileScreen } from '../features/profile/ProfileScreen';
import { EditProfileScreen } from '../features/profile/EditProfileScreen';
import { PlayerProfileScreen } from '../features/profile/PlayerProfileScreen';
import { SettingsScreen } from '../features/profile/SettingsScreen';
import { ChatScreen } from '../features/chat/ChatScreen';

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
          if (route.name === 'Perfil') {
            return <Ionicons name={focused ? 'person' : 'person-outline'} size={s} color={color} />;
          }
        },
      })}
    >
      <Tab.Screen name="Home" component={HomeScreen} options={{ title: 'Home' }} />
      <Tab.Screen name="Ranking" component={RankingScreen} options={{ title: 'Ranking' }} />
      <Tab.Screen name="Resultados" component={ResultadosScreen} options={{ title: 'Resultados' }} />
      <Tab.Screen name="Partidos" component={PartidosScreen} options={{ title: 'Partidos' }} />
      <Tab.Screen name="Perfil" component={ProfileScreen} options={{ title: 'Perfil' }} />
    </Tab.Navigator>
  );
}

export function AppNavigator() {
  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Splash">
        <Stack.Screen name="Splash" component={SplashScreen} />
        <Stack.Screen name="Login" component={LoginScreen} />
        <Stack.Screen name="Register" component={RegisterScreen} />
        <Stack.Screen name="ForgotPassword" component={ForgotPasswordScreen} />
        <Stack.Screen name="MainTabs" component={MainTabs} />
        <Stack.Screen name="FriendlyMatch" component={BuscarPartidoScreen} initialParams={{ tab: 'Amistoso' }} />
        <Stack.Screen name="RankedMatch" component={BuscarPartidoScreen} initialParams={{ tab: 'Rankeado' }} />
        <Stack.Screen name="CrearPartido" component={CrearPartidoScreen} />
        <Stack.Screen name="RetarJugador" component={RetarScreen} />
        <Stack.Screen name="MisSolicitudes" component={MisSolicitudesScreen} />
        <Stack.Screen name="DetallePartido" component={DetallePartidoScreen} />
        <Stack.Screen name="ColocarResultados" component={ColocarResultadosScreen} />
        <Stack.Screen name="MatchChat" component={MatchChatScreen} />
        <Stack.Screen name="TomarClase" component={TomarClaseScreen} />
        <Stack.Screen name="ProfesoresDisponibles" component={ProfesoresDisponiblesScreen} />
        <Stack.Screen name="DetalleClase" component={DetalleClaseScreen} />
        <Stack.Screen name="EditProfile" component={EditProfileScreen} />
        <Stack.Screen name="Settings" component={SettingsScreen} />
        <Stack.Screen name="PlayerProfile" component={PlayerProfileScreen} />
        <Stack.Screen name="Chat" component={ChatScreen} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}