import Image from 'next/image'
import Link from 'next/link'
import { Package } from 'lucide-react'

import { formatUSD } from '@/lib/money'
import type { ProductImage, ProductSummary } from '@/lib/products'

/** Square product image, or a neutral placeholder when the product has no photo yet. */
export function ProductPhoto({
  image,
  sizes,
  priority = false,
  className = '',
}: {
  image: ProductImage | null
  sizes: string
  priority?: boolean
  className?: string
}) {
  return (
    <div
      className={`relative flex aspect-square items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-br from-brand-50 to-surface ${className}`}
    >
      {image ? (
        <Image
          src={image.url}
          alt={image.alt}
          fill
          sizes={sizes}
          priority={priority}
          className="object-contain p-4"
        />
      ) : (
        <Package className="size-14 text-ink/20" aria-hidden />
      )}
    </div>
  )
}

export function ProductCard({ product }: { product: ProductSummary }) {
  const outOfStock = product.stock <= 0
  return (
    <Link href={`/shop/${product.slug}`} className="group block">
      <ProductPhoto
        image={product.image}
        sizes="(min-width: 1024px) 25vw, (min-width: 640px) 50vw, 100vw"
        className="transition-transform group-hover:scale-[1.02]"
      />
      {product.category && (
        <p className="mt-4 text-xs font-medium uppercase tracking-wide text-muted">
          {product.category.name}
        </p>
      )}
      <h3 className={`font-semibold group-hover:text-brand-600 ${product.category ? 'mt-1' : 'mt-4'}`}>
        {product.name}
      </h3>
      <p className="mt-1 flex items-center gap-3">
        <span className="font-semibold text-ink-soft">{formatUSD(product.price)}</span>
        {outOfStock && (
          <span className="rounded-full bg-surface px-2 py-0.5 text-xs font-medium text-muted">
            Out of stock
          </span>
        )}
      </p>
    </Link>
  )
}
