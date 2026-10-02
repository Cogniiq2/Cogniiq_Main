// ─────────────────────────────────────────────────────────────────────────────
// Gesprächsuhr — reine Rechnung hinter der Erzählung „Vom Anruf zum gebuchten
// Termin." (components/SolutionShowcase.tsx).
//
// Einheit ist die NACHRICHT: Nachricht i blendet ein, während der Wert von i
// nach i + Einblendanteil läuft. Ein Zeitplan bildet den Scroll-Fortschritt
// des Abschnitts (0–1) stückweise linear auf diese Einheit ab.
//
// Hier liegt nur Rechnung, damit die eine Zusage, auf der das Aufklappen
// beruht, prüfbar bleibt: Eine Neuplanung ändert an der aktuellen Stelle
// NICHTS — was schon steht, bleibt stehen, nichts springt.
// ─────────────────────────────────────────────────────────────────────────────

/** Stützstellen [Fortschritt, Nachrichten-Einheiten], aufsteigend im Fortschritt. */
export type Zeitplan = ReadonlyArray<readonly [number, number]>;

/** Abschnitt des Scrollwegs, auf dem das Gespräch läuft. */
export interface GespraechsPhase {
  start: number;
  ende: number;
}

/** Uhr in Ruhe: begrenzt nichts. */
export const UHR_RUHE = 99;

/** Dauer, in der die Uhr `einheiten` Nachrichten nacheinander durchläuft. */
export function uhrDauer(einheiten: number): number {
  return Math.min(1.2, 0.22 + 0.17 * Math.max(0, einheiten));
}

/** Gleichmäßige Zeitachse: n Nachrichten über die ganze Gesprächsphase. */
export function zeitplanFuer(phase: GespraechsPhase, n: number): Zeitplan {
  return [
    [phase.start, 0],
    [phase.ende, n],
  ];
}

/**
 * Neuplanung ab Fortschritt `p`, an dem gerade `u` Einheiten stehen. Die
 * Abbildung geht durch (p, u) — an der aktuellen Stelle ändert sich nichts —,
 * danach teilen sich die übrigen Nachrichten den restlichen Weg. Liegt `p`
 * außerhalb der Gesprächsphase, gilt die gleichmäßige Zeitachse; dahinter
 * übernimmt die Uhr die Nachrichten, deren Weg schon vorbei ist.
 */
export function zeitplanAb(phase: GespraechsPhase, p: number, u: number, n: number): Zeitplan {
  if (p <= phase.start || p >= phase.ende || u <= 0) return zeitplanFuer(phase, n);
  return [[phase.start, 0], [p, Math.min(u, n)], [phase.ende, n]];
}

/** Wert des Zeitplans bei Fortschritt `p`, an den Enden festgehalten. */
export function aufZeitplan(plan: Zeitplan, p: number): number {
  if (p <= plan[0][0]) return plan[0][1];
  for (let k = 1; k < plan.length; k++) {
    const [p1, u1] = plan[k];
    if (p <= p1) {
      const [p0, u0] = plan[k - 1];
      return p1 === p0 ? u1 : u0 + ((p - p0) / (p1 - p0)) * (u1 - u0);
    }
  }
  return plan[plan.length - 1][1];
}

/**
 * Sichtbare Gesprächshöhe bei `u`: Jede Nachricht zählt mit dem Anteil, zu dem
 * sie eingeblendet ist. `unterkanten` sind die Unterkanten der Nachrichten in
 * der Liste (inklusive Abstand), aufsteigend.
 */
export function enthuellteHoehe(u: number, unterkanten: readonly number[], einblenden: number): number {
  let hoehe = 0;
  for (let i = 0; i < unterkanten.length; i++) {
    const anteil = Math.min(1, Math.max(0, (u - i) / einblenden));
    if (anteil === 0) break;
    hoehe += anteil * (unterkanten[i] - (i === 0 ? 0 : unterkanten[i - 1]));
  }
  return hoehe;
}
