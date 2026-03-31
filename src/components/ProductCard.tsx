import { useState } from "react";
import { formatPrice, getCategoryLabel } from "../lib/catalog";
import type { ProductItem } from "../types";

type ProductCardProps = {
  product: ProductItem;
  variant?: "default" | "compact" | "spotlight";
  badgeText?: string;
  actionLabel?: string;
  cartQuantity?: number;
  isFavorite?: boolean;
  onOpen?: (productId: string) => void;
  onAddToCart?: (productId: string) => void;
  onDecreaseCart?: (productId: string) => void;
  onOpenCart?: () => void;
  onToggleFavorite?: (productId: string) => void;
};

function getInitials(brand: string) {
  return brand
    .split(" ")
    .map((item) => item[0])
    .join("")
    .slice(0, 3)
    .toUpperCase();
}

function CartIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" focusable="false">
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

export default function ProductCard({
  product,
  variant = "default",
  badgeText,
  actionLabel = "Подробнее",
  cartQuantity = 0,
  isFavorite = false,
  onOpen,
  onAddToCart,
  onDecreaseCart,
  onOpenCart,
  onToggleFavorite
}: ProductCardProps) {
  const [hasImageError, setHasImageError] = useState(false);
  const showImage = Boolean(product.imageUrl) && !hasImageError;
  const currentBadge = badgeText ?? getCategoryLabel(product.category);
  const visibleConcerns = product.concern.slice(0, variant === "spotlight" ? 1 : 2);
  const isInCart = cartQuantity > 0;
  const displayQuantity = cartQuantity > 99 ? "99+" : String(cartQuantity);
  const handleOpen = () => onOpen?.(product.id);

  return (
    <article className={`product-card product-card--${variant} ${isInCart ? "is-in-cart" : ""}`}>
      <div className="product-media">
        <span className="product-badge">{currentBadge}</span>

        {onToggleFavorite ? (
          <button
            type="button"
            className={`product-favorite-button ${isFavorite ? "is-active" : ""}`}
            aria-label={isFavorite ? `Убрать ${product.name} из избранного` : `Добавить ${product.name} в избранное`}
            aria-pressed={isFavorite}
            onClick={(event) => {
              event.stopPropagation();
              onToggleFavorite(product.id);
            }}
          >
            <FavoriteIcon filled={isFavorite} />
          </button>
        ) : null}

        {onOpen ? (
          <button
            type="button"
            className="product-media-button"
            aria-label={`Открыть ${product.brand} ${product.name}`}
            onClick={handleOpen}
          >
            {showImage ? (
              <img
                src={product.imageUrl}
                alt={`${product.brand} ${product.name}`}
                loading="lazy"
                decoding="async"
                onError={() => setHasImageError(true)}
              />
            ) : (
              <span className="product-fallback">{getInitials(product.brand)}</span>
            )}
          </button>
        ) : (
          <>
            {showImage ? (
              <img
                src={product.imageUrl}
                alt={`${product.brand} ${product.name}`}
                loading="lazy"
                decoding="async"
                onError={() => setHasImageError(true)}
              />
            ) : (
              <span className="product-fallback">{getInitials(product.brand)}</span>
            )}
          </>
        )}
      </div>

      <div className="product-body">
        <div className="product-copy">
          <p className="product-brand">
            {product.brand} <span>{product.country}</span>
          </p>

          <h3 className="product-title" title={product.name}>
            {onOpen ? (
              <button type="button" className="product-title-button" onClick={handleOpen}>
                {product.name}
              </button>
            ) : (
              product.name
            )}
          </h3>

          {variant === "default" ? (
            <>
              <p className="product-description">{product.shortDescription}</p>
              <div className="product-tags">
                {visibleConcerns.map((item) => (
                  <span key={item} title={item}>
                    {item}
                  </span>
                ))}
              </div>
            </>
          ) : (
            <p className="product-focus" title={visibleConcerns.join(" • ")}>
              {visibleConcerns.join(" • ")}
            </p>
          )}
        </div>

        <footer className="product-footer">
          <div className="product-pricing">
            <strong>{formatPrice(product.price)} ₽</strong>
            <p>{product.volume}</p>
          </div>

          <div className="product-actions">
            {onAddToCart ? (
              isInCart ? (
                <div className="product-cart-control" role="group" aria-label={`Количество ${product.name} в корзине`}>
                  <button
                    type="button"
                    className="product-cart-step"
                    aria-label={`Добавить еще один ${product.name}`}
                    onClick={() => onAddToCart(product.id)}
                  >
                    +
                  </button>

                  <button
                    type="button"
                    className="product-cart-main"
                    aria-label={`Открыть корзину, выбрано ${displayQuantity}`}
                    onClick={() => onOpenCart?.()}
                  >
                    <span className="product-cart-icon">
                      <CartIcon />
                    </span>
                    <span className="product-cart-count">{displayQuantity}</span>
                  </button>

                  <button
                    type="button"
                    className="product-cart-step"
                    aria-label={`Уменьшить количество ${product.name} на один`}
                    onClick={() => onDecreaseCart?.(product.id)}
                  >
                    -
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  className="product-add-button"
                  aria-label={`Добавить ${product.name} в корзину`}
                  onClick={() => onAddToCart(product.id)}
                >
                  +
                </button>
              )
            ) : null}

            <button type="button" className="product-open-button" onClick={() => onOpen?.(product.id)}>
              {actionLabel}
            </button>
          </div>
        </footer>
      </div>
    </article>
  );
}
