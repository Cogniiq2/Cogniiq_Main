// Email content builder: gender-safe greeting, HTML-escaped placeholder templating, a
// professional Cogniiq HTML layout, and a plain-text alternative. Pure + import-free, so it
// runs unchanged under Deno (worker) and Node (tests). ALL customer-controlled values are
// escaped before insertion into HTML.

export function escapeHtml(value: unknown): string {
  return String(value ?? '')
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;').replace(/'/g, '&#39;');
}

// Gender-safe greeting: "Herr"/"Frau" only when explicitly selected; never inferred.
export function recipientName(r: {
  greeting_name?: string | null; salutation?: string | null; title?: string | null;
  first_name?: string | null; last_name?: string | null;
}): string {
  const g = (r.greeting_name ?? '').trim();
  if (g) return g;
  const sal = (r.salutation ?? '').trim().toLowerCase();
  const title = (r.title ?? '').trim();
  const first = (r.first_name ?? '').trim();
  const last = (r.last_name ?? '').trim();
  const person = last || first;
  if ((sal === 'herr' || sal === 'frau') && person) {
    return [sal === 'herr' ? 'Herr' : 'Frau', title, person].filter(Boolean).join(' ');
  }
  return [title, first, last].filter(Boolean).join(' ');
}

export function fmtCentsDe(cents: number, currency = 'EUR'): string {
  const abs = Math.abs(cents);
  const euros = Math.floor(abs / 100).toLocaleString('de-DE');
  const frac = (abs % 100).toString().padStart(2, '0');
  return `${cents < 0 ? '-' : ''}${euros},${frac} ${currency === 'EUR' ? '€' : currency}`;
}
export function fmtDateDe(iso: string | null | undefined): string {
  if (!iso) return '';
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso);
  return m ? `${m[3]}.${m[2]}.${m[1]}` : iso;
}

/** Substitute {{placeholders}} with HTML-escaped values (unknown placeholders -> ''). */
export function renderTemplate(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, k: string) => escapeHtml(vars[k] ?? ''));
}

function layout(bodyHtml: string, sellerName: string): string {
  return `<!doctype html><html lang="de"><body style="margin:0;background:#f5f5f2;font-family:-apple-system,Segoe UI,Roboto,Helvetica,Arial,sans-serif;color:#0f172a">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px">
    <div style="background:#ffffff;border:1px solid #ececeb;border-radius:16px;padding:28px 26px">
      <div style="font-size:12px;letter-spacing:.14em;text-transform:uppercase;color:#94a3b8;font-weight:700">${escapeHtml(sellerName || 'Cogniiq')}</div>
      <div style="height:14px"></div>
      ${bodyHtml}
    </div>
    <div style="text-align:center;color:#94a3b8;font-size:11px;padding-top:16px">Bereitgestellt über Cogniiq</div>
  </div></body></html>`;
}

export interface BuiltEmail { subject: string; html: string; text: string; }

export interface InvoiceEmailContext {
  invoice: { invoice_number: string | null; currency: string; due_date: string | null; gross_total_cents: number };
  recipient: { company?: string | null; contact_name?: string | null; greeting_name?: string | null;
    salutation?: string | null; title?: string | null; first_name?: string | null; last_name?: string | null };
  seller: { legal_name?: string | null };
  templates?: { subject?: string | null; body?: string | null };
}
export interface OfferEmailContext {
  offer_number?: string | null; valid_until?: string | null;
  recipient: { greeting_name?: string | null; salutation?: string | null; title?: string | null;
    first_name?: string | null; last_name?: string | null };
  seller?: { legal_name?: string | null };
}

/**
 * Owner-authored overrides from the "Angebot versenden" dialog. Both are OPTIONAL — when a
 * value is blank the premium German default is used instead. The subject is plain text (never
 * rendered as HTML); the message body is HTML-ESCAPED here before insertion, so unsafe raw
 * HTML from the dialog can never reach the recipient. The secure link is NEVER taken from the
 * dialog — it is always the worker-minted `${PUBLIC_APP_URL}/d/<token>` value passed as `link`.
 */
export interface OfferEmailOverrides { subject?: string | null; message?: string | null; }

