import {
  ClipboardList,
  HeartPulse,
  Pill,
  Stethoscope,
  Syringe,
  Truck,
  type LucideIcon,
} from 'lucide-react'

import { site } from './site'

/**
 * Services offered, used by the home page cards (`summary`) and the Services page (`details`, `points`).
 * TODO: confirm every service, vaccine, and the delivery area with the client before launch.
 */
export type Service = {
  id: string
  icon: LucideIcon
  title: string
  summary: string
  details: string
  points: string[]
  cta?: { label: string; href: string }
}

export const services: Service[] = [
  {
    id: 'refills',
    icon: Pill,
    title: 'Prescription refills',
    summary: 'Transfer or refill your prescriptions quickly, with reminders so you never run out.',
    details:
      'Refill a prescription you already have with us, or move one over from another pharmacy. We handle the transfer for you; just tell us where it is now.',
    points: [
      'Transfers from any pharmacy, handled by our team',
      'Refill reminders by text or phone',
      'Pickup in store or local delivery',
    ],
    cta: { label: 'Call to refill or transfer', href: site.phoneHref },
  },
  {
    id: 'consultations',
    icon: Stethoscope,
    title: 'Doctor consultations',
    summary:
      'Request a prescription or book a visit. Our physician reviews every request personally.',
    details: `${site.doctor.name} reviews prescription requests personally and will contact you if more information is needed. Submitting a request does not guarantee a prescription; the doctor decides based on your health information.`,
    points: [
      'Online prescription request form',
      'Reviewed by a licensed physician',
      'Not for emergencies: call 911',
    ],
    cta: { label: 'Request a prescription', href: '/prescriptions' },
  },
  {
    id: 'vaccinations',
    icon: Syringe,
    title: 'Vaccinations',
    summary: 'Flu, COVID-19, shingles, and travel vaccines. Walk in or book ahead.',
    details:
      'Our pharmacists give common adult vaccines in store. Call ahead to check availability for the vaccine you need.',
    points: ['Flu (seasonal)', 'COVID-19', 'Shingles', 'Travel vaccines'],
    cta: { label: 'Call to check availability', href: site.phoneHref },
  },
  {
    id: 'medication-reviews',
    icon: ClipboardList,
    title: 'Medication reviews',
    summary: 'A one-on-one check of everything you take, to catch interactions and save money.',
    details:
      'Bring in everything you take, including vitamins and supplements, and sit down with a pharmacist. We look for interactions, duplicates, and ways to lower your costs.',
    points: [
      'Prescriptions, over-the-counter, and supplements',
      'Interaction and duplicate check',
      'Tips to make your routine simpler',
    ],
  },
  {
    id: 'delivery',
    icon: Truck,
    title: 'Local delivery',
    summary: 'Prescriptions and health products delivered to your door in the local area.',
    details: `We deliver prescriptions and shop orders to homes ${site.deliveryArea}. Outside that area, shop orders can be shipped.`,
    points: [
      `Delivery ${site.deliveryArea}`,
      'Prescriptions and shop orders',
      'Shipping available for shop orders',
    ],
  },
  {
    id: 'shop',
    icon: HeartPulse,
    title: 'Health & wellness shop',
    summary: 'Vitamins, first aid, personal care, and everyday essentials, available online.',
    details:
      'Order over-the-counter health products online and pay by your preferred method. Prescription medicines are not sold through the shop.',
    points: ['Vitamins and supplements', 'First aid and health devices', 'Personal care'],
    cta: { label: 'Browse the shop', href: '/shop' },
  },
]
