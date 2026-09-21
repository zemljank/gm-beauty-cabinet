import { useState } from "react";
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
  const [isListOpen, setIsListOpen] = useState(false);
  const [copyStatus, setCopyStatus] = useState("");
  const orderText = [
    "Здравствуйте! Хочу уточнить наличие и заказать средства:",
    ...items.map(({ product, quantity }, index) => `${index + 1}. ${product.brand} ${product.name}, ${product.volume} — ${quantity} шт. × ${formatPrice(product.price)} ₽`),
    `Сумма по каталогу: ${formatPrice(subtotal)} ₽.`,
    "Подскажите, пожалуйста, актуальную стоимость и условия получения."
  ].join("\n");
  const copyOrder = async () => {
    try {
      await navigator.clipboard.writeText(orderText);
      setCopyStatus("Список скопирован. Теперь его можно отправить администратору.");
    } catch {
      setCopyStatus("Выделите и скопируйте текст из поля ниже.");
    }
  };

  const shareOrder = async () => {
    try {
      await navigator.share({ title: "Мой список GM BEAUTY", text: orderText });
    } catch (error) {
      if (!(error instanceof DOMException && error.name === "AbortError")) {
        setCopyStatus("Не удалось открыть отправку. Скопируйте список и отправьте его администратору.");
      }
    }
  };

  if (items.length === 0) {
    return (
      <section className="cart-shell section-card section-card--soft">
        <div className="empty-state">
          <p className="section-kicker">Корзина</p>
          <h1>В корзине пока нет средств</h1>
          <p>
            Добавьте средства из каталога. Здесь можно изменить количество, проверить сумму
            и подготовить список для администратора.
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
                  <button type="button" aria-label={`Увеличить количество ${product.name}`} onClick={() => onIncrease(product.id)}>
                    +
                  </button>
                  <span>{quantity}</span>
                  <button type="button" aria-label={`Уменьшить количество ${product.name}`} onClick={() => onDecrease(product.id)}>
                    -
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
            <h2>Ваш список</h2>

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
                <strong>Уточняется</strong>
              </p>
            </div>

            <div className="cart-summary-total">
              <span>Сумма товаров</span>
              <strong>{formatPrice(subtotal)} ₽</strong>
            </div>

            <p className="cart-summary-note">Наличие, итоговую стоимость и условия получения подтвердит администратор.</p>
            <button type="button" className="button-primary cart-submit-button" aria-expanded={isListOpen} aria-controls="order-list" onClick={() => setIsListOpen((open) => !open)}>
              {isListOpen ? "Скрыть список" : "Подготовить список"}
            </button>
            {isListOpen && <div id="order-list" className="order-list">
              <label htmlFor="order-text">Список для администратора</label>
              <textarea id="order-text" readOnly value={orderText} rows={9} onFocus={(event) => event.currentTarget.select()} />
              {typeof navigator.share === "function" && <button type="button" className="button-primary" onClick={shareOrder}>Поделиться списком</button>}
              <button type="button" className="button-secondary" onClick={copyOrder}>Скопировать список</button>
              <p role="status">{copyStatus}</p>
              <a className="content-link" href="https://gm-beauty.ru/" target="_blank" rel="noreferrer">Перейти на сайт клиники ↗</a>
            </div>}
          </aside>
        </div>
      </section>

      <section className="section-card section-card--soft">
        <div className="section-heading">
          <div>
            <p className="section-kicker">Добавить к заказу</p>
            <h2>Посмотрите также</h2>
          </div>
          <p>
            Посмотрите другие средства каталога. Откройте карточку, чтобы изучить описание
            и решить, что добавить в свой список.
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
