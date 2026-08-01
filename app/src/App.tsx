import { useEffect } from 'react'
import { Frame } from './components/Frame'
import { Nav } from './components/Nav'
import { BranchScene } from './components/BranchScene'
import { Hero } from './components/Hero'
import { Showcase } from './components/Showcase'
import { Cta, Footer, HowItWorks, Pricing, Services } from './components/Sections'
import { useSmoothScroll } from './lib/useSmoothScroll'
import { ScrollTrigger } from './lib/motion'

export default function App() {
  useSmoothScroll()

  // Web fonts and the branch webps both change layout and paint timing;
  // refreshing once everything has loaded keeps ScrollTrigger starts honest.
  useEffect(() => {
    const refresh = () => ScrollTrigger.refresh()
    document.fonts?.ready.then(refresh)

    window.addEventListener('load', refresh)
    return () => window.removeEventListener('load', refresh)
  }, [])

  return (
    <Frame>
      {/* Targets <main>, not the third section down: skipping the nav should
          not also skip the hero and the product section. */}
      <a
        href="#main"
        className="sr-only focus-visible:not-sr-only focus-visible:fixed focus-visible:top-4 focus-visible:left-1/2 focus-visible:z-50 focus-visible:-translate-x-1/2 focus-visible:rounded-full focus-visible:bg-ink focus-visible:px-4 focus-visible:py-2 focus-visible:text-sm focus-visible:text-white"
      >
        Skip to content
      </a>

      <BranchScene />
      <Nav />

      <main id="main" tabIndex={-1} className="focus:outline-none">
        <Hero />
        <Showcase />
        <Services />
        <HowItWorks />
        <Pricing />
        <Cta />
      </main>

      <Footer />
    </Frame>
  )
}
