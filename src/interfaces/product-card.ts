import { EditorType } from "@/lib/category-utils";

export interface ShopItem {
  id: number;
  itemImage: string;
  name: string;
  itemDescription: string;
  itemPrice: number;
  numOfRequiredImages: number;
  photoResolution: number;
  photoWidth: number;
  photoHeight: number;
  editorType?: EditorType; // Tipo de editor a usar (se determina por la categoría)
}

export interface ProductSections {
  productName: string;
  packages: ShopItem[];
  editorType?: EditorType; // Tipo de editor para toda la sección
}
