export interface itemPackages {
  id: number;
  packageName: string;
  productClasification: string;
  description: string;
  photoQuantity: number;
  packagePrice: number;
  itemStatus: boolean;
  photoResolution: number;
  photoWidth: number;
  photoHeight: number;
  imagen_url?: string; // URL de la imagen del paquete en S3
  template_url?: string; // URL del template PNG personalizado para Polaroid
  templates_calendario?: Record<number, string>; // URLs de los 12 templates de calendario (1-12)
}
