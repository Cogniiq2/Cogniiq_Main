# MASTER PROMPT — Cogniiq Website Copy Overhaul (Evidence-Driven)

> **Paste this entire file into Claude Code as the project brief** (e.g. save as `.claude/COPY-BRIEF.md` or paste into `CLAUDE.md`).
> It contains the mission, the hard rules, the full customer-evidence base, the voice spec, per-page playbooks, the local-SEO rules, and the QA gate.

---

## 0. HARD LANGUAGE RULE — READ FIRST

**Every single line of customer-facing copy you write is in GERMAN.**
Formal address: **Sie-Form**, consistently, on every page.
This brief is written in English for precision. **Never** let English leak into output copy, headings, meta tags, alt text, button labels, schema fields, or comments visible to users.

---

## 1. MISSION

Rewrite the copy across the Cogniiq website so that a German outpatient healthcare decision-maker — a practice owner, MVZ manager, dentist, or therapy-centre owner — reads a page and thinks: *"Das hat jemand geschrieben, der weiß, wie es bei mir zugeht."*

Three outcomes, in priority order:

1. **Recognition.** The visitor sees their own daily reality described in their own vocabulary before we ever mention a product.
2. **Differentiation.** They understand that our receptionist is **built around their practice**, not a standardised bot they must adapt to.
3. **SEO preserved and improved.** Rankings must not regress. Existing technical SEO work stays intact and gets strengthened where copy allows.

**What you are NOT doing:** redesigning the site, changing the tech stack, altering URL structures, or inventing product features.

---

## 2. NON-NEGOTIABLE RULES

### 2.1 Truth and substantiation

- **Never invent** statistics, customer names, practice names, quotes, testimonials, case studies, logos, review counts, or awards.
- Every number that appears on the site must be traceable to a **named source with a date** (see §5.7 for the approved list). If a number is not in the approved list, do not use it.
- If you want to make a claim about Cogniiq's own product (uptime, integration coverage, setup time, languages, hosting location), and it is not confirmed in the repo or by the owner, **write `[[CLAIM: verify — <what needs verifying>]]`** inline and continue. Do not guess.
- Compile a list of all `[[CLAIM: ...]]` markers into `COPY-CLAIMS-TO-VERIFY.md` at the end of the run.

### 2.2 Using customer language — critical legal/ethical boundary

The vocabulary in §5 was harvested from public German forums, review sites, and job ads.

- ✅ **DO** use the *vocabulary, phrasing patterns, and problem framings* to write our own original sentences.
- ❌ **DO NOT** reproduce forum posts verbatim on the site.
- ❌ **DO NOT** present any of this language as a testimonial, quote, review, or customer statement from a Cogniiq client.
- ❌ **DO NOT** attribute any phrasing to a named person or practice.
- If a testimonial section exists in the codebase and contains placeholder content, leave a `[[CLAIM: real testimonial required — do not ship placeholder]]` marker rather than filling it with invented content.

### 2.3 Competitors

- **Never name a competitor negatively.** German competition law (UWG) permits comparative advertising only when objective and verifiable — disparaging claims create real risk.
- Instead, describe **the pattern** the buyer already recognises: rigid menus, synthetic voices, tied ecosystems, unpredictable per-call pricing, support that doesn't implement change requests.
- Framing template: *"Viele Systeme am Markt …"* / *"Der übliche Weg ist …"* — never *"Anbieter X macht …"*.

### 2.4 Overclaiming — the single biggest risk with this audience

The evidence shows a **sophisticated, sceptical buyer segment that actively debunks AI marketing.** Real forum voices call current products *"einfache Algorithmen"* and *"keine echte KI"*.

Therefore:

- ❌ Never promise that the system handles "all" or "80 %" or "the majority" of calls.
- ❌ Never use "revolutionär", "bahnbrechend", "Game Changer", "einzigartig", "die Zukunft der Praxis".
- ❌ Never lead with "KI" as the headline benefit. Lead with the outcome; mention the technology as a means.
- ✅ Anchor expectations honestly: relief at peak times, coverage outside opening hours, structured intake — not full replacement of the team.

### 2.5 Medical and regulatory care

