import { MessageSquare, FileText, Cog, Rocket, CheckCircle } from 'lucide-react';
import { Timeline } from './ui/timeline';

const stageContent = [
  {
    title: 'Kennenlernen & Zieldefinition',
    icon: MessageSquare,
    color: 'from-sky-500 to-cyan-400',
    description:
      'Kurzes Erstgespräch (30–45 Minuten), in dem wir dein Geschäftsmodell, deine Ziele und deinen Status Quo verstehen.',
    items: [
      'Kostenloser Strategiecall',
      'Analyse des Status Quo',
      'Klare Zielsetzung & KPIs',
      'Erste Einschätzung der Möglichkeiten',
    ],
  },
  {
    title: 'Konzept & Angebot',
    icon: FileText,
    color: 'from-teal-500 to-emerald-400',
    description:
      'Wir skizzieren Website/Automation/AI-Setup und erstellen ein klares, individuelles Angebot – ohne versteckte Kosten.',
    items: [
      'Maßgeschneidertes Konzept',
      'Detaillierte Roadmap',
      'Transparente Preisgestaltung',
      'Klare Meilensteine',
    ],
  },
  {
    title: 'Umsetzung & Feinschliff',
    icon: Cog,
    color: 'from-blue-500 to-sky-400',
    description:
      'Umsetzung in klaren Sprints, regelmäßige Zwischenstände, Feedbackrunden, Tests. Fokus auf Performance und Stabilität.',
    items: [
      'Entwicklung in Sprints',
      'Regelmäßige Updates',
      'Ausgiebige Feedbackrunden',
      'Performance-Tests',
    ],
  },
  {
    title: 'Go-Live & Optimierung',
    icon: Rocket,
    color: 'from-cyan-500 to-teal-400',
    description:
      'Launch, Monitoring und Optimierung auf das, was zählt: Anfragen, Buchungen, Umsatz – nicht nur Pixel.',
    items: [
      'Reibungsloser Launch',
      'Laufendes Monitoring',
      'Datenbasierte Optimierung',
      'Langfristige Partnerschaft',
    ],
  },
];

const timelineData = stageContent.map((stage, index) => {
  const Icon = stage.icon;
  return {
    title: `${String(index + 1).padStart(2, '0')}`,
    content: (
      <div className="group relative overflow-hidden bg-white dark:bg-gray-900 rounded-2xl p-7 border border-gray-100 dark:border-gray-800 shadow-lg hover:shadow-xl transition-all duration-500">
        <div className={`absolute top-0 left-0 w-1 h-full bg-gradient-to-b ${stage.color} rounded-l-2xl`} />

        <div className="flex items-start gap-4 mb-5">
          <div className={`flex-shrink-0 p-3 rounded-xl bg-gradient-to-br ${stage.color} shadow-md`}>
            <Icon className="w-6 h-6 text-white" />
          </div>
          <div>
            <h4 className="text-xl font-bold text-gray-900 dark:text-gray-100 leading-tight">
              {stage.title}
            </h4>
          </div>
        </div>

        <p className="text-gray-600 dark:text-gray-400 leading-relaxed mb-5 text-sm md:text-base">
          {stage.description}
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {stage.items.map((item, i) => (
            <div key={i} className="flex items-center gap-2.5">
              <CheckCircle className="w-4 h-4 flex-shrink-0 text-sky-500" />
              <span className="text-sm text-gray-700 dark:text-gray-300 font-medium">{item}</span>
            </div>
          ))}
        </div>
      </div>
    ),
  };
});

export function ProcessSection() {
  return (
    <section id="ablauf" className="py-20 bg-gray-50 dark:bg-gray-900 transition-colors duration-300" aria-labelledby="process-heading">
      <div className="max-w-7xl mx-auto px-6 lg:px-8">
        <div className="text-center mb-4">
          <h2
            id="process-heading"
            className="text-4xl lg:text-5xl font-bold mb-6 text-gray-900 dark:text-gray-100"
          >
            So arbeiten wir zusammen
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Transparenter Prozess: Von der ersten Anfrage bis zum erfolgreichen Go-Live
          </p>
        </div>

        <Timeline data={timelineData} />
      </div>
    </section>
  );
}
