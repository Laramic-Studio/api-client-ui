import { Heart, ShoppingCart, Sparkles } from "lucide-react";
import { cn } from "@/lib/utils";

function formatPrice(product) {
  if (!product) return "";
  const amount = product.price ?? (product.priceCents / 100);
  return new Intl.NumberFormat(undefined, {
    style: "currency",
    currency: product.currency || "USD",
  }).format(amount);
}

export default function ProductCard({
  product,
  onAddToCart,
  onAddToWishlist,
  inCart = false,
  inWishlist = false,
  compact = false,
  loadingAction = null,
}) {
  if (!product) return null;

  const disabled = !product.inStock;

  return (
    <div
      className={cn(
        "rounded-lg border border-[hsl(var(--border))] bg-[hsl(var(--card))] overflow-hidden",
        compact ? "flex gap-3 p-2" : "flex flex-col",
      )}
    >
      {product.imageUrl && (
        <div className={cn("shrink-0 bg-[hsl(var(--muted))]", compact ? "h-16 w-16 rounded-md overflow-hidden" : "h-28 w-full")}>
          <img
            src={product.imageUrl}
            alt={product.name}
            className="h-full w-full object-cover"
            loading="lazy"
          />
        </div>
      )}
      <div className={cn("min-w-0 flex flex-col", compact ? "flex-1 py-0.5" : "p-3 gap-2")}>
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <div className="text-[13px] font-medium text-foreground truncate">{product.name}</div>
            {!compact && product.description && (
              <p className="text-[11px] text-muted-foreground line-clamp-2 mt-1">{product.description}</p>
            )}
          </div>
          <div className="text-[12px] font-geom font-medium shrink-0">{formatPrice(product)}</div>
        </div>
        <div className="flex items-center gap-1.5 mt-auto pt-1">
          <button
            type="button"
            disabled={disabled || loadingAction === `cart:${product.id}`}
            onClick={() => onAddToCart?.(product)}
            className="h-7 px-2 rounded-md text-[11px] font-medium bg-[hsl(var(--brand))] hover:bg-[#4F46E5] text-white inline-flex items-center gap-1 disabled:opacity-50"
          >
            <ShoppingCart className="h-3 w-3" />
            {inCart ? "In cart" : "Add to cart"}
          </button>
          <button
            type="button"
            disabled={loadingAction === `wish:${product.id}`}
            onClick={() => onAddToWishlist?.(product)}
            className={cn(
              "h-7 w-7 grid place-items-center rounded-md border border-[hsl(var(--border))] hover:bg-accent/50",
              inWishlist && "text-[hsl(var(--danger))] border-[hsl(var(--danger))]/40",
            )}
            title={inWishlist ? "In wishlist" : "Add to wishlist"}
          >
            <Heart className={cn("h-3.5 w-3.5", inWishlist && "fill-current")} />
          </button>
          {product.featured && (
            <span className="ml-auto text-[10px] uppercase tracking-wider text-[hsl(var(--brand))] inline-flex items-center gap-0.5">
              <Sparkles className="h-3 w-3" /> Featured
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export { formatPrice };
