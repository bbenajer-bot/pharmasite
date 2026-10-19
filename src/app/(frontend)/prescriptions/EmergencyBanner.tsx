import { Siren } from 'lucide-react'

/** Required on every prescription form page, above the form. */
export function EmergencyBanner() {
  return (
    <div
      role="note"
      aria-label="Emergency warning"
      className="flex gap-3 rounded-2xl border border-red-200 bg-red-50 p-5 text-red-950"
    >
      <Siren className="mt-0.5 size-6 shrink-0 text-red-700" aria-hidden />
      <p>
        <strong>Not for emergencies.</strong> If you have a medical emergency, call{' '}
        <a href="tel:911" className="font-bold underline">
          911
        </a>{' '}
        or go to the nearest emergency room. Requests are reviewed during business hours.
      </p>
    </div>
  )
}
