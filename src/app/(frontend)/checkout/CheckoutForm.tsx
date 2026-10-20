'use client'

import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  cloneElement,
  useActionState,
  useEffect,
  useRef,
  useState,
  type ReactElement,
  type ReactNode,
} from 'react'
import { AlertTriangle, Lock, ShoppingBag } from 'lucide-react'

import { cart, useCart, useHydrated } from '@/components/shop/cart-store'
import { useCartSync } from '@/components/shop/useCartSync'
import { formatUSD, fromCents, toCents } from '@/lib/money'
import {
  fulfillmentFeeCents,
  fulfillmentOptions,
  labelOf,
  paymentMethods,
  PAYMENT_CANCEL_DAYS,
  type FeeSettings,
  type Fulfillment,
  type PaymentMethod,
} from '@/lib/shop'
import { placeOrder, type CheckoutFields, type CheckoutState } from './actions'

type Props = {
  fees: FeeSettings
  payment: PaymentMethod[]
  deliveryArea: string
  phone: string
  phoneHref: string
}

const initialState: CheckoutState = { status: 'idle' }

export function CheckoutForm({ fees, payment, deliveryArea, phone, phoneHref }: Props) {
  const router = useRouter()
  const hydrated = useHydrated()
  const { items, subtotalCents } = useCart()
  const { checking, notices } = useCartSync()
  const [state, formAction, pending] = useActionState(placeOrder, initialState)
  const [fulfillment, setFulfillment] = useState<Fulfillment | ''>(
    fees.fulfillment.length === 1 ? fees.fulfillment[0].value : '',
  )
  const alertRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (state.status === 'success' && state.token) {
      cart.clear()
      router.replace(`/order/${state.token}`)
    } else if (state.status === 'error') {
      alertRef.current?.focus()
    }
  }, [state, router])

  // Same height as the empty-cart box, so the footer doesn't jump once the cart loads.
  if (!hydrated) {
    return (
      <p className="flex min-h-60 items-center justify-center text-ink-soft">Loading checkout…</p>
    )
  }

  if (state.status === 'success') {
    return <p className="py-16 text-center text-ink-soft">Thank you. Opening your order…</p>
  }

  if (items.length === 0) {
    return (
      <div className="rounded-2xl border border-line p-10 text-center">
        <ShoppingBag className="mx-auto size-10 text-brand-600" aria-hidden />
        <p className="mt-4 text-lg font-semibold">Your cart is empty.</p>
        {notices.length > 0 && <p className="mt-2 text-ink-soft">{notices.join(' ')}</p>}
        <Link href="/shop" className="btn btn-primary mt-6">
          Browse the shop
        </Link>
      </div>
    )
  }

  const v = state.values
  const err = state.errors ?? {}
  const feeCents = fulfillment ? fulfillmentFeeCents(fees, fulfillment, subtotalCents) : null
  const needsAddress = fulfillment === 'local-delivery' || fulfillment === 'shipping'

  const input = (name: keyof CheckoutFields, extra: Record<string, unknown> = {}) => ({
    id: `co-${name}`,
    name,
    defaultValue: v?.[name] ?? '',
    'aria-invalid': err[name] ? true : undefined,
    className: 'input mt-2',
    ...extra,
  })

  return (
    <form action={formAction} noValidate className="grid gap-10 lg:grid-cols-[1fr_22rem]">
      <div className="space-y-10">
        {state.status === 'error' && state.message && (
          <div
            ref={alertRef}
            tabIndex={-1}
            role="alert"
            className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 focus:outline-none"
          >
            {state.message}
            {err.cart === 'review' && (
              <>
                {' '}
                <Link href="/cart" className="underline">
                  Go to your cart
                </Link>
              </>
            )}
          </div>
        )}
        {notices.length > 0 && (
          <ul
            role="status"
            className="space-y-1 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950"
          >
            {notices.map((n) => (
              <li key={n}>{n}</li>
            ))}
          </ul>
        )}

        <Fieldset legend="Your details">
          <div className="grid gap-6 sm:grid-cols-2">
            <Field label="Full name" name="name" error={err.name} required>
              <input {...input('name', { autoComplete: 'name', maxLength: 100 })} />
            </Field>
            <Field label="Phone" name="phone" error={err.phone} required>
              <input {...input('phone', { type: 'tel', autoComplete: 'tel', maxLength: 30 })} />
            </Field>
          </div>
          <Field
            label="Email"
            name="email"
            error={err.email}
            required
            hint="We send your order confirmation and payment instructions here."
          >
            <input {...input('email', { type: 'email', autoComplete: 'email', maxLength: 200 })} />
          </Field>
        </Fieldset>

        <Fieldset
          legend="How would you like to get your order?"
          error={err.fulfillment}
          errorId="co-fulfillment-error"
        >
          <div className="space-y-3">
            {fees.fulfillment.map((f) => {
              const fee = fulfillmentFeeCents(fees, f.value, subtotalCents) ?? 0
              return (
                <Choice
                  key={f.value}
                  name="fulfillment"
                  value={f.value}
                  checked={fulfillment === f.value}
                  onChange={() => setFulfillment(f.value)}
                  label={labelOf(fulfillmentOptions, f.value)}
                  price={fee === 0 ? 'Free' : formatUSD(fromCents(fee))}
                  describedBy={err.fulfillment ? 'co-fulfillment-error' : undefined}
                  hint={
                    f.value === 'pickup'
                      ? 'We’ll email you when it’s ready.'
                      : f.value === 'local-delivery'
                        ? `We deliver ${deliveryArea}.`
                        : fees.freeShippingOverCents != null
                          ? `Free on orders of ${formatUSD(fromCents(fees.freeShippingOverCents))} or more. US addresses only.`
                          : 'US addresses only.'
                  }
                />
              )
            })}
          </div>

          {needsAddress && (
            <div className="mt-6 space-y-6">
              <Field label="Street address" name="line1" error={err.line1} required>
                <input {...input('line1', { autoComplete: 'address-line1', maxLength: 120 })} />
              </Field>
              <Field label="Apartment, suite, etc." name="line2" error={err.line2}>
                <input {...input('line2', { autoComplete: 'address-line2', maxLength: 120 })} />
              </Field>
              <div className="grid gap-6 sm:grid-cols-[1fr_6rem_8rem]">
                <Field label="City" name="city" error={err.city} required>
                  <input {...input('city', { autoComplete: 'address-level2', maxLength: 60 })} />
                </Field>
                <Field label="State" name="state" error={err.state} required>
                  <input
                    {...input('state', {
                      autoComplete: 'address-level1',
                      maxLength: 2,
                      defaultValue: v?.state || 'IL',
                    })}
                  />
                </Field>
                <Field label="ZIP" name="zip" error={err.zip} required>
                  <input
                    {...input('zip', {
                      autoComplete: 'postal-code',
                      inputMode: 'numeric',
                      maxLength: 10,
                    })}
                  />
                </Field>
              </div>
            </div>
          )}
        </Fieldset>

        <Fieldset
          legend="How would you like to pay?"
          error={err.paymentMethod}
          errorId="co-paymentMethod-error"
          description="Nothing is charged on this website. After you place your order we email you instructions for the method you choose."
        >
          <div className="space-y-3">
            {payment.map((m) => {
              const info = paymentMethods.find((p) => p.value === m)!
              return (
                <Choice
                  key={m}
                  name="paymentMethod"
                  value={m}
                  defaultChecked={v?.paymentMethod === m}
                  label={info.label}
                  hint={info.hint}
                  describedBy={err.paymentMethod ? 'co-paymentMethod-error' : undefined}
                />
              )
            })}
          </div>
        </Fieldset>

        <Field
          label="Order notes"
          name="note"
          error={err.note}
          hint="Delivery instructions, etc. Please don’t include health information."
        >
          <textarea {...input('note', { rows: 3, maxLength: 500 })} />
        </Field>

        {/* Honeypot: hidden from people. */}
        <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
          <label>
            Website <input type="text" name="website" tabIndex={-1} autoComplete="off" />
          </label>
        </div>
        <input
          type="hidden"
          name="cart"
          value={JSON.stringify(items.map((i) => ({ id: i.id, qty: i.qty })))}
        />

        <div>
          <label className="flex gap-3 text-sm text-ink-soft">
            <input
              type="checkbox"
              required
              name="ack"
              value="yes"
              className="mt-0.5 size-5 shrink-0 accent-brand-600"
              aria-invalid={err.ack ? true : undefined}
              aria-describedby={err.ack ? 'co-ack-error' : undefined}
            />
            <span>
              I understand my order is not paid yet. I’ll receive payment instructions by email, and
              unpaid orders are cancelled after {PAYMENT_CANCEL_DAYS} days.
            </span>
          </label>
          {err.ack && (
            <p id="co-ack-error" className="mt-1.5 text-sm font-medium text-red-700">
              {err.ack}
            </p>
          )}
        </div>
      </div>

      <aside
        aria-labelledby="co-summary"
        className="h-fit rounded-2xl border border-line bg-surface p-6 lg:sticky lg:top-24"
      >
        <h2 id="co-summary" className="text-xl font-bold">
          Your order
        </h2>
        <ul className="mt-4 space-y-3 text-sm">
          {items.map((i) => (
            <li key={i.id} className="flex justify-between gap-4">
              <span>
                {i.name} <span className="text-muted">× {i.qty}</span>
              </span>
              <span className="font-medium">{formatUSD(fromCents(toCents(i.price) * i.qty))}</span>
            </li>
          ))}
        </ul>
        <dl className="mt-4 space-y-2 border-t border-line pt-4 text-sm">
          <div className="flex justify-between">
            <dt>Subtotal</dt>
            <dd>{formatUSD(fromCents(subtotalCents))}</dd>
          </div>
          <div className="flex justify-between">
            <dt>{fulfillment ? labelOf(fulfillmentOptions, fulfillment) : 'Delivery'}</dt>
            <dd>
              {feeCents == null
                ? 'Choose an option'
                : feeCents === 0
                  ? 'Free'
                  : formatUSD(fromCents(feeCents))}
            </dd>
          </div>
          <div className="flex justify-between border-t border-line pt-2 text-lg font-bold">
            <dt>Total</dt>
            <dd>{formatUSD(fromCents(subtotalCents + (feeCents ?? 0)))}</dd>
          </div>
        </dl>
        <p className="mt-2 text-xs text-muted">Any sales tax is added to your invoice.</p>
        <button
          type="submit"
          disabled={pending || checking}
          className="btn btn-primary mt-6 w-full text-base disabled:opacity-60"
        >
          <Lock className="size-4" aria-hidden />
          {pending ? 'Placing order…' : 'Place order'}
        </button>
        <p className="mt-4 flex gap-2 text-xs text-ink-soft">
          <AlertTriangle className="size-4 shrink-0 text-amber-700" aria-hidden />
          <span>
            Questions? Call{' '}
            <a href={phoneHref} className="font-semibold text-brand-600">
              {phone}
            </a>
            .
          </span>
        </p>
      </aside>
    </form>
  )
}

