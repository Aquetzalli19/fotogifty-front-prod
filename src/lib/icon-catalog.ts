/**
 * Shared catalog of Lucide icons available for CMS content (e.g. value cards
 * in WhyChooseSection). The admin IconPicker reads from this list, and the
 * public-facing components look up icons from the same map.
 *
 * To add a new icon:
 *  1. Import it from `lucide-react` below
 *  2. Add it to `ICON_CATALOG` with a short Spanish label
 *
 * The `name` MUST match the Lucide component name exactly — this is what gets
 * stored in the DB (`slide.icono`) and used at render time.
 */

import {
  Award,
  Palette,
  Truck,
  Shield,
  Clock,
  HeartHandshake,
  Star,
  CheckCircle,
  Zap,
  Heart,
  ThumbsUp,
  Gift,
  Camera,
  Image as ImageIcon,
  Printer,
  Frame,
  Layers,
  Sparkles,
  Sun,
  Moon,
  Flame,
  Leaf,
  Flower,
  Smile,
  Eye,
  Lock,
  Globe,
  MapPin,
  Phone,
  Mail,
  MessageCircle,
  Tag,
  ShoppingBag,
  Package,
  Box,
  Ruler,
  Scissors,
  PaintBucket,
  Brush,
  Wand2,
  Settings,
  Wrench,
  Lightbulb,
  TrendingUp,
  Trophy,
  Medal,
  Crown,
  Rocket,
  Target,
  Compass,
  Map,
  Calendar,
  Clock3,
  Bell,
  Users,
  User,
  UserCheck,
  Baby,
  Home,
  Building,
  Store,
  Car,
  Plane,
  Gem,
  Diamond,
  Sparkle,
  PartyPopper,
  Cake,
  Coffee,
  Music,
  Film,
  Book,
  BookOpen,
  Feather,
  PenTool,
  type LucideIcon,
} from "lucide-react";

export interface IconCatalogEntry {
  name: string;
  label: string;
  component: LucideIcon;
}

export const ICON_CATALOG: IconCatalogEntry[] = [
  { name: "Award", label: "Premio", component: Award },
  { name: "Trophy", label: "Trofeo", component: Trophy },
  { name: "Medal", label: "Medalla", component: Medal },
  { name: "Crown", label: "Corona", component: Crown },
  { name: "Star", label: "Estrella", component: Star },
  { name: "Sparkle", label: "Destello", component: Sparkle },
  { name: "Sparkles", label: "Destellos", component: Sparkles },
  { name: "Gem", label: "Gema", component: Gem },
  { name: "Diamond", label: "Diamante", component: Diamond },

  { name: "Heart", label: "Corazón", component: Heart },
  { name: "HeartHandshake", label: "Apoyo", component: HeartHandshake },
  { name: "ThumbsUp", label: "Me gusta", component: ThumbsUp },
  { name: "Smile", label: "Sonrisa", component: Smile },
  { name: "CheckCircle", label: "Verificado", component: CheckCircle },
  { name: "Shield", label: "Escudo", component: Shield },
  { name: "Lock", label: "Candado", component: Lock },

  { name: "Camera", label: "Cámara", component: Camera },
  { name: "Image", label: "Imagen", component: ImageIcon },
  { name: "Printer", label: "Impresora", component: Printer },
  { name: "Frame", label: "Marco", component: Frame },
  { name: "Layers", label: "Capas", component: Layers },
  { name: "Palette", label: "Paleta", component: Palette },
  { name: "PaintBucket", label: "Cubeta pintura", component: PaintBucket },
  { name: "Brush", label: "Brocha", component: Brush },
  { name: "PenTool", label: "Pluma", component: PenTool },
  { name: "Feather", label: "Pluma ave", component: Feather },
  { name: "Wand2", label: "Varita", component: Wand2 },
  { name: "Scissors", label: "Tijeras", component: Scissors },
  { name: "Ruler", label: "Regla", component: Ruler },

  { name: "Zap", label: "Rayo", component: Zap },
  { name: "Flame", label: "Llama", component: Flame },
  { name: "Lightbulb", label: "Idea", component: Lightbulb },
  { name: "Rocket", label: "Cohete", component: Rocket },
  { name: "Target", label: "Diana", component: Target },
  { name: "TrendingUp", label: "Tendencia", component: TrendingUp },

  { name: "Truck", label: "Camión", component: Truck },
  { name: "Package", label: "Paquete", component: Package },
  { name: "Box", label: "Caja", component: Box },
  { name: "ShoppingBag", label: "Bolsa de compras", component: ShoppingBag },
  { name: "Store", label: "Tienda", component: Store },
  { name: "Tag", label: "Etiqueta", component: Tag },
  { name: "Gift", label: "Regalo", component: Gift },

  { name: "Clock", label: "Reloj", component: Clock },
  { name: "Clock3", label: "Reloj 3", component: Clock3 },
  { name: "Calendar", label: "Calendario", component: Calendar },
  { name: "Bell", label: "Campana", component: Bell },

  { name: "Users", label: "Personas", component: Users },
  { name: "User", label: "Persona", component: User },
  { name: "UserCheck", label: "Usuario verificado", component: UserCheck },
  { name: "Baby", label: "Bebé", component: Baby },

  { name: "Home", label: "Hogar", component: Home },
  { name: "Building", label: "Edificio", component: Building },
  { name: "MapPin", label: "Ubicación", component: MapPin },
  { name: "Map", label: "Mapa", component: Map },
  { name: "Globe", label: "Globo", component: Globe },
  { name: "Compass", label: "Brújula", component: Compass },

  { name: "Phone", label: "Teléfono", component: Phone },
  { name: "Mail", label: "Correo", component: Mail },
  { name: "MessageCircle", label: "Mensaje", component: MessageCircle },

  { name: "Sun", label: "Sol", component: Sun },
  { name: "Moon", label: "Luna", component: Moon },
  { name: "Leaf", label: "Hoja", component: Leaf },
  { name: "Flower", label: "Flor", component: Flower },
  { name: "Eye", label: "Ojo", component: Eye },

  { name: "PartyPopper", label: "Fiesta", component: PartyPopper },
  { name: "Cake", label: "Pastel", component: Cake },
  { name: "Coffee", label: "Café", component: Coffee },
  { name: "Music", label: "Música", component: Music },
  { name: "Film", label: "Película", component: Film },
  { name: "Book", label: "Libro", component: Book },
  { name: "BookOpen", label: "Libro abierto", component: BookOpen },

  { name: "Car", label: "Auto", component: Car },
  { name: "Plane", label: "Avión", component: Plane },

  { name: "Settings", label: "Ajustes", component: Settings },
  { name: "Wrench", label: "Herramienta", component: Wrench },
];

/**
 * Lookup map: icon name → component. Used by public-facing components to
 * render an icon from the slide's `icono` string.
 */
export const ICON_MAP: Record<string, LucideIcon> = Object.fromEntries(
  ICON_CATALOG.map(({ name, component }) => [name, component])
);

/**
 * Returns the Lucide component for a given icon name, or `Star` as fallback.
 */
export function getIconByName(name: string | null | undefined): LucideIcon {
  if (!name) return Star;
  return ICON_MAP[name] || Star;
}
