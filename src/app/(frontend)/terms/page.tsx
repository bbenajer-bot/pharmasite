import { LegalPage, legalMetadata } from '@/components/layout/LegalPage'

export const metadata = legalMetadata('terms')

export default function Page() {
  return <LegalPage pageKey="terms" />
}
