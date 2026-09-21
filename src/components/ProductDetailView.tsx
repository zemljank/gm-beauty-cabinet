import ProductCard from "./ProductCard";
import { formatPrice, getCategoryLabel } from "../lib/catalog";
import type { ProductItem } from "../types";

type ProductDetailViewProps = {
  product: ProductItem;
  relatedProducts: ProductItem[];
  cartQuantityById: Map<string, number>;
  favoriteIds: Set<string>;
  isFavorite: boolean;
  onBack: () => void;
  onAddToCart: (productId: string) => void;
  onDecreaseCart: (productId: string) => void;
  onOpenCart: () => void;
  onOpenProduct: (productId: string) => void;
  onToggleFavorite: (productId: string) => void;
};

function FavoriteIcon({ filled = false }: { filled?: boolean }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
      <path
        d="M12 20.4 4.9 13.6a4.8 4.8 0 0 1-.6-6.4 4.7 4.7 0 0 1 6.9-.4L12 7.7l.8-.9a4.7 4.7 0 0 1 6.9.4 4.8 4.8 0 0 1-.6 6.4Z"
        fill={filled ? "currentColor" : "none"}
        stroke="currentColor"
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth="1.8"
      />
    </svg>
  );
}

export default function ProductDetailView({
  product,
  relatedProducts,
  cartQuantityById,
  favoriteIds,
  isFavorite,
  onBack,
  onAddToCart,
  onDecreaseCart,
  onOpenCart,
  onOpenProduct,
  onToggleFavorite
}: ProductDetailViewProps) {
  const routineCards = [
    {
      title: "Описание средства",
      text: product.shortDescription
    },
    {
      title: "Основной запрос кожи",
      text: product.concern.slice(0, 3).join(", ")
    },
    {
      title: "Формат средства",
      text: `${getCategoryLabel(product.category)} • ${product.volume} • ${product.country}`
    }
  ];

  return (
    <div className="detail-page">
      <section className="detail-shell">
        <button type="button" className="back-link" onClick={onBack}>
          <span>&lt;</span> Назад к каталогу
        </button>

        <div className="detail-layout">
          <div className="detail-media-panel">
            <div className="detail-media">
              {product.imageUrl ? (
                <img src={product.imageUrl} alt={`${product.brand} ${product.name}`} />
              ) : (
                <span>{product.brand}</span>
              )}
            </div>
          </div>

          <div className="detail-content">
            <p className="detail-brand">
              {product.brand} <span>{product.country}</span>
            </p>
            <h1>{product.name}</h1>
            <p className="detail-lead">{product.shortDescription}</p>

            <div className="detail-price-row">
              <strong>{formatPrice(product.price)} ₽</strong>
              <span>{product.volume}</span>
            </div>

            <div className="detail-chips">
              {product.concern.map((item) => (
                <span key={item}>{item}</span>
              ))}
            </div>

            <div className="detail-actions">
              <button type="button" className="button-primary" onClick={() => onAddToCart(product.id)}>
                {cartQuantityById.get(product.id) ? `Добавить ещё · в корзине ${cartQuantityById.get(product.id)}` : "Добавить в корзину"}
              </button>
              <button type="button" className="button-secondary" onClick={onOpenCart}>
                Открыть корзину
              </button>
              <button
                type="button"
                className={`button-secondary detail-favorite-button ${isFavorite ? "is-active" : ""}`}
                aria-pressed={isFavorite}
                onClick={() => onToggleFavorite(product.id)}
              >
                <FavoriteIcon filled={isFavorite} />
                <span>{isFavorite ? "В избранном" : "В избранное"}</span>
              </button>
            </div>

            <p className="detail-order-note">Наличие и актуальную стоимость уточнит администратор при заказе.</p>
            <div className="detail-facts">
              <article>
                <span>Бренд</span>
                <strong>{product.brand}</strong>
              </article>
              <article>
                <span>Категория</span>
                <strong>{getCategoryLabel(product.category)}</strong>
              </article>
              <article>
                <span>Объем</span>
                <strong>{product.volume}</strong>
              </article>
            </div>
          </div>
        </div>
      </section>

      <section className="detail-section section-card section-card--soft">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Карточка товара</p>
            <h2>Как встроить средство в домашний уход</h2>
          </div>
          <p>
            Сравните назначение и формат средства с вашим текущим уходом.
            Способ и частоту применения уточняйте по инструкции на упаковке.
          </p>
        </div>

        <div className="detail-routine-grid">
          {routineCards.map((item) => (
            <article key={item.title} className="detail-routine-card">
              <p>{item.title}</p>
              <h3>{item.text}</h3>
            </article>
          ))}
        </div>
      </section>

      <section className="detail-section section-card">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Продолжить выбор</p>
            <h2>Вам также может быть интересно</h2>
          </div>
          <p>
            Другие средства того же бренда, категории или со схожими задачами.
            Откройте карточки и сравните описания.
          </p>
        </div>

        <div className="detail-related-grid">
          {relatedProducts.map((item) => (
            <ProductCard
              key={item.id}
              product={item}
              variant="spotlight"
              badgeText="Рекомендуем"
              actionLabel="Открыть"
              cartQuantity={cartQuantityById.get(item.id) ?? 0}
              isFavorite={favoriteIds.has(item.id)}
              onAddToCart={onAddToCart}
              onDecreaseCart={onDecreaseCart}
              onOpen={onOpenProduct}
              onOpenCart={onOpenCart}
              onToggleFavorite={onToggleFavorite}
            />
          ))}
        </div>
      </section>
    </div>
  );
}
