'use server'

import config from '@payload-config'
import { getPayload } from 'payload'

import { getSiteSettings } from '@/lib/settings'

export type ContactFields = { name: string; email: string; phone: string; message: string }

export type ContactState = {
  status: 'idle' | 'success' | 'error'
  message?: string
  errors?: Partial<Record<keyof ContactFields, string>>
  values?: ContactFields
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

export async function sendContactMessage(
  _prev: ContactState,
  formData: FormData,
): Promise<ContactState> {
  const values: ContactFields = {
    name: String(formData.get('name') ?? '').trim(),
    email: String(formData.get('email') ?? '').trim(),
    phone: String(formData.get('phone') ?? '').trim(),
    message: String(formData.get('message') ?? '').trim(),
  }

  // Honeypot: hidden from people, often filled in by bots. Pretend success so bots don't retry.
  if (String(formData.get('website') ?? '') !== '') return { status: 'success' }

  const errors: ContactState['errors'] = {}
  if (!values.name) errors.name = 'Please enter your name.'
  else if (values.name.length > 100) errors.name = 'Please use 100 characters or fewer.'
  if (!EMAIL_RE.test(values.email)) errors.email = 'Please enter a valid email address.'
  if (values.phone.length > 30) errors.phone = 'Please enter a shorter phone number.'
  if (values.message.length < 10)
    errors.message = 'Please write a little more (at least 10 characters).'
  else if (values.message.length > 2000)
    errors.message = 'Please keep your message under 2,000 characters.'

  if (Object.keys(errors).length > 0) {
    return { status: 'error', message: 'Please fix the highlighted fields.', errors, values }
  }

  try {
    const payload = await getPayload({ config })
    await payload.create({
      collection: 'contact-messages',
      data: { ...values, phone: values.phone || undefined, status: 'new' },
    })
    // TODO (Phase 3): email the admin "New contact message" via Resend.
  } catch (err) {
    console.error('Contact form: could not save message', err)
    const site = await getSiteSettings()
    return {
      status: 'error',
      message: `Sorry, we couldn't send your message right now. Please call us at ${site.phone}.`,
      values,
    }
  }

  return { status: 'success' }
}
