import { createNavigationContainerRef } from '@react-navigation/native';

// NUEVO (APP-AVO-041): permite navegar desde fuera de una pantalla
// (por ejemplo, al tocar una notificación push).
export const navigationRef = createNavigationContainerRef();

export function navegar(nombre, params) {
  if (navigationRef.isReady()) navigationRef.navigate(nombre, params);
}
