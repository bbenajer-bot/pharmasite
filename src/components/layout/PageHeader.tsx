import type { ReactNode } from 'react'

/** Title band at the top of inner pages. Holds the page's single h1. */
export function PageHeader({
  eyebrow,
  title,
  children,
}: {
  eyebrow: string
  title: string
  children?: ReactNode
}) {
  return (
    <section className="bg-gradient-to-b from-brand-50 to-white">
      <div className="container-page py-16 md:py-20">
        <p className="eyebrow">{eyebrow}</p>
        <h1 className="mt-3 max-w-3xl text-4xl font-bold sm:text-5xl">{title}</h1>
        {children && <div className="mt-5 max-w-2xl text-lg text-ink-soft">{children}</div>}
      </div>
    </section>
  )
}
