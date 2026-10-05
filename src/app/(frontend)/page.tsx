import {
  AboutTeaser,
  BlogTeaser,
  FeaturedProducts,
  Hero,
  HowItWorks,
  Services,
  VisitUs,
} from '@/components/home/HomeSections'

export default function HomePage() {
  return (
    <>
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
