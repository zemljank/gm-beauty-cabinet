import { useEffect, useMemo, useRef, useState } from "react";
import CartView from "./components/CartView";
import FilterBar from "./components/FilterBar";
import FavoritesView from "./components/FavoritesView";
import ProductCard from "./components/ProductCard";
import ProductDetailView from "./components/ProductDetailView";
import { brands, categories, products } from "./data/products";
import {
  filterProducts,
  formatPrice,
  getCatalogPriceBounds,
  getCategoryLabel,
  getIngredientOptions,
  getProductById,
  getSkinTypeOptions,
  getTextureOptions,
  getRecommendedProducts,
  getRelatedProducts,
  getZoneOptions,
  sortProducts
} from "./lib/catalog";
import type { CatalogSortOption } from "./lib/catalog";
import type { CartLine, PriceRange, ProductCategory, ProductItem } from "./types";

type HomeAnchor = "top" | "categories" | "concerns" | "doctor";
type CatalogAnchor = "catalog" | "filters";
type HomeHeroSlideTheme = "pearl" | "sky" | "sage" | "amber";
type HomeHeroSlideProduct = {
  id: string;
  name: string;
  imageUrl: string;
};
type HomeHeroSlideSceneImage = {
  src: string;
  tabletSrc?: string;
  mobileSrc?: string;
  alt: string;
  position?: string;
};
type HomeHeroSlide = {
  id: string;
  theme: HomeHeroSlideTheme;
  kicker: string;
  titleLines: Array<{ text: string; accent?: boolean }>;
  description: string;
  buttonLabel: string;
  action: { type: "catalog"; anchor: CatalogAnchor } | { type: "product"; productId: string };
  products?: HomeHeroSlideProduct[];
  featuredProducts?: HomeHeroSlideProduct[];
  sceneImage?: HomeHeroSlideSceneImage;
};

type ViewState =
  | { page: "home"; anchor: HomeAnchor }
  | { page: "catalog"; anchor: CatalogAnchor }
  | { page: "product"; productId: string }
  | { page: "favorites" }
  | { page: "cart" };

const navigation = [
  { label: "Каталог", page: "catalog", anchor: "catalog" },
  { label: "Категории", page: "home", anchor: "categories" },
  { label: "Проблемы кожи", page: "home", anchor: "concerns" },
  { label: "Выбор врача", page: "home", anchor: "doctor" }
] as const;

const CATALOG_PAGE_SIZE = 30;

const benefits = [
  {
    icon: "doctor",
    title: "Рекомендовано врачами",
    text: "Тщательно подобранные решения для домашнего ухода, где эффективность сочетается с мягкостью и эстетикой профессионального подхода."
  },
  {
    icon: "cosmetics",
    title: "Профессиональная косметика",
    text: "Профессиональные формулы и проверенные бренды, которые помогают поддерживать высокий стандарт ухода и заметный результат в домашних условиях."
  },
  {
    icon: "recovery",
    title: "Уход после процедур",
    text: "Деликатные средства для периода после процедур, которые помогают сохранить комфорт кожи и поддержать её бережное восстановление."
  }
] as const;

const quickQueries = [
  "Пигментация",
  "Акне",
  "Чувствительность",
  "Антивозрастное",
  "Восстановление"
] as const;

const showcaseCategories: Array<{ id: ProductCategory; description: string }> = [
  {
    id: "cleanser",
    description: "Гели, пенки и очищающие средства для мягкого первого этапа ухода."
  },
  {
    id: "serum",
    description: "Концентрированные формулы для сияния, баланса и точечной коррекции."
  },
  {
    id: "cream",
    description: "Текстуры для ежедневного комфорта, восстановления и защиты барьера."
  },
  {
    id: "sun-care",
    description: "Финишный этап дневного ухода с акцентом на фотозащиту."
  }
];

const doctorChoiceIds = [
  "zo-illuminating-aox-serum",
  "angio-vitamin-c-serum",
  "egia-vitamin-c-serum",
  "angio-spf-fluid"
] as const;
const popularProductIds = new Set<string>(doctorChoiceIds);

const CART_STORAGE_KEY = "gm-beauty-cart";
const FAVORITES_STORAGE_KEY = "gm-beauty-favorites";
const catalogPriceBounds = getCatalogPriceBounds(products);
const brandOptions = brands.filter((item) => item !== "Все бренды");
const skinTypeOptions = getSkinTypeOptions(products);
const ingredientOptions = getIngredientOptions(products);
const textureOptions = getTextureOptions(products);
const zoneOptions = getZoneOptions(products);
const catalogSortOptions: Array<{ value: CatalogSortOption; label: string }> = [
  { value: "default", label: "По умолчанию" },
  { value: "price-asc", label: "Сначала дешевле" },
  { value: "price-desc", label: "Сначала дороже" },
  { value: "name-asc", label: "По названию" }
];

const homeHeroImageOverrides: Record<string, string> = {
  "angio-silk-cleanser": "/hero/products/angio-silk-cleanser.png",
  "angio-vitamin-c-serum": "/hero/products/angio-vitamin-c-serum.png",
  "angio-foam-amino": "/hero/products/angio-foam-amino.png",
  "angio-anti-couperose-serum": "/hero/products/angio-anti-couperose-serum.png",
  "angio-anti-couperose-cream": "/hero/products/angio-anti-couperose-cream.png",
  "angio-azelaic-cream": "/hero/products/angio-azelaic-cream.png",
  "angio-pdrn-restoring-serum": "/hero/products/angio-pdrn-restoring-serum.png",
  "angio-ceramide-restoring-cream": "/hero/products/angio-ceramide-restoring-cream.png",
  "angio-restoring-sensitive-mask": "/hero/products/angio-restoring-sensitive-mask.png"
};

function getHomeHeroProduct(productId: string): HomeHeroSlideProduct {
  const product = getProductById(products, productId);

  if (!product?.imageUrl) {
    throw new Error(`Missing hero product image for ${productId}`);
  }

  return {
    id: product.id,
    name: product.name,
    imageUrl: homeHeroImageOverrides[productId] ?? product.imageUrl
  };
}

function getHomeHeroProducts(...productIds: string[]): HomeHeroSlideProduct[] {
  return productIds.map((productId) => getHomeHeroProduct(productId));
}

const zoHeroProducts = getHomeHeroProducts(
  "zo-hydrating-cleanser",
  "zo-illuminating-aox-serum",
  "zo-exfoliating-polish"
);

const angioDailyHeroProducts = getHomeHeroProducts(
  "angio-ceramide-restoring-cream",
  "angio-vitamin-c-serum",
  "angio-spf-fluid"
);

const sensitiveHeroProducts = getHomeHeroProducts(
  "angio-anti-couperose-serum",
  "angio-anti-couperose-cream",
  "angio-azelaic-cream"
);

const recoveryHeroProducts = getHomeHeroProducts(
  "angio-pdrn-restoring-serum",
  "angio-ceramide-restoring-cream",
  "angio-restoring-sensitive-mask"
);

