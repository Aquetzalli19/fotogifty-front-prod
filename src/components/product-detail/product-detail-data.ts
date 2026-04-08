import {
  Shield,
  Truck,
  Palette,
  Award,
  Clock,
  HeartHandshake,
} from "lucide-react";

export const WHY_CHOOSE_ITEMS = [
  {
    icon: Award,
    title: "Calidad Profesional",
    description:
      "Impresiones en papel fotográfico premium con tecnología de última generación para colores vibrantes y detalles nítidos.",
  },
  {
    icon: Palette,
    title: "Personalización Total",
    description:
      "Editor integrado con filtros, ajustes y efectos para que cada foto quede exactamente como la imaginas.",
  },
  {
    icon: Truck,
    title: "Envío a Todo México",
    description:
      "Recibe tus impresiones en la puerta de tu casa con envío seguro y rastreable a cualquier parte del país.",
  },
  {
    icon: Shield,
    title: "Pago 100% Seguro",
    description:
      "Transacciones protegidas con Stripe. Tu información financiera siempre está segura con nosotros.",
  },
  {
    icon: Clock,
    title: "Entrega Rápida",
    description:
      "Procesamos tu pedido en tiempo récord para que disfrutes tus fotos impresas lo antes posible.",
  },
  {
    icon: HeartHandshake,
    title: "Garantía de Satisfacción",
    description:
      "Si no estás satisfecho con la calidad de impresión, te reimprimimos sin costo adicional.",
  },
];

export const PAPER_TYPES = [
  {
    id: "lustre",
    name: "Lustre",
    description:
      "El acabado preferido por fotógrafos profesionales. Ofrece una textura suave con un brillo sutil que reduce reflejos y resalta los detalles de la imagen.",
    features: [
      "Textura semi-mate elegante",
      "Reduce reflejos y huellas",
      "Ideal para retratos y paisajes",
      "Colores ricos y naturales",
      "Resistente al desgaste",
    ],
    image: "/slide1.jpg",
  },
  {
    id: "mate",
    name: "Mate",
    description:
      "Acabado sin brillo que ofrece una apariencia sofisticada y artística. Perfecto para fotos en blanco y negro y fotografía artística.",
    features: [
      "Sin reflejos ni brillos",
      "Apariencia artística y elegante",
      "Perfecto para fotos B&N",
      "Fácil de enmarcar",
      "Textura suave al tacto",
    ],
    image: "/slide2.jpg",
  },
  {
    id: "brillante",
    name: "Brillante",
    description:
      "El acabado clásico con brillo intenso que hace que los colores resalten al máximo. Ideal para fotos coloridas y vibrantes.",
    features: [
      "Colores ultra vibrantes",
      "Brillo intenso y llamativo",
      "Contraste máximo",
      "Ideal para fotos a color",
      "El clásico favorito",
    ],
    image: "/slide3.jpg",
  },
];

export const PRINT_SERVICES = [
  {
    title: "Impresiones Estándar",
    description:
      "Fotos impresas en múltiples tamaños con la calidad que tus recuerdos merecen.",
    image: "/slide1.jpg",
  },
  {
    title: "Calendarios Personalizados",
    description:
      "Crea calendarios únicos con tus fotos favoritas para cada mes del año.",
    image: "/slide2.jpg",
  },
  {
    title: "Fotos Estilo Polaroid",
    description:
      "El encanto retro de las polaroid con la calidad de impresión moderna.",
    image: "/slide3.jpg",
  },
  {
    title: "Paquetes Especiales",
    description:
      "Combina diferentes tamaños y estilos en un solo pedido con descuentos exclusivos.",
    image: "/slide4.jpg",
  },
];

export const PRODUCT_TYPES = [
  {
    title: "Impresiones Estándar",
    description:
      "Disponibles en múltiples tamaños, desde 4×6 hasta 8×10. Perfectas para enmarcar o regalar.",
    image: "/slide1.jpg",
  },
  {
    title: "Calendarios",
    description:
      "12 meses con tus fotos favoritas. Personaliza cada mes con tu editor integrado.",
    image: "/Calendar.png",
  },
  {
    title: "Polaroid",
    description:
      "El estilo retro que nunca pasa de moda. Marco blanco clásico con espacio para texto.",
    image: "/polaroid/Polaroid.png",
  },
];

export const GALLERY_IMAGES = [
  { src: "/slide1.jpg", alt: "Impresión de foto profesional", span: "col-span-2 row-span-2" },
  { src: "/slide2.jpg", alt: "Foto impresa de alta calidad", span: "" },
  { src: "/slide3.jpg", alt: "Detalle de impresión fotográfica", span: "" },
  { src: "/slide4.jpg", alt: "Colección de fotos impresas", span: "" },
  { src: "/SingleProduct.jpg", alt: "Producto de impresión", span: "" },
  { src: "/product-slider/slide1.jpg", alt: "Ejemplo de foto impresa", span: "col-span-2" },
];

export const FEATURED_SIZES = [
  "4×6 pulgadas (10×15 cm)",
  "5×7 pulgadas (13×18 cm)",
  "8×10 pulgadas (20×25 cm)",
  "Polaroid 3×3 y 4×4",
  "Calendario 8.5×11",
];

export const SIZES_TABLE_DATA = [
  {
    size: '4×6"',
    dimensions: "10 × 15 cm",
    resolution: "300 DPI",
    editor: "Estándar",
    priceFrom: "$15.00",
  },
  {
    size: '5×7"',
    dimensions: "13 × 18 cm",
    resolution: "300 DPI",
    editor: "Estándar",
    priceFrom: "$25.00",
  },
  {
    size: '8×10"',
    dimensions: "20 × 25 cm",
    resolution: "300 DPI",
    editor: "Estándar",
    priceFrom: "$45.00",
  },
  {
    size: "Polaroid",
    dimensions: "7.6 × 7.6 cm",
    resolution: "300 DPI",
    editor: "Polaroid",
    priceFrom: "$12.00",
  },
  {
    size: "Calendario",
    dimensions: "21.6 × 28 cm",
    resolution: "300 DPI",
    editor: "Calendario",
    priceFrom: "$99.00",
  },
];
