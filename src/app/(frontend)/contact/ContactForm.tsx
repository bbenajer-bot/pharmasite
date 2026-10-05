'use client'

import { useActionState, useEffect, useRef } from 'react'
import { AlertTriangle, CheckCircle2, Send } from 'lucide-react'

import { sendContactMessage, type ContactFields, type ContactState } from './actions'

const initialState: ContactState = { status: 'idle' }

const inputClass =
  'mt-2 block w-full rounded-xl border border-line bg-white px-4 py-3 text-ink placeholder:text-muted focus:border-brand-500 focus:outline-none focus:ring-2 focus:ring-brand-200 aria-[invalid=true]:border-red-600'

export function ContactForm() {
  const [state, formAction, pending] = useActionState(sendContactMessage, initialState)
  const statusRef = useRef<HTMLDivElement>(null)

  // Move focus to the result so keyboard and screen reader users hear it.
  useEffect(() => {
    if (state.status !== 'idle') statusRef.current?.focus()
  }, [state])

  if (state.status === 'success') {
    return (
      <div
        ref={statusRef}
        tabIndex={-1}
        role="status"
        className="rounded-2xl border border-mint-500/30 bg-mint-50 p-8 focus:outline-none"
      >
        <CheckCircle2 className="size-8 text-mint-700" aria-hidden />
        <h2 className="mt-4 text-2xl font-bold">Thanks, your message was sent.</h2>
        <p className="mt-2 text-ink-soft">
          We usually reply within one business day. For anything urgent, please call us.
        </p>
      </div>
    )
  }

  const v = state.values
  const err = state.errors ?? {}

  const field = (name: keyof ContactFields) => ({
    id: `contact-${name}`,
    name,
    defaultValue: v?.[name] ?? '',
    'aria-invalid': err[name] ? true : undefined,
    'aria-describedby': err[name] ? `contact-${name}-error` : undefined,
    className: inputClass,
  })

  const errorText = (name: keyof ContactFields) =>
    err[name] ? (
      <p id={`contact-${name}-error`} className="mt-1.5 text-sm font-medium text-red-700">
        {err[name]}
      </p>
    ) : null

  return (
    <form action={formAction} noValidate className="space-y-6">
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

      <div className="flex gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-950">
        <AlertTriangle className="mt-0.5 size-5 shrink-0 text-amber-700" aria-hidden />
        <p>
          <strong>Please don&apos;t include medical details</strong> (symptoms, conditions, or
          medications) in this form. For prescriptions, use our prescription request form or call
          us. <strong>In an emergency, call 911.</strong>
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div>
          <label htmlFor="contact-name" className="font-medium text-ink">
            Name{' '}
            <span className="text-red-700" aria-hidden>
              *
            </span>
          </label>
          <input type="text" autoComplete="name" required maxLength={100} {...field('name')} />
          {errorText('name')}
        </div>
        <div>
          <label htmlFor="contact-email" className="font-medium text-ink">
            Email{' '}
            <span className="text-red-700" aria-hidden>
              *
            </span>
          </label>
          <input type="email" autoComplete="email" required {...field('email')} />
          {errorText('email')}
        </div>
      </div>

      <div>
        <label htmlFor="contact-phone" className="font-medium text-ink">
          Phone <span className="font-normal text-muted">(optional)</span>
        </label>
        <input type="tel" autoComplete="tel" maxLength={30} {...field('phone')} />
        {errorText('phone')}
      </div>

      <div>
        <label htmlFor="contact-message" className="font-medium text-ink">
          Message{' '}
          <span className="text-red-700" aria-hidden>
            *
          </span>
        </label>
        <textarea rows={6} required maxLength={2000} {...field('message')} />
        {errorText('message')}
      </div>

      {/* Honeypot for bots. Hidden from people and assistive tech. */}
      <div aria-hidden className="absolute -left-[9999px] h-px w-px overflow-hidden">
        <label htmlFor="contact-website">Leave this field empty</label>
        <input id="contact-website" type="text" name="website" tabIndex={-1} autoComplete="off" />
      </div>

      <p className="text-sm text-muted">
        Fields marked <span className="text-red-700">*</span> are required.
      </p>

      <button
        type="submit"
        disabled={pending}
        className="btn btn-primary text-base disabled:opacity-60"
      >
        <Send className="size-4" aria-hidden />
        {pending ? 'Sending…' : 'Send message'}
      </button>
    </form>
  )
}
