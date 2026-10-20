import { LegalPage, legalMetadata } from '@/components/layout/LegalPage'

export const metadata = legalMetadata('npp')

export default function Page() {
  return <LegalPage pageKey="npp" />
}
