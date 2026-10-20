import { LegalPage, legalMetadata } from '@/components/layout/LegalPage'

export const metadata = legalMetadata('privacy')

export default function Page() {
  return <LegalPage pageKey="privacy" />
}
