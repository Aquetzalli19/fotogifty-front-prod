import { EditorType } from "@/lib/category-utils";

export interface CartItem {
  id: number;

  productCategory: string;
  itemImage: string;
  name: string;
  itemPrice: number;

  quantity: number;
  numOfRequiredImages: number;
  editorType?: EditorType; // Tipo de editor determinado por la categoría
}

export interface CartTotals {
  subtotal: number;
  iva: number;
  total: number;
}
