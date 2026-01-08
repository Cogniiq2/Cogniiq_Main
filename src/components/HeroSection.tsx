import { SplineScene } from './ui/splite';
import { Spotlight } from './ui/spotlight';
import { PremiumTextBlock } from './PremiumTextBlock';
import { MobilePremiumHero } from './MobilePremiumHero';

export function HeroSection() {
  return (
    <section
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-white dark:bg-gray-950 pt-20 transition-colors duration-300"
      aria-label="Hauptbereich"
    >
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="white"
      />

      {/* Desktop Version */}
      <div className="hidden lg:flex h-full w-full max-w-7xl mx-auto px-6 lg:px-8 min-h-screen items-center gap-8">
        <PremiumTextBlock />

        <div className="flex-1 relative flex items-center justify-center h-screen overflow-hidden">
          <div className="absolute inset-0 flex items-center justify-center" style={{ width: '180%', height: '100%', left: '-40%' }}>
            <SplineScene
              scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
              className="w-full h-full"
            />
          </div>
        </div>
      </div>

      {/* Mobile Version */}
      <div className="lg:hidden w-full h-full">
        <MobilePremiumHero />
      </div>
    </section>
  );
}

export default HeroSection;
