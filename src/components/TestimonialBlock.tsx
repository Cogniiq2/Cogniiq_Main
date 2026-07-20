import { motion } from "framer-motion";
import { Quote } from "lucide-react";

export interface Testimonial {
  quote: string;
  attribution: string;
  project?: string;
  isReal: boolean;
}

export const REAL_TESTIMONIAL: Testimonial = {
  quote:
    "Die neue Website und das Buchungssystem funktionieren deutlich zuverlässiger als vorher. Besucher finden schneller, was sie suchen, und Reservierungen laufen jetzt ohne manuelle Abstimmung. Insgesamt wirkt der Auftritt deutlich moderner und professioneller.",
  attribution: "Betreiber, Sportanlage Region Bayreuth",
  project: "SV Heinersreuth – Website + Buchungsautomatisierung",
  isReal: true,
};

export const PLACEHOLDER_TESTIMONIAL: Testimonial = {
  quote:
    "Seit dem Relaunch kommen deutlich mehr Anfragen über die Website. Die Ladezeit ist erheblich schneller geworden, und das Design wirkt jetzt so, wie wir uns nach außen präsentieren wollen.",
  attribution: "Beispiel-Feedback (Vorlage)",
  isReal: false,
};

export const PLACEHOLDER_TESTIMONIAL_2: Testimonial = {
  quote:
    "Cogniiq hat unsere Anforderungen direkt verstanden und pragmatisch umgesetzt. Keine langen Abstimmungsrunden – das System läuft stabil und hat unsere Erwartungen erfüllt.",
  attribution: "Beispiel-Feedback (Vorlage)",
  isReal: false,
};

const fadeUp = {
  hidden: { opacity: 0, y: 24 },
  visible: (delay = 0) => ({
    opacity: 1,
    y: 0,
    transition: { duration: 0.55, delay, ease: [0.22, 1, 0.36, 1] as [number, number, number, number] },
  }),
};

interface TestimonialBlockProps {
  testimonials: Testimonial[];
  heading?: string;
  subheading?: string;
  compact?: boolean;
}

export function TestimonialBlock({
  testimonials,
  heading,
  subheading,
  compact = false,
}: TestimonialBlockProps) {
  return (
    <section className={`${compact ? "py-12" : "py-20"} bg-gray-50 dark:bg-gray-900/50 transition-colors duration-300`}>
      <div className="max-w-5xl mx-auto px-6 lg:px-8">
        {(heading || subheading) && (
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeUp}
            custom={0}
            className="mb-10"
          >
            {heading && (
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {heading}
              </h2>
            )}
            {subheading && (
              <p className="text-gray-500 dark:text-gray-400">{subheading}</p>
            )}
          </motion.div>
        )}

        <div className={`grid ${testimonials.length > 1 ? "md:grid-cols-2" : "max-w-2xl"} gap-6`}>
          {testimonials.map((t, i) => (
            <motion.div
              key={i}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true }}
              variants={fadeUp}
              custom={i * 0.1}
              className={`relative bg-white dark:bg-gray-800/60 border rounded-2xl p-7 flex flex-col gap-5 ${
                t.isReal
                  ? "border-gray-200 dark:border-gray-700"
                  : "border-gray-100 dark:border-gray-800 opacity-70"
              }`}
            >
              <Quote
                size={20}
                className="text-gray-300 dark:text-gray-600 flex-shrink-0"
              />
              <p
                className={`text-base leading-relaxed ${
                  t.isReal
                    ? "text-gray-700 dark:text-gray-300"
                    : "text-gray-500 dark:text-gray-500 italic"
                }`}
              >
                "{t.quote}"
              </p>
              <div className="mt-auto flex items-center justify-between gap-4">
                <span
                  className={`text-sm font-medium ${
                    t.isReal
                      ? "text-gray-600 dark:text-gray-400"
                      : "text-gray-400 dark:text-gray-600"
                  }`}
                >
                  — {t.attribution}
                </span>
                {!t.isReal && (
                  <span className="text-xs text-gray-400 dark:text-gray-600 border border-gray-200 dark:border-gray-700 rounded-full px-2.5 py-0.5 flex-shrink-0">
                    Vorlage
                  </span>
                )}
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