- Never imply the system performs triage, gives medical advice, or assesses symptoms.
- Emergency handling is always described as **recognition and immediate routing to a human / emergency instruction**, never as assessment.
- Data-protection statements must stay factual and non-legal-advisory. Do not assert whether a DSFA (Art. 35 DSGVO) is required — that question is genuinely contested. Write what *we* do; recommend the practice consult its own DSB.

---

## 3. THE CORE NARRATIVE (use this spine on every major page)

**Beat 1 — Recognition.** The phone rings while a patient stands at the counter. Nobody wins.
**Beat 2 — Cost naming.** What it actually costs: interrupted work, mistakes under pressure, complaint conversations that take longer than the medical ones, reviews about unreachability, an exhausted team.
**Beat 3 — Why previous attempts failed.** Not because the technology couldn't listen — because the result didn't land in the PVS, the voice sounded like a machine, and nobody adapted the system to the practice.
**Beat 4 — The turn.** Our receptionist is built *for this practice*: its voice, its menu, its rules, its handoff, its emergency path.
**Beat 5 — Proof of the process.** How the personalisation actually happens — concrete steps, not adjectives.
**Beat 6 — Risk removal.** Predictable pricing, no ecosystem lock-in, data protection, named human contact, the team keeps control.
**Beat 7 — Small, specific next step.**

**Never open a page with the product. Always open with their reality.**

---

## 4. POSITIONING — THE ONE SENTENCE

> **Ein Praxis-Empfang am Telefon, der auf Ihre Praxis zugeschnitten wird — mit Ihrer Stimme, Ihren Regeln und einer Übergabe, die im System ankommt.**

Four defensible pillars (all grounded in documented market gaps — see §5.5):

| Pillar | German shorthand | What it answers |
|---|---|---|
| **P1 · Individuell konfiguriert** | „Für Ihre Praxis gebaut, nicht von der Stange" | Rigid menus, one-size-fits-all |
| **P2 · Klingt wie Ihre Praxis** | „Ihre Ansagen, Ihre Stimme, Ihr Ton" | Rejection of synthetic voices |
| **P3 · Die Übergabe stimmt** | „Das Anliegen landet dort, wo Sie arbeiten" | The copy-paste media break |
| **P4 · Planbar und ungebunden** | „Feste Kosten, kein Systemwechsel nötig" | Unpredictable per-call tariffs, ecosystem lock-in |

Every page must make at least **two** of these four concrete. Not as slogans — as described mechanics.

---

## 5. THE EVIDENCE BASE

> Source: `01-healthcare-source-map.md` and `02-evidence-digest.md`.
> Evidence classes: **A** = real first-person public statement · **B** = representative study · **C** = secondary/professional source · **V** = vendor claim (never usable as proof).
> **Known limitation:** most owner-side evidence comes from one technically-progressive practice-software community. Treat it as directionally strong, not statistically representative. Do not write copy that claims "most practices …" on this basis.

### 5.1 What owners fear (S1)

| Fear | Copy implication |
|---|---|
| Patients reject the synthetic voice — and you only find out after go-live | Address voice on the page, early and explicitly |
| The team resists; acceptance is a staff problem, not a tech problem | Speak to the MFA/team directly in a dedicated block |
| Being forced into an entire ecosystem to get one feature | State plainly: no PVS or calendar switch required `[[CLAIM: verify]]` |
| Unpredictable per-call / per-message costs | Lead pricing with predictability, not with cheapness |
| Support that doesn't implement change requests | Name the support model concretely: who, how fast, how changes are made |
| Technical outage paralyses the practice | Describe the fallback path explicitly |
| Damage to reviews and reputation | Connect unreachability → public reviews |

### 5.2 What the team fears (S2 — MFA, ZFA, Empfang)

- Making mistakes under constant interruption — documented in real terms: forgetting patient names on the phone during hectic periods, being left alone at the front desk, dreading the workday.
- Aggressive or unfriendly callers.
- **More clicking, not less** — a system that adds work instead of removing it.
- ⚠️ **Fear of job loss through AI: no evidence found.** Do **not** pre-emptively defend against it with defensive phrasing like *"Wir ersetzen niemanden!"* — that plants the thought. Instead show relief concretely: fewer interruptions, fewer duplicate entries, calmer peak hours.