function Fieldset({
  legend,
  description,
  error,
  errorId,
  children,
}: {
  legend: string
  description?: string
  error?: string
  errorId?: string
  children: ReactNode
}) {
  return (
    <fieldset className="space-y-6" aria-describedby={error ? errorId : undefined}>
      <legend className="font-display text-xl font-bold">{legend}</legend>
      {description && <p className="-mt-3 text-sm text-ink-soft">{description}</p>}
      {error && (
        <p id={errorId} className="text-sm font-medium text-red-700">
          {error}
        </p>
      )}
      {children}
    </fieldset>
  )
}

function Field({
  label,
  name,
  error,
  hint,
  required,
  children,
}: {
  label: string
  name: string
  error?: string
  hint?: string
  required?: boolean
  children: ReactElement<Record<string, unknown>>
}) {
  // Screen readers need the required state and the hint too (the asterisk is visual only).
  const describedBy = [hint && `co-${name}-hint`, error && `co-${name}-error`]
    .filter(Boolean)
    .join(' ')
  return (
    <div>
      <label htmlFor={`co-${name}`} className="font-medium text-ink">
        {label}
        {required ? (
          <span className="text-red-700" aria-hidden>
            {' '}
            *
          </span>
        ) : (
          <span className="font-normal text-muted"> (optional)</span>
        )}
      </label>
      {hint && (
        <p id={`co-${name}-hint`} className="mt-1 text-sm text-muted">
          {hint}
        </p>
      )}
      {cloneElement(children, { required, 'aria-describedby': describedBy || undefined })}
      {error && (
        <p id={`co-${name}-error`} className="mt-1.5 text-sm font-medium text-red-700">
          {error}
        </p>
      )}
    </div>
  )
}

function Choice({
  name,
  value,
  label,
  hint,
  price,
  checked,
  defaultChecked,
  onChange,
  describedBy,
}: {
  name: string
  value: string
  label: string
  hint?: string
  price?: string
  checked?: boolean
  defaultChecked?: boolean
  onChange?: () => void
  describedBy?: string
}) {
  return (
    <label className="flex cursor-pointer gap-3 rounded-xl border border-line bg-white p-4 has-checked:border-brand-500 has-checked:bg-brand-50">
      <input
        type="radio"
        required
        name={name}
        value={value}
        checked={checked}
        defaultChecked={defaultChecked}
        onChange={onChange}
        aria-describedby={describedBy}
        className="mt-1 size-4 shrink-0 accent-brand-600"
      />
      <span className="flex-1">
        <span className="flex justify-between gap-4 font-semibold">
          {label}
          {price && <span>{price}</span>}
        </span>
        {hint && <span className="mt-0.5 block text-sm text-ink-soft">{hint}</span>}
      </span>
    </label>
  )
}
