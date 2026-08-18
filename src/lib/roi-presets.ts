// ─────────────────────────────────────────────────────────────────────────────
// Startwerte des branchenübergreifenden Rechners auf der Startseite.
//
// Lag bisher in `components/ROICalculator.tsx`; `CostComparisonSection`
// importierte von dort und war damit an die Rechner-Komponente gekoppelt.
// Seit der Praxis-Rechner (`PraxisRechner.tsx`) daneben existiert, liegen die
// geteilten Presets hier, damit beide Komponenten unabhängig voneinander
// geändert werden können.
//
// Es sind frei gewählte Startwerte, KEINE Branchenstatistik — beide
// Komponenten weisen das sichtbar aus, und gerechnet wird ausschließlich mit
// den Eingaben des Besuchers.
// ─────────────────────────────────────────────────────────────────────────────

export type Industry = 'Arztpraxis' | 'Gastronomie' | 'Dienstleistung' | 'Immobilien';

export interface Preset {
  callsPerWeek: number;
  missedPercent: number;
  avgValue: number;
  adminHours: number;
  hourlyRate: number;
}

export const INDUSTRY_PRESETS: Record<Industry, Preset> = {
  Arztpraxis:     { callsPerWeek: 120, missedPercent: 32, avgValue: 180,  adminHours: 15, hourlyRate: 28 },
  Gastronomie:    { callsPerWeek: 80,  missedPercent: 35, avgValue: 65,   adminHours: 10, hourlyRate: 18 },
  Dienstleistung: { callsPerWeek: 50,  missedPercent: 28, avgValue: 320,  adminHours: 12, hourlyRate: 35 },
  Immobilien:     { callsPerWeek: 40,  missedPercent: 22, avgValue: 4500, adminHours: 20, hourlyRate: 45 },
};
