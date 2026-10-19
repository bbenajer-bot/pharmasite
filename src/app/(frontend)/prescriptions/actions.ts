'use server'

import config from '@payload-config'
import { redirect } from 'next/navigation'
import { getPayload } from 'payload'

import { sendNewRequestToDoctor } from '@/lib/email/prescriptions'
import type { RequestFulfillment, RequestKind } from '@/lib/prescriptions'
import { getSiteSettings } from '@/lib/settings'

export type RequestFields = {
  name: string
  dateOfBirth: string
  phone: string
  email: string
  rxNumber: string
  medication: string
  reason: string
  currentMedications: string
  allergies: string
  fulfillment: string
  deliveryAddress: string
}

export type RequestState = {
  status: 'idle' | 'error'
  message?: string
  errors?: Partial<Record<keyof RequestFields | 'consent', string>>
  values?: RequestFields
}

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/
const DATE_RE = /^(\d{4})-(\d{2})-(\d{2})$/

function dobError(value: string): string | undefined {
  const m = DATE_RE.exec(value)
  if (!m) return 'Please enter your date of birth.'
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])]
  const date = new Date(Date.UTC(y, mo - 1, d))
  const valid =
    date.getUTCFullYear() === y && date.getUTCMonth() === mo - 1 && date.getUTCDate() === d
  if (!valid || y < 1900 || date.getTime() > Date.now())
    return 'Please enter a valid date of birth.'
}

function tooLong(value: string, max: number) {
  return value.length > max
    ? `Please keep this under ${max.toLocaleString('en-US')} characters.`
    : undefined
}

/**
 * Saves a prescription or refill request, then emails the doctor a notice with no health details.
 * Never logs the submitted values: database errors can echo them back, so only the error type is logged.
 */
export async function submitRequest(
  _prev: RequestState,
  formData: FormData,
): Promise<RequestState> {
  const get = (k: string) => String(formData.get(k) ?? '').trim()
  const kind: RequestKind = get('kind') === 'refill' ? 'refill' : 'new'
  const values: RequestFields = {
    name: get('name'),
    dateOfBirth: get('dateOfBirth'),
    phone: get('phone'),
    email: get('email'),
    rxNumber: get('rxNumber'),
    medication: get('medication'),
    reason: get('reason'),
    currentMedications: get('currentMedications'),
    allergies: get('allergies'),
    fulfillment: get('fulfillment'),
    deliveryAddress: get('deliveryAddress'),
  }

  // Honeypot (see contact form). Pretend success without saving anything.
  if (get('website') !== '') redirect(`/prescriptions/submitted?type=${kind}`)

  const errors: NonNullable<RequestState['errors']> = {}
  if (!values.name) errors.name = 'Please enter your full name.'
  else errors.name = tooLong(values.name, 100)
  errors.dateOfBirth = dobError(values.dateOfBirth)
  if (values.phone.replace(/\D/g, '').length < 10 || values.phone.length > 30)
    errors.phone = 'Please enter a phone number with area code.'
  if (values.email && (!EMAIL_RE.test(values.email) || values.email.length > 200))
    errors.email = 'Please enter a valid email address, or leave it empty.'

  if (kind === 'refill') {
    if (!values.rxNumber) errors.rxNumber = 'Please enter the Rx number from your label.'
    else errors.rxNumber = tooLong(values.rxNumber, 30)
    errors.medication = tooLong(values.medication, 200)
  } else {
    if (!values.medication) errors.medication = 'Please tell us which medication you need.'
    else errors.medication = tooLong(values.medication, 200)
    if (values.reason.length < 10)
      errors.reason = 'Please describe why you need it (at least 10 characters).'
    else errors.reason = tooLong(values.reason, 2000)
    errors.currentMedications = tooLong(values.currentMedications, 1000)
    errors.allergies = tooLong(values.allergies, 500)
  }

  const fulfillment = (['pickup', 'delivery'] as const).find((f) => f === values.fulfillment) as
    RequestFulfillment | undefined
  if (!fulfillment) errors.fulfillment = 'Please choose pickup or delivery.'
  if (fulfillment === 'delivery') {
    if (values.deliveryAddress.length < 8)
      errors.deliveryAddress = 'Please enter your delivery address.'
    else errors.deliveryAddress = tooLong(values.deliveryAddress, 300)
  }

  if (formData.get('consent') !== 'on') errors.consent = 'Please tick the box to continue.'

  for (const key of Object.keys(errors) as (keyof typeof errors)[]) {
    if (!errors[key]) delete errors[key]
  }
  if (Object.keys(errors).length > 0) {
    return { status: 'error', message: 'Please fix the highlighted fields.', errors, values }
  }

  let requestNumber: number | null | undefined
  try {
    const payload = await getPayload({ config })
    const doc = await payload.create({
      collection: 'prescription-requests',
      data: {
        kind,
        name: values.name,
        dateOfBirth: values.dateOfBirth,
        phone: values.phone,
        email: values.email || undefined,
        rxNumber: kind === 'refill' ? values.rxNumber : undefined,
        medication: values.medication || undefined,
        reason: kind === 'new' ? values.reason : undefined,
        currentMedications: kind === 'new' ? values.currentMedications || undefined : undefined,
        allergies: kind === 'new' ? values.allergies || undefined : undefined,
        fulfillment: fulfillment!,
        deliveryAddress: fulfillment === 'delivery' ? values.deliveryAddress : undefined,
        consentAt: new Date().toISOString(),
        status: 'new',
      },
    })
    requestNumber = doc.requestNumber
    await sendNewRequestToDoctor(payload, { id: doc.id, requestNumber, kind })
  } catch (err) {
    console.error(
      'Prescription request: could not save',
      err instanceof Error ? err.name : 'unknown',
    )
    const site = await getSiteSettings()
    return {
      status: 'error',
      message: `Sorry, we couldn't send your request right now. Please call us at ${site.phone}.`,
      values,
    }
  }

  redirect(`/prescriptions/submitted?type=${kind}&ref=${requestNumber}`)
}
