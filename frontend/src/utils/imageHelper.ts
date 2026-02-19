const MAX_IMAGE_SIZE_BYTES = 5 * 1024 * 1024;

const fileToDataUrl = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(file);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => {
      reject(new Error("Não foi possível ler o arquivo de imagem"));
    };
  });
};

const blobToDataUrl = (blob: Blob): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.readAsDataURL(blob);
    reader.onload = () => resolve(reader.result as string);
    reader.onerror = () => {
      reject(new Error("Não foi possível converter a imagem processada"));
    };
  });
};

const loadImage = (file: File): Promise<HTMLImageElement> => {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(file);

    img.onload = () => {
      URL.revokeObjectURL(url);
      resolve(img);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error("Não foi possível carregar a imagem"));
    };

    img.src = url;
  });
};

const canvasToBlob = (
  canvas: HTMLCanvasElement,
  mimeType: string,
  quality?: number,
): Promise<Blob> => {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Não foi possível processar a imagem"));
          return;
        }
        resolve(blob);
      },
      mimeType,
      quality,
    );
  });
};

const compressImageToMaxSize = async (file: File): Promise<string> => {
  const image = await loadImage(file);
  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Não foi possível processar a imagem");
  }

  let scale = 1;
  let quality = 0.92;
  let outputType =
    file.type === "image/jpeg" || file.type === "image/webp"
      ? file.type
      : "image/jpeg";

  for (let attempt = 0; attempt < 10; attempt += 1) {
    const width = Math.max(1, Math.floor(image.width * scale));
    const height = Math.max(1, Math.floor(image.height * scale));

    canvas.width = width;
    canvas.height = height;

    if (outputType === "image/jpeg") {
      context.fillStyle = "#ffffff";
      context.fillRect(0, 0, width, height);
    } else {
      context.clearRect(0, 0, width, height);
    }

    context.drawImage(image, 0, 0, width, height);

    const blob = await canvasToBlob(
      canvas,
      outputType,
      outputType === "image/png" ? undefined : quality,
    );

    if (blob.size <= MAX_IMAGE_SIZE_BYTES) {
      return blobToDataUrl(blob);
    }

    quality = Math.max(0.4, quality - 0.08);
    scale *= 0.85;
  }

  throw new Error(
    "Não foi possível reduzir a imagem para até 5MB. Tente uma imagem menor.",
  );
};

export const imageToBase64 = async (file: File): Promise<string> => {
  if (file.size <= MAX_IMAGE_SIZE_BYTES) {
    return fileToDataUrl(file);
  }

  return compressImageToMaxSize(file);
};

/**
 * Validar se arquivo é imagem
 */
export const isValidImageFile = (file: File): boolean => {
  const validTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];

  if (!validTypes.includes(file.type)) {
    throw new Error("Apenas imagens (JPEG, PNG, GIF, WebP) são permitidas");
  }

  return true;
};

/**
 * Componente de imagem com fallback
 */
export const getImageUrl = (fotoBase64: string | null | undefined): string => {
  if (!fotoBase64) {
    return "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='200'%3E%3Crect fill='%23e5e7eb' width='200' height='200'/%3E%3Ctext x='50%25' y='50%25' font-size='16' fill='%236b7280' text-anchor='middle' dy='.3em'%3ESem Foto%3C/text%3E%3C/svg%3E";
  }
  return fotoBase64;
};
