import { ArrowDown, ArrowRight, Building2, CalendarDays, Check, CircleDot, Layers3, WalletCards } from 'lucide-react';
import { PageSEO } from '@/components/PageSEO';
import { PubLinkButton, pubFocus } from '@/components/public/PublicUI';
import './KundenprojektePage.css';

// Owner brief, 2026-09-16: BoLaGio may be featured on this preview branch.
// [[ASSET: approved product screenshots and customer testimonial before launch]]
// This illustration describes the agreed scope; it is NOT a product screenshot.
// No operational records, review ratings, financial results or live integrations.
const modules = [
  { icon: CalendarDays, title: 'Aufenthalte & Gäste', detail: 'Buchung, Gast und Aufenthalt zusammenführen.' },
  { icon: Check, title: 'Aufgaben & Betrieb', detail: 'Anreisen, Reinigung und Zuständigkeiten koordinieren.' },
  { icon: WalletCards, title: 'Finanzen & Übersicht', detail: 'Zahlungen und Kosten dem richtigen Vorgang zuordnen.' },
];

export interface ApprovedProjectReview {
  quote: string;
  author: string;
  role: string;
  company: string;
  approvedAt: string;
  publicationApproved: boolean;
}

// Keep empty until real text and publication permission are supplied.
const reviews: readonly ApprovedProjectReview[] = [];

export function ProjectReviews({ entries }: { entries: readonly ApprovedProjectReview[] }) {
  const approved = entries.filter((entry) => entry.publicationApproved && entry.approvedAt && entry.quote.trim() && entry.author.trim());
  if (!approved.length) return null;
  return (
    <section className="cq-project-section" aria-labelledby="kundenstimmen-title">
      <p className="cq-project-eyebrow">Aus der Zusammenarbeit</p>
      <h2 id="kundenstimmen-title">Kundenstimmen.</h2>
      {approved.map((entry) => (
        <figure className="cq-project-review" key={`${entry.company}-${entry.author}`}>
          <blockquote>{entry.quote}</blockquote>
          <figcaption>{entry.author} · {entry.role} · {entry.company}</figcaption>
        </figure>
      ))}
    </section>
  );
}

