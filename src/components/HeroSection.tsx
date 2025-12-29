import { SplineScene } from './ui/splite';
import { Spotlight } from './ui/spotlight';

export function HeroSection() {
  return (
    <section
      className="relative w-full min-h-screen flex items-center justify-center overflow-hidden bg-black/[0.96] pt-20"
      aria-label="Hauptbereich"
    >
      <Spotlight
        className="-top-40 left-0 md:left-60 md:-top-20"
        fill="white"
      />

      <div className="flex h-full w-full max-w-7xl mx-auto px-6 lg:px-8 min-h-screen items-center gap-8">
        <div className="flex-none w-full lg:w-[400px] xl:w-[450px] p-4 lg:p-8 relative z-10 flex flex-col justify-center">
          <h1 className="text-3xl md:text-4xl lg:text-5xl xl:text-6xl font-bold bg-clip-text text-transparent bg-gradient-to-b from-neutral-50 to-neutral-400 leading-tight">
            CogniIQ – The Future is here.
          </h1>
          <p className="mt-4 lg:mt-6 text-neutral-300 text-base lg:text-lg">
            Erleben Sie die Zukunft der KI-gestützten Webentwicklung.
            Interaktive 3D-Erlebnisse, die Ihre Vision zum Leben erwecken.
          </p>
        </div>

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
