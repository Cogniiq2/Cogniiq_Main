// Golden Agent — cheap, dependency-free content fingerprints.
//
// Used to answer "did this change?" for knowledge documents and cached runtimes. Never used for
// authentication or integrity: where an attacker controls the input, the server uses SHA-256
// (server/shared.ts). FNV-1a is chosen here because it is synchronous, which keeps
// `planGoldenAgent` pure, and because a collision costs one redundant write, not a security hole.

export function contentFingerprint(input: string): string {
  let hash = 0x811c9dc5;
  for (let i = 0; i < input.length; i += 1) {
    hash ^= input.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193) >>> 0;
  }
  // The length is appended so two inputs need to collide in both the hash and their size.
  return `${hash.toString(16).padStart(8, '0')}-${input.length.toString(16)}`;
}