export function KundenprojektePage() {
  return (
    <>
      <PageSEO
        title="Kunden & Projekte | Cogniiq"
        description="Einblicke in ausgewählte Cogniiq-Projekte: Für BoLaGio in Bayreuth entstehen eine Gästewebsite und eine zentrale Verwaltung für den Hospitality-Betrieb."
        canonical="https://cogniiq.de/kundenprojekte"
        noIndex
      />
      <div className="cq-project-page">
        <div className="cq-project-preview">Projektvorschau · In Entwicklung · Noch nicht zur Veröffentlichung freigegeben</div>
        <div className="cq-project-container">
          <section className="cq-project-intro" aria-labelledby="kundenprojekte-title">
            <p className="cq-project-eyebrow">Kunden & Projekte</p>
            <h1 id="kundenprojekte-title">Anspruch wird sichtbar.<br /><span>Im Auftritt. Im Betrieb.</span></h1>
            <p className="cq-project-lead">Einblicke in die Unternehmen, für die wir Websites und digitale Abläufe entwickeln. Und in die Arbeit, die beides verbindet.</p>
            <a className={`cq-project-text-link ${pubFocus}`} href="#bolagio">BoLaGio kennenlernen <ArrowDown size={16} aria-hidden="true" /></a>
          </section>

          <article id="bolagio" className="cq-project-case" aria-labelledby="bolagio-title">
            <div className="cq-project-case-top"><span>01 / Ausgewähltes Projekt</span><span>Hospitality · Bayreuth</span></div>
            <header className="cq-project-case-heading">
              <p className="cq-project-wordmark">BoLaGio<span>GmbH</span></p>
              <h2 id="bolagio-title">Ein besonderer Aufenthalt.<br />Ein durchdachter Betrieb dahinter.</h2>
              <p>Für BoLaGio entsteht eine digitale Grundlage, die den Anspruch der Apartments nach außen trägt und die Abläufe dahinter zusammenführt.</p>
              <div className="cq-project-tags"><span>Webdesign & Entwicklung</span><span>Verwaltung & Finanzen</span><span>Prozessautomatisierung</span></div>
            </header>

            <figure className="cq-project-system" aria-labelledby="system-caption">
              <div className="cq-project-system-top"><span><CircleDot size={15} aria-hidden="true" /> BoLaGio / Digitale Struktur</span><span>Projektkonzept</span></div>
              <div className="cq-project-system-body">
                <div className="cq-project-guest"><p className="cq-project-eyebrow">Für den Gast</p><Building2 size={32} strokeWidth={1.25} aria-hidden="true" /><h3>Ankommen beginnt<br />mit dem ersten Eindruck.</h3><p>Apartments entdecken.<br />Aufenthalt planen.<br />Direkt Kontakt aufnehmen.</p></div>
                <div className="cq-project-system-arrow" aria-hidden="true"><ArrowRight size={22} /></div>
                <div className="cq-project-operations"><p className="cq-project-eyebrow">Für das Team</p><h3>Ein Zusammenhang.<br />Statt einzelner Listen.</h3>{modules.map(({ icon: Icon, title, detail }) => <div className="cq-project-module" key={title}><Icon size={19} aria-hidden="true" /><div><h4>{title}</h4><p>{detail}</p></div></div>)}</div>
              </div>
              <figcaption id="system-caption">Geplantes Zusammenspiel von Website und Verwaltung. Schematische Darstellung, keine Ansicht eines bereits produktiven Systems.</figcaption>
            </figure>

            <div className="cq-project-facts"><div><span>Unternehmen</span><strong>BoLaGio GmbH</strong></div><div><span>Standort</span><strong>Bayreuth</strong></div><div><span>Projektumfang</span><strong>Website + Betriebsplattform</strong></div><div><span>Projektstatus</span><strong>In Entwicklung</strong></div></div>

            <section className="cq-project-section cq-project-split" aria-labelledby="ambition-title">
              <div><p className="cq-project-eyebrow">Der Anspruch</p><h2 id="ambition-title">Gastfreundschaft braucht<br />Aufmerksamkeit.</h2></div>
              <div className="cq-project-prose"><p>BoLaGio steht für Premium-Hospitality in Bayreuth. Mit zusätzlichen Apartments wächst auch die Zahl der Informationen, die im Alltag zusammenpassen müssen: Gäste, Aufenthalte, Aufgaben und Zahlungen.</p><p>Der Auftrag an Cogniiq verbindet deshalb die Gästewebsite mit einer zentralen Verwaltungsoberfläche. Das Ziel: Informationen aus angebundenen Buchungsvorgängen übernehmen und für die nächsten Arbeitsschritte nutzbar machen, statt dieselben Angaben erneut abzutippen.</p></div>
            </section>

            <section className="cq-project-section" aria-labelledby="scope-title">
              <p className="cq-project-eyebrow">Was wir entwickeln</p><h2 id="scope-title">Vom ersten Interesse<br />bis zum nächsten Aufenthalt.</h2>
              <div className="cq-project-scope">
                <div><span className="cq-project-number">01</span><h3>Die Gästewebsite.</h3><p>Eine eigenständige Präsentation der Apartments mit klaren Informationen und einem direkten Anfrageweg. Die durchgängige Direktbuchung ist als weiterer Ausbauschritt vorgesehen.</p></div>
                <div><span className="cq-project-number">02</span><h3>Die Betriebszentrale.</h3><p>Gäste, Aufenthalte, Aufgaben und finanzielle Übersichten in einem gemeinsamen Arbeitsbereich. Entwickelt um die Abläufe eines Hospitality-Betriebs.</p></div>
                <div><span className="cq-project-number">03</span><h3>Die Verbindung.</h3><p>Geplante Automationen übernehmen Daten aus angebundenen Quellen und stoßen definierte Folgeaufgaben an. Unvollständige Vorgänge bleiben zur Prüfung sichtbar.</p></div>
              </div>
            </section>

            <section className="cq-project-workflow" aria-labelledby="workflow-title">
              <div><p className="cq-project-eyebrow">Ein Ablauf, konkret</p><h2 id="workflow-title">Einmal erfasst.<br />Für den Betrieb verbunden.</h2><p>So ist die Übergabe aus einer bestätigten Buchung in die Verwaltung vorgesehen.</p></div>
              <ol>{[['Buchung übernehmen', 'Bestätigte Daten aus der angebundenen Buchungsquelle empfangen.'], ['Gast & Aufenthalt zuordnen', 'Informationen zusammenführen, ohne denselben Gast erneut anzulegen.'], ['Folgeaufgaben vorbereiten', 'Anreise und Reinigung mit Zuständigkeit im Team verknüpfen.'], ['Finanziellen Status zeigen', 'Zahlungsinformationen dem Aufenthalt zuordnen; offene Punkte zur Prüfung kennzeichnen.']].map(([title, detail], index) => <li key={title}><span>{index + 1}</span><div><h3>{title}</h3><p>{detail}</p></div></li>)}</ol>
              <p className="cq-project-workflow-note">Zielablauf in Entwicklung. Die produktiven Anbindungen und ihr tatsächlicher Umfang werden vor Veröffentlichung dieses Projekts geprüft.</p>
            </section>

            <section className="cq-project-section" aria-labelledby="growth-title">
              <p className="cq-project-eyebrow">Die nächste Etappe</p><h2 id="growth-title">Eine Marke.<br />Raum für mehr.</h2>
              <div className="cq-project-expansion"><div><span className="cq-project-status">In Vorbereitung</span><h3>Opernstraße 3.<br />Am Sternplatz.</h3><p>Drei neue Apartments erweitern das BoLaGio-Portfolio in der Bayreuther Innenstadt.</p></div><div><span className="cq-project-status">Geplant</span><h3>Açaí.<br />Ein neuer Treffpunkt.</h3><p>Die geplante Açaí- und Health-Bar ergänzt die Hospitality-Marke um ein eigenes gastronomisches Angebot. Die digitale Umsetzung bildet einen weiteren Projektbaustein.</p></div></div>
              <p className="cq-project-growth-note"><Layers3 size={18} aria-hidden="true" /> Weitere Standorte sind Teil der Expansionsplanung.</p>
            </section>
          </article>

          <ProjectReviews entries={reviews} />
          <section className="cq-project-closing" aria-labelledby="project-cta-title"><p className="cq-project-eyebrow">Ihr Unternehmen</p><h2 id="project-cta-title">Was soll bei Ihnen<br />besser zusammenspielen?</h2><p>Wir besprechen Ihren Auftritt, Ihre Abläufe und die Verbindungen, die Ihrem Team im Alltag fehlen.</p><PubLinkButton to="/kontakt" size="lg" icon={ArrowRight} iconTrailing>Projekt besprechen</PubLinkButton><div className="cq-project-related"><PubLinkButton to="/webdesign" variant="quiet">Webdesign ansehen</PubLinkButton><PubLinkButton to="/prozessautomatisierung" variant="quiet">Automatisierung ansehen</PubLinkButton></div></section>
        </div>
      </div>
    </>
  );
}
