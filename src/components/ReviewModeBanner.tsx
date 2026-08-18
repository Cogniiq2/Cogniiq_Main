// ─────────────────────────────────────────────────────────────────────────────
// Review-Banner für Vorschau-Deployments (Brief II §7.2).
//
// Aktivierung ausschließlich über die Build-Variable VITE_REVIEW_MODE=true.
// Ohne die Variable (Produktion, normale Previews) rendert die Komponente
// nichts — sie ist standardmäßig aus und in Produktionsbuilds nicht erreichbar,
// solange die Variable dort nicht gesetzt wird.
//
// Zusätzlich markiert der Banner-Stil alle Elemente mit dem Attribut
// `data-review-claim`: Sektionen, deren Inhalt einen offenen [[CLAIM]]- oder
// [[ASSET]]-Marker trägt, erhalten im Review-Modus einen sichtbaren Rahmen.
// Die Marker selbst bleiben Code-Kommentare und werden nie gerendert.
// ─────────────────────────────────────────────────────────────────────────────

const REVIEW_MODE = import.meta.env.VITE_REVIEW_MODE === "true";

const OUTLINE_CSS = `
[data-review-claim] {
  outline: 2px dashed rgba(217, 119, 6, 0.75) !important;
  outline-offset: 3px;
  position: relative;
}
[data-review-claim]::after {
  content: "Angabe noch nicht bestätigt";
  position: absolute;
  top: -10px;
  right: 8px;
  z-index: 40;
  background: #d97706;
  color: #fff;
  font-size: 10px;
  font-weight: 600;
  line-height: 1;
  padding: 4px 8px;
  border-radius: 6px;
  letter-spacing: 0.04em;
}
body {
  padding-bottom: 52px;
}
`;

export function ReviewModeBanner() {
  if (!REVIEW_MODE) return null;

  return (
    <>
      <style>{OUTLINE_CSS}</style>
      <div
        role="status"
        className="fixed bottom-0 left-0 right-0 z-[100] bg-amber-600 text-white px-4 py-3 text-center shadow-[0_-2px_12px_rgba(0,0,0,0.15)]"
      >
        <p className="text-[13px] font-semibold leading-snug">
          Vorschau — nicht freigegebene Inhalte. Einzelne Angaben sind noch nicht bestätigt.
        </p>
        <p className="text-[11px] text-amber-100 leading-snug mt-0.5">
          Gestrichelt umrahmte Abschnitte enthalten Angaben, die auf Antworten aus OWNER-INPUT.md warten.
        </p>
      </div>
    </>
  );
}