export function buildInvoiceEmail(ctx: InvoiceEmailContext, opts: { link?: string } = {}): BuiltEmail {
  const inv = ctx.invoice; const r = ctx.recipient; const seller = ctx.seller;
  const name = recipientName(r);
  const gross = fmtCentsDe(inv.gross_total_cents, inv.currency);
  const vars: Record<string, string> = {
    recipient_name: name, company: r.company ?? '', invoice_number: inv.invoice_number ?? '',
    gross_total: gross, due_date: fmtDateDe(inv.due_date), document_link: opts.link ?? '',
    seller_name: seller.legal_name ?? '', offer_number: '', valid_until: '',
  };
  const subject = (ctx.templates?.subject && String(ctx.templates.subject).trim())
    ? String(ctx.templates.subject).replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_: string, k: string) => vars[k] ?? '')
    : `Ihre Rechnung ${inv.invoice_number ?? ''} von ${seller.legal_name ?? 'Cogniiq'}`.trim();

  const greetLine = name ? `Guten Tag ${escapeHtml(name)},` : 'Guten Tag,';
  const bodyTemplate = ctx.templates?.body && String(ctx.templates.body).trim()
    ? `<p style="font-size:15px;line-height:1.6;color:#334155">${renderTemplate(String(ctx.templates.body), vars).replace(/\n/g, '<br>')}</p>`
    : `<p style="font-size:15px;line-height:1.6;color:#334155">${greetLine}</p>
       <p style="font-size:15px;line-height:1.6;color:#334155">anbei erhalten Sie Ihre Rechnung <strong>${escapeHtml(inv.invoice_number ?? '')}</strong> über <strong>${escapeHtml(gross)}</strong>, fällig bis ${escapeHtml(fmtDateDe(inv.due_date))}. Die Rechnung finden Sie als PDF im Anhang.</p>
       <p style="font-size:15px;line-height:1.6;color:#334155">Beste Grüße<br>${escapeHtml(seller.legal_name ?? 'Cogniiq')}</p>`;
  const html = layout(bodyTemplate, seller.legal_name ?? 'Cogniiq');
  const text = `${name ? `Guten Tag ${name},` : 'Guten Tag,'}\n\n` +
    `anbei Ihre Rechnung ${inv.invoice_number ?? ''} über ${gross}, fällig bis ${fmtDateDe(inv.due_date)}.\n` +
    `Die Rechnung ist als PDF angehängt.\n\nBeste Grüße\n${seller.legal_name ?? 'Cogniiq'}`;
  return { subject, html, text };
}

export interface ConfirmationEmailContext {
  offer: { offer_number: string | null; currency: string; gross_total_cents: number };
  signature: { accepted_at?: string | null };
  signer: { name?: string | null };
  recipient: { company?: string | null; greeting_name?: string | null; salutation?: string | null;
    title?: string | null; first_name?: string | null; last_name?: string | null };
  seller: { legal_name?: string | null; email?: string | null; phone?: string | null; website?: string | null };
  templates?: { subject?: string | null; body?: string | null };
}

/**
 * Premium signed-acceptance confirmation email. Sent AFTER a signed acceptance, with the
 * signed acceptance certificate attached. All customer-controlled values are HTML-escaped;
 * a plain-text alternative is always included. No portal token is exposed after acceptance.
 */
export function buildConfirmationEmail(ctx: ConfirmationEmailContext): BuiltEmail {
  const r = ctx.recipient; const name = recipientName(r);
  const sellerName = ctx.seller.legal_name ?? 'Cogniiq';
  const offerNo = ctx.offer.offer_number ?? '';
  const gross = fmtCentsDe(ctx.offer.gross_total_cents, ctx.offer.currency);
  const acceptedAt = fmtDateDe(ctx.signature.accepted_at);
  const vars: Record<string, string> = {
    recipient_name: name, recipient_company: r.company ?? '', offer_number: offerNo,
    gross_total: gross, currency: ctx.offer.currency, accepted_at: acceptedAt,
    signer_name: ctx.signer.name ?? name, seller_name: sellerName, seller_email: ctx.seller.email ?? '',
    invoice_number: '', due_date: '', document_link: '',
  };
  const subject = (ctx.templates?.subject && String(ctx.templates.subject).trim())
    ? renderTemplateRaw(String(ctx.templates.subject), vars)
    : `Ihre Annahme des Angebots ${offerNo} wurde bestätigt`.trim();

  const greetLine = name ? `Guten Tag ${escapeHtml(name)},` : 'Guten Tag,';
  const contactBits = [ctx.seller.email, ctx.seller.phone, ctx.seller.website].filter(Boolean).map((b) => escapeHtml(String(b))).join('  ·  ');
  const bodyHtml = ctx.templates?.body && String(ctx.templates.body).trim()
    ? `<p style="font-size:15px;line-height:1.6;color:#334155">${renderTemplate(String(ctx.templates.body), vars).replace(/\n/g, '<br>')}</p>`
    : `<p style="font-size:15px;line-height:1.6;color:#334155">${greetLine}</p>
       <p style="font-size:15px;line-height:1.6;color:#334155">vielen Dank — Ihre Annahme des Angebots <strong>${escapeHtml(offerNo)}</strong> über <strong>${escapeHtml(gross)}</strong> haben wir am ${escapeHtml(acceptedAt)} verbindlich erfasst.</p>
       <p style="font-size:15px;line-height:1.6;color:#334155">Ihre unterschriebene Annahmebestätigung finden Sie als PDF im Anhang dieser E-Mail. Wir bereiten nun die nächsten Schritte vor und melden uns in Kürze mit den weiteren Details bei Ihnen.</p>
       ${contactBits ? `<p style="font-size:13px;line-height:1.6;color:#64748b">Bei Fragen erreichen Sie uns unter ${contactBits}.</p>` : ''}
       <p style="font-size:15px;line-height:1.6;color:#334155">Herzliche Grüße<br>${escapeHtml(sellerName)}</p>`;
  const html = layout(bodyHtml, sellerName);
  const text = `${name ? `Guten Tag ${name},` : 'Guten Tag,'}\n\n` +
    `vielen Dank — Ihre Annahme des Angebots ${offerNo} über ${gross} haben wir am ${acceptedAt} verbindlich erfasst.\n` +
    `Ihre unterschriebene Annahmebestätigung ist als PDF angehängt. Wir melden uns in Kürze mit den nächsten Schritten.\n` +
    (contactBits ? `\nKontakt: ${[ctx.seller.email, ctx.seller.phone, ctx.seller.website].filter(Boolean).join(' · ')}\n` : '') +
    `\nHerzliche Grüße\n${sellerName}`;
  return { subject, html, text };
}

