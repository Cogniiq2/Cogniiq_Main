// Premium transactional PDF engine (template "cogniiq-premium-offer-v2"). Uses
// @react-pdf/renderer for real, selectable text with an embedded font (correct German +
// euro glyphs — never "?"), variable-height module rows, section-aware pagination,
// headings kept with their content (wrap={false}), a repeatable footer and page numbers.
// It consumes the deterministic PremiumSource model, so preview and print never diverge.
//
// The engine and its fonts are loaded lazily (dynamic import) so react-pdf stays out of the
// main bundle. The JSX tree (buildDocument) is shared, but the final render call is environment-
// specific and split into two explicit, non-overlapping exports:
//   - renderPremiumOfferPdfBrowser: pdf(element).toBlob() — the ONLY API @react-pdf/renderer's
//     browser build actually supports. Imported by browser code (via ./index.ts) only.
//   - renderPremiumOfferPdfNode: renderToBuffer(element) — Node-only, used by the local fixture
//     renderer and PDF test scripts. Never imported by browser code.
// There is deliberately no combined function that feature-detects which API to call: the browser
// build exposes `renderToBuffer` as a function-shaped stub, so `typeof renderToBuffer ===
// 'function'` is true there too and used to wrongly pick the Node path, throwing
// "renderToBuffer is a Node specific API" at runtime. Structural separation (two call sites,
// each importing only what it needs) prevents that class of bug entirely.

import type { PremiumSource, PremiumModule } from './premiumSource';
import { buildPremiumSource } from './premiumSource';
import type { TransactionalDocument } from '../documentModel';
import { PREMIUM_OFFER_TEMPLATE_KEY } from '../documentModel';

export interface PremiumFontSources {
  regular: string;   // URL (browser) or absolute file path (node)
  bold: string;
}

export interface PremiumRenderOptions {
  fonts?: PremiumFontSources;
}

const GRAPHITE = '#1A1A1A';
const GRAY = '#4B5563';
const MUTED = '#6B7280';
const HAIR = '#E5E7EB';
const SOFT = '#F7F8F9';

// Registered independently per environment: fonts registered while rendering in Node (the
// fixture/test harness, using on-disk file paths) must not be assumed valid for a later browser
// render (Vite asset URLs), and vice versa.
const fontsRegistered = { browser: false, node: false };

/**
 * Build the React tree. `RP` is the loaded @react-pdf/renderer module. Kept as a factory so the
 * same JSX is used by renderToBuffer/streams without importing react-pdf at module load.
 */
