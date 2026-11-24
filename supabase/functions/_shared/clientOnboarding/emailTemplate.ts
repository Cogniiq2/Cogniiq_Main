// Cogniiq client onboarding email — ONE template for the owner's live preview and the server send.
//
// Dependency-free on purpose: the Edge Function `client-onboarding-invite` imports this file from
// supabase/functions/_shared and the frontend re-exports it (src/lib/clientOnboarding), so what
// the owner previews is byte-for-byte what is sent.
//
// Design rules (transactional mail that renders everywhere):
//   * table layout, inline styles, system fonts, no images, no web fonts, no tracking pixel;
//   * a real plain-text alternative with the same content;
//   * every caller-provided string is HTML-escaped; links are only ever the CTA built by the server;
//   * no confidential implementation detail, no credentials, no patient data.

export type OnboardingEmailKind = 'invitation' | 'reminder' | 'request';
export type OnboardingEmailLanguage = 'de' | 'en';

export interface OnboardingEmailInput {
  kind: OnboardingEmailKind;
  language: OnboardingEmailLanguage;
  /** Salutation name, e.g. "Anna Muster". Optional — falls back to a neutral greeting. */
  recipientName?: string | null;
  /** Customer organization / company name. */
  company: string;
  /** Owner-written introduction. Replaces the default first paragraph when present. */
  intro?: string | null;
  /** Secure entry link built server-side (invite activation or portal login). */
  ctaUrl: string;
  /** Portal address shown as a plain fallback in case the button cannot be used. */
  portalUrl: string;
  /** For `request`: the question the customer is asked to answer in the portal. */
  requestQuestion?: string | null;
  /** Configured sender details (owner_document_settings). Nothing is invented. */
  sender: { legalName?: string | null; email?: string | null; phone?: string | null };
  /** Marks a test send visibly, so it can never be mistaken for the real message. */
  isTest?: boolean;
}

export interface RenderedEmail {
  html: string;
  text: string;
}

export function escapeHtml(value: string): string {
  return value
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#39;');
}

