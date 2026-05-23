const SEASON_CODE_RE = /^[a-z0-9](?:[a-z0-9-]*[a-z0-9])?$/;

export function slugifySeasonCode(input: string): string {
  return input
    .normalize("NFKD")
    .replace(/[̀-ͯ]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .replace(/-{2,}/g, "-");
}

export function isValidSeasonCode(code: string): boolean {
  return SEASON_CODE_RE.test(code);
}
