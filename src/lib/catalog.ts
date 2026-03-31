import type { PriceRange, ProductCategory, ProductItem } from "../types";

const categoryLabels: Record<ProductCategory, string> = {
  cleanser: "Очищение",
  toner: "Тоник",
  serum: "Сыворотка",
  cream: "Крем",
  mask: "Маска",
  set: "Набор",
  body: "Тело",
  "sun-care": "SPF"
};

const skinTypeOrder = [
  "Чувствительная",
  "Жирная",
  "Комбинированная",
  "Сухая",
  "Нормальная"
] as const;

const ingredientOrder = [
  "Витамин C",
  "Ретиноиды",
  "Ниацинамид",
  "Пептиды",
  "Церамиды",
  "Азелаиновая кислота",
  "Салициловая кислота",
  "Молочная кислота",
  "Фруктовые кислоты",
  "Транексамовая кислота",
  "Бакучиол",
  "Гиалуроновая кислота",
  "Пребиотики",
  "Аминокислоты",
  "Энзимы",
  "Аргановое масло",
  "Омега 3-6-9",
  "Магний",
  "PDRN",
  "SPF-фильтры"
] as const;

const textureOrder = [
  "Гель",
  "Пенка",
  "Масло",
  "Пудра",
  "Тоник",
  "Сыворотка",
  "Крем",
  "Маска",
  "Флюид",
  "Эмульсия",
  "Лосьон",
  "Мусс",
  "Блеск",
  "Набор"
] as const;

const zoneOrder = [
  "Лицо",
  "Глаза",
  "Губы",
  "Тело",
  "Волосы",
  "Брови и ресницы",
  "Интимная зона"
] as const;

export type CatalogSortOption = "default" | "price-asc" | "price-desc" | "name-asc";

export type CatalogFilters = {
  search: string;
  brands: string[];
  categories: ProductCategory[];
  concerns: string[];
  skinTypes: string[];
  ingredients: string[];
  textures: string[];
  zones: string[];
  priceRange: PriceRange;
};

type ProductFacets = {
  skinTypes: string[];
  ingredients: string[];
  textures: string[];
  zones: string[];
};

export function formatPrice(value: number) {
  return new Intl.NumberFormat("ru-RU").format(value);
}

export function getCatalogPriceBounds(products: ProductItem[]): PriceRange {
  const prices = products.map((product) => product.price);

  return {
    min: Math.min(...prices),
    max: Math.max(...prices)
  };
}

export function getSkinTypeOptions(products: ProductItem[]) {
  return getFacetOptions(products, "skinTypes", skinTypeOrder);
}

export function getIngredientOptions(products: ProductItem[]) {
  return getFacetOptions(products, "ingredients", ingredientOrder);
}

export function getTextureOptions(products: ProductItem[]) {
  return getFacetOptions(products, "textures", textureOrder);
}

export function getZoneOptions(products: ProductItem[]) {
  return getFacetOptions(products, "zones", zoneOrder);
}

export function sortProducts(products: ProductItem[], sort: CatalogSortOption) {
  const sorted = [...products];

  switch (sort) {
    case "price-asc":
      return sorted.sort((first, second) => first.price - second.price || first.name.localeCompare(second.name, "ru"));
    case "price-desc":
      return sorted.sort((first, second) => second.price - first.price || first.name.localeCompare(second.name, "ru"));
    case "name-asc":
      return sorted.sort((first, second) => first.name.localeCompare(second.name, "ru"));
    case "default":
    default:
      return sorted;
  }
}

export function filterProducts(products: ProductItem[], filters: CatalogFilters) {
  const normalizedSearch = normalizeText(filters.search.trim());
  const normalizedConcerns = filters.concerns.map(normalizeText);

  return products.filter((product) => {
    const facets = getProductFacets(product);
    const haystack = normalizeText(
      [
        product.brand,
        product.name,
        product.shortDescription,
        product.country,
        product.volume,
        ...product.concern,
        ...facets.skinTypes,
        ...facets.ingredients,
        ...facets.textures,
        ...facets.zones
      ].join(" ")
    );

    if (normalizedSearch && !haystack.includes(normalizedSearch)) {
      return false;
    }

    if (filters.brands.length > 0 && !filters.brands.includes(product.brand)) {
      return false;
    }

    if (filters.categories.length > 0 && !filters.categories.includes(product.category)) {
      return false;
    }

    if (
      normalizedConcerns.length > 0 &&
      !normalizedConcerns.some((item) => haystack.includes(item))
    ) {
      return false;
    }

    if (filters.skinTypes.length > 0 && !filters.skinTypes.some((item) => facets.skinTypes.includes(item))) {
      return false;
    }

    if (
      filters.ingredients.length > 0 &&
      !filters.ingredients.some((item) => facets.ingredients.includes(item))
    ) {
      return false;
    }

    if (filters.textures.length > 0 && !filters.textures.some((item) => facets.textures.includes(item))) {
      return false;
    }

    if (filters.zones.length > 0 && !filters.zones.some((item) => facets.zones.includes(item))) {
      return false;
    }

    if (product.price < filters.priceRange.min || product.price > filters.priceRange.max) {
      return false;
    }

    return true;
  });
}

