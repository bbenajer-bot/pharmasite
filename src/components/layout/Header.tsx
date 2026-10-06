'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Menu, Phone, ShoppingBag, X } from 'lucide-react'

import { useCart } from '@/components/shop/cart-store'
import { nav } from '@/lib/site'
import { Logo } from './Logo'

/** Client component: business details come in as props from the (server) layout. */
export function Header({ site }: { site: { name: string; phone: string; phoneHref: string } }) {
  const [open, setOpen] = useState(false)
  const pathname = usePathname()
  const { count: cartCount } = useCart()

  // Close the mobile menu whenever the route changes.
  useEffect(() => setOpen(false), [pathname])

  return (
    <header className="sticky top-0 z-40 border-b border-line bg-white/90 backdrop-blur">
      <div className="container-page flex h-16 items-center justify-between gap-4">
        <Link href="/" className="shrink-0" aria-label={`${site.name} home`}>
          <Logo name={site.name} />
        </Link>

        <nav aria-label="Main" className="hidden lg:block">
          <ul className="flex items-center gap-1">
            {nav.map((item) => {
              const active = pathname === item.href || pathname.startsWith(`${item.href}/`)
              return (
                <li key={item.href}>
                  <Link
                    href={item.href}
                    aria-current={active ? 'page' : undefined}
                    className={`rounded-full px-3 py-2 text-sm font-medium transition-colors ${
                      active ? 'bg-brand-50 text-brand-700' : 'text-ink-soft hover:text-ink'
                    }`}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>
        </nav>

        <div className="flex items-center gap-2">
          <a
            href={site.phoneHref}
            className="hidden items-center gap-2 whitespace-nowrap text-sm font-semibold text-ink-soft hover:text-ink xl:flex"
          >
            <Phone className="size-4" aria-hidden />
            {site.phone}
          </a>
          <Link
            href="/cart"
            className="relative rounded-full p-2 text-ink-soft hover:bg-brand-50 hover:text-ink"
            aria-label={cartCount ? `Cart, ${cartCount} ${cartCount === 1 ? 'item' : 'items'}` : 'Cart'}
          >
            <ShoppingBag className="size-5" aria-hidden />
            {cartCount > 0 && (
              <span
                aria-hidden
                className="absolute -top-0.5 -right-0.5 flex min-w-5 items-center justify-center rounded-full bg-brand-600 px-1 text-xs font-semibold text-white"
              >
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </Link>
          <Link href="/prescriptions" className="btn btn-primary hidden sm:inline-flex">
            Request a prescription
          </Link>
          <button
            type="button"
            className="rounded-full p-2 text-ink lg:hidden"
            aria-expanded={open}
            aria-controls="mobile-menu"
            aria-label={open ? 'Close menu' : 'Open menu'}
            onClick={() => setOpen((v) => !v)}
          >
            {open ? <X className="size-6" aria-hidden /> : <Menu className="size-6" aria-hidden />}
          </button>
        </div>
      </div>

      {open && (
        <nav
          id="mobile-menu"
          aria-label="Mobile"
          className="border-t border-line bg-white lg:hidden"
        >
          <ul className="container-page flex flex-col py-3">
            {nav.map((item) => (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className="block rounded-lg px-2 py-3 text-base font-medium text-ink hover:bg-brand-50"
                >
                  {item.label}
                </Link>
              </li>
            ))}
            <li className="mt-2 flex flex-col gap-2 border-t border-line pt-4">
              <Link href="/prescriptions" className="btn btn-primary">
                Request a prescription
              </Link>
              <a href={site.phoneHref} className="btn btn-secondary">
                <Phone className="size-4" aria-hidden /> Call {site.phone}
              </a>
            </li>
          </ul>
        </nav>
      )}
    </header>
  )
}
