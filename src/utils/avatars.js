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
  if (!fotoPerfilUrl) return LOCAL_AVATARS.avatar_general;

  // Normaliza: quita extensión .png si viene con ella (ej: "avatar_masculino_3.png")
  const key = fotoPerfilUrl.replace(/\.png$/i, '');

  if (LOCAL_AVATARS[key]) return LOCAL_AVATARS[key];

  // URL web real (Cloudinary, Google, Facebook, etc.)
  if (fotoPerfilUrl.startsWith('http://') || fotoPerfilUrl.startsWith('https://')) {
    return { uri: fotoPerfilUrl };
  }

  return LOCAL_AVATARS.avatar_general;
};