/** Only absolute http(s) URLs may become links. Anything else renders as nothing. */
export function safeHref(url: string): string | null {
  return /^https?:\/\/[^\s<>"']+$/i.test(url) ? url : null;
}

function firstName(name: string | null | undefined): string | null {
  const trimmed = (name ?? '').trim();
  return trimmed.length > 0 ? trimmed : null;
}

interface Copy {
  greeting: (name: string | null) => string;
  eyebrow: string;
  heading: string;
  paragraphs: string[];
  requestLead: string;
  steps: string[];
  stepsTitle: string;
  cta: string;
  fallback: string;
  next: string;
  help: string;
  closing: string;
  team: string;
  testBanner: string;
  footer: (company: string) => string;
}

function copyFor(input: OnboardingEmailInput): Copy {
  const company = input.company.trim() || (input.language === 'de' ? 'Ihr Unternehmen' : 'your business');
  if (input.language === 'en') {
    const base: Omit<Copy, 'eyebrow' | 'heading' | 'paragraphs' | 'cta'> = {
      greeting: (n) => (n ? `Hello ${n},` : 'Hello,'),
      requestLead: 'To complete the setup, we need one more piece of information from you:',
      stepsTitle: 'How it works',
      steps: [
        'Open your personal setup area using the button below.',
        'Answer the questions about your business. Your answers are saved, so you can pause at any time.',
        'Review your answers and send them to us.',
      ],
      fallback: 'If the button does not work, sign in to your Cogniiq portal at',
      next: 'Once your information is complete, we review it and take care of the next technical steps. You will always see the current status of your project in the portal.',
      help: 'If you have any questions, simply reply to this email.',
      closing: 'Kind regards,',
      team: 'Your Cogniiq team',
      testBanner: 'TEST EMAIL: preview of the customer message. The button opens the portal login; a Cogniiq staff account does not see the customer view.',
      footer: (c) => `You are receiving this email because Cogniiq is setting up an AI phone assistant for ${c}.`,
    };
    if (input.kind === 'request') {
      return { ...base, eyebrow: 'Follow-up question', heading: `One more question about ${company}`,
        paragraphs: ['Thank you for the information so far.'], cta: 'Answer in the portal' };
    }
    if (input.kind === 'reminder') {
      return { ...base, eyebrow: 'Reminder', heading: `Your AI phone assistant setup for ${company}`,
        paragraphs: ['This is a friendly reminder that your personal setup area is ready. Your answers are saved, so you can continue exactly where you left off.'],
        cta: 'Continue setup' };
    }
    return { ...base, eyebrow: 'Project start', heading: `Welcome to Cogniiq, ${company}`,
      paragraphs: [
        'We are looking forward to setting up your AI phone assistant with you.',
        'To tailor the assistant to how your business works, we have prepared a personal setup area for you. There you can tell us the most important details about your business, your processes and your requirements.',
      ],
      cta: 'Start setup' };
  }

  const base: Omit<Copy, 'eyebrow' | 'heading' | 'paragraphs' | 'cta'> = {
    greeting: (n) => (n ? `Guten Tag ${n},` : 'Guten Tag,'),
    requestLead: 'Für die weitere Einrichtung benötigen wir noch eine Angabe von Ihnen:',
    stepsTitle: 'So geht es weiter',
    steps: [
      'Öffnen Sie über die Schaltfläche Ihren persönlichen Einrichtungsbereich.',
      'Beantworten Sie die Fragen zu Ihrem Unternehmen. Ihre Angaben werden gespeichert, Sie können jederzeit unterbrechen.',
      'Prüfen Sie Ihre Angaben und senden Sie sie an uns.',
    ],
    fallback: 'Falls die Schaltfläche nicht funktioniert, melden Sie sich in Ihrem Cogniiq-Portal an unter',
    next: 'Sobald Ihre Angaben vollständig sind, prüfen wir sie und übernehmen die nächsten technischen Schritte. Den aktuellen Stand Ihres Projekts sehen Sie jederzeit im Portal.',
    help: 'Bei Fragen antworten Sie einfach auf diese E-Mail. Wir sind persönlich für Sie da.',
    closing: 'Freundliche Grüße',
    team: 'Ihr Cogniiq-Team',
    testBanner: 'TEST-E-MAIL: Vorschau der Kundennachricht. Die Schaltfläche führt zur Portal-Anmeldung; mit einem Cogniiq-Konto sehen Sie dort nicht die Kundenansicht.',
    footer: (c) => `Sie erhalten diese E-Mail, weil Cogniiq für ${c} einen KI-Telefonassistenten einrichtet.`,
  };
  if (input.kind === 'request') {
    return { ...base, eyebrow: 'Rückfrage', heading: `Eine Rückfrage zu ${company}`,
      paragraphs: ['vielen Dank für Ihre bisherigen Angaben.'], cta: 'Im Portal beantworten' };
  }
  if (input.kind === 'reminder') {
    return { ...base, eyebrow: 'Erinnerung', heading: `Die Einrichtung Ihres KI-Telefonassistenten für ${company}`,
      paragraphs: ['Ihr persönlicher Einrichtungsbereich steht weiterhin für Sie bereit. Ihre bisherigen Angaben sind gespeichert. Sie können genau dort weitermachen, wo Sie aufgehört haben.'],
      cta: 'Einrichtung fortsetzen' };
  }
  return { ...base, eyebrow: 'Projektstart', heading: `Willkommen bei Cogniiq, ${company}`,
    paragraphs: [
      'wir freuen uns, Sie bei der Einrichtung Ihres KI-Telefonassistenten zu begleiten.',
      'Damit wir Ihren Assistenten optimal auf die Abläufe Ihres Unternehmens abstimmen können, haben wir einen persönlichen Einrichtungsbereich für Sie vorbereitet. Dort teilen Sie uns die wichtigsten Informationen zu Ihrem Unternehmen, Ihren Abläufen und Ihren Anforderungen mit.',
    ],
    cta: 'Einrichtung starten' };
}

/** Owner intro replaces the default body paragraphs; blank lines separate paragraphs. */
function bodyParagraphs(input: OnboardingEmailInput, copy: Copy): string[] {
  const intro = (input.intro ?? '').trim();
  if (!intro) return copy.paragraphs;
  return intro.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
}

const FONT = "-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif";

export function renderOnboardingEmail(input: OnboardingEmailInput): RenderedEmail {
  const copy = copyFor(input);
  const name = firstName(input.recipientName);
  const paragraphs = bodyParagraphs(input, copy);
  const cta = safeHref(input.ctaUrl);
  const portal = safeHref(input.portalUrl);
  const question = (input.requestQuestion ?? '').trim();
  const company = input.company.trim();
  const sender = input.sender ?? {};
  const contactBits = [sender.email, sender.phone].filter((v): v is string => Boolean(v && v.trim()));

  const p = (html: string, extra = '') =>
    `<p style="margin:0 0 16px 0;font-family:${FONT};font-size:15px;line-height:24px;color:#3f3f46;${extra}">${html}</p>`;
  const multiline = (value: string) => escapeHtml(value).replace(/\n/g, '<br>');

  const htmlParts: string[] = [];
  htmlParts.push(`<!doctype html><html lang="${input.language}"><head><meta charset="utf-8">`,
    '<meta name="viewport" content="width=device-width,initial-scale=1">',
    '<meta name="color-scheme" content="light"><meta name="supported-color-schemes" content="light">',
    `<title>${escapeHtml(copy.heading)}</title></head>`,
    '<body style="margin:0;padding:0;background:#f4f4f5;">',
    // Preheader: the inbox preview line.
    `<div style="display:none;max-height:0;overflow:hidden;opacity:0;">${escapeHtml(copy.steps[0])}</div>`,
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f4f4f5;">',
    '<tr><td align="center" style="padding:32px 16px;">',
    '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:560px;">');

  if (input.isTest) {
    htmlParts.push(`<tr><td style="padding:10px 16px;margin-bottom:12px;background:#fef3c7;border:1px solid #fcd34d;border-radius:8px;font-family:${FONT};font-size:12px;font-weight:600;color:#92400e;text-align:center;">${escapeHtml(copy.testBanner)}</td></tr><tr><td style="height:12px;line-height:12px;">&nbsp;</td></tr>`);
  }

  htmlParts.push(
    `<tr><td style="padding:0 4px 20px 4px;font-family:${FONT};font-size:17px;font-weight:700;letter-spacing:-0.01em;color:#18181b;">Cogniiq</td></tr>`,
    '<tr><td style="background:#ffffff;border:1px solid #e4e4e7;border-radius:14px;padding:36px 32px;">',
    `<p style="margin:0 0 8px 0;font-family:${FONT};font-size:12px;font-weight:600;letter-spacing:0.06em;text-transform:uppercase;color:#71717a;">${escapeHtml(copy.eyebrow)}</p>`,
    `<h1 style="margin:0 0 24px 0;font-family:${FONT};font-size:22px;line-height:30px;font-weight:650;letter-spacing:-0.015em;color:#18181b;">${escapeHtml(copy.heading)}</h1>`,
    p(escapeHtml(copy.greeting(name))),
  );
  for (const para of paragraphs) htmlParts.push(p(multiline(para)));

  if (input.kind === 'request' && question) {
    htmlParts.push(p(escapeHtml(copy.requestLead)),
      `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px 0;"><tr><td style="border-left:3px solid #18181b;background:#fafafa;padding:14px 16px;font-family:${FONT};font-size:15px;line-height:23px;color:#18181b;">${multiline(question)}</td></tr></table>`);
  } else if (input.kind === 'invitation') {
    htmlParts.push(`<p style="margin:8px 0 10px 0;font-family:${FONT};font-size:13px;font-weight:600;color:#18181b;">${escapeHtml(copy.stepsTitle)}</p>`,
      '<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 24px 0;">');
    copy.steps.forEach((step, index) => {
      htmlParts.push(`<tr><td valign="top" style="width:28px;padding:0 0 10px 0;font-family:${FONT};font-size:13px;font-weight:600;color:#71717a;">${index + 1}.</td><td style="padding:0 0 10px 0;font-family:${FONT};font-size:14px;line-height:22px;color:#3f3f46;">${escapeHtml(step)}</td></tr>`);
    });
    htmlParts.push('</table>');
  }

  if (cta) {
    htmlParts.push(
      '<table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:4px 0 24px 0;"><tr>',
      `<td align="center" bgcolor="#18181b" style="border-radius:10px;"><a href="${escapeHtml(cta)}" target="_blank" rel="noopener" style="display:inline-block;padding:13px 26px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:10px;">${escapeHtml(copy.cta)}</a></td>`,
      '</tr></table>');
  }

  htmlParts.push(p(escapeHtml(copy.next)), p(escapeHtml(copy.help)),
    p(`${escapeHtml(copy.closing)}<br><span style="color:#18181b;font-weight:600;">${escapeHtml(copy.team)}</span>`, 'margin-bottom:0;'));

  if (portal) {
    htmlParts.push(`<p style="margin:24px 0 0 0;padding-top:20px;border-top:1px solid #f4f4f5;font-family:${FONT};font-size:12px;line-height:19px;color:#71717a;">${escapeHtml(copy.fallback)} <a href="${escapeHtml(portal)}" style="color:#3f3f46;">${escapeHtml(portal.replace(/^https?:\/\//, ''))}</a></p>`);
  }
  htmlParts.push('</td></tr>');

  const footerLines = [copy.footer(company || (input.language === 'de' ? 'Ihr Unternehmen' : 'your business'))];
  if (sender.legalName) footerLines.push(sender.legalName);
  if (contactBits.length) footerLines.push(contactBits.join(' · '));
  htmlParts.push(`<tr><td style="padding:20px 8px 0 8px;font-family:${FONT};font-size:12px;line-height:18px;color:#a1a1aa;text-align:center;">${footerLines.map(escapeHtml).join('<br>')}</td></tr>`,
    '</table></td></tr></table></body></html>');

  const textParts: string[] = [];
  if (input.isTest) textParts.push(`[${copy.testBanner}]`, '');
  textParts.push(copy.heading, '', copy.greeting(name), '', ...paragraphs.flatMap((x) => [x, '']));
  if (input.kind === 'request' && question) textParts.push(copy.requestLead, '', question, '');
  if (input.kind === 'invitation') {
    textParts.push(`${copy.stepsTitle}:`, ...copy.steps.map((s, i) => `${i + 1}. ${s}`), '');
  }
  if (cta) textParts.push(`${copy.cta}: ${cta}`, '');
  textParts.push(copy.next, '', copy.help, '', copy.closing, copy.team);
  if (portal) textParts.push('', `${copy.fallback} ${portal}`);
  textParts.push('', '—', ...footerLines);

  return { html: htmlParts.join(''), text: textParts.join('\n') };
}

/** Default subject lines, editable by the owner in the composer. */
export function defaultSubject(kind: OnboardingEmailKind, language: OnboardingEmailLanguage, company: string): string {
  const c = company.trim();
  if (language === 'en') {
    if (kind === 'request') return `A quick question about your setup${c ? ` – ${c}` : ''}`;
    if (kind === 'reminder') return `Continue your setup with Cogniiq${c ? ` – ${c}` : ''}`;
    return `Your project start with Cogniiq${c ? ` – ${c}` : ''}`;
  }
  if (kind === 'request') return `Eine Rückfrage zu Ihrer Einrichtung${c ? ` – ${c}` : ''}`;
  if (kind === 'reminder') return `Ihre Einrichtung mit Cogniiq fortsetzen${c ? ` – ${c}` : ''}`;
  return `Ihr Projektstart mit Cogniiq${c ? ` – ${c}` : ''}`;
}
