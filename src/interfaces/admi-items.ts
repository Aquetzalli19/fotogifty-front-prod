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
  template_url?: string; // URL del template PNG personalizado en S3
}