function buildDocument(RP: typeof import('@react-pdf/renderer'), src: PremiumSource, fontFamily: string) {
  const { Document, Page, View, Text, StyleSheet } = RP;
  const accent = src.accent;

  const s = StyleSheet.create({
    page: { paddingTop: 54, paddingBottom: 64, paddingHorizontal: 52, fontFamily, fontSize: 10, color: GRAPHITE },
    // Cover
    coverBrandRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
    brand: { fontFamily, fontSize: 17, fontWeight: 700, letterSpacing: 0.5, color: GRAPHITE },
    accentRule: { height: 3, width: 54, backgroundColor: accent, marginTop: 10, marginBottom: 0 },
    kindLabel: { fontSize: 11, letterSpacing: 3, color: MUTED, textTransform: 'uppercase', marginTop: 130 },
    coverTitle: { fontSize: 30, fontWeight: 700, color: GRAPHITE, marginTop: 14, lineHeight: 1.2 },
    coverSubtitle: { fontSize: 14, color: GRAY, marginTop: 10, lineHeight: 1.4 },
    coverValue: { fontSize: 11, color: GRAY, marginTop: 22, maxWidth: 400, lineHeight: 1.6 },
    coverMetaWrap: { flexDirection: 'row', marginTop: 150, justifyContent: 'space-between' },
    coverMetaCol: { flexDirection: 'column', width: '48%' },
    metaLabel: { fontSize: 8, letterSpacing: 1.5, color: MUTED, textTransform: 'uppercase' },
    metaValue: { fontSize: 11, color: GRAPHITE, marginTop: 3 },
    metaValueSub: { fontSize: 9.5, color: GRAY, marginTop: 1 },
    draftBadge: { position: 'absolute', top: 44, right: 52, borderWidth: 1, borderColor: accent, color: accent, fontSize: 9, letterSpacing: 2, paddingVertical: 4, paddingHorizontal: 10, borderRadius: 3 },
    // Sections
    sectionHead: { flexDirection: 'row', alignItems: 'center', marginBottom: 10 },
    sectionBar: { width: 3, height: 15, backgroundColor: accent, marginRight: 8 },
    sectionTitle: { fontSize: 13, fontWeight: 700, color: GRAPHITE, letterSpacing: 0.2 },
    block: { marginBottom: 20 },
    subHead: { fontSize: 10.5, fontWeight: 700, color: GRAPHITE, marginBottom: 4, marginTop: 8 },
    para: { fontSize: 10, color: GRAY, marginBottom: 6, lineHeight: 1.6 },
    bulletRow: { flexDirection: 'row', marginBottom: 3, paddingRight: 6 },
    bulletDot: { width: 10, fontSize: 10, color: accent },
    bulletText: { flex: 1, fontSize: 10, color: GRAY, lineHeight: 1.5 },
    // Modules
    module: { borderWidth: 1, borderColor: HAIR, borderRadius: 6, padding: 14, marginBottom: 12 },
    moduleTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
    moduleNo: { fontSize: 8, letterSpacing: 1.5, color: accent, textTransform: 'uppercase', marginBottom: 3 },
    moduleTitle: { fontSize: 12, fontWeight: 700, color: GRAPHITE, maxWidth: 360, lineHeight: 1.3 },
    modulePrice: { fontSize: 12, fontWeight: 700, color: GRAPHITE },
    modulePriceLabel: { fontSize: 7.5, color: MUTED, textAlign: 'right', textTransform: 'uppercase', letterSpacing: 1 },
    moduleDetails: { fontSize: 9.5, color: GRAY, marginTop: 7, marginBottom: 4, lineHeight: 1.55 },
    moduleMetaRow: { flexDirection: 'row', marginTop: 8, gap: 16 },
    moduleTag: { fontSize: 8.5, color: MUTED },
    moduleTagStrong: { fontSize: 8.5, color: GRAPHITE },
    // Investment
    invBox: { borderWidth: 1, borderColor: HAIR, borderRadius: 6, overflow: 'hidden' },
    invRow: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 8, paddingHorizontal: 14, borderBottomWidth: 1, borderBottomColor: HAIR },
    invRowLabel: { fontSize: 10, color: GRAY },
    invRowValue: { fontSize: 10, color: GRAPHITE },
    invTotal: { flexDirection: 'row', justifyContent: 'space-between', paddingVertical: 12, paddingHorizontal: 14, backgroundColor: SOFT },
    invTotalLabel: { fontSize: 11, fontWeight: 700, color: GRAPHITE },
    invTotalValue: { fontSize: 14, fontWeight: 700, color: GRAPHITE },
    // Payment / timeline rows
    payRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center', paddingVertical: 9, borderBottomWidth: 1, borderBottomColor: HAIR },
    payLabel: { fontSize: 10, color: GRAPHITE, flex: 1 },
    payNote: { fontSize: 8.5, color: MUTED, marginTop: 1 },
    payAmount: { fontSize: 9, color: MUTED, marginRight: 12 },
    payPct: { fontSize: 11, fontWeight: 700, color: accent, minWidth: 70, textAlign: 'right' },
    tlRow: { flexDirection: 'row', marginBottom: 10 },
    tlLeft: { width: 96, paddingRight: 10 },
    tlPhase: { fontSize: 9, fontWeight: 700, color: accent },
    tlDuration: { fontSize: 8.5, color: MUTED, marginTop: 2 },
    tlTitle: { fontSize: 10, fontWeight: 700, color: GRAPHITE },
    tlDesc: { fontSize: 9.5, color: GRAY, marginTop: 2, lineHeight: 1.5 },
    twoCol: { flexDirection: 'row', gap: 18 },
    col: { flex: 1 },
    // Closing
    closing: { fontSize: 10, color: GRAY, lineHeight: 1.6, marginBottom: 10 },
    nextBox: { borderLeftWidth: 3, borderLeftColor: accent, backgroundColor: SOFT, padding: 12, borderRadius: 3 },
    nextHead: { fontSize: 10.5, fontWeight: 700, color: GRAPHITE, marginBottom: 3 },
    nextText: { fontSize: 10, color: GRAY, lineHeight: 1.6 },
    // Footer
    footer: { position: 'absolute', bottom: 30, left: 52, right: 52, flexDirection: 'row', justifyContent: 'space-between', borderTopWidth: 1, borderTopColor: HAIR, paddingTop: 8 },
    footerText: { fontSize: 7.5, color: MUTED, maxWidth: 400, lineHeight: 1.4 },
    footerPage: { fontSize: 7.5, color: MUTED },
  });

  const Para = ({ text }: { text: string }) => (
    <View>{text.split(/\n{2,}/).map((p, i) => (
      <Text key={i} style={s.para}>{p.split(/\n/).join(' ')}</Text>
    ))}</View>
  );

  const Bullets = ({ items }: { items: string[] }) => (
    <View>{items.map((it, i) => (
      <View key={i} style={s.bulletRow}><Text style={s.bulletDot}>•</Text><Text style={s.bulletText}>{it}</Text></View>
    ))}</View>
  );

  const Heading = ({ title }: { title: string }) => (
    <View style={s.sectionHead}><View style={s.sectionBar} /><Text style={s.sectionTitle}>{title}</Text></View>
  );

  const Section = ({ title, children, keep = 48 }: { title: string; children: React.ReactNode; keep?: number }) => (
    <View style={s.block} minPresenceAhead={keep}>
      <Heading title={title} />
      {children}
    </View>
  );

  // Section whose heading is glued to its first item so the heading never sits alone at a
  // page bottom (variable-height module rows make a distance heuristic unreliable).
  const ModuleSection = ({ title, mods, prefix }: { title: string; mods: PremiumModule[]; prefix: string }) => (
    <View style={s.block}>
      <View wrap={false}>
        <Heading title={title} />
        <ModuleCard m={mods[0]} prefix={prefix} />
      </View>
      {mods.slice(1).map((m) => <ModuleCard key={`${prefix}${m.index}`} m={m} prefix={prefix} />)}
    </View>
  );

  const ModuleCard = ({ m, prefix }: { m: PremiumModule; prefix: string }) => (
    <View style={s.module} wrap={false}>
      <View style={s.moduleTop}>
        <View style={{ flex: 1, paddingRight: 12 }}>
          <Text style={s.moduleNo}>{prefix} {m.index}</Text>
          <Text style={s.moduleTitle}>{m.title}</Text>
        </View>
        <View><Text style={s.modulePriceLabel}>Netto</Text><Text style={s.modulePrice}>{m.netLabel}</Text></View>
      </View>
      {m.details ? <Text style={s.moduleDetails}>{m.details.split(/\n/).join(' ')}</Text> : null}
      {m.deliverables.length ? <Bullets items={m.deliverables} /> : null}
      {(m.phaseLabel || m.durationLabel) ? (
        <View style={s.moduleMetaRow}>
          {m.phaseLabel ? <Text style={s.moduleTag}>Phase: <Text style={s.moduleTagStrong}>{m.phaseLabel}</Text></Text> : null}
          {m.durationLabel ? <Text style={s.moduleTag}>Dauer: <Text style={s.moduleTagStrong}>{m.durationLabel}</Text></Text> : null}
        </View>
      ) : null}
    </View>
  );

  const Footer = () => (
    <View style={s.footer} fixed>
      <Text style={s.footerText}>{src.footer ?? `${src.seller.legalName}${src.seller.email ? ' · ' + src.seller.email : ''}`}</Text>
      <Text style={s.footerPage} render={({ pageNumber, totalPages }: { pageNumber: number; totalPages: number }) => `Seite ${pageNumber} von ${totalPages}`} />
    </View>
  );

  const numberText = src.documentNumber ?? (src.isDraft ? src.draftBadge : '');

  return (
    <Document title={`${src.kindLabel} ${numberText}`.trim()} author={src.seller.legalName}>
      {/* Page 1 — Premium cover */}
      <Page size="A4" style={s.page} wrap>
        {src.isDraft ? <Text style={s.draftBadge}>{src.draftBadge}</Text> : null}
        <View style={s.coverBrandRow}>
          <View><Text style={s.brand}>{src.seller.legalName}</Text><View style={s.accentRule} /></View>
        </View>
        <Text style={s.kindLabel}>{src.kindLabel}{numberText ? `  ·  ${numberText}` : ''}</Text>
        <Text style={s.coverTitle}>{src.title}</Text>
        {src.subtitle ? <Text style={s.coverSubtitle}>{src.subtitle}</Text> : null}
        {src.valueProposition ? <Text style={s.coverValue}>{src.valueProposition}</Text> : null}
        <View style={s.coverMetaWrap}>
          <View style={s.coverMetaCol}>
            <Text style={s.metaLabel}>Für</Text>
            <Text style={s.metaValue}>{src.recipient.company}</Text>
            {src.recipient.contactName ? <Text style={s.metaValueSub}>{src.recipient.contactName}{src.recipient.department ? ` · ${src.recipient.department}` : ''}</Text> : null}
            {src.recipient.addressLines.map((l, i) => <Text key={i} style={s.metaValueSub}>{l}</Text>)}
          </View>
          <View style={s.coverMetaCol}>
            <Text style={s.metaLabel}>{src.dates.issueLabel}</Text>
            <Text style={s.metaValue}>{src.dates.issue}</Text>
            {src.dates.valid ? <><Text style={[s.metaLabel, { marginTop: 12 }]}>{src.dates.validLabel}</Text><Text style={s.metaValue}>{src.dates.valid}</Text></> : null}
          </View>
        </View>
        {Footer()}
      </Page>

      {/* Page 2+ — Understanding & objectives, then everything else, auto-paginated */}
      <Page size="A4" style={s.page} wrap>
        {(src.introduction || src.projectApproach || src.executiveSummary || src.desiredOutcomes.length) ? (
          <Section title="Ausgangslage & Zielbild">
            {src.introduction ? <><Text style={s.subHead}>Ausgangslage</Text><Para text={src.introduction} /></> : null}
            {src.projectApproach ? <><Text style={s.subHead}>Zielbild & Vorgehen</Text><Para text={src.projectApproach} /></> : null}
            {src.executiveSummary ? <><Text style={s.subHead}>Executive Summary</Text><Para text={src.executiveSummary} /></> : null}
            {src.desiredOutcomes.length ? <><Text style={s.subHead}>Erwartete Ergebnisse</Text><Bullets items={src.desiredOutcomes} /></> : null}
          </Section>
        ) : null}

        {src.modules.length ? <ModuleSection title="Projektmodule" mods={src.modules} prefix="Modul" /> : null}

        {src.optionalModules.length ? (
          <ModuleSection title="Optionale Zusatzmodule (nicht im Investitionsvolumen)" mods={src.optionalModules} prefix="Option" />
        ) : null}

        <View style={s.block} wrap={false}>
          <Heading title="Investitionsübersicht" />
          <View style={s.invBox}>
            <View style={s.invRow}><Text style={s.invRowLabel}>Nettosumme</Text><Text style={s.invRowValue}>{src.investment.netLabel}</Text></View>
            {src.investment.vatRows.map((r, i) => (
              <View key={i} style={s.invRow}><Text style={s.invRowLabel}>{r.label} · Netto {r.net}</Text><Text style={s.invRowValue}>{r.vat}</Text></View>
            ))}
            <View style={s.invRow}><Text style={s.invRowLabel}>Umsatzsteuer gesamt</Text><Text style={s.invRowValue}>{src.investment.vatTotalLabel}</Text></View>
            <View style={s.invTotal}><Text style={s.invTotalLabel}>Gesamtinvestition (brutto)</Text><Text style={s.invTotalValue}>{src.investment.grossLabel}</Text></View>
          </View>
        </View>

        {(src.timeline.length || src.deliveryTerms) ? (
          <Section title="Zeitplan & Zusammenarbeit">
            {src.timeline.map((t, i) => (
              <View key={i} style={s.tlRow} wrap={false}>
                <View style={s.tlLeft}>
                  {t.phase ? <Text style={s.tlPhase}>{t.phase}</Text> : null}
                  {t.duration ? <Text style={s.tlDuration}>{t.duration}</Text> : null}
                </View>
                <View style={{ flex: 1 }}>
                  {t.title ? <Text style={s.tlTitle}>{t.title}</Text> : null}
                  {t.description ? <Text style={s.tlDesc}>{t.description}</Text> : null}
                </View>
              </View>
            ))}
            {src.deliveryTerms ? <><Text style={s.subHead}>Liefer- & Mitwirkungsbedingungen</Text><Para text={src.deliveryTerms} /></> : null}
          </Section>
        ) : null}

        {src.payment.rows.length ? (
          <Section title="Zahlungsplan">
            {src.payment.rows.map((r, i) => (
              <View key={i} style={s.payRow} wrap={false}>
                <View style={{ flex: 1 }}><Text style={s.payLabel}>{r.label}</Text>{r.note ? <Text style={s.payNote}>{r.note}</Text> : null}</View>
                {r.amountLabel ? <Text style={s.payAmount}>{r.amountLabel}</Text> : null}
                <Text style={s.payPct}>{r.right}</Text>
              </View>
            ))}
            {src.payment.note ? <Text style={[s.para, { marginTop: 8 }]}>{src.payment.note}</Text> : null}
          </Section>
        ) : null}

        {(src.assumptions || src.exclusions) ? (
          <Section title="Annahmen & Ausschlüsse">
            <View style={s.twoCol}>
              {src.assumptions ? <View style={s.col}><Text style={s.subHead}>Annahmen</Text><Para text={src.assumptions} /></View> : null}
              {src.exclusions ? <View style={s.col}><Text style={s.subHead}>Nicht enthalten</Text><Para text={src.exclusions} /></View> : null}
            </View>
          </Section>
        ) : null}

        {(src.closing || src.nextSteps) ? (
          <Section title="Nächste Schritte">
            {src.closing ? <Text style={s.closing}>{src.closing.split(/\n/).join(' ')}</Text> : null}
            <View style={s.nextBox} wrap={false}>
              <Text style={s.nextHead}>Nächster Schritt</Text>
              <Text style={s.nextText}>{src.nextSteps ?? 'Nach Ihrer Online-Annahme stimmen wir gemeinsam den Projektstart und die erste Konzeptionsphase ab.'}</Text>
            </View>
          </Section>
        ) : null}

        {Footer()}
      </Page>
    </Document>
  );
}

