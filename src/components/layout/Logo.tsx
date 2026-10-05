import { site } from '@/lib/site'

/** Text + icon logo. The mark is a rounded pharmacy cross; swap for a real logo file later if desired. */
export function Logo({ inverted = false }: { inverted?: boolean }) {
  return (
    <span className="flex items-center gap-2.5">
      <svg viewBox="0 0 32 32" className="size-8" aria-hidden>
        <rect
          width="32"
          height="32"
          rx="9"
          className={inverted ? 'fill-white' : 'fill-brand-600'}
        />
        <path
          d="M13.5 8.5h5a1 1 0 0 1 1 1v4h4a1 1 0 0 1 1 1v5a1 1 0 0 1-1 1h-4v4a1 1 0 0 1-1 1h-5a1 1 0 0 1-1-1v-4h-4a1 1 0 0 1-1-1v-5a1 1 0 0 1 1-1h4v-4a1 1 0 0 1 1-1Z"
          className={inverted ? 'fill-brand-600' : 'fill-white'}
        />
      </svg>
      <span
        className={`font-display text-lg font-bold leading-none tracking-tight ${
          inverted ? 'text-white' : 'text-ink'
        }`}
      >
        {site.name}
      </span>
    </span>
  )
}
