/**
 * Utilidades para renderizar polaroids
 * Genera el polaroid completo con marco y transformaciones
 */

interface PolaroidData {
  imageSrc: string;
  transformations: {
    scale: number;
    posX: number;
    posY: number;
  };
}

// Dimensiones del polaroid
const POLAROID_WIDTH = 800;
const POLAROID_HEIGHT = 1000;

// Área de la foto dentro del polaroid
const PHOTO_AREA = {
  top: 50,
  left: 50,
  width: 700,
  height: 700,
};

/**
 * Carga una imagen desde una URL
 */
async function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`Error cargando imagen`));
    img.src = src;
  });
}

/**
 * Renderiza un polaroid completo con marco blanco
 */
export async function renderPolaroid(
  polaroidData: PolaroidData
): Promise<string | undefined> {
  if (!polaroidData.imageSrc) return undefined;

  const canvas = document.createElement("canvas");
  canvas.width = POLAROID_WIDTH;
  canvas.height = POLAROID_HEIGHT;
  const ctx = canvas.getContext("2d");
  if (!ctx) return undefined;

  try {
    const img = await loadImage(polaroidData.imageSrc);

    // 1. Dibujar marco blanco del polaroid
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, POLAROID_WIDTH, POLAROID_HEIGHT);

    // 2. Dibujar la foto con transformaciones
    ctx.save();

    // Crear clipping path para que la foto no se salga del área
    ctx.beginPath();
    ctx.rect(
      PHOTO_AREA.left,
      PHOTO_AREA.top,
      PHOTO_AREA.width,
      PHOTO_AREA.height
    );
    ctx.clip();

    const { scale, posX, posY } = polaroidData.transformations;
    const centerX = PHOTO_AREA.left + PHOTO_AREA.width / 2;
    const centerY = PHOTO_AREA.top + PHOTO_AREA.height / 2;

    // Aplicar transformaciones
    ctx.translate(centerX + posX, centerY + posY);
    ctx.scale(scale, scale);

    // Dibujar imagen
    ctx.drawImage(img, -img.width / 2, -img.height / 2, img.width, img.height);

    ctx.restore();

    // 3. Convertir a JPEG
    return canvas.toDataURL("image/jpeg", 0.95);
  } catch (error) {
    console.error("Error renderizando polaroid:", error);
    return undefined;
  }
}
