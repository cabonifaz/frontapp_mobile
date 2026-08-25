// Diccionario de imágenes locales
export const LOCAL_AVATARS = {
  avatar_general: require('../../assets/avatar_general.png'),
  avatar_masculino_1: require('../../assets/avatar_masculino_1.png'),
  avatar_masculino_2: require('../../assets/avatar_masculino_2.png'),
  avatar_masculino_3: require('../../assets/avatar_masculino_3.png'),
  avatar_femenino_1: require('../../assets/avatar_femenino_1.png'),
  avatar_femenino_2: require('../../assets/avatar_femenino_2.png'),
  avatar_femenino_3: require('../../assets/avatar_femenino_3.png'),
};

// Función helper para resolver la imagen
export const getAvatarSource = (fotoPerfilUrl) => {
  // Si no hay foto en la BD, devolvemos el general
  if (!fotoPerfilUrl) {
    return LOCAL_AVATARS.avatar_general;
  }
  
  // Si la clave de la BD coincide con alguna de nuestras imágenes locales
  if (LOCAL_AVATARS[fotoPerfilUrl]) {
    return LOCAL_AVATARS[fotoPerfilUrl];
  }

  // Si es una URL web real (por si en un futuro usas Cloudinary o fotos de Google)
  return { uri: fotoPerfilUrl };
};