### 5.3 What patients experience (S3)

Real public language: *keiner geht ran · immer besetzt · in der Warteschleife · weggedrückt · nicht durchkommen*.
Documented pattern: patients who cannot cancel fear being billed for the missed appointment; some conclude the practice cut the line on purpose; a distinct group avoids phoning at all out of anxiety.

**Copy implication:** the patient-experience section is not decoration — it is the owner's reputational pain and their staff's daily conflict source. Write it from the practice's perspective ("Was Ihre Patienten erleben, wenn niemand abnehmen kann").

### 5.4 What IT / data protection gate-keepers need (S4)

Must be addressed on a dedicated section or page:

- **Auftragsverarbeitungsvertrag (Art. 28 DSGVO)** — standard, not an extra.
- **Ärztliche Schweigepflicht (§ 203 StGB)** extends to processors — say how we handle it.
- **§ 201 StGB** — recording of non-public spoken word; state exactly what is and isn't recorded/stored and for how long.
- **AI Act Art. 50** — the caller must be told they are speaking with an AI system. Turn this into a trust feature, not a disclaimer.
- **Hosting location, sub-processors, no training on patient data** `[[CLAIM: verify all three]]`.
- **Do not assert** whether a DSFA is required. Offer to support the practice's own assessment.

### 5.5 What the market wants but doesn't have (→ our four pillars)

Documented, unmet desires expressed by real practice owners:

1. One-click takeover of a call with the patient record already open — repeatedly wished for, rarely delivered.
2. Entries written into the record automatically instead of copy-paste.
3. Human-sounding announcements — practices that recorded their own announcements reported it landed well with patients.
4. Pre-configured templates instead of a blank canvas: *"die Bedürfnisse jeder Praxis haben viele Gemeinsamkeiten"* — configuration effort is real and named as the main workload.
5. Independence from any single platform; explicit rejection of the all-in-one promise.
6. Self-service control over announcements (holidays, short-notice changes) without calling support.

**This list is the product-proof section of the site.** Each item becomes a described mechanic, not a bullet adjective.

### 5.6 Objections, ranked by hardness → where each is answered

| # | Objection | Hardness | Must be answered on |
|---|---|---|---|
| 1 | "Meine Patienten kommen mit einer Computerstimme nicht klar" | **high** | Homepage, Service, FAQ, every city page |
| 2 | "Das lässt sich nicht in mein PVS integrieren" | **high** | Homepage, Integrationen, Service, FAQ |
| 3 | "Ich müsste dafür mein ganzes System wechseln" | **high** | Homepage, Pricing, FAQ |
| 4 | "Das ist doch gar keine echte KI" | mid | Wie es funktioniert, FAQ |
| 5 | "Die Kosten sind nicht planbar" | mid | Pricing (lead with this) |
| 6 | "Der Support setzt meine Wünsche nicht um" | mid | Onboarding/Betreuung section, About |
| 7 | "Datenschutz und Schweigepflicht" | mid (S4 gate) | Datenschutz/Sicherheit page, FAQ |
| 8 | "Digitalisierung macht die Kommunikation nicht besser" | mid | Homepage Beat 3, Blog |
| 9 | "Meine Software fällt sowieso ständig aus" | latent | Reliability/fallback section |
| 10 | "Die Konfiguration kostet mich zu viel Zeit" | low-mid | Onboarding section — turn into our differentiator |

### 5.7 APPROVED STATISTICS — the only numbers allowed on the site

Use sparingly (max. 2–3 per page). **Always** with source and year visible or in a footnote. Never as a bare number in a hero.

