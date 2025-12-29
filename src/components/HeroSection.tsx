import { TypewriterEffectSmooth } from './ui/typewriter-effect';
import { Button } from './ui/button';
import { SplineScene } from './ui/splite';
import { Spotlight } from './ui/spotlight';

export function HeroSection() {
  const handleScrollTo = (id: string) => {
    const element = document.querySelector(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-black/[0.96] pt-20"
      aria-label="Hauptbereich"
    >
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="white"
      />

      <div
        className="absolute inset-0 w-full h-full flex items-center justify-center opacity-30 pointer-events-none z-0"
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
            <h1 className="sr-only">
              Cogniiq - AI Agentur und Webdesign Agentur in Bayreuth, Deutschland
            </h1>

            <TypewriterEffectSmooth
              words={[
                {
                  text: "CogniIQ – The Future is here.",
                  className: "bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400"
                }
              ]}
              className="font-bold text-5xl md:text-7xl lg:text-8xl"
              cursorClassName="bg-white"
            />

          </div>

        </div>
      </div>

    </section>
  );
}

export default HeroSection;
