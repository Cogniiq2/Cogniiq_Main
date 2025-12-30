import { SplineScene } from './ui/splite';
import { Spotlight } from './ui/spotlight';
import { PremiumTextBlock } from './PremiumTextBlock';

export function HeroSection() {
  return (
    <section
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-[#fafafa] pt-20"
      aria-label="Hauptbereich"
    >
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="white"
      />

      <div className="flex h-full w-full max-w-7xl mx-auto px-6 lg:px-8 min-h-screen items-center gap-8">
        <PremiumTextBlock />

        <div className="flex-1 relative hidden lg:flex items-center justify-center h-screen">
          <SplineScene
            scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
            className="w-full h-full"
          />
        </div>
      </div>
    </section>
  );
}

export default HeroSection;
