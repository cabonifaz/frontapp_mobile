const CLOUD_NAME    = 'tf4oxaty';
const UPLOAD_PRESET = 'avo_sports';

export async function uploadImage(localUri) {
  const formData = new FormData();
  formData.append('file', { uri: localUri, type: 'image/jpeg', name: 'photo.jpg' });
  formData.append('upload_preset', UPLOAD_PRESET);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: formData }
  );

  if (!response.ok) throw new Error('Error al subir la imagen');

  const data = await response.json();
  return data.secure_url;
}
