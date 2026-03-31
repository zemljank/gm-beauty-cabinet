import { categories } from "../data/products";
import { formatPrice } from "../lib/catalog";
import type { PriceRange, ProductCategory } from "../types";

const categoryOptions = categories.filter((item) => item.id !== "all");
const PRICE_STEP = 100;

type FilterBarProps = {
  searchQuery: string;
  selectedBrands: string[];
  selectedCategories: ProductCategory[];
  selectedConcerns: string[];
  selectedSkinTypes: string[];
  selectedIngredients: string[];
  selectedTextures: string[];
  selectedZones: string[];
  brandOptions: readonly string[];
  skinTypeOptions: readonly string[];
  ingredientOptions: readonly string[];
  textureOptions: readonly string[];
  zoneOptions: readonly string[];
  quickQueries: readonly string[];
  priceBounds: PriceRange;
  priceRange: PriceRange;
  onBrandToggle: (value: string) => void;
  onCategoryToggle: (value: ProductCategory) => void;
  onConcernToggle: (value: string) => void;
  onSkinTypeToggle: (value: string) => void;
  onIngredientToggle: (value: string) => void;
  onTextureToggle: (value: string) => void;
  onZoneToggle: (value: string) => void;
  onPriceChange: (nextRange: PriceRange) => void;
  onSearchChange: (value: string) => void;
  onReset: () => void;
};

type FilterOptionProps = {
  isActive: boolean;
  label: string;
  onClick: () => void;
};

function FilterOption({ isActive, label, onClick }: FilterOptionProps) {
  return (
    <button
      type="button"
      className={`filter-option-button ${isActive ? "is-active" : ""}`}
      onClick={onClick}
    >
      <span className="filter-option-box" aria-hidden="true" />
      <span>{label}</span>
    </button>
  );
}

