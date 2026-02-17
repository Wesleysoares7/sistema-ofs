/**
 * Converte um arquivo de imagem para base64
 */
export const imageToBase64 = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => {
      const result = reader.result as string;
      resolve(result);
    };
    reader.onerror = (error) => {
      reject(error);
    };
  });
};

/**
 * Validar se arquivo é imagem
 */
export const isValidImageFile = (file: File): boolean => {
  const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
  const maxSize = 5 * 1024 * 1024; // 5MB

  if (!validTypes.includes(file.type)) {
    throw new Error("Apenas imagens (JPEG, PNG, GIF, WebP) são permitidas");
  }

  if (file.size > maxSize) {
    throw new Error("Tamanho máximo: 5MB");
  }

  return true;
};

/**
 * Componente de imagem com fallback
 */
export const getImageUrl = (
  fotoBase64: string | null | undefined,
): string => {
  if (!fotoBase64) {
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23e5e7eb' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' font-size='16' fill='%236b7280' text-anchor='middle' dy='.3em'%3ESem Foto%3C/text%3E%3C/svg%3E";
  }
  return fotoBase64;
};
