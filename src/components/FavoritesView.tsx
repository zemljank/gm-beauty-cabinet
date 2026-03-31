import ProductCard from "./ProductCard";
import type { ProductItem } from "../types";

type FavoritesViewProps = {
  items: ProductItem[];
  cartQuantityById: Map<string, number>;
  favoriteIds: Set<string>;
  onBack: () => void;
  onOpenProduct: (productId: string) => void;
  onOpenCart: () => void;
  onAddToCart: (productId: string) => void;
  onDecreaseCart: (productId: string) => void;
  onToggleFavorite: (productId: string) => void;
};

export default function FavoritesView({
  items,
  cartQuantityById,
  favoriteIds,
  onBack,
  onOpenProduct,
  onOpenCart,
  onAddToCart,
  onDecreaseCart,
  onToggleFavorite
}: FavoritesViewProps) {
  if (items.length === 0) {
    return (
      <div className="favorites-page">
        <section className="section-card catalog-hero-card favorites-hero-card">
          <div className="catalog-hero-copy">
            <h1>Избранное</h1>
            <p>Сохраняй интересные позиции из каталога, чтобы быстро вернуться к ним позже и спокойно собрать персональный заказ.</p>
          </div>
        </section>

        <section className="section-card section-card--soft empty-state favorites-empty-state">
          <div className="favorites-empty-copy">
            <h1>Пока пусто</h1>
            <p>
              Добавь несколько средств из каталога, и здесь появится спокойная подборка, к которой удобно возвращаться перед оформлением заказа.
            </p>
            <button type="button" className="button-primary" onClick={onBack}>
              Перейти в каталог
            </button>
          </div>
        </section>
      </div>
    );
  }

  return (
    <div className="favorites-page">
      <section className="section-card catalog-hero-card favorites-hero-card">
        <div className="catalog-hero-copy">
          <h1>Избранное</h1>
          <p>Сохраняй интересные позиции, сравнивай их между собой и в один момент переноси нужные средства в корзину.</p>
        </div>
      </section>

      <section className="favorites-main">
        <div className="catalog-toolbar favorites-toolbar">
          <div className="catalog-toolbar-left">
            <div className="active-filters">
              <span>{items.length} позиций в избранном</span>
            </div>
          </div>

          <div className="catalog-toolbar-meta">
            <button type="button" className="button-secondary favorites-back-button" onClick={onBack}>
              Продолжить выбор
            </button>
          </div>
        </div>

        <div className="catalog-grid favorites-grid">
          {items.map((product) => (
            <ProductCard
              key={product.id}
              product={product}
              variant="spotlight"
              cartQuantity={cartQuantityById.get(product.id) ?? 0}
              isFavorite={favoriteIds.has(product.id)}
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
