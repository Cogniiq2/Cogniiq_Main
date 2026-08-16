# MASTER PROMPT II — Cogniiq: Vertrauensebene, Ehrlichkeits-Audit & Positionierung
> **Follow-up to `.claude/COPY-BRIEF.md`.** Save as `.claude/COPY-BRIEF-2.md` and reference from `CLAUDE.md`.
> Branch `claude/cogniiq-copy-overhaul-mjkdf4` already contains the first pass. **Do not redo that work.**
---
## 0. READ FIRST — CONTEXT AND HARD RULES
### 0.1 Start by reading, in this order
1. `.claude/COPY-BRIEF.md` — **all rules in it remain fully binding**, especially: German only (Sie-Form), no invented statistics or testimonials, no verbatim forum language, no competitor named negatively, no overclaiming, no medical triage implication, approved-statistics list only.
2. `COPY-INVENTORY.md`, `COPY-SEO-CHANGELOG.md`, `COPY-CLAIMS-TO-VERIFY.md`, `COPY-GAPS.md` — your own output from pass 1.
3. `src/lib/telefonassistent-copy.ts` — the shared module. Extend it; don't fork it.
### 0.2 The governing principle of this pass
**Pass 1 removed the lies. Pass 2 builds the proof.**
More copy will not increase trust with this audience. What increases trust is: sensory proof, named limitations, and reversibility. Where a proof asset does not exist yet, **build the slot and mark it — never write copy that implies the proof exists.**
### 0.3 Two new marker types
```
[[CLAIM: ...]]     → factual assertion needing owner confirmation (existing convention, code comments)
[[ASSET: ...]]     → a proof asset (audio, screenshot, video, reference customer, document)
                     that must be supplied before the section may ship
```
Both live as **code comments**, never as rendered German text. Any component whose content depends on an unsupplied `[[ASSET]]` must not render at all in production — see §7.2.
### 0.4 Absolute stop conditions
Stop and ask the owner before proceeding if:
- §1 (owner input) is unanswered — **you may not write copy that depends on unverified pricing, integrations, response times, or the Art. 50 announcement**
- §2 (positioning flag) is unset
- Any work would require asserting something no one has confirmed
**Never fill a gap with a plausible-sounding invention. An empty, marked slot is a correct outcome.**
---
## 1. PHASE 0 — OWNER INPUT (BLOCKING)
Produce `OWNER-INPUT.md` at repo root: a fill-in form consolidating every open `[[CLAIM]]` from pass 1 plus everything §4 needs. Group by decision type, one line per item, blank field for the answer, and a one-line note on what breaks if it stays unanswered.
Minimum required groups:
**A · Preis & Vertrag** — exact tiers, what's included, setup fee (yes/no + amount), minimum term, notice period, whether per-call billing ever occurs, test phase terms.
**B · Produkt & Technik** — verified PVS list split into *direkt angebunden / über Schnittstelle möglich / auf Anfrage*; verified telephone-system compatibility; hosting location; sub-processors; whether patient data is used for training; what is recorded, stored, for how long; behaviour during outage; supported languages.
**C · Compliance** — **does the assistant announce itself as an AI system at call start today, yes or no?** If no: is it being built, by when? Whether an AVV is provided as standard; whether a TOM list exists; whether documents are downloadable.
**D · Service & Betreuung** — who the practice actually reaches (name/role); reachability window; committed response time; how change requests to announcements and rules are handled and within what timeframe; onboarding duration.
**E · Onboarding-Prozess** — the real 4–6 steps, exactly as they happen. This carries the entire "für Ihre Praxis gebaut" promise. Adjectives cannot substitute.
**F · Proof-Assets** — availability of: audio sample, handoff screenshot/recording, reference practice with written permission, own measured automation rate.
**G · Positionierung** — see §2.
**After creating this file, stop and report.** Do not begin §3 until it comes back filled.
---
## 2. POSITIONING DECISION (BLOCKING)
The site currently sells healthcare, hotels and restaurants from one homepage. The healthcare buyer's decisive question is whether the system is built for *their* practice. A generalist frame undercuts that.
The owner sets exactly one flag in `OWNER-INPUT.md`:
- **`A — Healthcare-Fokus`** → the healthcare cluster gets its own entry path, its own navigation and its own landing page; the multi-industry story is reachable only from the corporate root. Healthcare pages must never link into hotel/restaurant content.
- **`B — Horizontal mit klarer Trennung`** → industries stay side by side, but each vertical gets a self-contained entry page and cross-industry links are removed from within a vertical's journey.
- **`C — Horizontal wie bisher`** → structure unchanged. Then the specificity promise must be carried entirely by §4.5 (the onboarding process) and §4.6 (segment depth), and the copy must not imply healthcare exclusivity anywhere.
Implement the chosen option in §6. **Do not choose on the owner's behalf.**
---
## 3. PHASE 1 — REPO-WIDE HONESTY AUDIT
Pass 1 cleaned the healthcare cluster. The same patterns almost certainly exist elsewhere. A half-honest site is worse than a uniformly overclaiming one: a prospect who crosses the seam stops believing everything.
Scan **the entire repository** — all pages, all configs, all components, all copy constants, plus `public/`, meta tags, OG descriptions, JSON-LD, form confirmations, error and empty states, email templates, and any PDF/asset text.
Search for and report every instance of:
1. **Numbers without a source** — call volumes, seconds, percentages, savings, ROI timeframes, salary comparisons, customer counts, uptime.
2. **The four "Beispielprojekte" pattern anywhere else.** Constructed configurations presented in the visual language of customer cases are misleading advertising under UWG. Every instance must be either reframed as an explicit *Beispielkonfiguration* or removed.
3. **Banned words** from `COPY-BRIEF.md` §5.9, incl. `vollautomatisch`, `nahtlos`, `100 %`, `revolutionär`, `einzigartig`.
4. **Absolute promises** — "jeder Anruf", "kein Kunde verloren", "immer", "nie wieder".
5. **Competitor references**, including indirect regional jabs.
6. **Logos, badges, counters, star ratings** not backed by something real.
7. **Placeholder testimonials** still rendering.
8. **Claims of certification, partnership or compliance** that no one has confirmed.
Output `HONESTY-AUDIT.md`: file, line, exact text, problem class, proposed fix, severity (blocker / should-fix / cosmetic).
Fix everything classified blocker or should-fix, **one commit per file group.** Leave `[[CLAIM]]` markers where a claim might be true but is unconfirmed.
---
## 4. PHASE 2 — BUILD THE TRUST LAYER
This is the core of the pass. Ten components, in priority order. Each specifies what you build now versus what waits on an asset.
### 4.1 · `M13 — Stimmprobe` (highest leverage on the site)
Answers objection #1, which no amount of text can answer.
- Build an audio-player component: play/pause, duration, transcript below in German, a short caption naming what the caller wanted.
- Place it **above the fold or immediately below** on the healthcare landing page and the service page, and on all three city pages.
- Surrounding copy: what the visitor is about to hear, that the announcement is the practice's own, and that a human is reachable at any moment during the call.
- `[[ASSET: Audioaufnahme eines echten Anrufs, mit Einwilligung, ohne Patientendaten]]`
- **Until supplied, the component must not render.** Do not substitute a stock voice or a synthesised sample.
### 4.2 · `M14 — Die Übergabe, sichtbar`
Answers objection #2, the documented #1 cause of abandonment.
- A component showing what the team actually sees after a call: screenshot or short screen recording, plus a 3–4 step description of the path from call to system.
- State plainly what is transferred automatically and what still requires a click.
- `[[ASSET: Screenshot oder 20–30s Bildschirmaufnahme der Übergabe]]`
- Copy around it can be written now; the visual slot stays hidden until supplied.
### 4.3 · `M15 — Was unser Empfang nicht macht`
Named limitations are the strongest trust signal available to you, and cost nothing.
Explicitly listed, in German, as a normal section — not hidden in an FAQ:
- Keine medizinische Einschätzung, keine Triage, keine Beratung
- Kein Ersatz für das Praxisteam
- Notfälle: Erkennung und sofortige Weiterleitung, keine Bewertung
- Anliegen, die immer bei einem Menschen landen (from the existing Anliegen-Katalog)
- Was technisch heute noch nicht angebunden ist
- Realistic framing of the automation share — relief at peak times and outside opening hours, not full coverage
**Never soften this section. Its value is that it is uncomfortable.**
### 4.4 · `M16 — Wenn wir nicht zu Ihnen passen`
A short, honest section naming who this is *not* for. Two or three concrete constellations.
This converts sceptics faster than any benefit list, because it proves you are not trying to sell to everyone. Keep it factual, never coy, never a disguised humblebrag.
### 4.5 · `M17 — So wird Ihr Empfang gebaut` (rewrite of the existing 5-step block)
The existing block is generic. Rewrite it strictly from the owner's answers in §1E.
Each step needs: what happens, who does it, how long it takes, what the practice must contribute. If a step has no duration, it is not a step — it is a claim.
This module carries the entire "personally built" promise. Verify it names at least: the intake conversation, the mapping of the practice's own Anliegen and rules, the recording of the practice's own announcements, a test phase, and an adjustment loop after go-live.
`[[CLAIM: Prozessschritte und Zeitangaben vom Inhaber bestätigen]]`
### 4.6 · `M18 — Änderungen und Betreuung`
Answers objection #6 — support is a burned category for this buyer (52 % name it as a reason to switch systems).
Must state, in plain German: who they reach, how, within which window, and **how quickly a change to an announcement or rule is implemented.** A named person with a photo outperforms a support-ticket promise by a wide margin here.
`[[CLAIM: Reaktionszeit, Änderungsfrist, Ansprechpartner]]` · `[[ASSET: Foto und Name des Ansprechpartners]]`
### 4.7 · `M19 — Umkehrbarkeit`
Reversibility lowers the cost of believing you.
Test phase, minimum term, notice period, what happens to data on termination, whether a PVS or calendar switch is required (it must be stated that it is not, if true). Presented as a compact fact block, not as marketing.
`[[CLAIM: sämtliche Vertragsangaben]]`
### 4.8 · `M20 — Was Ihre Patientinnen und Patienten gerade erleben`
Recognition from the other side. Written from the practice's perspective, using patient vocabulary in **our own original sentences** — never reproduced forum text, never presented as a quote.
Vocabulary to work from: *keiner geht ans Telefon · immer besetzt · Warteschleife · nicht durchkommen · nicht erreichbar*.
Connect it to what the owner actually feels: this is what ends up in their public reviews, and what their team absorbs at the counter all day.
Maximum one approved statistic (GKV-SV or vzbv, source and year visible).
### 4.9 · `M21 — Für Ihr Praxisteam`
Team resistance is a documented cause of failure, and the team influences the purchase.
Written *to* the MFA: what changes on day one, what disappears, what stays theirs, who trains them, how they change something themselves.
**Do not defend against fear of job loss.** No evidence exists that this fear is present, and defensive phrasing (*"Wir ersetzen niemanden!"*) plants the thought. Show relief concretely instead: fewer interruptions during patient contact, no double entry, calmer peak hours.
### 4.10 · `M22 — Referenz` (slot only)
Build the component. Requires: practice type, size, region, a real quote, and written permission. Anonymised is acceptable ("Hausarztpraxis mit drei Behandlern, Oberfranken"); invented is not.
`[[ASSET: echte Referenzpraxis mit schriftlicher Einwilligung]]`
**Until supplied, this component must not render, and no placeholder text may exist in the DOM.**
---
## 5. PHASE 3 — REMAINING PAGES
Apply the full `COPY-BRIEF.md` standard plus §3 audit fixes to everything untouched in pass 1:
- `/bayern/ki-telefonassistent`
- the demo page
- the Hotel and Restaurant segment pages
- the homepage, per the §2 decision
- any remaining service, legal, contact or confirmation pages
The Hotel and Restaurant pages get the honesty pass regardless of the positioning decision. They may keep their own tone; they may not keep invented statistics, absolute promises or banned words.
---
## 6. PHASE 4 — POSITIONING IMPLEMENTATION
Implement the §2 flag. Regardless of which option:
- Healthcare pages link only to healthcare pages within the visitor's journey.
- Navigation from any healthcare page must not surface hotel or restaurant content in the primary path.
- Every healthcare page has a clear route to the healthcare entry page.
- Preserve all URLs, canonicals and redirects. If the decision requires new routes, propose them and **stop for approval** — do not create or change routing unilaterally.
---
## 7. PHASE 5 — SEO AND SAFE PREVIEW
### 7.1 SEO baseline and continuity
- Before further metadata changes, produce `SEO-BASELINE.md`: every affected route with current H1, title, description, canonical, schema types and internal-link count. This is the rollback reference.
- All existing rules from `COPY-BRIEF.md` §8 remain binding. URLs, canonicals, hreflang, robots and redirects are untouchable.
- Extend schema where new sections justify it: `FAQPage` for new FAQs, `HowTo` for the build process only if it is genuinely procedural, `Organization` with real company details. **Never mark up a section that is hidden because its asset is missing.**
- New trust sections improve E-E-A-T only if they are real. An empty `[[ASSET]]` slot must not be described in schema.
- City pages: verify each still clears the 40 % unique-content floor after edits, and that all local substance is verified rather than inherited from pass 1. Anything unverifiable gets `[[CLAIM]]` and thin-but-honest treatment.
### 7.2 Preview safety
The preview currently looks finished while roughly 25 claims remain unconfirmed. A stakeholder will read it as ready.
Implement a build-flag-controlled review banner (e.g. `VITE_REVIEW_MODE`) that, when active:
- displays a fixed banner: *"Vorschau — nicht freigegebene Inhalte. Einzelne Angaben sind noch nicht bestätigt."*
- visually outlines every section containing an unresolved `[[CLAIM]]` or `[[ASSET]]`
Must be **off by default** and never reachable in production. Never render English markers to users.
---
## 8. EXTENDED QA GATE
Everything in `COPY-BRIEF.md` §12 still applies. Additionally, per page:
- [ ] No unsourced number anywhere in the file
- [ ] No section implies a proof asset that has not been supplied
- [ ] Components depending on missing assets do not render, and leave no placeholder in the DOM
- [ ] `M15` (limitations) present and not softened
- [ ] At least one of `M13`/`M14` present or explicitly slotted on every commercial healthcare page
- [ ] Reversibility facts present on the pricing page and stated or linked on the landing page
- [ ] Team section contains no defensive job-loss language
- [ ] Patient-perspective section uses original sentences, no quoted or quote-styled forum language
- [ ] No cross-industry link inside a healthcare journey (per §2 decision)
- [ ] Schema matches only visible, real content
- [ ] Every `[[CLAIM]]` and `[[ASSET]]` is a code comment, never rendered text
- [ ] Read-aloud test: does it sound like someone who has stood at an Anmeldung at 8:05 on a Monday — or like a pitch?
**Full gate before push:** typecheck, tests, lint, build, and confirm all public routes still prerender.
---
## 9. DELIVERABLES
Update or create at repo root:
| File | Content |
|---|---|
| `OWNER-INPUT.md` | The blocking questionnaire (Phase 0) |
| `HONESTY-AUDIT.md` | Every finding, fix and severity from §3 |
| `SEO-BASELINE.md` | Pre-change metadata snapshot |
| `COPY-SEO-CHANGELOG.md` | Extended with this pass |
| `COPY-CLAIMS-TO-VERIFY.md` | Consolidated, deduplicated, grouped by decision type |
| `ASSETS-REQUIRED.md` | Every `[[ASSET]]`: what it is, which page needs it, what it unblocks, spec (length, format, consent requirement) |
| `COPY-GAPS.md` | Strategic gaps and open owner decisions |
**Workflow:** one page or module per commit. After each, a concise diff summary: what changed, which objection it now answers, SEO impact, any new marker. Push to the existing branch. **Do not merge, do not deploy, do not touch git remotes beyond pushing this branch.**
---
## 10. THE ONE THING THAT MATTERS MOST IN THIS PASS
> Pass 1 made the site honest. That earns the right to be read — it does not yet earn trust.
>
> Trust with this buyer comes from three things only: **they hear it, you tell them what it can't do, and they can get out.**
>
> If a section adds words without adding one of those three, it is not making the site better.
---
*Master prompt II v1.0 — based on `01-healthcare-source-map.md`, `02-evidence-digest.md`, `03-master-prompt-website-copy.md` and the pass-1 report. 16.08.2026.*
