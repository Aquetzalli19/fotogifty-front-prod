import { UserOrder } from "@/interfaces/order-summary";

export const mockDataUserOrders: UserOrder[] = [
  {
    dateOfOrder: "2025-09-20T10:00:00Z",
    orderItems: [
      {
        productName: "Polaroid",
        package: "50 fotos 11x14",
        itemPrice: 150.0,
      },
      {
        productName: "Ampliaciones",
        package: "10 fotos 8x24",
        itemPrice: 250.5,
      },
      {
        productName: "Prints",
        package: "100 fotos 4x6",
        itemPrice: 120.0,
      },
    ],
    status: "Entregado",
    images: ["/images/polaroid_set.jpg", "/images/ampliaciones.jpg"],
  },
  {
    dateOfOrder: "2025-09-18T14:30:00Z",
    orderItems: [
      {
        productName: "Fotolibro Premium",
        package: "Pasta dura 20x30",
        itemPrice: 850.0,
      },
    ],
    status: "En reparto",
    images: ["/images/photobook.jpg"],
  },
  {
    dateOfOrder: "2025-09-15T09:15:00Z",
    orderItems: [
      {
        productName: "Calendario 2026",
        package: "Pared 12x18",
        itemPrice: 280.0,
      },
      {
        productName: "Set de Tazas",
        package: "2 tazas personalizadas",
        itemPrice: 220.0,
      },
    ],
    status: "Enviado",
    images: ["/images/calendario.jpg", "/images/tazas.jpg"],
  },
  {
    dateOfOrder: "2025-08-25T18:00:00Z",
    orderItems: [
      {
        productName: "Lienzo Canvas",
        package: "Grande 24x36",
        itemPrice: 1250.75,
      },
    ],
    status: "Entregado",
    images: ["/images/lienzo_canvas.jpg"],
  },
];