const homeHeroSlides: HomeHeroSlide[] = [
  {
    id: "zo-routine",
    theme: "pearl",
    kicker: "ZO Skin Health",
    titleLines: [
      { text: "Бережное очищение" },
      { text: "и сияние кожи", accent: true }
    ],
    description:
      "Hydrating Cleanser, AOX Serum и Exfoliating Polish для гладкой, свежей и визуально более сияющей кожи.",
    buttonLabel: "Смотреть ZO",
    action: { type: "product", productId: "zo-hydrating-cleanser" },
    sceneImage: {
      src: "/hero/gm-hero-zo-routine.png",
      tabletSrc: "/hero/gm-hero-zo-tablet.jpg",
      mobileSrc: "/hero/gm-hero-zo-mobile.jpg",
      alt: "Три средства ZO Skin Health: очищающее средство, сыворотка и полиш для домашнего ухода.",
      position: "72% center"
    },
    featuredProducts: zoHeroProducts
  },
  {
    id: "angio-routine",
    theme: "amber",
    kicker: "Angiopharm",
    titleLines: [
      { text: "Восстановление" },
      { text: "и защита каждый день", accent: true }
    ],
    description:
      "Ceramide Repair Cream, Vitamin C Serum и Sunscreen Fluid SPF 30 для спокойного дневного ритуала с комфортом и защитой.",
    buttonLabel: "Открыть подборку",
    action: { type: "product", productId: "angio-ceramide-restoring-cream" },
    sceneImage: {
      src: "/hero/gm-hero-angio-routine.png",
      tabletSrc: "/hero/gm-hero-daily-tablet.jpg",
      mobileSrc: "/hero/gm-hero-daily-mobile.jpg",
      alt: "Три средства Angiopharm: восстанавливающий крем, витаминная сыворотка и солнцезащитный флюид.",
      position: "70% center"
    },
    featuredProducts: angioDailyHeroProducts
  },
  {
    id: "sensitive",
    theme: "sage",
    kicker: "Чувствительная кожа",
    titleLines: [
      { text: "Деликатный уход" },
      { text: "для чувствительной кожи", accent: true }
    ],
    description:
      "Мягкие формулы и спокойные текстуры, которые помогают сохранить комфорт, баланс и ощущение ухоженности.",
    buttonLabel: "Смотреть уходы",
    action: { type: "product", productId: "angio-anti-couperose-serum" },
    sceneImage: {
      src: "/hero/gm-hero-sensitive-care.jpg",
      tabletSrc: "/hero/gm-hero-sensitive-tablet.jpg",
      mobileSrc: "/hero/gm-hero-sensitive-mobile.jpg",
      alt: "Средства Angiopharm Anti Couperose и Azelaine Soft Cream для чувствительной кожи.",
      position: "right center"
    },
    featuredProducts: sensitiveHeroProducts
  },
  {
    id: "recovery",
    theme: "sky",
    kicker: "GM Beauty Cabinet",
    titleLines: [
      { text: "Восстановление" },
      { text: "после процедур", accent: true }
    ],
    description:
      "Домашний уход, который поддерживает кожу между визитами к специалисту и помогает не перегружать ежедневную рутину.",
    buttonLabel: "Смотреть подборку",
    action: { type: "product", productId: "angio-pdrn-restoring-serum" },
    sceneImage: {
      src: "/hero/gm-hero-recovery-desktop.jpg",
      tabletSrc: "/hero/gm-hero-recovery-tablet.jpg",
      mobileSrc: "/hero/gm-hero-recovery-mobile.jpg",
      alt: "Средства Angiopharm с церамидами, ПДРН и восстанавливающая маска для ухода после процедур.",
      position: "right center"
    },
    featuredProducts: recoveryHeroProducts
  }
];

