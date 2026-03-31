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

const benefits = [
  {
    title: "Рекомендовано врачами",
    text: "Домашний уход собран вокруг понятных сценариев и проверенных брендов."
  },
  {
    title: "Профессиональная косметика",
    text: "В каталоге только актуальные позиции из твоего прайса и локальные фото товаров."
  },
  {
    title: "Уход после процедур",
    text: "Витрина уже подходит для клиники, кабинета косметолога и мягкого подбора средств."
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
  const [isSortMenuOpen, setIsSortMenuOpen] = useState(false);
  const sortMenuRef = useRef<HTMLDivElement | null>(null);
  const [isFilterDrawerOpen, setIsFilterDrawerOpen] = useState(false);
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
    if (!isFilterDrawerOpen || typeof document === "undefined") {
      return;
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = previousOverflow;
    };
  }, [isFilterDrawerOpen]);

  useEffect(() => {
    if (!isFilterDrawerOpen || typeof document === "undefined") {
      return undefined;
    }

    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsFilterDrawerOpen(false);
      }
    };

    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, [isFilterDrawerOpen]);

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
        }),
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
      catalogSort
    ]
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
    updateHash(anchor, true);
    setView({ page: "home", anchor });
  };

  const goToCatalog = (anchor: CatalogAnchor = "catalog") => {
    updateHash(anchor, true);
    setView({ page: "catalog", anchor });
  };

  const goToProduct = (productId: string) => {
    setIsFilterDrawerOpen(false);
    updateHash(`product/${productId}`);
    setView({ page: "product", productId });
  };

  const goToCart = () => {
    setIsFilterDrawerOpen(false);
    updateHash("cart");
    setView({ page: "cart" });
  };

  const goToFavorites = () => {
    setIsFilterDrawerOpen(false);
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
    <header className="topbar">
      <button
        type="button"
        className="brand-mark brand-mark--button"
        aria-label="GM Beauty: перейти на главную"
        onClick={() => goToHome("top")}
      >
        <img className="brand-mark-image" src="/brand/gm-logo-brand.png" alt="" />
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
          className={`topbar-action-button ${view.page === "favorites" ? "is-active" : ""}`}
          onClick={goToFavorites}
        >
          Избранное
          {favoritesCount > 0 ? <span className="topbar-button-badge">{favoritesCount}</span> : null}
        </button>
        <button type="button" className="topbar-action-button">
          Профиль
        </button>
        <button type="button" className="topbar-cart-button" onClick={goToCart}>
          Корзина
          <span>{cartCount}</span>
        </button>
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

              {activeFilters.length > 0 ? (
                <div className="catalog-toolbar">
                  <div className="catalog-toolbar-left">
                    <div className="active-filters">
                      {activeFilters.map((item) => (
                        <span key={item}>{item}</span>
                      ))}
                    </div>
                  </div>

                  <div className="catalog-toolbar-meta">
                    <button
                      type="button"
                      className="button-secondary catalog-filters-button"
                      onClick={() => setIsFilterDrawerOpen(true)}
                    >
                      Фильтры
                    </button>

                    <div className="catalog-results-meta">
                      <p>{visibleProducts.length} товаров найдено</p>
                    </div>

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
              ) : (
                <div className="catalog-toolbar catalog-toolbar--empty">
                  <div className="catalog-toolbar-left" />
                  <div className="catalog-toolbar-meta">
                    <button
                      type="button"
                      className="button-secondary catalog-filters-button"
                      onClick={() => setIsFilterDrawerOpen(true)}
                    >
                      Фильтры
                    </button>

                    <div className="catalog-results-meta">
                      <p>{visibleProducts.length} товаров найдено</p>
                    </div>

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
              )}

              <section className="catalog-grid">
                {visibleProducts.map((product) => (
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
            </div>
          </section>
        </main>
      </div>
    );
  }

  return (
    <div className="page-shell" id="top">
      <main className="page">
        {renderTopBar()}

        <section className="hero-card">
          <div className="hero-copy">
            <h1>Профессиональный домашний уход</h1>
            <p>Средства, подобранные с учетом потребностей Вашей кожи.</p>

            <div className="hero-actions">
              <button type="button" className="button-primary" onClick={() => goToCatalog("catalog")}>
                Перейти в каталог
              </button>
            </div>
          </div>
        </section>

        <section className="benefits-row">
          {benefits.map((item) => (
            <article key={item.title} className="benefit-card">
              <span className="benefit-dot" aria-hidden="true" />
              <div>
                <h3>{item.title}</h3>
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
              <h2>Стартовая подборка средств, с которых удобно начать</h2>
            </div>
            <p>
              Здесь остаются только рекомендованные позиции. Полная сетка с фильтрами и всем
              каталогом теперь живет на отдельной странице.
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