export function getCategoryLabel(category: ProductCategory) {
  return categoryLabels[category];
}

export function getProductById(products: ProductItem[], id: string) {
  return products.find((product) => product.id === id);
}

export function getRelatedProducts(products: ProductItem[], currentProduct: ProductItem, limit = 4) {
  return [...products]
    .filter((product) => product.id !== currentProduct.id)
    .sort((first, second) => scoreProduct(second, currentProduct) - scoreProduct(first, currentProduct))
    .slice(0, limit);
}

export function getRecommendedProducts(products: ProductItem[], excludedIds: string[], limit = 4) {
  const excluded = new Set(excludedIds);

  return [...products]
    .filter((product) => !excluded.has(product.id))
    .sort((first, second) => {
      const firstWeight = Number(first.category === "cream" || first.category === "serum");
      const secondWeight = Number(second.category === "cream" || second.category === "serum");
      return secondWeight - firstWeight || second.price - first.price;
    })
    .slice(0, limit);
}

export function getProductFacets(product: ProductItem): ProductFacets {
  const text = normalizeText(
    [product.name, product.shortDescription, product.volume, ...product.concern].join(" ")
  );

  const skinTypes: string[] = [];
  const ingredients: string[] = [];
  const textures: string[] = [];
  const zones: string[] = [];

  if (includesAny(text, ["чувств", "купероз", "покраснен", "антикупероз", "восстанов"])) {
    pushUnique(skinTypes, "Чувствительная");
  }

  if (includesAny(text, ["жирн", "себум", "себорег", "акне", "проблемн", "поры"])) {
    pushUnique(skinTypes, "Жирная");
  }

  if (includesAny(text, ["комбинирован"])) {
    pushUnique(skinTypes, "Комбинированная");
  }

  if (includesAny(text, ["сух", "обезвож", "увлаж", "липид"])) {
    pushUnique(skinTypes, "Сухая");
  }

  if (includesAny(text, ["нормальн"])) {
    pushUnique(skinTypes, "Нормальная");
  }

  if (includesAny(text, ["витамин c", "vitamin c", "ce ferulic", "энергия «с", "энергия с"])) {
    pushUnique(ingredients, "Витамин C");
  }

  if (includesAny(text, ["ретинол", "ретиноид"])) {
    pushUnique(ingredients, "Ретиноиды");
  }

  if (includesAny(text, ["ниацинамид"])) {
    pushUnique(ingredients, "Ниацинамид");
  }

  if (includesAny(text, ["пептид"])) {
    pushUnique(ingredients, "Пептиды");
  }

  if (includesAny(text, ["церамид"])) {
    pushUnique(ingredients, "Церамиды");
  }

  if (includesAny(text, ["азелаин"])) {
    pushUnique(ingredients, "Азелаиновая кислота");
  }

  if (includesAny(text, ["салицил"])) {
    pushUnique(ingredients, "Салициловая кислота");
  }

  if (includesAny(text, ["молочн"])) {
    pushUnique(ingredients, "Молочная кислота");
  }

  if (includesAny(text, ["фруктов"])) {
    pushUnique(ingredients, "Фруктовые кислоты");
  }

  if (includesAny(text, ["транексам"])) {
    pushUnique(ingredients, "Транексамовая кислота");
  }

  if (includesAny(text, ["бакучиол"])) {
    pushUnique(ingredients, "Бакучиол");
  }

  if (includesAny(text, ["гиалурон"])) {
    pushUnique(ingredients, "Гиалуроновая кислота");
  }

  if (includesAny(text, ["пребиот"])) {
    pushUnique(ingredients, "Пребиотики");
  }

  if (includesAny(text, ["аминокислот"])) {
    pushUnique(ingredients, "Аминокислоты");
  }

  if (includesAny(text, ["энзим"])) {
    pushUnique(ingredients, "Энзимы");
  }

  if (includesAny(text, ["арган"])) {
    pushUnique(ingredients, "Аргановое масло");
  }

  if (includesAny(text, ["омега"])) {
    pushUnique(ingredients, "Омега 3-6-9");
  }

  if (includesAny(text, ["магни"])) {
    pushUnique(ingredients, "Магний");
  }

  if (includesAny(text, ["пдрн"])) {
    pushUnique(ingredients, "PDRN");
  }

  if (product.category === "sun-care" || text.includes("spf")) {
    pushUnique(ingredients, "SPF-фильтры");
  }

  if (product.category === "set" || includesAny(text, ["дорожный набор", "набор"])) {
    pushUnique(textures, "Набор");
  } else if (includesAny(text, ["пенка"])) {
    pushUnique(textures, "Пенка");
  } else if (includesAny(text, ["масло"])) {
    pushUnique(textures, "Масло");
  } else if (includesAny(text, ["пудра"])) {
    pushUnique(textures, "Пудра");
  } else if (includesAny(text, ["флюид"])) {
    pushUnique(textures, "Флюид");
  } else if (includesAny(text, ["эмульс"])) {
    pushUnique(textures, "Эмульсия");
  } else if (includesAny(text, ["лосьон"])) {
    pushUnique(textures, "Лосьон");
  } else if (includesAny(text, ["мусс"])) {
    pushUnique(textures, "Мусс");
  } else if (includesAny(text, ["блеск"])) {
    pushUnique(textures, "Блеск");
  } else if (product.category === "toner" || includesAny(text, ["тоник"])) {
    pushUnique(textures, "Тоник");
  } else if (product.category === "serum" || includesAny(text, ["сыворот"])) {
    pushUnique(textures, "Сыворотка");
  } else if (product.category === "cream" || includesAny(text, ["крем"])) {
    pushUnique(textures, "Крем");
  } else if (product.category === "mask" || includesAny(text, ["маска"])) {
    pushUnique(textures, "Маска");
  } else if (includesAny(text, ["гель"]) || product.category === "cleanser") {
    pushUnique(textures, "Гель");
  }

  if (includesAny(text, ["вокруг глаз", "век", "для глаз"])) {
    pushUnique(zones, "Глаза");
  }

  if (includesAny(text, ["губ"])) {
    pushUnique(zones, "Губы");
  }

  if (includesAny(text, ["волос"])) {
    pushUnique(zones, "Волосы");
  }

  if (includesAny(text, ["бров", "ресниц"])) {
    pushUnique(zones, "Брови и ресницы");
  }

  if (includesAny(text, ["интим"])) {
    pushUnique(zones, "Интимная зона");
  }

  if (product.category === "body" || includesAny(text, ["тела", "тело"])) {
    pushUnique(zones, "Тело");
  }

  if (zones.length === 0) {
    pushUnique(zones, "Лицо");
  }

  return {
    skinTypes: sortByConfiguredOrder(skinTypes, skinTypeOrder),
    ingredients: sortByConfiguredOrder(ingredients, ingredientOrder),
    textures: sortByConfiguredOrder(textures, textureOrder),
    zones: sortByConfiguredOrder(zones, zoneOrder)
  };
}