| Statement (German, ready to adapt) | Source | Year |
|---|---|---|
| Jede dritte Arzt- und Psychotherapiepraxis möchte ihr Praxisverwaltungssystem wechseln. | Zi (Zentralinstitut für die kassenärztliche Versorgung), PVS-Monitoring | 2026 |
| 52 % nennen unzureichenden Kundensupport als Wechselgrund. | Zi, PVS-Monitoring | 2026 |
| Bei 46 % sind versteckte Preissteigerungen bzw. zu hohe Wartungskosten ein Wechselgrund. | Zi, PVS-Monitoring | 2026 |
| Fast die Hälfte der Praxen berichtet, dass der Praxisablauf mehrmals pro Woche oder täglich durch Softwarefehler gestört wird. | Zi | 2024 |
| Mehr als ein Drittel der Befragten ist beim Versuch der telefonischen Terminbuchung gescheitert. | vzbv, Marktcheck Arztterminportale | 2025 |
| 44 % der Nutzerinnen und Nutzer haben negative Erfahrungen mit Online-Terminportalen gemacht. | vzbv | 2025 |
| 39 % bewerten die Erreichbarkeit außerhalb der Öffnungszeiten als schwierig. | GKV-Spitzenverband, Versichertenbefragung | 2025 |
| 17 % geben an, dass Zugangsprobleme zu gesundheitlichen Problemen führen können. | GKV-Spitzenverband, Versichertenbefragung | 2025 |
| Bei der Arztwahl hat kompetentes und freundliches Praxispersonal die höchste Priorität; nahezu gleichrangig sind gute Praxisorganisation und telefonische Erreichbarkeit. | GKV-Spitzenverband, Versichertenbefragung | 2025 |
| Rund ein Viertel der Versicherten hält die Sprech- und Öffnungszeiten für zu kurz. | GKV-Spitzenverband, Versichertenbefragung | 2025 |
| Das Tarifgehalt für Medizinische Fachangestellte beginnt 2026 bei 2.939,59 € monatlich. | Gehaltstarifvertrag MFA (Virchowbund) | 2026 |

**Banned:** any figure sourced from a competitor's website, any "X % Zeitersparnis" claim, any invented call-volume average, any ROI number not calculated transparently from the visitor's own inputs.

**Note on ROI:** the only buyer-authored calculation found in the market was conservative — roughly 10–20 % of calls absorbed, calculated *net* of the follow-up work. If the site includes a savings calculator, it must default to that conservative range and show the math. `[[CLAIM: confirm Cogniiq's own measured range before publishing any calculator]]`

### 5.8 LANGUAGE BANK — use these words

**Practice-side problem vocabulary (their words, use in our own sentences):**
`die Flut an Anrufen` · `nicht mehr zu bewältigen` · `Stoßzeiten` · `Störfaktor` · `ständig unterbrochen` · `Hin- und Herspringen` · `entzerren` · `spürbar entlasten` · `Anmeldung` · `Empfang` · `Praxisalltag` · `Rückrufliste` · `Terminstornierung` · `Rezeptbestellung` · `Überweisung` · `Befundauskunft`

**Patient-side vocabulary (use when describing what patients experience):**
`keiner geht ans Telefon` · `immer besetzt` · `Warteschleife` · `nicht durchkommen` · `nicht erreichbar`

**Solution vocabulary (their aspiration words):**
`Ihre eigenen Ansagen` · `selbst aufgesprochen` · `individuelle Menüführung` · `Anbindung an Ihr System` · `Kartei direkt geöffnet` · `Übergabe mit einem Klick` · `vorkonfiguriert` · `planbar` · `feste monatliche Kosten`

**Emotionally precise phrasings drawn from documented reality — rewrite, don't copy:**
- The complaint conversation that outlasts the medical one.
- The moment a patient stands at the counter while the phone rings.
- The colleague who does the callbacks herself in the evening because the desk isn't staffed.
- Recording new announcements by hand before every holiday.
- Falling back to a printed day plan when the system is down.

### 5.9 BANNED WORDS AND PHRASES

`revolutionär` · `bahnbrechend` · `Game Changer` · `die Zukunft der Praxis` · `nahtlos` (overused, meaningless) · `einzigartig` · `innovativ` (as a standalone claim) · `KI-Revolution` · `vollautomatisch` · `ersetzt Ihr Personal` · `rund um die Uhr perfekt` · `100 %` (of anything) · `mühelos` · `magisch` · `Deep Learning`/`Neural Networks` as selling points · `eierlegende Wollmilchsau` (the market already mocks this) · `Melkkuh` · any English marketing term where German exists (`Seamless`, `Hassle-free`, `Next-Level`)

**Also avoid:** exclamation marks in body copy, rhetorical questions stacked more than one per section, em-dash-heavy rhythm, three-adjective chains.

