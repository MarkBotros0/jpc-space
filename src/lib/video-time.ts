// Format a whole number of seconds as m:ss (or h:mm:ss past an hour).
export function formatTimestamp(totalSeconds: number): string {
  const s = Math.max(0, Math.floor(totalSeconds));
  const hours = Math.floor(s / 3600);
  const minutes = Math.floor((s % 3600) / 60);
  const seconds = s % 60;
  const pad = (n: number) => String(n).padStart(2, "0");
  if (hours > 0) return `${hours}:${pad(minutes)}:${pad(seconds)}`;
  return `${minutes}:${pad(seconds)}`;
}

// Parse a "m:ss", "h:mm:ss", or plain-seconds string to a second count.
// Returns null when the input is not a valid timestamp.
export function parseTimestamp(input: string): number | null {
  const trimmed = input.trim();
  if (trimmed === "") return null;

  const parts = trimmed.split(":");
  if (parts.length > 3) return null;

  const nums = parts.map((p) => Number(p));
  if (nums.some((n) => !Number.isInteger(n) || n < 0)) return null;

  if (parts.length === 1) return nums[0];
  if (parts.length === 2) {
    if (nums[1] >= 60) return null;
    return nums[0] * 60 + nums[1];
  }
  if (nums[1] >= 60 || nums[2] >= 60) return null;
  return nums[0] * 3600 + nums[1] * 60 + nums[2];
}
