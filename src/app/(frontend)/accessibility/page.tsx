import { LegalPage, legalMetadata } from '@/components/layout/LegalPage'

export const metadata = legalMetadata('accessibility')

export default function Page() {
  return <LegalPage pageKey="accessibility" />
}