---

## 6. VOICE SPECIFICATION

| Attribute | Setting |
|---|---|
| Address | Sie, consistently |
| Register | Professional, calm, concrete. Like a competent consultant who has sat in a practice, not like a startup. |
| Sentence length | Mostly 8–18 words. Break long ones. |
| Jargon | Use *their* professional terms (PVS, MFA, MVZ, Anmeldung, Sprechstunde, Rezeptbestellung). Avoid *our* tech terms (LLM, NLU, Intent, Latency, Voice Agent). |
| Claims | Specific and bounded. "Zu Stoßzeiten" beats "immer". |
| Emotion | Shown through concrete scenes, never asserted. Write the counter and the ringing phone; don't write "Wir wissen, wie stressig es ist". |
| Proof | Mechanism over adjective. Describe *how* something works instead of calling it "individuell". |
| Humility | Where a limitation exists, name it. This audience rewards it. |

**Tone test before shipping any paragraph:** Would a 55-year-old Hausarzt with 24 years in practice find this respectful and accurate — or would it read as a sales pitch written by someone who has never seen an Anmeldung at 8:05 on a Monday?

---

## 7. PAGE PLAYBOOKS

For every page: **first read the existing file**, identify its current H1, target keyword, meta title/description, internal links, and any schema. Preserve the SEO shell (§8), rewrite the flesh.

### 7.1 Homepage

| Section | Instruction |
|---|---|
| **Hero** | One outcome-focused H1 containing the primary keyword. Subline names the concrete relief. CTA is low-commitment. **No statistics in the hero. No "KI" as the first word.** |
| **Recognition block** | 3–5 sentences describing the real scene at the Anmeldung. Their vocabulary. No product yet. |
| **Cost block** | What unreachability costs: interruptions, errors under pressure, complaint calls, reviews, team turnover. Max one approved statistic here. |
| **Why previous attempts failed** | The three documented failure causes, stated as market pattern (voice / handoff / no adaptation). This is the trust-earning section — do not skip it. |
| **The four pillars** | P1–P4 from §4, each as a described mechanic with a concrete example. |
| **How the personalisation actually works** | 4–5 numbered steps. Specific: intake conversation, mapping of Anliegen, own announcements recorded, test phase, iteration. `[[CLAIM: confirm actual process steps]]` |
| **Team block** | Written *to* the MFA/Praxisteam. What changes for them on day one. No defensive job-loss language. |
| **Data protection teaser** | 3 concrete facts + link to the full page. |
| **Segment links** | Hausarzt / Facharzt / Zahnarzt & KFO / MVZ & Mehrstandort / Therapiezentrum — internal links. |
| **City links** | Link to the three city pages with natural, differentiated anchor text. |
| **FAQ (5–7)** | The hardest objections, answered honestly. Mark up with FAQPage schema. |
| **Final CTA** | Small, specific, reversible. |

### 7.2 Service / product page

Deepen every homepage block. Add:
- **Anliegen-Katalog:** exactly which call types are handled and which are always routed to a human. Naming the limits builds more trust than hiding them.
- **Emergency path:** recognition → immediate routing. Never assessment.
- **Handoff detail:** what the team sees, where, in what form. This is objection #2 — the highest-value section on the site.
- **Fallback/reliability:** what happens during an outage.
- **Change management:** how the practice changes announcements and rules itself.

### 7.3 The three city pages (LOCAL SEO — read §8.3 carefully)

**Danger:** three near-identical pages with swapped city names are a doorway-page pattern. Google devalues them and the copy reads as fake to the visitor — the exact opposite of "sie haben das Gefühl, sie hätten die Seite selbst geschrieben".

**Each city page must contain a minimum of 40 % genuinely city-specific content.** Build it from:

1. **Local healthcare structure** — what is verifiably true about outpatient care density, practice structure, or patient flow in that city. `[[CLAIM: verify each local fact]]`
2. **Local segment emphasis** — which practice types dominate there (e.g. a city with a strong dental cluster gets a dental-weighted example).
3. **Locally specific scenario** — write the Monday-morning scene with local texture (commuter patterns, Uni-clinic referral flows, seasonal load), only where verifiable.
4. **Region-specific service framing** — on-site setup availability, response times, local reachability. `[[CLAIM: verify]]`
5. **Locally relevant FAQ** — 3 questions unique to that page.
6. **Local internal links** — to the segment pages and back to the service page.

