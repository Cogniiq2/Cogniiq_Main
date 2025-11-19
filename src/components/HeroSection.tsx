import { GooeyText } from './ui/gooey-text-morphing';
import { Button } from './ui/button';
import { SplineScene } from './ui/splite';

export function HeroSection() {
  const handleScrollTo = (id: string) => {
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-gradient-to-br from-gray-50 via-white to-gray-100 pt-20"
      aria-label="Hauptbereich"
    >

      <div
        className="absolute inset-0 w-full h-full flex items-center justify-center opacity-40 pointer-events-none z-0"
        aria-hidden="true"
        role="img"
        aria-label="3D Roboter Animation im Hintergrund"
      >
        <SplineScene
          scene="https://prod.spline.design/kZDDjO5HuC9GJUM2/scene.splinecode"
          className="w-full h-full"
        />
      </div>

      <div className="relative max-w-7xl mx-auto px-6 lg:px-8 py-20 lg:py-32 z-10">
        <div className="text-center space-y-8">

          <div className="mb-8 min-h-[180px] flex items-center justify-center">
            <h1 className="sr-only">Cogniiq - AI Agentur und Webdesign Agentur in Bayreuth, Deutschland</h1>
            <GooeyText
              texts={[
                "CogniIQ",
                "the",
                "Future",
                "is",
                "here"
              ]}
              morphTime={1.2}
              cooldownTime={0.8}
              className="font-bold"
              textClassName="font-bold text-5xl md:text-7xl lg:text-8xl text-gray-400"
            />
          </div>

        </div>
      </div>

    </section>
  );
}

export default HeroSection;
