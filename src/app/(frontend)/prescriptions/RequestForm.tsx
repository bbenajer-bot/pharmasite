'use client'

import Link from 'next/link'
import { useActionState, useEffect, useRef, useState, type ReactNode } from 'react'
import { Send } from 'lucide-react'

import type { RequestKind } from '@/lib/prescriptions'
import { submitRequest, type RequestFields, type RequestState } from './actions'

const initialState: RequestState = { status: 'idle' }

const inputClass =
  'mt-2 block w-full rounded-xl border border-line bg-white px-4 py-3 text-ink placeholder:text-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 aria-[invalid=true]:border-red-600'

type Props = { kind: RequestKind; pharmacyName: string; deliveryArea: string }

/** Prescription request form (`kind="new"`) and the shorter refill form (`kind="refill"`). */
export function RequestForm({ kind, pharmacyName, deliveryArea }: Props) {
  const [state, formAction, pending] = useActionState(submitRequest, initialState)
  const [fulfillment, setFulfillment] = useState(state.values?.fulfillment ?? 'pickup')
  const statusRef = useRef<HTMLDivElement>(null)

  // Move focus to the error summary so keyboard and screen reader users hear it.
  useEffect(() => {
    if (state.status === 'error') statusRef.current?.focus()
  }, [state])

  const v = state.values
  const err = state.errors ?? {}
  const id = (name: string) => `rx-${name}`

  const field = (name: keyof RequestFields, hint?: boolean) => {
    const describedBy = [hint && `${id(name)}-hint`, err[name] && `${id(name)}-error`]
      .filter(Boolean)
      .join(' ')
    return {
      id: id(name),
      name,
      defaultValue: v?.[name] ?? '',
      'aria-invalid': err[name] ? true : undefined,
      'aria-describedby': describedBy || undefined,
      className: inputClass,
    }
  }

  const errorText = (name: keyof RequestFields | 'consent') =>
    err[name] ? (
      <p id={`${id(name)}-error`} className="mt-1.5 text-sm font-medium text-red-700">
        {err[name]}
      </p>
    ) : null

  const label = (name: string, text: ReactNode, required = true) => (
    <label htmlFor={id(name)} className="font-medium text-ink">
      {text}{' '}
      {required ? (
        <span className="text-red-700" aria-hidden>
          *
        </span>
      ) : (
        <span className="font-normal text-muted">(optional)</span>
      )}
    </label>
  )

  const hint = (name: string, text: ReactNode) => (
    <p id={`${id(name)}-hint`} className="mt-1 text-sm text-muted">
      {text}
    </p>
  )

  const today = new Date().toISOString().slice(0, 10)

  return (
    <form action={formAction} noValidate className="space-y-10">
      <input type="hidden" name="kind" value={kind} />

      {state.status === 'error' && state.message && (
        <div
          ref={statusRef}
          tabIndex={-1}
          role="alert"
          className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm font-medium text-red-800 focus:outline-none"
        >
          {state.message}
        </div>
      )}

      <fieldset className="space-y-6">
        <legend className="text-xl font-bold">About you</legend>
        <div className="grid gap-6 sm:grid-cols-2">
          <div>
            {label('name', 'Full name')}
            <input type="text" autoComplete="name" required maxLength={100} {...field('name')} />
            {errorText('name')}
          </div>
          <div>
            {label('dateOfBirth', 'Date of birth')}
            <input
              type="date"
              autoComplete="bday"
              required
              min="1900-01-01"
              max={today}
              {...field('dateOfBirth')}
            />
            {errorText('dateOfBirth')}
          </div>
          <div>
            {label('phone', 'Phone')}
            <input
              type="tel"
              autoComplete="tel"
              required
              maxLength={30}
              {...field('phone', true)}
            />
            {hint('phone', 'We’ll call you about your request.')}
            {errorText('phone')}
          </div>
          <div>
            {label('email', 'Email', false)}
            <input type="email" autoComplete="email" maxLength={200} {...field('email')} />
            {errorText('email')}
          </div>
        </div>
      </fieldset>

      {kind === 'refill' ? (
        <fieldset className="space-y-6">
          <legend className="text-xl font-bold">Your prescription</legend>
          <div className="grid gap-6 sm:grid-cols-2">
            <div>
              {label('rxNumber', 'Rx number')}
              <input type="text" required maxLength={30} {...field('rxNumber', true)} />
              {hint('rxNumber', 'Printed on your prescription label.')}
              {errorText('rxNumber')}
            </div>
            <div>
              {label('medication', 'Medication name', false)}
              <input type="text" maxLength={200} {...field('medication')} />
              {errorText('medication')}
            </div>
          </div>
        </fieldset>
      ) : (
        <fieldset className="space-y-6">
          <legend className="text-xl font-bold">Your request</legend>
          <div>
            {label('medication', 'Medication you’re requesting')}
            <input type="text" required maxLength={200} {...field('medication', true)} />
            {hint('medication', 'If you’re not sure of the name, describe it as best you can.')}
            {errorText('medication')}
          </div>
          <div>
            {label('reason', 'Why do you need it?')}
            <textarea rows={5} required maxLength={2000} {...field('reason', true)} />
            {hint('reason', 'Your symptoms or condition, and how long you’ve had them.')}
            {errorText('reason')}
          </div>
          <div>
            {label('currentMedications', 'Medications you take now', false)}
            <textarea rows={3} maxLength={1000} {...field('currentMedications', true)} />
            {hint('currentMedications', 'Include vitamins and supplements.')}
            {errorText('currentMedications')}
          </div>
          <div>
            {label('allergies', 'Allergies', false)}
            <textarea rows={2} maxLength={500} {...field('allergies', true)} />
            {hint(
              'allergies',
              'Medicines, foods, or anything else. Write “None” if you have none.',
            )}
            {errorText('allergies')}
          </div>
        </fieldset>
      )}

      <fieldset
        className="space-y-4"
        aria-describedby={err.fulfillment ? `${id('fulfillment')}-error` : undefined}
      >
        <legend className="text-xl font-bold">
          Pickup or delivery{' '}
          <span className="text-red-700" aria-hidden>
            *
          </span>
        </legend>
        <div className="grid gap-3 sm:grid-cols-2">
          {[
            {
              value: 'pickup',
              title: 'Pick up at the pharmacy',
              body: 'We’ll call when it’s ready.',
            },
            { value: 'delivery', title: 'Local delivery', body: `We deliver ${deliveryArea}.` },
          ].map((o) => (
            <label
              key={o.value}
              className="flex cursor-pointer gap-3 rounded-xl border border-line bg-white p-4 has-[:checked]:border-brand-500 has-[:checked]:bg-brand-50 has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-brand-200"
            >
              <input
                type="radio"
                name="fulfillment"
                value={o.value}
                checked={fulfillment === o.value}
                onChange={() => setFulfillment(o.value)}
                className="mt-1 size-4 accent-brand-600"
              />
              <span>
                <span className="block font-medium text-ink">{o.title}</span>
                <span className="block text-sm text-ink-soft">{o.body}</span>
              </span>
            </label>
          ))}
        </div>
        {errorText('fulfillment')}
        {fulfillment === 'delivery' && (
          <div>
            {label('deliveryAddress', 'Delivery address')}
            <textarea
              rows={2}
              required
              maxLength={300}
              autoComplete="street-address"
              {...field('deliveryAddress')}
            />
            {errorText('deliveryAddress')}
          </div>
        )}
      </fieldset>

      <div>
        <div className="flex gap-3 rounded-xl border border-line bg-surface p-4">
          <input
            id={id('consent')}
            type="checkbox"
            name="consent"
            required
            aria-invalid={err.consent ? true : undefined}
            aria-describedby={err.consent ? `${id('consent')}-error` : undefined}
            className="mt-1 size-5 shrink-0 accent-brand-600"
          />
          <label htmlFor={id('consent')} className="text-sm text-ink">
            I confirm the information above is accurate and about me (or a person I&apos;m
            authorized to act for). I agree that {pharmacyName} may contact me by phone or email
            about this request. I understand that submitting it does not guarantee a prescription,
            and that this form is <strong>not for emergencies</strong>. See our{' '}
            <Link href="/privacy" className="font-semibold text-brand-600 hover:underline">
              Privacy Policy
            </Link>
            .{' '}
            <span className="text-red-700" aria-hidden>
              *
            </span>
          </label>
        </div>
        {errorText('consent')}
      </div>

      {/* Honeypot for bots. Hidden from people and assistive tech. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor={id('website')}>Leave this field empty</label>
        <input id={id('website')} type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <div className="space-y-3">
        <p className="text-sm text-muted">
          Fields marked <span className="text-red-700">*</span> are required.
        </p>
        <button
          type="submit"
          disabled={pending}
          className="btn btn-primary text-base disabled:opacity-60"
        >
          <Send className="size-4" aria-hidden />
          {pending ? 'Sending…' : kind === 'refill' ? 'Request refill' : 'Send request'}
        </button>
      </div>
    </form>
  )
}