**Shared across city pages (acceptable duplication):** the four pillars, data-protection facts, pricing logic, process steps. Keep these blocks as **components/partials**, not copy-pasted prose, so they stay maintainable.

**Per city page, vary:** H1, meta title, meta description, intro (100 % unique), scenario section, FAQ, image alt text, CTA wording.

**Never write:** "Wir sind Ihr Partner in [Stadt]" as a substitute for local substance. If you cannot find verifiable local substance, write `[[CLAIM: local content needed — <city> — no verifiable local facts available]]` and keep the page thin rather than padding it with filler.

### 7.4 Pricing page

Lead with **predictability**, not with the amount. This is the documented purchase driver.

- State the model in the first two sentences: fixed monthly, what's included, what could ever cost extra.
- Explicitly address: no per-call surprise billing, no hidden increases, contract term and notice period stated plainly.
- Address objection #3 directly: no PVS or calendar switch required `[[CLAIM: verify]]`.
- If there is a setup fee, name it. Hiding it costs more trust than charging it.
- **No fake urgency, no countdown, no "nur für kurze Zeit".**
- `[[CLAIM: all pricing figures require owner confirmation]]`

### 7.5 Integrations / PVS page

The single most important technical page for objection #2.

- List supported PVS and telephone systems honestly, in three tiers: **direkt angebunden / über Schnittstelle möglich / auf Anfrage prüfen**. `[[CLAIM: verify each entry]]`
- Describe what "Anbindung" concretely means for the daily workflow — what the MFA sees and clicks.
- State explicitly what does **not** work yet. Naming gaps is a competitive advantage with this audience.
- Address the ecosystem-lock-in fear directly.

### 7.6 Datenschutz & Sicherheit page

Structure for the S4 gate-keeper who is looking for reasons to say no:

1. AVV nach Art. 28 DSGVO — standard, provided automatically.
2. Ärztliche Schweigepflicht § 203 StGB — how processor obligations are handled.
3. Recording and storage — exactly what is stored, where, for how long, § 201 StGB context.
4. Hosting location and sub-processors.
5. No training on patient data. `[[CLAIM: verify]]`
6. AI Act Art. 50 — callers are informed they are speaking with an AI system; framed as a trust feature.
7. Support for the practice's own DSB — **without** asserting whether a DSFA is required.
8. Downloadable documents if they exist. `[[CLAIM: verify availability]]`

### 7.7 Segment pages (Hausarzt / Facharzt / Zahnarzt & KFO / MVZ / Therapie)

Each needs genuinely different call-mix and pain emphasis:

| Segment | Dominant load | Emphasis |
|---|---|---|
| **Hausarzt** | Monday-morning surge, Rezeptbestellungen, AU, chronic patients | Peak-hour relief, prescription intake |
| **Facharzt** | High call volume vs. limited slots, long waits, referral flow | Structured intake, cancellation capture |
| **Zahnarzt & KFO** | Recall, high appointment frequency, short-notice cancellations | Recall handling, cancellation slots refilled |
| **MVZ & Mehrstandort** | Central number, multiple locations, standardised processes | Multi-site routing, consistent standards |
| **Therapie (Physio/Ergo/Logo)** | Reception unstaffed while treating, callbacks in the evening | Reachability without a staffed desk |

The therapy segment has a documented pattern worth using: reception staffed only a few hours per week, an external service takes messages, and the owner does the callbacks personally. Describe that reality — it will be immediately recognised.

### 7.8 About / Warum Cogniiq

Answer objection #6 (support). Name the delivery model: who the practice speaks to, response times, how change requests are handled. `[[CLAIM: verify]]`
This page carries the "personally made" promise. **Adjectives don't prove it — process does.**

### 7.9 Blog / resource pages

Rewrite existing posts to the voice spec; keep URLs and existing keyword targeting. Do not create new posts unless explicitly asked.

---

## 8. SEO — PRESERVE AND STRENGTHEN

### 8.1 Never touch without explicit instruction

