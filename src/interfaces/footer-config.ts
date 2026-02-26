export type SocialPlatform = 'instagram' | 'facebook' | 'whatsapp' | 'tiktok' | 'twitter' | 'youtube';

export interface SocialLink {
  id: number;
  plataforma: SocialPlatform;
  url: string;
  orden: number;
  activo: boolean;
}

export interface FooterConfig {
  id: number;
  descripcion: string | null;   // tagline de la marca
  email: string | null;
  telefono: string | null;
  socialLinks: SocialLink[];
  updatedAt: string;
}
