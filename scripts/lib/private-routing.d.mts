export const PRIVATE_PREFIXES: string[];
export const PRIVATE_SHELL: string;
export const PRIVATE_SHELL_FILE: string;
export const NOT_FOUND_DOCUMENT: string;
export function normalizePathname(pathname: string): string;
export function isPrivateRoute(pathname: string): boolean;
export function describeDocumentProblem(
  response: { ok: boolean; status: number; contentType: string | null },
  html: string,
  requireEmptyRoot: boolean
): string | null;