function TopbarFavoriteIcon() {
  return (
    <svg className="topbar-action-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 20.4 4.9 13.6a4.8 4.8 0 0 1-.6-6.4 4.7 4.7 0 0 1 6.9-.4L12 7.7l.8-.9a4.7 4.7 0 0 1 6.9.4 4.8 4.8 0 0 1-.6 6.4Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function TopbarProfileIcon() {
  return (
    <svg className="topbar-action-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 12a4 4 0 1 0-4-4 4 4 0 0 0 4 4m-6.4 7.2a7.7 7.7 0 0 1 12.8 0"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

function TopbarCartIcon() {
  return (
    <svg className="topbar-action-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M8 7h12l-1.6 7.2a1 1 0 0 1-1 .8H10.4a1 1 0 0 1-1-.8L7.4 4H4"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
      <circle cx="10.5" cy="18.5" r="1.3" fill="currentColor" />
      <circle cx="17" cy="18.5" r="1.3" fill="currentColor" />
    </svg>
  );
}

function BenefitDoctorIcon() {
  return (
    <svg className="benefit-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 4.6 7.1 6.5v4.8c0 3.7 2 6.3 4.9 7.7 2.9-1.4 4.9-4 4.9-7.7V6.5Z"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.45"
      />
      <path
        d="M12 8.7v4.6M9.7 11h4.6"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.45"
      />
    </svg>
  );
}

function BenefitCosmeticsIcon() {
  return (
    <svg className="benefit-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M10.4 5.1h3.2M11.1 3.9h1.8"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.35"
      />
      <path
        d="M9.3 6.4h5.4a1.6 1.6 0 0 1 1.6 1.6v8.3a2.7 2.7 0 0 1-2.7 2.7h-3.2a2.7 2.7 0 0 1-2.7-2.7V8a1.6 1.6 0 0 1 1.6-1.6Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.4"
      />
      <path
        d="M9.5 10h5"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.35"
      />
    </svg>
  );
}

function BenefitRecoveryIcon() {
  return (
    <svg className="benefit-icon" viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 5.1s-4.2 4.4-4.2 7.7a4.2 4.2 0 1 0 8.4 0C16.2 9.5 12 5.1 12 5.1Z"
        fill="none"
        stroke="currentColor"
        strokeLinejoin="round"
        strokeWidth="1.45"
      />
      <path
        d="M10 15.1c.5.6 1.2.9 2 .9"
        fill="none"
        stroke="currentColor"
        strokeLinecap="round"
        strokeWidth="1.25"
      />
    </svg>
  );
}

function renderBenefitIcon(icon: (typeof benefits)[number]["icon"]) {
  if (icon === "doctor") {
    return <BenefitDoctorIcon />;
  }

  if (icon === "cosmetics") {
    return <BenefitCosmeticsIcon />;
  }

  return <BenefitRecoveryIcon />;
}

function getDefaultPriceRange(): PriceRange {
  return { ...catalogPriceBounds };
}

function toggleSelection<T>(items: T[], value: T) {
  return items.includes(value) ? items.filter((item) => item !== value) : [...items, value];
}

function parseHash(hashValue: string): ViewState {
  const hash = hashValue.replace(/^#/, "");

  if (hash.startsWith("product/")) {
    return {
      page: "product",
      productId: decodeURIComponent(hash.slice("product/".length))
    };
  }

  if (hash === "cart") {
    return { page: "cart" };
  }

  if (hash === "favorites") {
    return { page: "favorites" };
  }

  if (hash === "catalog" || hash === "filters") {
    return { page: "catalog", anchor: hash };
  }

  if (hash === "categories" || hash === "concerns" || hash === "doctor" || hash === "top") {
    return { page: "home", anchor: hash };
  }

  return { page: "home", anchor: "top" };
}

function readCartFromStorage(): CartLine[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(CART_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter(
      (item): item is CartLine =>
        typeof item === "object" &&
        item !== null &&
        typeof item.productId === "string" &&
        typeof item.quantity === "number"
    );
  } catch {
    return [];
  }
}

function readFavoritesFromStorage(): string[] {
  if (typeof window === "undefined") {
    return [];
  }

  try {
    const raw = window.localStorage.getItem(FAVORITES_STORAGE_KEY);

    if (!raw) {
      return [];
    }

    const parsed = JSON.parse(raw);

    if (!Array.isArray(parsed)) {
      return [];
    }

    return parsed.filter((item): item is string => typeof item === "string");
  } catch {
    return [];
  }
}

function App() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedBrands, setSelectedBrands] = useState<string[]>([]);
  const [selectedCategories, setSelectedCategories] = useState<ProductCategory[]>([]);
  const [selectedConcerns, setSelectedConcerns] = useState<string[]>([]);
  const [selectedSkinTypes, setSelectedSkinTypes] = useState<string[]>([]);
  const [selectedIngredients, setSelectedIngredients] = useState<string[]>([]);
  const [selectedTextures, setSelectedTextures] = useState<string[]>([]);
  const [selectedZones, setSelectedZones] = useState<string[]>([]);
  const [priceRange, setPriceRange] = useState<PriceRange>(() => getDefaultPriceRange());
  const [catalogSort, setCatalogSort] = useState<CatalogSortOption>("default");
  const [catalogViewMode, setCatalogViewMode] = useState<"three" | "two">("three");
  const [catalogPagination, setCatalogPagination] = useState({ page: 1, filterKey: "" });
  const [showOnlyAvailable, setShowOnlyAvailable] = useState(false);
  const [showOnlyPopular, setShowOnlyPopular] = useState(false);
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
  const [isTopbarMenuOpen, setIsTopbarMenuOpen] = useState(false);
  const [activeHeroSlide, setActiveHeroSlide] = useState(0);
  const [isHeroAutoplayPaused, setIsHeroAutoplayPaused] = useState(false);
  const [view, setView] = useState<ViewState>(() =>
    typeof window === "undefined" ? { page: "home", anchor: "top" } : parseHash(window.location.hash)
  );
  const [cart, setCart] = useState<CartLine[]>(() => readCartFromStorage());
  const [favorites, setFavorites] = useState<string[]>(() => readFavoritesFromStorage());

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const handleHashChange = () => {
      const nextView = parseHash(window.location.hash);
      if (nextView.page !== "catalog") {
        setIsFilterDrawerOpen(false);
      }
      setIsTopbarMenuOpen(false);
      setView(nextView);
    };

    handleHashChange();
    window.addEventListener("hashchange", handleHashChange);

    return () => {
      window.removeEventListener("hashchange", handleHashChange);
    };
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(cart));
  }, [cart]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    window.localStorage.setItem(FAVORITES_STORAGE_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return undefined;
    }

    const laptopQuery = window.matchMedia("(min-width: 1024px)");
    const closeMenuOnLaptop = () => {
      if (laptopQuery.matches) {
        setIsTopbarMenuOpen(false);
      }
    };

    closeMenuOnLaptop();
    laptopQuery.addEventListener("change", closeMenuOnLaptop);

    return () => {
      laptopQuery.removeEventListener("change", closeMenuOnLaptop);
    };
  }, []);

  useEffect(() => {
    if (!isSortMenuOpen || typeof document === "undefined") {
      return undefined;
    }

    const handlePointerDown = (event: MouseEvent) => {
      if (sortMenuRef.current && !sortMenuRef.current.contains(event.target as Node)) {
        setIsSortMenuOpen(false);
      }
    };

    document.addEventListener("mousedown", handlePointerDown);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
    };
  }, [isSortMenuOpen]);

  useEffect(() => {
    if ((!isFilterDrawerOpen && !isTopbarMenuOpen) || typeof document === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFilterDrawerOpen, isTopbarMenuOpen]);

  useEffect(() => {
    if ((!isFilterDrawerOpen && !isTopbarMenuOpen) || typeof document === "undefined") {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFilterDrawerOpen(false);
        setIsTopbarMenuOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFilterDrawerOpen, isTopbarMenuOpen]);

  useEffect(() => {
    if (typeof window === "undefined" || view.page !== "home" || isHeroAutoplayPaused) {
      return;
    }

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      return;
    }

    const intervalId = window.setInterval(() => {
      setActiveHeroSlide((current) => (current + 1) % homeHeroSlides.length);
    }, 5600);

    return () => {
      window.clearInterval(intervalId);
    };
  }, [isHeroAutoplayPaused, view.page]);

  useEffect(() => {
    if (typeof window === "undefined") {
      return;
    }

    if (view.page === "product" || view.page === "cart" || view.page === "favorites") {
      return;
    }

    const targetId =
      view.page === "home"
        ? view.anchor
        : view.anchor === "filters"
          ? "filters"
          : "catalog";

    window.setTimeout(() => {
      if (targetId === "top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      document.getElementById(targetId)?.scrollIntoView({ behavior: "smooth", block: "start" });
    }, 0);
  }, [view]);

  const visibleProducts = useMemo(
    () =>
      sortProducts(
        filterProducts(products, {
          search: searchQuery,
          brands: selectedBrands,
          categories: selectedCategories,
          concerns: selectedConcerns,
          skinTypes: selectedSkinTypes,
          ingredients: selectedIngredients,
          textures: selectedTextures,
          zones: selectedZones,
          priceRange
        })
          .filter((product) => !showOnlyAvailable || Boolean(product.imageUrl))
          .filter((product) => !showOnlyPopular || popularProductIds.has(product.id)),
        catalogSort
      ),
    [
      searchQuery,
      selectedBrands,
      selectedCategories,
      selectedConcerns,
      selectedSkinTypes,
      selectedIngredients,
      selectedTextures,
      selectedZones,
      priceRange,
      catalogSort,
      showOnlyAvailable,
      showOnlyPopular
    ]
  );

  const catalogFilterKey = JSON.stringify({
    searchQuery,
    selectedBrands,
    selectedCategories,
    selectedConcerns,
    selectedSkinTypes,
    selectedIngredients,
    selectedTextures,
    selectedZones,
    priceRange,
    catalogSort,
    showOnlyAvailable,
    showOnlyPopular
  });
  const catalogPageCount = Math.max(1, Math.ceil(visibleProducts.length / CATALOG_PAGE_SIZE));
  const activeCatalogPage =
    catalogPagination.filterKey === catalogFilterKey
      ? Math.min(catalogPagination.page, catalogPageCount)
      : 1;
  const paginatedProducts = visibleProducts.slice(
    (activeCatalogPage - 1) * CATALOG_PAGE_SIZE,
    activeCatalogPage * CATALOG_PAGE_SIZE
  );

  const doctorChoiceProducts = useMemo(
    () =>
      doctorChoiceIds
        .map((id) => products.find((item) => item.id === id))
        .filter((item): item is ProductItem => Boolean(item)),
    []
  );

  const categoryShowcase = useMemo(
    () =>
      showcaseCategories.map((item) => {
        const meta = categories.find((entry) => entry.id === item.id);
        const product =
          products.find((entry) => entry.category === item.id && entry.imageUrl) ??
          products.find((entry) => entry.category === item.id) ??
          products[0];
        const count = products.filter((entry) => entry.category === item.id).length;

        return {
          id: item.id,
          label: meta?.label ?? item.id,
          description: item.description,
          count,
          product
        };
      }),
    []
  );

  const cartItems = useMemo(
    () =>
      cart
        .map((line) => {
          const product = getProductById(products, line.productId);

          if (!product) {
            return null;
          }

          return {
            product,
            quantity: line.quantity
          };
        })
        .filter((item): item is { product: ProductItem; quantity: number } => Boolean(item)),
    [cart]
  );

  const cartCount = useMemo(
    () => cart.reduce((sum, line) => sum + line.quantity, 0),
    [cart]
  );

  const cartSubtotal = useMemo(
    () => cartItems.reduce((sum, item) => sum + item.product.price * item.quantity, 0),
    [cartItems]
  );

  const cartQuantityById = useMemo(
    () => new Map(cart.map((item) => [item.productId, item.quantity] as const)),
    [cart]
  );

  const favoriteIds = useMemo(() => new Set(favorites), [favorites]);

  const favoriteProducts = useMemo(
    () =>
      favorites
        .map((productId) => getProductById(products, productId))
        .filter((item): item is ProductItem => Boolean(item)),
    [favorites]
  );

  const favoritesCount = favoriteProducts.length;

  const currentProduct = useMemo(
    () => (view.page === "product" ? getProductById(products, view.productId) : undefined),
    [view]
  );

  const relatedProducts = useMemo(
    () => (currentProduct ? getRelatedProducts(products, currentProduct, 4) : []),
    [currentProduct]
  );

  const recommendedProducts = useMemo(
    () => getRecommendedProducts(products, cart.map((item) => item.productId), 4),
    [cart]
  );

  const activeFilters = [
    searchQuery ? `Поиск: ${searchQuery}` : null,
    ...selectedCategories.map((item) => {
      const label = categories.find((entry) => entry.id === item)?.label ?? item;
      return `Категория: ${label}`;
    }),
    ...selectedSkinTypes.map((item) => `Тип кожи: ${item}`),
    ...selectedConcerns.map((item) => `Проблема: ${item}`),
    ...selectedBrands.map((item) => `Бренд: ${item}`),
    ...selectedIngredients.map((item) => `Актив: ${item}`),
    ...selectedTextures.map((item) => `Текстура: ${item}`),
    ...selectedZones.map((item) => `Зона: ${item}`),
    priceRange.min !== catalogPriceBounds.min || priceRange.max !== catalogPriceBounds.max
      ? `Цена: ${formatPrice(priceRange.min)} - ${formatPrice(priceRange.max)} ₽`
      : null
  ].filter((item): item is string => Boolean(item));
  const hasCatalogToolbarMeta = activeFilters.length > 0 || showOnlyAvailable || showOnlyPopular;

  const updateHash = (nextHash: string, shouldScrollToAnchor = false) => {
    if (typeof window === "undefined") {
      return;
    }

    const currentHash = window.location.hash.replace(/^#/, "");

    if (currentHash !== nextHash) {
      window.location.assign(`#${nextHash}`);
      return;
    }

    if (!shouldScrollToAnchor) {
      return;
    }

    window.requestAnimationFrame(() => {
      if (nextHash === "top") {
        window.scrollTo({ top: 0, behavior: "smooth" });
        return;
      }

      document.getElementById(nextHash)?.scrollIntoView({ behavior: "smooth", block: "start" });
    });
  };

  const goToHome = (anchor: HomeAnchor = "top") => {
    setIsFilterDrawerOpen(false);
    setIsTopbarMenuOpen(false);
    updateHash(anchor, true);
    setView({ page: "home", anchor });
  };

  const goToCatalog = (anchor: CatalogAnchor = "catalog") => {
    setIsTopbarMenuOpen(false);
    updateHash(anchor, true);
    setView({ page: "catalog", anchor });
  };

  const goToCatalogPage = (page: number) => {
    const nextPage = Math.max(1, Math.min(page, catalogPageCount));

    if (nextPage === activeCatalogPage) {
      return;
    }

    setCatalogPagination({ page: nextPage, filterKey: catalogFilterKey });
    window.setTimeout(() => {
      document.getElementById("catalog-products")?.scrollIntoView({
        behavior: "smooth",
        block: "start"
      });
    }, 0);
  };

  const goToProduct = (productId: string) => {
    setIsFilterDrawerOpen(false);
    setIsTopbarMenuOpen(false);
    updateHash(`product/${productId}`);
    setView({ page: "product", productId });
    window.requestAnimationFrame(() => {
      window.scrollTo({ top: 0, behavior: "smooth" });
    });
  };

  const goToCart = () => {
    setIsFilterDrawerOpen(false);
    setIsTopbarMenuOpen(false);
    updateHash("cart");
    setView({ page: "cart" });
  };

  const showPrevHeroSlide = () => {
    setActiveHeroSlide((current) => (current - 1 + homeHeroSlides.length) % homeHeroSlides.length);
  };

  const showNextHeroSlide = () => {
    setActiveHeroSlide((current) => (current + 1) % homeHeroSlides.length);
  };

  const handleHeroAction = (slide: HomeHeroSlide) => {
    if (slide.action.type === "catalog") {
      goToCatalog(slide.action.anchor);
      return;
    }

    goToProduct(slide.action.productId);
  };

  const goToFavorites = () => {
    setIsFilterDrawerOpen(false);
    setIsTopbarMenuOpen(false);
    updateHash("favorites");
    setView({ page: "favorites" });
  };

  const handleConcernSelect = (value: string) => {
    setSearchQuery("");
    setSelectedConcerns([value]);
    setSelectedBrands([]);
    setSelectedCategories([]);
    setSelectedSkinTypes([]);
    setSelectedIngredients([]);
    setSelectedTextures([]);
    setSelectedZones([]);
    setShowOnlyAvailable(false);
    setShowOnlyPopular(false);
    setPriceRange(getDefaultPriceRange());
    goToCatalog("catalog");
  };

  const handleCategorySelect = (value: ProductCategory) => {
    setSearchQuery("");
    setSelectedConcerns([]);
    setSelectedCategories([value]);
    setSelectedBrands([]);
    setSelectedSkinTypes([]);
    setSelectedIngredients([]);
    setSelectedTextures([]);
    setSelectedZones([]);
    setShowOnlyAvailable(false);
    setShowOnlyPopular(false);
    setPriceRange(getDefaultPriceRange());
    goToCatalog("catalog");
  };

  const handleToggleBrand = (value: string) => {
    setSelectedBrands((current) => toggleSelection(current, value));
  };

  const handleToggleCategory = (value: ProductCategory) => {
    setSelectedCategories((current) => toggleSelection(current, value));
  };

  const handleToggleConcern = (value: string) => {
    setSelectedConcerns((current) => toggleSelection(current, value));
  };

  const handleToggleSkinType = (value: string) => {
    setSelectedSkinTypes((current) => toggleSelection(current, value));
  };

  const handleToggleIngredient = (value: string) => {
    setSelectedIngredients((current) => toggleSelection(current, value));
  };

  const handleToggleTexture = (value: string) => {
    setSelectedTextures((current) => toggleSelection(current, value));
  };

  const handleToggleZone = (value: string) => {
    setSelectedZones((current) => toggleSelection(current, value));
  };

  const handlePriceRangeChange = (nextRange: PriceRange) => {
    setPriceRange({
      min: Math.max(catalogPriceBounds.min, Math.min(nextRange.min, nextRange.max)),
      max: Math.min(catalogPriceBounds.max, Math.max(nextRange.max, nextRange.min))
    });
  };

  const handleResetFilters = () => {
    setSearchQuery("");
    setSelectedConcerns([]);
    setSelectedBrands([]);
    setSelectedCategories([]);
    setSelectedSkinTypes([]);
    setSelectedIngredients([]);
    setSelectedTextures([]);
    setSelectedZones([]);
    setShowOnlyAvailable(false);
    setShowOnlyPopular(false);
    setPriceRange(getDefaultPriceRange());
  };

  const handleAddToCart = (productId: string) => {
    setCart((currentCart) => {
      const existing = currentCart.find((item) => item.productId === productId);

      if (!existing) {
        return [...currentCart, { productId, quantity: 1 }];
      }

      return currentCart.map((item) =>
        item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
      );
    });
  };

  const handleIncreaseQuantity = (productId: string) => {
    setCart((currentCart) =>
      currentCart.map((item) =>
        item.productId === productId ? { ...item, quantity: item.quantity + 1 } : item
      )
    );
  };

  const handleDecreaseQuantity = (productId: string) => {
    setCart((currentCart) =>
      currentCart
        .map((item) =>
          item.productId === productId ? { ...item, quantity: item.quantity - 1 } : item
        )
        .filter((item) => item.quantity > 0)
    );
  };

  const handleRemoveFromCart = (productId: string) => {
    setCart((currentCart) => currentCart.filter((item) => item.productId !== productId));
  };

  const handleToggleFavorite = (productId: string) => {
    setFavorites((currentFavorites) =>
      currentFavorites.includes(productId)
        ? currentFavorites.filter((item) => item !== productId)
        : [productId, ...currentFavorites]
    );
  };

  const renderTopBar = () => (
    <header className={`topbar ${isTopbarMenuOpen ? "is-menu-open" : ""}`}>
      <button
        type="button"
        className="brand-mark brand-mark--button"
        aria-label="GM Beauty: перейти на главную"
        onClick={() => goToHome("top")}
      >
        <picture className="brand-mark-media">
          <source media="(min-width: 1024px)" srcSet="/brand/gm-logo-wordmark.png" />
          <img className="brand-mark-image" src="/brand/gm-logo-mobile-wordmark.png" alt="" />
        </picture>
        <span>GM Beauty</span>
        <small>домашний уход</small>
      </button>

      <nav className="topbar-nav" aria-label="Основная навигация">
        {navigation.map((item) => (
          <button
            key={`${item.page}-${item.anchor}`}
            type="button"
            onClick={() =>
              item.page === "catalog" ? goToCatalog(item.anchor) : goToHome(item.anchor)
            }
          >
            {item.label}
          </button>
        ))}
      </nav>

      <div className="topbar-actions">
        <button
          type="button"
          className={`topbar-action-button topbar-action-button--favorites ${view.page === "favorites" ? "is-active" : ""}`}
          onClick={goToFavorites}
          aria-label="Избранное"
        >
          <TopbarFavoriteIcon />
          <span className="topbar-action-label">Избранное</span>
          {favoritesCount > 0 ? <span className="topbar-count-badge topbar-count-badge--favorites">{favoritesCount}</span> : null}
        </button>
        <button type="button" className="topbar-action-button" aria-label="Профиль">
          <TopbarProfileIcon />
          <span className="topbar-action-label">Профиль</span>
        </button>
        <button
          type="button"
          className={`topbar-cart-button ${view.page === "cart" ? "is-active" : ""}`}
          onClick={goToCart}
          aria-label="Корзина"
        >
          <TopbarCartIcon />
          <span className="topbar-action-label">Корзина</span>
          {cartCount > 0 ? <span className="topbar-count-badge topbar-count-badge--cart">{cartCount > 99 ? "99+" : cartCount}</span> : null}
        </button>
      </div>

      <button
        type="button"
        className="topbar-menu-button"
        aria-label={isTopbarMenuOpen ? "Закрыть меню" : "Открыть меню"}
        aria-expanded={isTopbarMenuOpen}
        aria-controls="topbar-mobile-menu"
        onClick={() => setIsTopbarMenuOpen((isOpen) => !isOpen)}
      >
        <span />
        <span />
        <span />
      </button>

      <button
        type="button"
        className="topbar-menu-backdrop"
        aria-label="Закрыть меню"
        onClick={() => setIsTopbarMenuOpen(false)}
      />

      <div
        id="topbar-mobile-menu"
        className="topbar-mobile-menu"
        aria-hidden={!isTopbarMenuOpen}
      >
        <p className="topbar-mobile-menu-kicker">GM Beauty</p>
        <div className="topbar-mobile-menu-list" aria-label="Мобильная навигация">
          {navigation.map((item) => (
            <button
              key={`mobile-${item.page}-${item.anchor}`}
              type="button"
              className="topbar-mobile-menu-item"
              onClick={() =>
                item.page === "catalog" ? goToCatalog(item.anchor) : goToHome(item.anchor)
              }
            >
              <span>{item.label}</span>
            </button>
          ))}
        </div>

        <div className="topbar-mobile-actions" aria-label="Разделы пользователя">
          <button
            type="button"
            className={`topbar-mobile-action topbar-mobile-action--favorites ${view.page === "favorites" ? "is-active" : ""}`}
            onClick={goToFavorites}
          >
            <TopbarFavoriteIcon />
            <span>Избранное</span>
            {favoritesCount > 0 ? <span className="topbar-count-badge topbar-count-badge--favorites">{favoritesCount}</span> : null}
          </button>
          <button
            type="button"
            className="topbar-mobile-action"
            onClick={() => setIsTopbarMenuOpen(false)}
          >
            <TopbarProfileIcon />
            <span>Профиль</span>
          </button>
          <button
            type="button"
            className={`topbar-mobile-action topbar-mobile-action--cart ${view.page === "cart" ? "is-active" : ""}`}
            onClick={goToCart}
          >
            <TopbarCartIcon />
            <span>Корзина</span>
            {cartCount > 0 ? <span className="topbar-count-badge topbar-count-badge--cart">{cartCount > 99 ? "99+" : cartCount}</span> : null}
          </button>
        </div>
      </div>
    </header>
  );

  if (view.page === "product") {
    if (!currentProduct) {
      return (
        <div className="page-shell" id="top">
          <main className="page page--catalog">
            {renderTopBar()}
            <section className="section-card section-card--soft empty-state">
              <p className="section-kicker">Товар не найден</p>
              <h1>Эта карточка пока недоступна</h1>
              <p>Вернем тебя обратно в каталог, чтобы можно было продолжить выбор без потери ритма.</p>
              <button type="button" className="button-primary" onClick={() => goToCatalog("catalog")}>
                Вернуться в каталог
              </button>
            </section>
          </main>
        </div>
      );
    }

    return (
      <div className="page-shell" id="top">
        <main className="page">
          {renderTopBar()}
          <ProductDetailView
            product={currentProduct}
            relatedProducts={relatedProducts}
            cartQuantityById={cartQuantityById}
            favoriteIds={favoriteIds}
            isFavorite={favoriteIds.has(currentProduct.id)}
            onBack={() => goToCatalog("catalog")}
            onAddToCart={handleAddToCart}
            onDecreaseCart={handleDecreaseQuantity}
            onOpenCart={goToCart}
            onOpenProduct={goToProduct}
            onToggleFavorite={handleToggleFavorite}
          />
        </main>
      </div>
    );
  }

  if (view.page === "favorites") {
    return (
      <div className="page-shell" id="top">
        <main className="page page--catalog">
          {renderTopBar()}
          <FavoritesView
            items={favoriteProducts}
            cartQuantityById={cartQuantityById}
            favoriteIds={favoriteIds}
            onBack={() => goToCatalog("catalog")}
            onOpenProduct={goToProduct}
            onOpenCart={goToCart}
            onAddToCart={handleAddToCart}
            onDecreaseCart={handleDecreaseQuantity}
            onToggleFavorite={handleToggleFavorite}
          />
        </main>
      </div>
    );
  }

  if (view.page === "cart") {
    return (
      <div className="page-shell" id="top">
        <main className="page">
          {renderTopBar()}
          <CartView
            items={cartItems}
            subtotal={cartSubtotal}
            totalItems={cartCount}
            recommendations={recommendedProducts}
            cartQuantityById={cartQuantityById}
            favoriteIds={favoriteIds}
            onBack={() => goToCatalog("catalog")}
            onOpenProduct={goToProduct}
            onOpenCart={goToCart}
            onAddToCart={handleAddToCart}
            onIncrease={handleIncreaseQuantity}
            onDecrease={handleDecreaseQuantity}
            onRemove={handleRemoveFromCart}
            onToggleFavorite={handleToggleFavorite}
          />
        </main>
      </div>
    );
  }

  if (view.page === "catalog") {
    return (
      <div className="page-shell" id="top">
        <main className="page">
          {renderTopBar()}

          <section className="section-card catalog-hero-card">
            <div className="catalog-hero-copy">
              <h1>Каталог домашнего ухода</h1>
              <p>Профессиональные средства, подобранные по потребностям кожи и рекомендациям специалистов GM BEAUTY.</p>
            </div>
          </section>

          <section className="catalog-layout" id="catalog">
            <aside className="catalog-sidebar">
              <FilterBar
                searchQuery={searchQuery}
                selectedBrands={selectedBrands}
                selectedCategories={selectedCategories}
                selectedConcerns={selectedConcerns}
                selectedSkinTypes={selectedSkinTypes}
                selectedIngredients={selectedIngredients}
                selectedTextures={selectedTextures}
                selectedZones={selectedZones}
                brandOptions={brandOptions}
                skinTypeOptions={skinTypeOptions}
                ingredientOptions={ingredientOptions}
                textureOptions={textureOptions}
                zoneOptions={zoneOptions}
                quickQueries={quickQueries}
                priceBounds={catalogPriceBounds}
                priceRange={priceRange}
                onSearchChange={setSearchQuery}
                onBrandToggle={handleToggleBrand}
                onCategoryToggle={handleToggleCategory}
                onConcernToggle={handleToggleConcern}
                onSkinTypeToggle={handleToggleSkinType}
                onIngredientToggle={handleToggleIngredient}
                onTextureToggle={handleToggleTexture}
                onZoneToggle={handleToggleZone}
                onPriceChange={handlePriceRangeChange}
                onReset={handleResetFilters}
              />
            </aside>

            <div className="catalog-main">
              <div
                className={`filter-drawer-overlay ${isFilterDrawerOpen ? "is-open" : ""}`}
                role="presentation"
                onClick={() => setIsFilterDrawerOpen(false)}
              >
                <aside
                  className="filter-drawer"
                  role="dialog"
                  aria-modal="true"
                  aria-label="Фильтры каталога"
                  onClick={(event) => event.stopPropagation()}
                >
                  <FilterBar
                    searchQuery={searchQuery}
                    selectedBrands={selectedBrands}
                    selectedCategories={selectedCategories}
                    selectedConcerns={selectedConcerns}
                    selectedSkinTypes={selectedSkinTypes}
                    selectedIngredients={selectedIngredients}
                    selectedTextures={selectedTextures}
                    selectedZones={selectedZones}
                    brandOptions={brandOptions}
                    skinTypeOptions={skinTypeOptions}
                    ingredientOptions={ingredientOptions}
                    textureOptions={textureOptions}
                    zoneOptions={zoneOptions}
                    quickQueries={quickQueries}
                    priceBounds={catalogPriceBounds}
                    priceRange={priceRange}
                    onClose={() => setIsFilterDrawerOpen(false)}
                    onSearchChange={setSearchQuery}
                    onBrandToggle={handleToggleBrand}
                    onCategoryToggle={handleToggleCategory}
                    onConcernToggle={handleToggleConcern}
                    onSkinTypeToggle={handleToggleSkinType}
                    onIngredientToggle={handleToggleIngredient}
                    onTextureToggle={handleToggleTexture}
                    onZoneToggle={handleToggleZone}
                    onPriceChange={handlePriceRangeChange}
                    onReset={handleResetFilters}
                  />
                </aside>
              </div>

              <div className={`catalog-toolbar ${!hasCatalogToolbarMeta ? "catalog-toolbar--empty" : ""}`}>
                <div className="catalog-toolbar-left">
                  {activeFilters.length > 0 ? (
                    <div className="active-filters">
                      {activeFilters.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                  ) : null}
                </div>

                <div className="catalog-toolbar-meta">
                  <button
                    type="button"
                    className="button-secondary catalog-filters-button"
                    onClick={() => setIsFilterDrawerOpen(true)}
                  >
                    Фильтры
                  </button>

                  <div className="catalog-toolbar-controls">
                    <button
                      type="button"
                      className={`catalog-quick-toggle ${showOnlyAvailable ? "is-active" : ""}`}
                      aria-pressed={showOnlyAvailable}
                      onClick={() => setShowOnlyAvailable((current) => !current)}
                    >
                      В наличии
                    </button>
                    <button
                      type="button"
                      className={`catalog-quick-toggle ${showOnlyPopular ? "is-active" : ""}`}
                      aria-pressed={showOnlyPopular}
                      onClick={() => setShowOnlyPopular((current) => !current)}
                    >
                      Популярные
                    </button>
                  </div>

                  {hasCatalogToolbarMeta ? (
                    <div className="catalog-results-meta">
                      <p>{visibleProducts.length} товаров найдено</p>
                    </div>
                  ) : null}

                  <button
                    type="button"
                    className={`catalog-view-trigger ${catalogViewMode === "two" ? "is-active" : ""}`}
                    aria-label={catalogViewMode === "three" ? "Переключить каталог на 2 колонки" : "Переключить каталог на 3 колонки"}
                    onClick={() =>
                      setCatalogViewMode((current) => (current === "three" ? "two" : "three"))
                    }
                  >
                    <svg viewBox="0 0 24 24" aria-hidden="true">
                      {catalogViewMode === "three" ? (
                        <>
                          <rect x="4" y="5" width="4" height="14" rx="1.2" />
                          <rect x="10" y="5" width="4" height="14" rx="1.2" />
                          <rect x="16" y="5" width="4" height="14" rx="1.2" />
                        </>
                      ) : (
                        <>
                          <rect x="5" y="5" width="5.5" height="14" rx="1.2" />
                          <rect x="13.5" y="5" width="5.5" height="14" rx="1.2" />
                        </>
                      )}
                    </svg>
                  </button>

                  <div className={`catalog-sort ${isSortMenuOpen ? "is-open" : ""}`} ref={sortMenuRef}>
                    <button
                      type="button"
                      className="catalog-sort-trigger"
                      aria-label={`Сортировка: ${catalogSortOptions.find((option) => option.value === catalogSort)?.label ?? "По умолчанию"}`}
                      aria-haspopup="menu"
                      aria-expanded={isSortMenuOpen}
                      onClick={() => setIsSortMenuOpen((current) => !current)}
                    >
                      <svg viewBox="0 0 24 24" aria-hidden="true">
                        <path
                          d="M4 7h10M4 12h7M4 17h4m11-10v10m0 0-3-3m3 3 3-3"
                          fill="none"
                          stroke="currentColor"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="1.9"
                        />
                      </svg>
                    </button>

                    {isSortMenuOpen ? (
                      <div className="catalog-sort-menu" role="menu">
                        {catalogSortOptions.map((option) => (
                          <button
                            key={option.value}
                            type="button"
                            role="menuitemradio"
                            aria-checked={catalogSort === option.value}
                            className={`catalog-sort-option ${catalogSort === option.value ? "is-active" : ""}`}
                            onClick={() => {
                              setCatalogSort(option.value);
                              setIsSortMenuOpen(false);
                            }}
                          >
                            {option.label}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>
                </div>
              </div>

              <section className="catalog-grid" id="catalog-products" data-view={catalogViewMode}>
                {paginatedProducts.map((product) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    variant="spotlight"
                    badgeText={getCategoryLabel(product.category)}
                    cartQuantity={cartQuantityById.get(product.id) ?? 0}
                    isFavorite={favoriteIds.has(product.id)}
                    onAddToCart={handleAddToCart}
                    onDecreaseCart={handleDecreaseQuantity}
                    onOpen={goToProduct}
                    onOpenCart={goToCart}
                    onToggleFavorite={handleToggleFavorite}
                  />
                ))}
              </section>

              {catalogPageCount > 1 ? (
                <nav className="catalog-pagination" aria-label="Страницы каталога">
                  <button
                    type="button"
                    className="catalog-pagination-nav"
                    disabled={activeCatalogPage === 1}
                    onClick={() => goToCatalogPage(activeCatalogPage - 1)}
                    aria-label="Предыдущая страница"
                  >
                    <span aria-hidden="true">←</span>
                    <span className="catalog-pagination-label">Назад</span>
                  </button>

                  <div className="catalog-pagination-pages">
                    {Array.from({ length: catalogPageCount }, (_, index) => index + 1).map((page) => (
                      <button
                        key={page}
                        type="button"
                        className={`catalog-pagination-page ${activeCatalogPage === page ? "is-active" : ""}`}
                        aria-label={`Страница ${page}`}
                        aria-current={activeCatalogPage === page ? "page" : undefined}
                        onClick={() => goToCatalogPage(page)}
                      >
                        {page}
                      </button>
                    ))}
                  </div>

                  <button
                    type="button"
                    className="catalog-pagination-nav"
                    disabled={activeCatalogPage === catalogPageCount}
                    onClick={() => goToCatalogPage(activeCatalogPage + 1)}
                    aria-label="Следующая страница"
                  >
                    <span className="catalog-pagination-label">Далее</span>
                    <span aria-hidden="true">→</span>
                  </button>
                </nav>
              ) : null}
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="page-shell" id="top">
      <main className="page page--home">
        {renderTopBar()}

        <section
          className="hero-card"
          aria-label="Главный баннер"
          aria-roledescription="carousel"
          onMouseEnter={() => setIsHeroAutoplayPaused(true)}
          onMouseLeave={() => setIsHeroAutoplayPaused(false)}
          onFocusCapture={() => setIsHeroAutoplayPaused(true)}
          onBlurCapture={(event) => {
            if (!event.currentTarget.contains(event.relatedTarget as Node | null)) {
              setIsHeroAutoplayPaused(false);
            }
          }}
        >
          <div className="sr-only" aria-live="polite">
            {`Слайд ${activeHeroSlide + 1} из ${homeHeroSlides.length}: ${homeHeroSlides[activeHeroSlide]?.titleLines
              .map((line) => line.text)
              .join(" ")}`}
          </div>
          <div className="hero-rotator">
            <button
              type="button"
              className="hero-nav-button hero-nav-button--prev"
              aria-label="Показать предыдущий слайд"
              onClick={showPrevHeroSlide}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="m14.5 5.5-6 6 6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
            </button>
            <button
              type="button"
              className="hero-nav-button hero-nav-button--next"
              aria-label="Показать следующий слайд"
              onClick={showNextHeroSlide}
            >
              <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
                <path
                  d="m9.5 5.5 6 6-6 6"
                  fill="none"
                  stroke="currentColor"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="1.8"
                />
              </svg>
            </button>
            <div
              className="hero-track"
              style={{ transform: `translateX(-${activeHeroSlide * 100}%)` }}
            >
              {homeHeroSlides.map((slide, index) => {
                const isActive = index === activeHeroSlide;
                const featuredProducts = slide.featuredProducts ?? slide.products ?? [];
                const HeadingTag = index === 0 ? "h1" : "h2";

                return (
                  <article
                    key={slide.id}
                    className={`hero-slide hero-slide--${slide.theme} ${slide.sceneImage ? "hero-slide--scene" : "hero-slide--products"}`}
                    role="group"
                    aria-label={`Слайд ${index + 1} из ${homeHeroSlides.length}`}
                    aria-hidden={!isActive}
                  >
                  <div className="hero-slide-copy">
                    <p className="hero-slide-kicker">{slide.kicker}</p>
                    <HeadingTag className="hero-slide-title">
                      {slide.titleLines.map((line) => (
                        <span
                          key={line.text}
                          className={`hero-slide-title-line ${line.accent ? "is-accent" : ""}`}
                        >
                          {line.text}
                        </span>
                      ))}
                    </HeadingTag>
                    <p className="hero-slide-description">{slide.description}</p>

                    <div className="hero-actions hero-slide-actions">
                      <button
                        type="button"
                        className="button-primary hero-slide-button"
                        onClick={() => handleHeroAction(slide)}
                        tabIndex={isActive ? 0 : -1}
                      >
                        {slide.buttonLabel}
                      </button>
                    </div>

                    {featuredProducts.length > 0 ? (
                      <div className="hero-slide-product-links" aria-label="Товары в слайде">
                        {featuredProducts.map((product) => (
                          <button
                            key={product.id}
                            type="button"
                            className="hero-slide-product-link"
                            onClick={() => goToProduct(product.id)}
                            tabIndex={isActive ? 0 : -1}
                          >
                            {product.name}
                          </button>
                        ))}
                      </div>
                    ) : null}
                  </div>

                  <div
                    className={`hero-slide-visual ${slide.sceneImage ? "hero-slide-visual--scene" : ""}`}
                  >
                    {slide.sceneImage ? (
                      <div className="hero-slide-scene">
                        <picture className="hero-slide-scene-picture">
                          {slide.sceneImage.mobileSrc ? (
                            <source media="(max-width: 767px)" srcSet={slide.sceneImage.mobileSrc} />
                          ) : null}
                          {slide.sceneImage.tabletSrc ? (
                            <source
                              media="(min-width: 768px) and (max-width: 1023px)"
                              srcSet={slide.sceneImage.tabletSrc}
                            />
                          ) : null}
                          <img
                            className="hero-slide-scene-image"
                            src={slide.sceneImage.src}
                            alt={slide.sceneImage.alt}
                            style={{ objectPosition: slide.sceneImage.position ?? "center" }}
                          />
                        </picture>
                      </div>
                    ) : (
                      slide.products?.map((product, productIndex) => (
                        <button
                          key={product.id}
                          type="button"
                          className="hero-slide-product"
                          data-slot={productIndex + 1}
                          onClick={() => goToProduct(product.id)}
                          aria-label={`Открыть ${product.name}`}
                          tabIndex={isActive ? 0 : -1}
                        >
                          <img src={product.imageUrl} alt="" />
                        </button>
                      ))
                    )}
                  </div>

                  <div className="hero-slide-mobile-actions">
                    <button
                      type="button"
                      className="button-primary hero-slide-button"
                      onClick={() => handleHeroAction(slide)}
                      tabIndex={isActive ? 0 : -1}
                    >
                      {slide.buttonLabel}
                    </button>
                  </div>

                  <button
                    type="button"
                    className="hero-slide-mobile-link"
                    aria-label={`${slide.buttonLabel}: ${slide.titleLines.map((line) => line.text).join(" ")}`}
                    onClick={() => handleHeroAction(slide)}
                    tabIndex={isActive ? 0 : -1}
                  >
                    <span className="sr-only">{slide.buttonLabel}</span>
                  </button>
                  </article>
                );
              })}
            </div>

            <div className="hero-pagination" aria-label="Слайды баннера">
              {homeHeroSlides.map((slide, index) => (
                <button
                  key={slide.id}
                  type="button"
                  className={`hero-pagination-dot ${index === activeHeroSlide ? "is-active" : ""}`}
                  aria-label={`Показать слайд ${index + 1}`}
                  aria-pressed={index === activeHeroSlide}
                  onClick={() => setActiveHeroSlide(index)}
                />
              ))}
            </div>
          </div>
        </section>

        <section className="benefits-row">
          {benefits.map((item) => (
            <article key={item.title} className="benefit-card">
              <div className="benefit-copy">
                <div className="benefit-head">
                  <span className="benefit-icon-wrap" aria-hidden="true">
                    {renderBenefitIcon(item.icon)}
                  </span>
                  <h3>{item.title}</h3>
                </div>
                <p>{item.text}</p>
              </div>
            </article>
          ))}
        </section>

        <section className="section-card" id="categories">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Популярные категории</p>
              <h2>Собрали каталог в понятные сценарии ухода</h2>
            </div>
            <p>
              На главной остается только легкая витрина: категории, запросы кожи и несколько
              стартовых рекомендаций без длинного каталога ниже.
            </p>
          </div>

          <div className="category-showcase">
            {categoryShowcase.map((item) => (
              <article key={item.id} className="category-card">
                <div
                  className="category-card-media"
                >
                  {item.product.imageUrl ? (
                    <img src={item.product.imageUrl} alt={item.product.name} loading="lazy" />
                  ) : (
                    <span>{item.label}</span>
                  )}
                </div>

                <div className="category-card-copy">
                  <p>{item.count} позиций</p>
                  <h3>{item.label}</h3>
                  <p>{item.description}</p>
                  <button type="button" onClick={() => handleCategorySelect(item.id)}>
                    Открыть категорию
                  </button>
                </div>
              </article>
            ))}
          </div>

          <div className="concern-strip" id="concerns" aria-label="Быстрые сценарии ухода">
            {quickQueries.map((item) => (
              <button key={item} type="button" onClick={() => handleConcernSelect(item)}>
                {item}
              </button>
            ))}
          </div>
        </section>

        <section className="section-card section-card--soft doctor-section" id="doctor">
          <div className="section-heading">
            <div>
              <p className="section-kicker">Выбор врача</p>
              <h2>Рекомендовано врачами</h2>
            </div>
            <p>
              Средства, которые специалисты выбирают для мягкого и уверенного старта: деликатные
              формулы, понятные сценарии ухода и ощущение профессиональной заботы каждый день.
            </p>
          </div>

          <div className="doctor-grid">
            {doctorChoiceProducts.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                variant="spotlight"
                badgeText="Выбор врача"
                cartQuantity={cartQuantityById.get(product.id) ?? 0}
                isFavorite={favoriteIds.has(product.id)}
                onAddToCart={handleAddToCart}
                onDecreaseCart={handleDecreaseQuantity}
                onOpen={goToProduct}
                onOpenCart={goToCart}
                onToggleFavorite={handleToggleFavorite}
              />
            ))}
          </div>
        </section>
      </main>
    </div>
  );
}

export default App;
