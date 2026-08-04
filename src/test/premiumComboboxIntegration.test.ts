import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

// FALSIFICATION TEST — the long entity selectors must stay searchable.
//
// These four selectors are the ones whose option list grows without bound: the CRM and
// owner-customer lists in the offer editor, the CRM list in the invoice drawer, and the
// project list in the portal publish card. A plain listbox over any of them is unusable
// past a few dozen rows, and the regression is invisible in a screenshot of a short
// fixture list — so it is asserted here instead.
//
// Deleting a `PremiumCombobox` from any of these files, or swapping it back to `Select`,
// fails this test.

const ROOT = resolve(__dirname, '../..');

interface Integration {
  /** Path relative to the repository root. */
  file: string;
  /** The control's `id`, which is also what the QA harness looks for in the DOM. */
  controlId: string;
  /** Why this particular selector has to be searchable. */
  reason: string;
}

export const REQUIRED_COMBOBOX_INTEGRATIONS: Integration[] = [
  {
    file: 'src/pages/owner/OfferEditor.tsx',
    controlId: 'owner-customer',
    reason: 'Kundenverwaltung list grows without bound; scrolling it is the slowest step in writing an offer.',
  },
  {
    file: 'src/pages/owner/OfferEditor.tsx',
    controlId: 'customer',
    reason: 'Full CRM customer list.',
  },
  {
    file: 'src/pages/owner/InvoicesPage.tsx',
    controlId: 'customer',
    reason: 'Invoice drawer opens against the full CRM customer list.',
  },
  {
    file: 'src/components/finance/CustomerPortalPublishCard.tsx',
    controlId: 'publish-project',
    reason: 'Customer project titles are long and numerous per organisation.',
  },
];

function read(file: string): string {
  return readFileSync(resolve(ROOT, file), 'utf8');
}

/** Extract the JSX opening tag that carries `id="<controlId>"`, whatever the component is. */
function elementForId(source: string, controlId: string): { tag: string; body: string } | null {
  const idPattern = new RegExp(`id=["']${controlId}["']`);
  const match = idPattern.exec(source);
  if (!match) return null;

  // Walk backwards to the `<` that opens this element, then forwards to the matching `>`.
  const open = source.lastIndexOf('<', match.index);
  if (open === -1) return null;
  let depth = 0;
  let end = open;
  for (let i = open; i < source.length; i += 1) {
    const ch = source[i];
    if (ch === '{') depth += 1;
    else if (ch === '}') depth -= 1;
    else if (ch === '>' && depth === 0) {
      end = i;
      break;
    }
  }
  const body = source.slice(open, end + 1);
  const tag = /^<\s*([A-Za-z0-9_.]+)/.exec(body)?.[1] ?? '';
  return { tag, body };
}

describe('PremiumCombobox integrations', () => {
  it.each(REQUIRED_COMBOBOX_INTEGRATIONS)(
    '$file renders id="$controlId" as a searchable combobox',
    ({ file, controlId, reason }) => {
      const element = elementForId(read(file), controlId);
      expect(element, `no element with id="${controlId}" in ${file}`).not.toBeNull();
      expect(
        element!.tag,
        `${file} → id="${controlId}" must be a PremiumCombobox, found <${element!.tag}>. ${reason}`,
      ).toBe('PremiumCombobox');
    },
  );

  it.each(REQUIRED_COMBOBOX_INTEGRATIONS)(
    '$file → $controlId keeps a German search placeholder and empty message',
    ({ file, controlId }) => {
      const element = elementForId(read(file), controlId)!;
      expect(element.body, 'searchPlaceholder is what makes the control searchable to a user').toContain('searchPlaceholder');
      expect(element.body, 'emptyMessage must name the real next action').toContain('emptyMessage');
    },
  );

  it('every integration keeps the empty-string sentinel option, so clearing still yields ""', () => {
    // The payload contract is that "no selection" is the empty string, not null and not a
    // sentinel id. Losing the '' option would silently change what gets written.
    for (const { file, controlId } of REQUIRED_COMBOBOX_INTEGRATIONS) {
      const element = elementForId(read(file), controlId)!;
      expect(element.body, `${file} → ${controlId} lost its "" option`).toMatch(/value:\s*''/);
    }
  });

  it('PremiumCombobox itself still filters on label, description and keywords', () => {
    // The integrations pass `keywords` (customer number, e-mail, legal name). If the
    // component stopped consulting them, search would silently narrow to the visible label.
    const source = read('src/components/dashboard/premiumControls.tsx');
    expect(source).toContain('option.keywords');
    expect(source).toContain('option.description');
  });
});
