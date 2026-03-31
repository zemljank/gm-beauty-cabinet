import ProductCard from "./ProductCard";
import { formatPrice } from "../lib/catalog";
import type { ProductItem } from "../types";

type CartLineView = {
  product: ProductItem;
  quantity: number;
};

type CartViewProps = {
  items: CartLineView[];
  subtotal: number;
  totalItems: number;
  recommendations: ProductItem[];
  cartQuantityById: Map<string, number>;
  favoriteIds: Set<string>;
  onBack: () => void;
  onOpenProduct: (productId: string) => void;
  onOpenCart: () => void;
  onAddToCart: (productId: string) => void;
  onIncrease: (productId: string) => void;
  onDecrease: (productId: string) => void;
  onRemove: (productId: string) => void;
  onToggleFavorite: (productId: string) => void;
};

export default function CartView({
  items,
  subtotal,
  totalItems,
  recommendations,
  cartQuantityById,
  favoriteIds,
  onBack,
  onOpenProduct,
  onOpenCart,
  onAddToCart,
  onIncrease,
  onDecrease,
  onRemove,
  onToggleFavorite
}: CartViewProps) {
  if (items.length === 0) {
    return (
      <section className="cart-shell section-card section-card--soft">
        <div className="empty-state">
          <p className="section-kicker">Корзина</p>
          <h1>Пока пусто</h1>
          <p>
            Добавь несколько средств из каталога, и здесь появится аккуратная корзина с
            рекомендациями к заказу.
          </p>
          <button type="button" className="button-primary" onClick={onBack}>
            Вернуться в каталог
          </button>
        </div>
      </section>
    );
  }

  return (
    <div className="cart-page">
      <section className="cart-shell section-card">
        <div className="section-heading section-heading--cart">
          <div>
            <p className="section-kicker">Корзина</p>
            <h1>Моя корзина</h1>
          </div>
          <button type="button" className="button-secondary" onClick={onBack}>
            Продолжить покупки
          </button>
        </div>

        <div className="cart-layout">
          <div className="cart-list">
            <div className="cart-table-head">
              <span>Товар</span>
              <span>Цена</span>
              <span>Количество</span>
              <span>Сумма</span>
            </div>

            {items.map(({ product, quantity }) => (
              <article key={product.id} className="cart-row">
                <button type="button" className="cart-item-card" onClick={() => onOpenProduct(product.id)}>
                  <div className="cart-thumb">
                    {product.imageUrl ? (
                      <img src={product.imageUrl} alt={product.name} />
                    ) : (
                      <span>{product.brand}</span>
                    )}
                  </div>

                  <div className="cart-item-copy">
                    <span>{product.brand}</span>
                    <strong>{product.name}</strong>
                    <p>{product.volume}</p>
                  </div>
                </button>

                <div className="cart-price">{formatPrice(product.price)} ₽</div>

                <div className="cart-qty-control">
                  <button type="button" onClick={() => onDecrease(product.id)}>
                    -
                  </button>
                  <span>{quantity}</span>
                  <button type="button" onClick={() => onIncrease(product.id)}>
                    +
                  </button>
                </div>

                <div className="cart-line-total">
                  <strong>{formatPrice(product.price * quantity)} ₽</strong>
                  <button type="button" onClick={() => onRemove(product.id)}>
                    Удалить
                  </button>
                </div>
              </article>
            ))}
          </div>

          <aside className="cart-summary">
            <h2>Ваш заказ</h2>

            <div className="cart-summary-lines">
              <p>
                <span>Позиции</span>
                <strong>{totalItems}</strong>
              </p>
              <p>
                <span>Итого</span>
                <strong>{formatPrice(subtotal)} ₽</strong>
              </p>
              <p>
                <span>Доставка</span>
                <strong>Бесплатно</strong>
              </p>
            </div>

            <div className="cart-summary-total">
              <span>Всего к оплате</span>
              <strong>{formatPrice(subtotal)} ₽</strong>
            </div>

            <button type="button" className="button-primary cart-submit-button">
              Оформить заказ
            </button>

            <label className="promo-field">
              <span>Промокод</span>
              <div>
                <input type="text" placeholder="Введите промокод" />
                <button type="button">Применить</button>
              </div>
            </label>
          </aside>
        </div>
      </section>

      <section className="section-card section-card--soft">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Добавить к заказу</p>
            <h2>Средства, которые хорошо дополняют корзину</h2>
          </div>
          <p>
            Этот блок продолжает механику интернет-магазина: из корзины можно не только
            оформить заказ, но и спокойно добавить еще несколько подходящих позиций.
          </p>
        </div>

        <div className="cart-recommendations-grid">
          {recommendations.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              variant="compact"
              badgeText="К заказу"
              actionLabel="Открыть"
              cartQuantity={cartQuantityById.get(product.id) ?? 0}
              isFavorite={favoriteIds.has(product.id)}
              onAddToCart={onAddToCart}
              onDecreaseCart={onDecrease}
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
