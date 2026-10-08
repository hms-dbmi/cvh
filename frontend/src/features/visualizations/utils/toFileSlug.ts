// Filesystems cap names at 255 bytes. 60 code points stays under that even
// at 4 bytes each, with room for a suffix like "-qr-code.png".
const MAX_LENGTH = 60;

/**
 * Turns a visualization name into a safe file name part, keeping letters
 * and numbers in any script: "Évolution des cellules (v2)" ->
 * "évolution-des-cellules-v2". Everything else, including path separators,
 * characters Windows forbids and invisible formatting characters (such as
 * right-to-left overrides), becomes a dash. Returns "" when nothing usable
 * remains, so callers can fall back to a default.
 */
export function toFileSlug(name: string) {
  const slug = name
    .normalize("NFC")
    .toLowerCase()
    .replace(/[^\p{L}\p{M}\p{N}]+/gu, "-")
    // A leading accent mark has no letter to attach to.
    .replace(/^[-\p{M}]+/u, "");
  return Array.from(slug).slice(0, MAX_LENGTH).join("").replace(/-+$/, "");
}
