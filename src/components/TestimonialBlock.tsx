import { motion } from "framer-motion";
import { Quote } from "lucide-react";

// Only verified, real customer feedback may be represented by this type. There is
// deliberately no "example"/"template" variant: placeholder testimonials must never
// be published, not even when visually marked as such.
export interface Testimonial {
  quote: string;
  attribution: string;
  project?: string;
}

// There is deliberately NO exported testimonial constant.
//
// The previously shipped quote named a real third party (a sports club) without a
// documented written consent in this repository. It was removed from rendering
// entirely — component, page usages and structured data — rather than merely
// marked. The wording is preserved in ASSETS-REQUIRED.md and may only be restored
// after written consent from the named party is on file.
//
// [[ASSET: Referenz mit schriftlicher Einwilligung — erst dann darf hier wieder
// eine benannte Kundenstimme entstehen]]

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
              className="relative bg-white dark:bg-gray-800/60 border border-gray-200 dark:border-gray-700 rounded-2xl p-7 flex flex-col gap-5"
            >
              <Quote
                size={20}
                className="text-gray-300 dark:text-gray-600 flex-shrink-0"
              />
              <p className="text-base leading-relaxed text-gray-700 dark:text-gray-300">
                "{t.quote}"
              </p>
              <div className="mt-auto flex items-center justify-between gap-4">
                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                  — {t.attribution}
                </span>
              </div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
