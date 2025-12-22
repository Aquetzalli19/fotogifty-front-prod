import { AdmiOrder } from "@/interfaces/order-summary";

export const mockOrders: AdmiOrder[] = [
  {
    orderId: 1,
    clientName: "Juan Pérez",
    dateOfOrder: "2023-10-15",
    orderItems: [
      {
        productName: "Cuadro mediano",
        package: "Mediano",
        itemPrice: 299.99,
      },
      {
        productName: "Fotografía en lienzo",
        package: "Grande",
        itemPrice: 499.99,
      },
    ],
    status: "Enviado",
    images: [],
  },
  {
    orderId: 2,
    clientName: "María García",
    dateOfOrder: "2023-10-16",
    orderItems: [
      {
        productName: "Álbum de fotos",
        package: "30x20cm",
        itemPrice: 399.99,
      },
    ],
    status: "En reparto",
    images: [],
  },
  {
    orderId: 3,
    clientName: "Carlos López",
    dateOfOrder: "2023-10-17",
    orderItems: [
      {
        productName: "Tarjeta de felicitación",
        package: "A4",
        itemPrice: 49.99,
      },
      {
        productName: "Calendario personalizado",
        package: "A3",
        itemPrice: 149.99,
      },
    ],
    status: "Imprimiendo",
    images: [],
  },
  {
    orderId: 4,
    clientName: "Ana Martínez",
    dateOfOrder: "2023-10-18",
    orderItems: [
      {
        productName: "Llavero con foto",
        package: "Redondo",
        itemPrice: 29.99,
      },
      {
        productName: "Cafetera con foto",
        package: "Personalizada",
        itemPrice: 299.99,
      },
    ],
    status: "Empaquetado",
    images: [],
  },
  {
    orderId: 5,
    clientName: "Luis Fernández",
    dateOfOrder: "2023-10-19",
    orderItems: [
      {
        productName: "Poster grande",
        package: "70x100cm",
        itemPrice: 199.99,
      },
    ],
    status: "Archivado",
    images: [],
  },
  {
    orderId: 6,
    clientName: "Sofía Ramírez",
    dateOfOrder: "2023-10-20",
    orderItems: [
      {
        productName: "Funda para celular",
        package: "iPhone 13",
        itemPrice: 99.99,
      },
    ],
    status: "Enviado",
    images: [],
  },
];