export default function FilterBar({
  searchQuery,
  selectedBrands,
  selectedCategories,
  selectedConcerns,
  selectedSkinTypes,
  selectedIngredients,
  selectedTextures,
  selectedZones,
  brandOptions,
  skinTypeOptions,
  ingredientOptions,
  textureOptions,
  zoneOptions,
  quickQueries,
  priceBounds,
  priceRange,
  onBrandToggle,
  onCategoryToggle,
  onConcernToggle,
  onSkinTypeToggle,
  onIngredientToggle,
  onTextureToggle,
  onZoneToggle,
  onPriceChange,
  onSearchChange,
  onReset
}: FilterBarProps) {
  const range = Math.max(priceBounds.max - priceBounds.min, 1);
  const leftPercent = ((priceRange.min - priceBounds.min) / range) * 100;
  const rightPercent = 100 - ((priceRange.max - priceBounds.min) / range) * 100;

  const handleMinChange = (value: number) => {
    onPriceChange({
      min: Math.min(Math.max(value, priceBounds.min), priceRange.max),
      max: priceRange.max
    });
  };

  const handleMaxChange = (value: number) => {
    onPriceChange({
      min: priceRange.min,
      max: Math.max(Math.min(value, priceBounds.max), priceRange.min)
    });
  };

  return (
    <section className="filter-shell" id="filters">
      <div className="filter-header">
        <h2>Фильтры</h2>
        <button className="filter-reset" type="button" onClick={onReset} aria-label="Сбросить фильтры">
          <svg viewBox="0 0 24 24" aria-hidden="true">
            <path
              d="M4.5 7h9M4.5 12h12M4.5 17h8"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.55"
            />
            <path
              d="M16.5 6.5l3 3M19.5 6.5l-3 3"
              fill="none"
              stroke="currentColor"
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="1.55"
            />
          </svg>
        </button>
      </div>

      <label className="filter-search">
        <span className="filter-section-title">Поиск по товарам</span>
        <input
          type="search"
          value={searchQuery}
          onChange={(event) => onSearchChange(event.target.value)}
          placeholder="Название, бренд или задача кожи"
        />
      </label>

      <details className="filter-section" open>
        <summary>
          <span className="filter-section-title">Категории</span>
        </summary>

        <div className="filter-section-body filter-option-list">
          {categoryOptions.map((item) => {
            const categoryId = item.id as ProductCategory;
            return (
              <FilterOption
                key={item.id}
                isActive={selectedCategories.includes(categoryId)}
                label={item.label}
                onClick={() => onCategoryToggle(categoryId)}
              />
            );
          })}
        </div>
      </details>

      <details className="filter-section" open>
        <summary>
          <span className="filter-section-title">Тип кожи</span>
        </summary>

        <div className="filter-section-body filter-option-list">
          {skinTypeOptions.map((item) => (
            <FilterOption
              key={item}
              isActive={selectedSkinTypes.includes(item)}
              label={item}
              onClick={() => onSkinTypeToggle(item)}
            />
          ))}
        </div>
      </details>

      <details className="filter-section" open>
        <summary>
          <span className="filter-section-title">Проблемы кожи</span>
        </summary>

        <div className="filter-section-body filter-option-list">
          {quickQueries.map((item) => (
            <FilterOption
              key={item}
              isActive={selectedConcerns.includes(item)}
              label={item}
              onClick={() => onConcernToggle(item)}
            />
          ))}
        </div>
      </details>

      <details className="filter-section" open>
        <summary>
          <span className="filter-section-title">Бренд</span>
        </summary>

        <div className="filter-section-body filter-option-list">
          {brandOptions.map((item) => (
            <FilterOption
              key={item}
              isActive={selectedBrands.includes(item)}
              label={item}
              onClick={() => onBrandToggle(item)}
            />
          ))}
        </div>
      </details>

      <details className="filter-section" open>
        <summary>
          <span className="filter-section-title">Цена</span>
        </summary>

        <div className="filter-section-body">
          <div className="filter-price-values">
            <span>от {formatPrice(priceRange.min)} ₽</span>
            <span>до {formatPrice(priceRange.max)} ₽</span>
          </div>

          <div className="filter-price-slider">
            <span className="filter-price-rail" aria-hidden="true" />
            <span
              className="filter-price-progress"
              aria-hidden="true"
              style={{ left: `${leftPercent}%`, right: `${rightPercent}%` }}
            />
            <input
              className="filter-price-input filter-price-input--min"
              type="range"
              min={priceBounds.min}
              max={priceBounds.max}
              step={PRICE_STEP}
              value={priceRange.min}
              aria-label="Минимальная цена"
              onChange={(event) => handleMinChange(Number(event.target.value))}
            />
            <input
              className="filter-price-input filter-price-input--max"
              type="range"
              min={priceBounds.min}
              max={priceBounds.max}
              step={PRICE_STEP}
              value={priceRange.max}
              aria-label="Максимальная цена"
              onChange={(event) => handleMaxChange(Number(event.target.value))}
            />
          </div>

          <div className="filter-price-scale">
            <span>{formatPrice(priceBounds.min)} ₽</span>
            <span>{formatPrice(priceBounds.max)} ₽</span>
          </div>
        </div>
      </details>

      <details className="filter-section">
        <summary>
          <span className="filter-section-title">Активные компоненты</span>
        </summary>

        <div className="filter-section-body filter-option-list">
          {ingredientOptions.map((item) => (
            <FilterOption
              key={item}
              isActive={selectedIngredients.includes(item)}
              label={item}
              onClick={() => onIngredientToggle(item)}
            />
          ))}
        </div>
      </details>

      <details className="filter-section">
        <summary>
          <span className="filter-section-title">Текстура</span>
        </summary>

        <div className="filter-section-body filter-option-list">
          {textureOptions.map((item) => (
            <FilterOption
              key={item}
              isActive={selectedTextures.includes(item)}
              label={item}
              onClick={() => onTextureToggle(item)}
            />
          ))}
        </div>
      </details>

      <details className="filter-section">
        <summary>
          <span className="filter-section-title">Зона применения</span>
        </summary>

        <div className="filter-section-body filter-option-list">
          {zoneOptions.map((item) => (
            <FilterOption
              key={item}
              isActive={selectedZones.includes(item)}
              label={item}
              onClick={() => onZoneToggle(item)}
            />
          ))}
        </div>
      </details>
    </section>
  );
}