/** Subject-line templating (plain text, no HTML escaping — a subject is never rendered as HTML). */
function renderTemplateRaw(tpl: string, vars: Record<string, string>): string {
  return tpl.replace(/\{\{\s*([a-z_]+)\s*\}\}/gi, (_, k: string) => vars[k] ?? '');
}

export function buildOfferEmail(ctx: OfferEmailContext, link: string, overrides: OfferEmailOverrides = {}): BuiltEmail {
  const r = ctx.recipient; const name = recipientName(r);
  const seller = ctx.seller ?? {}; const sellerName = seller.legal_name ?? 'Cogniiq';
  const validUntil = fmtDateDe(ctx.valid_until);

  // Owner-authored subject wins when present (plain text — a subject is never HTML).
  const customSubject = (overrides.subject ?? '').trim();
  const subject = customSubject || `Ihr persönliches Angebot ${ctx.offer_number ?? ''} von ${sellerName}`.trim();

  const greetLine = name ? `Guten Tag ${escapeHtml(name)},` : 'Guten Tag,';
  // The secure link button is ALWAYS the worker-minted portal URL, appended after the body
  // (the dialog never carries the token). The CTA button + validity line frame every variant.
  const linkBlock =
    `<p style="margin:20px 0"><a href="${escapeHtml(link)}" style="display:inline-block;background:#0f172a;color:#fff;text-decoration:none;padding:12px 22px;border-radius:12px;font-weight:600;font-size:14px">Angebot ansehen</a></p>
    ${validUntil ? `<p style="font-size:13px;color:#64748b">Das Angebot ist bis zum ${escapeHtml(validUntil)} gültig.</p>` : ''}`;

  // Owner-authored body wins when present — HTML-ESCAPED, newlines → <br> (no raw HTML leaks).
  const customMessage = (overrides.message ?? '').trim();
  const body = customMessage
    ? `<p style="font-size:15px;line-height:1.6;color:#334155">${escapeHtml(overrides.message).replace(/\n/g, '<br>')}</p>
    ${linkBlock}`
    : `<p style="font-size:15px;line-height:1.6;color:#334155">${greetLine}</p>
    <p style="font-size:15px;line-height:1.6;color:#334155">unter dem folgenden sicheren Link können Sie Ihr persönliches Angebot einsehen, als PDF herunterladen und direkt online annehmen:</p>
    ${linkBlock}
    <p style="font-size:15px;line-height:1.6;color:#334155">Beste Grüße<br>${escapeHtml(sellerName)}</p>`;
  const html = layout(body, sellerName);

  const text = customMessage
    ? `${overrides.message!.trim()}\n\n${link}\n` + (validUntil ? `\nGültig bis ${validUntil}.\n` : '')
    : `${name ? `Guten Tag ${name},` : 'Guten Tag,'}\n\n` +
      `Ihr persönliches Angebot ${ctx.offer_number ?? ''} können Sie hier einsehen und online annehmen:\n${link}\n` +
      (validUntil ? `\nGültig bis ${validUntil}.\n` : '') +
      `\nBeste Grüße\n${sellerName}`;
  return { subject, html, text };
}