async function ensureFonts(
  RP: typeof import('@react-pdf/renderer'),
  fonts: PremiumFontSources | undefined,
  env: 'browser' | 'node',
): Promise<string> {
  if (!fonts) return 'Helvetica';
  if (!fontsRegistered[env]) {
    RP.Font.register({ family: 'Cogniiq', fonts: [
      { src: fonts.regular, fontWeight: 400 },
      { src: fonts.bold, fontWeight: 700 },
    ] });
    // No hyphenation — avoids odd mid-word breaks in German compounds.
    RP.Font.registerHyphenationCallback((word: string) => [word]);
    fontsRegistered[env] = true;
  }
  return 'Cogniiq';
}

/**
 * Render the premium PDF to bytes — BROWSER ONLY. Uses `pdf(element).toBlob()`, the only
 * rendering entry point @react-pdf/renderer's browser build actually implements. Must never call
 * `renderToBuffer`/`renderToFile`/`renderToStream` (Node-only; throws "renderToBuffer is a Node
 * specific API" if invoked in a browser). Import this from browser code only (via ./index.ts).
 */
export async function renderPremiumOfferPdfBrowser(doc: TransactionalDocument, opts: PremiumRenderOptions = {}): Promise<Uint8Array> {
  const RP = await import('@react-pdf/renderer');
  const family = await ensureFonts(RP, opts.fonts, 'browser');
  const src = buildPremiumSource(doc);
  const element = buildDocument(RP, src, family);
  const instance = RP.pdf(element);
  const blob = await instance.toBlob();
  return new Uint8Array(await blob.arrayBuffer());
}

/**
 * Render the premium PDF to bytes — NODE ONLY. Uses `renderToBuffer(element)`. Import this from
 * Node fixtures/test scripts only; never from browser code.
 */
export async function renderPremiumOfferPdfNode(doc: TransactionalDocument, opts: PremiumRenderOptions = {}): Promise<Uint8Array> {
  const RP = await import('@react-pdf/renderer');
  const family = await ensureFonts(RP, opts.fonts, 'node');
  const src = buildPremiumSource(doc);
  const element = buildDocument(RP, src, family);
  return new Uint8Array(await RP.renderToBuffer(element));
}

export { PREMIUM_OFFER_TEMPLATE_KEY };
