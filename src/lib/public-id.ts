import { customAlphabet } from "nanoid";

// URL-safe alphabet: digits + ASCII letters. 62^10 ≈ 8.4 × 10^17 — collision-safe for this scale.
const alphabet = "0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz";
const generate = customAlphabet(alphabet, 10);

export function newPublicId(): string {
  return generate();
}