- URLs / slugs / routing
- Canonical tags, hreflang, robots directives
- Redirects
- Existing structured data types (extend, don't remove)
- Image files and their paths
- Component logic, props, build config

### 8.2 Do improve

| Element | Rule |
|---|---|
| **H1** | One per page. Keep the primary keyword. Rewrite for benefit clarity. |
| **Meta title** | ≤ 60 chars. Primary keyword near the front. Written for a click, not for a robot. |
| **Meta description** | 140–158 chars. Include the keyword *and* a concrete benefit. Active voice. |
| **H2/H3** | Mirror real search questions from §5.6 and the query bank. Use question-form headings where natural. |
| **Body keyword use** | Natural density. Semantic variants over repetition: *Telefonassistent, Telefonannahme, Praxisempfang, telefonische Erreichbarkeit, Anrufannahme, digitale Rezeption*. |
| **Internal links** | Every page links to ≥ 3 others with descriptive German anchor text. Never "hier klicken". |
| **Alt text** | German, descriptive, keyword only where it genuinely fits the image. |
| **Schema** | Add/extend `FAQPage` on pages with FAQs, `LocalBusiness`/`Organization` where appropriate, `Service` for service pages, `BreadcrumbList`. Never mark up content that isn't visible on the page. |
| **Word count** | Depth over padding. If a section needs 80 words, write 80. Never pad to hit a count. |

### 8.3 Local SEO for the three city pages

- Unique H1, title, description, intro, scenario, FAQ per city.
- City name appears naturally in H1, title, description, intro, and 2–3 times in body. **Not more.** Keyword stuffing here is both a ranking risk and instantly readable as inauthentic.
- Use natural regional formulations where they exist (`Praxen im Raum <Stadt>`, `<Stadtteil>`), not mechanical repetition.
- Add `LocalBusiness` or `Service` + `areaServed` schema per city page. `[[CLAIM: verify Cogniiq has a real presence/service claim for each city before using LocalBusiness]]`
- Interlink the three city pages to each other and to the main service page.
- **Do not** create additional city pages. Three is the scope.

### 8.4 Before/after check

For every file changed, log: old H1 → new H1, old title → new title, old description → new description, keywords preserved (yes/no), internal links added. Output to `COPY-SEO-CHANGELOG.md`.

---

## 9. REUSABLE COPY MODULES

Build these once as components/partials and reuse. Do not copy-paste prose between pages.

| Module | Purpose | Where |
|---|---|---|
| `M1 · Anmeldungs-Szene` | Recognition opener | Homepage, service, segment pages (varied per segment) |
| `M2 · Was es kostet, nicht erreichbar zu sein` | Cost naming, max 1 statistic | Homepage, service, city pages |
| `M3 · Warum bisherige Versuche gescheitert sind` | Trust-earning honesty block | Homepage, service, FAQ |
| `M4 · Die vier Säulen` | P1–P4 as described mechanics | Everywhere |
| `M5 · So wird Ihr Empfang gebaut` | The personalisation process, 4–5 steps | Homepage, service, about |
| `M6 · Für Ihr Team` | Written to the MFA | Homepage, service, segment pages |
| `M7 · Datenschutz in drei Punkten` | S4 teaser + link | Every page footer area |
| `M8 · Anliegen-Katalog` | What is handled / what always goes to a human | Service, segment pages |
| `M9 · Übergabe ins System` | The handoff mechanic — objection #2 | Service, integrations, homepage |
| `M10 · Planbare Kosten` | Pricing logic teaser | Homepage, pricing, city pages |
| `M11 · FAQ-Kern` | The 7 hard objections | Service + adapted per page |
| `M12 · Abschluss-CTA` | Low-commitment next step | Every page |

---

## 10. CTA RULES

- One primary CTA per page, repeated at most twice.
- Low commitment, concrete, German: *"Unverbindliches Erstgespräch vereinbaren"*, *"Ihren Empfang gemeinsam durchgehen"*, *"Anliegen-Katalog für Ihre Praxis erstellen lassen"*.
- ❌ Never: *"Jetzt kostenlos starten!"*, *"Sichern Sie sich…"*, countdowns, artificial scarcity.
- Secondary CTA may be informational: *"Zur Datenschutz-Übersicht"*, *"PVS-Anbindungen ansehen"*.
- Every form: state what happens next and within what timeframe. `[[CLAIM: verify response time]]`

---

## 11. EXECUTION WORKFLOW FOR CLAUDE CODE

1. **Inventory first.** Scan the repo. Produce `COPY-INVENTORY.md` listing every page with: path, current H1, current meta title/description, target keyword (inferred), page type, word count. **Do not edit anything yet.**
2. **Confirm scope** with the owner: which pages, which order, which are out of scope.
3. **Build the modules** (§9) first, as components/partials.
4. **Rewrite page by page.** One page per commit. Never bulk-rewrite.
5. **Per page:** preserve SEO shell → rewrite content → verify no broken links → log to changelog.
6. **After each page**, show a concise diff summary: what changed, why, which objection it now answers, SEO impact.
7. **At the end**, output three files:
   - `COPY-SEO-CHANGELOG.md` — all metadata changes
   - `COPY-CLAIMS-TO-VERIFY.md` — every `[[CLAIM: ...]]` marker, grouped
   - `COPY-GAPS.md` — where evidence was insufficient and what the owner should supply (real testimonials, actual metrics, verified integrations, local facts)

**Do not deploy. Do not touch git remotes. Do not modify component logic beyond what copy changes require.**

---

## 12. QA GATE — run before declaring any page done

- [ ] All copy in German, Sie-Form, consistent
- [ ] Page opens with the visitor's reality, not the product
- [ ] At least two of the four pillars made concrete with mechanics
- [ ] At least three of the top-five objections answered
- [ ] No invented statistics, quotes, testimonials, or customer names
- [ ] Every statistic on the approved list, with source and year
- [ ] No forum language reproduced verbatim or presented as a testimonial
- [ ] No competitor named negatively
- [ ] No banned word present (§5.9)
- [ ] No claim of full automation or a specific % time saving
- [ ] No implication of medical triage or advice
- [ ] Data-protection statements factual, no legal advice, no DSFA assertion
- [ ] H1 present, unique, keyword-preserving
- [ ] Meta title ≤ 60, description 140–158, both rewritten for clicks
- [ ] ≥ 3 internal links with descriptive anchors
- [ ] Schema valid and matching visible content
- [ ] City pages: ≥ 40 % unique content, city name used naturally, not stuffed
- [ ] Every unverified assertion carries a `[[CLAIM: ...]]` marker
- [ ] Read aloud test: does it sound like a consultant who has stood at an Anmeldung — or like a pitch?

---

## 13. THE FOUR OPEN CONTRADICTIONS — handle honestly, never paper over

1. **Elderly patients and voice systems.** The evidence contains both rejection *and* eventual enthusiastic adoption by older patients. The likely differentiating variable is the voice (synthetic vs. own recordings) and the settling-in period. **Copy rule:** do not claim universal patient acceptance. Say what we do about it — own announcements, a clear path to a human at any moment, an adjustment phase we support.
2. **Digitalisation satisfaction.** Official surveys show rising satisfaction with individual applications; system-level surveys show persistent frustration. Both are true. **Copy rule:** never dismiss digitalisation as a failure, never celebrate it as solved.
3. **Online booking as the answer.** It is sold as relief and rated negatively by 44 % of users. **Copy rule:** position the phone channel as complementary, not as a replacement for online booking — and explicitly serve patients who won't use online tools.
4. **Switching costs.** Some practices switch providers freely; others fear ecosystem lock-in. **Copy rule:** make our low-lock-in position explicit and verifiable, and never mock those who feel locked in.

---

## 14. THE ONE THING THAT MATTERS MOST

The strongest documented insight in the entire evidence base:

> **Failures in this market are not caused by the AI failing to understand the caller. They are caused by what happens after the call is answered — the result not landing in the system, the voice sounding like a machine, and nobody adapting the setup to the practice.**

Every page must make it unmistakably clear that Cogniiq is built around exactly those three failure points. If a page doesn't do that, it isn't finished.

---

*Master prompt v1.0 — based on `01-healthcare-source-map.md` and `02-evidence-digest.md`, 16.08.2026.*
