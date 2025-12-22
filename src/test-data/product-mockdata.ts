import { ProductSections } from "@/interfaces/product-card";

/**
 * Mock data para productos estáticos (Calendarios y Polaroids)
 * Prints y Ampliaciones ahora se obtienen dinámicamente desde la API
 */
export const mockDataproducts: ProductSections[] = [
  {
    productName: "Calendarios",
    packages: [
      {
        id: 101,
        itemImage:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1Ymz-9xSwPgIeQq-1wYvupFkYwjUyyvY-0Q&s",
        name: "Calendario Clásico",
        itemDescription:
          "Calendario de pared personalizado con 12 fotos, una para cada mes.",
        itemPrice: 25.99,
        numOfRequiredImages: 12,
        photoResolution: 300,
        photoWidth: 2400, // Width in pixels
        photoHeight: 1700, // Height in pixels
      },
      {
        id: 102,
        itemImage:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1Ymz-9xSwPgIeQq-1wYvupFkYwjUyyvY-0Q&s",
        name: "Calendario de Escritorio",
        itemDescription:
          "Calendario pequeño para escritorio, ideal para un recordatorio diario.",
        itemPrice: 15.5,
        numOfRequiredImages: 1,
        photoResolution: 300,
        photoWidth: 2400, // Width in pixels
        photoHeight: 1700, // Height in pixels
      },
      {
        id: 103,
        itemImage:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1Ymz-9xSwPgIeQq-1wYvupFkYwjUyyvY-0Q&s",
        name: "Calendario de Escritorio",
        itemDescription:
          "Calendario pequeño para escritorio, ideal para un recordatorio diario.",
        itemPrice: 15.5,
        numOfRequiredImages: 1,
        photoResolution: 300,
        photoWidth: 2400, // Width in pixels
        photoHeight: 1700, // Height in pixels
      },
      {
        id: 104,
        itemImage:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1Ymz-9xSwPgIeQq-1wYvupFkYwjUyyvY-0Q&s",
        name: "Calendario de Escritorio",
        itemDescription:
          "Calendario pequeño para escritorio, ideal para un recordatorio diario.",
        itemPrice: 15.5,
        numOfRequiredImages: 1,
        photoResolution: 300,
        photoWidth: 2400, // Width in pixels
        photoHeight: 1700, // Height in pixels
      },
    ],
  },
  {
    productName: "Polaroids",
    packages: [
      {
        id: 301,
        itemImage:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1Ymz-9xSwPgIeQq-1wYvupFkYwjUyyvY-0Q&s",
        name: "Set de 10 Polaroids",
        itemDescription:
          "Impresiones estilo Polaroid con marco blanco, perfectas para decoración.",
        itemPrice: 9.99,
        numOfRequiredImages: 10,
        photoResolution: 300,
        photoWidth: 1700, // Square polaroid: Width in pixels
        photoHeight: 1700, // Square polaroid: Height in pixels
      },
      {
        id: 302,
        itemImage:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1Ymz-9xSwPgIeQq-1wYvupFkYwjUyyvY-0Q&s",
        name: "Polaroid Jumbo",
        itemDescription:
          "Versión grande de la clásica Polaroid, para fotos que destacan.",
        itemPrice: 5.5,
        numOfRequiredImages: 1,
        photoResolution: 300,
        photoWidth: 1700, // Square polaroid: Width in pixels
        photoHeight: 1700, // Square polaroid: Height in pixels
      },
      {
        id: 303,
        itemImage:
          "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcR1Ymz-9xSwPgIeQq-1wYvupFkYwjUyyvY-0Q&s",
        name: "Polaroid Jumbo",
        itemDescription:
          "Versión grande de la clásica Polaroid, para fotos que destacan.",
        itemPrice: 5.5,
        numOfRequiredImages: 1,
        photoResolution: 300,
        photoWidth: 1700, // Square polaroid: Width in pixels
        photoHeight: 1700, // Square polaroid: Height in pixels
      },
    ],
  },
];
