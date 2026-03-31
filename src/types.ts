export type ProductCategory =
  | "cleanser"
  | "toner"
  | "serum"
  | "cream"
  | "mask"
  | "set"
  | "body"
  | "sun-care";

export interface ProductItem {
  id: string;
  brand: string;
  country: string;
  name: string;
  price: number;
  volume: string;
  category: ProductCategory;
  concern: string[];
  shortDescription: string;
  accent: string;
  imageUrl?: string;
}

export interface PriceRange {
  min: number;
  max: number;
}

export interface CartLine {
  productId: string;
  quantity: number;
}
