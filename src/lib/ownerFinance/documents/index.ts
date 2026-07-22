// Public surface for the shared transactional document system (offers + invoices).

export * from './documentModel';
export * from './documentValidation';
export * from './documentHash';
export * from './documentFilename';
export { buildTransactionalReportModel, renderTransactionalPdf } from './transactionalPdf';

import { downloadBytes } from '@/lib/ownerFinance/exports';
import type { TransactionalDocument } from './documentModel';
import { documentFilename } from './documentFilename';
import { renderTransactionalPdf } from './transactionalPdf';

/** Render and download a transactional document PDF with its stable filename. */
export async function exportTransactionalPdf(doc: TransactionalDocument): Promise<void> {
  const bytes = await renderTransactionalPdf(doc);
  downloadBytes(documentFilename(doc), bytes, 'application/pdf');
}
