import { CostPage } from "@/components/CostPage";
import type { CostPageConfig } from "@/components/CostPage";
import { BUSINESS_INFO } from "@/lib/seo-data";

// [[CLAIM: verify — alle Preisangaben auf dieser Seite (Staffeln, Beispielwerte)
// sind vor Veröffentlichung vom Inhaber zu bestätigen]]
const config: CostPageConfig = {
  seo: {
    title: "Was kostet ein KI Telefonassistent? Preise | Cogniiq",
    description:
      "Was kostet ein KI Telefonassistent? Festes Minutenkontingent mit Obergrenze: Tarife, Einrichtung und Einflussfaktoren im Überblick.",
    canonical: `${BUSINESS_INFO.website}/kosten-ki-telefonassistent`,
  },
  h1: "Was kostet ein KI Telefonassistent?",
  intro:
    "Die wichtigste Antwort zuerst: Sie zahlen einen festen Monatsbetrag für ein Minutenkontingent. Wird es überschritten, kostet jede weitere Minute 0,39 € – und die Rechnung übersteigt nie den nächsthöheren Tarif. Abgerechnet wird pro Praxis, nicht pro Behandler. Einmalig kommt die Einrichtung dazu; sie steht vor Vertragsschluss im Angebot. Hier finden Sie die Tarife, die Faktoren dahinter und Beispielkonfigurationen zur Orientierung.",
  serviceLink: "/ki-telefonassistent",
  serviceLinkLabel: "KI Telefonassistent entdecken",
  priceRanges: [
    {
      label: "Basis",
      range: "ab 99 €/Monat",
      description:
        "Anrufannahme mit Ihren Ansagen, Beantwortung wiederkehrender Fragen und strukturierte Aufnahme von Anliegen mit Weiterleitung an Ihr Team. Für kleinere Betriebe mit überschaubarem Anrufaufkommen.",
    },
    {
      label: "Professionell",
      range: "199 – 399 €/Monat",
      description:
        "Zusätzlich Terminbuchung nach Ihren Regeln, Anbindung an Kalender oder CRM und ein individuell erarbeiteter Anliegen-Katalog für Ihren Betrieb. Der übliche Zuschnitt für Praxen und Betriebe mit täglichem Telefonaufkommen.",
    },
    {
      label: "Enterprise",
      range: "ab 499 €/Monat",
      description:
        "Für mehrere Standorte, mehrsprachige Konfigurationen und individuelle Anbindungen an bestehende Systeme – mit eigenem Ansprechpartner für laufende Anpassungen.",
    },
  ],
  priceFactors: [
    {
      title: "Umfang des Anliegen-Katalogs",
      description:
        "Ein Assistent, der Anliegen aufnimmt und weiterleitet, ist einfacher zu konfigurieren als einer, der Termine nach komplexen Regeln vergibt. Der Umfang dessen, was er erledigen soll, ist der größte Preisfaktor.",
    },
    {
      title: "Anbindung an Kalender, CRM oder Praxissoftware",
      description:
        "Die Übergabe in Ihr System ist der Kern des Produkts. Welche Anbindung möglich ist und was sie kostet, prüfen wir vor dem Angebot – nicht danach.",
    },
    {
      title: "Eigene Ansagen und Stimme",
      description:
        "Stimmauswahl, Begrüßungssatz und Formulierungen gehören zur Einrichtung. Mehr Anliegen und mehr Regeln bedeuten mehr Abstimmung und damit einen höheren einmaligen Einrichtungsaufwand.",
    },
    {
      title: "Branchenspezifische Regeln",
      description:
        "Praxen brauchen andere Regeln als Restaurants: Notfall-Weiterleitung, Umgang mit Gesundheitsdaten, Rezeptbestellungen. Diese Abstimmung fließt in die Einrichtung ein.",
    },
    {
      title: "Mehrsprachigkeit",
      description:
        "Konfigurationen für mehrere Sprachen – etwa Deutsch und Englisch – erfordern zusätzliche Abstimmung und wirken sich auf den Monatsbetrag aus.",
    },
    {
      title: "Einmalige Einrichtung",
      description:
        "Je nach Umfang fällt eine einmalige Einrichtungsgebühr an. Sie steht im Angebot, bevor Sie unterschreiben – wir halten es für ehrlicher, sie zu nennen, als sie im Monatspreis zu verstecken.",
    },
  ],
  exampleProjects: [
    {
      title: "Beispielkonfiguration: Hausarztpraxis",
      description:
        "Terminwünsche und Stornierungen nach Praxisregeln, strukturierte Aufnahme von Rezeptbestellungen, Notfall-Weiterleitung an den Bereitschaftsdienst, Anbindung an den Praxiskalender.",
      investment: "249 €/Monat",
    },
    {
      title: "Beispielkonfiguration: Restaurant",
      description:
        "Reservierungsannahme mit Bestätigung, Beantwortung wiederkehrender Fragen zu Küche und Zeiten, Erreichbarkeit auch außerhalb der Servicezeiten.",
      investment: "149 €/Monat",
    },
    {
      title: "Beispielkonfiguration: Handwerksbetrieb",
      description:
        "Anrufannahme während der Außeneinsätze, strukturierte Erfassung von Auftragsanfragen mit Rückrufnummer, Übergabe als sortierte Liste an den Inhaber.",
      investment: "199 €/Monat",
    },
    {
      title: "Beispielkonfiguration: Therapiepraxis",
      description:
        "Terminwünsche und Absagen während der Behandlungszeiten, Warteliste für frei werdende Termine, Auftragsverarbeitungsvertrag nach Art. 28 DSGVO.",
      investment: "299 €/Monat",
    },
  ],
  cityLinks: [
    { label: "KI Telefonassistent Bayreuth", href: "/bayreuth/ki-telefonassistent" },
    { label: "KI Telefonassistent München", href: "/muenchen/ki-telefonassistent" },
    { label: "KI Telefonassistent Regensburg", href: "/regensburg/ki-telefonassistent" },
    { label: "KI Telefonassistent Bayern", href: "/bayern/ki-telefonassistent" },
    { label: "KI Agentur Deutschland", href: "/ki-agentur-deutschland" },
  ],
  industryLinks: [
    { label: "KI Telefonassistent Arztpraxis", href: "/ki-telefonassistent-arzt" },
    { label: "KI Telefonassistent Restaurant", href: "/ki-telefonassistent-restaurant" },
    { label: "KI Telefonassistent Hotel", href: "/ki-telefonassistent-hotel" },
    { label: "KI Telefonassistent Praxis", href: "/ki-telefonassistent-praxis" },
  ],
  faq: [
    {
      question: "Sind die Kosten wirklich planbar – auch bei vielen Anrufen?",
      answer:
        "Der Kern des Modells ist die Obergrenze: Ihr Tarif enthält ein Minutenkontingent, darüber kostet jede Minute 0,39 € – und die Monatsrechnung übersteigt nie den nächsthöheren Tarif. Eine Grippewelle kann Ihre Rechnung also bewegen, aber nicht sprengen. Wächst Ihr Bedarf dauerhaft über das Kontingent hinaus, besprechen wir den passenden Tarif offen.",
    },
    {
      question: "Was kostet ein KI Telefonassistent pro Monat?",
      answer:
        "Die monatlichen Kosten beginnen bei etwa 99 €/Monat für einfache Konfigurationen. Der übliche Zuschnitt mit Terminbuchung und Systemanbindung liegt bei 199–399 €/Monat. Das konkrete Angebot hängt vom Umfang Ihres Anliegen-Katalogs und den benötigten Anbindungen ab – es steht schriftlich fest, bevor Sie sich entscheiden.",
    },
    {
      question: "Gibt es eine Einrichtungsgebühr?",
      answer:
        "Je nach Umfang der Konfiguration ja. Sie deckt das Aufnahmegespräch, den Anliegen-Katalog, die Ansagen und die Testphase ab. Die Höhe steht im Angebot, bevor Sie unterschreiben – versteckte Einmalkosten gibt es nicht.",
    },
    {
      question: "Wie lange bin ich vertraglich gebunden?",
      // [[CLAIM: verify — Vertragslaufzeiten und Kündigungsfristen vom Inhaber bestätigen]]
      answer:
        "Wir bieten flexible Laufzeiten mit klar benannter Kündigungsfrist. Die konkreten Konditionen stehen im Angebot – vor Vertragsschluss, nicht im Kleingedruckten danach.",
    },
    {
      question: "Muss ich für den Assistenten mein System oder meine Rufnummer wechseln?",
      answer:
        "Nein. Ihre Rufnummer bleibt, Ihr Kalender bleibt, Ihre Software bleibt. Der Assistent wird an Ihre bestehende Arbeitsweise angebunden; was für Ihr System möglich ist, prüfen wir vor dem Angebot.",
    },
    {
      question: "Was kostet die Anbindung an bestehende Systeme?",
      answer:
        "Verbreitete Anbindungen wie Google Calendar oder Outlook sind in vielen Konfigurationen enthalten oder kosten eine geringe einmalige Gebühr. Individuelle Anbindungen kalkulieren wir separat und weisen sie im Angebot einzeln aus.",
    },
    {
      question: "Kann ich den Umfang später erweitern oder verkleinern?",
      answer:
        "Ja. Der Anliegen-Katalog lässt sich erweitern, Regeln und Ansagen lassen sich anpassen. Preisliche Auswirkungen besprechen wir vorher – eine Änderung am Preis ohne Ihre Zustimmung gibt es nicht.",
    },
  ],
  ctaHeadline: "Ihr Angebot: schriftlich, aufgeschlüsselt, ohne Überraschungen",
  ctaText:
    "Im unverbindlichen Erstgespräch gehen wir Ihre typischen Anrufe durch und klären, welcher Umfang zu Ihrem Betrieb passt. Danach erhalten Sie ein schriftliches Angebot mit allen Posten – und entscheiden in Ruhe.",
};

export function KostenKiTelefonassistent() {
  return <CostPage config={config} />;
}
