// Browser-only font sources for the premium PDF engine. Vite resolves `?url` to a hashed,
// bundled asset URL that @react-pdf/renderer fetches at render time. Imported ONLY from
// browser code paths (never from the node test harness, which registers fonts from disk).

import regular from '@/assets/fonts/DejaVuSans.ttf?url';
import bold from '@/assets/fonts/DejaVuSans-Bold.ttf?url';
import type { PremiumFontSources } from './premiumOfferPdf';

export const PREMIUM_FONTS: PremiumFontSources = { regular, bold };
