import {
  AboutTeaser,
  BlogTeaser,
  FeaturedProducts,
  Hero,
  HowItWorks,
  Services,
  VisitUs,
} from '@/components/home/HomeSections'
import { JsonLd } from '@/components/seo/JsonLd'
import { getSiteSettings } from '@/lib/settings'
import { pharmacySchema } from '@/lib/structured-data'

export default async function HomePage() {
  const site = await getSiteSettings()

  return (
    <>
      <JsonLd data={pharmacySchema(site)} />
      <Hero />
      <Services />
      <HowItWorks />
      <FeaturedProducts />
      <AboutTeaser />
      <BlogTeaser />
      <VisitUs />
    </>
  )
}