function normalizeText(value: string) {
  return value.toLowerCase().replace(/ё/g, "е");
}

function includesAny(text: string, needles: string[]) {
  return needles.some((needle) => text.includes(needle));
}

function pushUnique(values: string[], nextValue: string) {
  if (!values.includes(nextValue)) {
    values.push(nextValue);
  }
}

function sortByConfiguredOrder(values: string[], order: readonly string[]) {
  const indexMap = new Map(order.map((item, index) => [item, index] as const));

  return [...values].sort(
    (first, second) =>
      (indexMap.get(first) ?? Number.POSITIVE_INFINITY) -
        (indexMap.get(second) ?? Number.POSITIVE_INFINITY) ||
      first.localeCompare(second, "ru")
  );
}

function getFacetOptions(
  products: ProductItem[],
  facet: keyof ProductFacets,
  order: readonly string[]
) {
  const values = new Set<string>();

  products.forEach((product) => {
    getProductFacets(product)[facet].forEach((item) => values.add(item));
  });

  return sortByConfiguredOrder([...values], order);
}

function scoreProduct(candidate: ProductItem, currentProduct: ProductItem) {
  let score = 0;

  if (candidate.brand === currentProduct.brand) {
    score += 4;
  }

  if (candidate.category === currentProduct.category) {
    score += 3;
  }

  const sharedConcerns = candidate.concern.filter((item) => currentProduct.concern.includes(item)).length;
  score += sharedConcerns * 2;

  return score;
}
