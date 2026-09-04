const ALLOWED_PREFIXES = ["getprop", "dumpsys", "pm list"] as const;

const FORBIDDEN_PATTERNS = ["&&", "||", ";", "|", "$(", "`", "\n"] as const;

export function isCommandAllowed(command: string): boolean {
  const trimmed = command.trim();

  if (trimmed.length === 0) {
    return false;
  }

  const startsWithAllowed = ALLOWED_PREFIXES.some((prefix) =>
    trimmed.startsWith(prefix)
  );
  if (!startsWithAllowed) {
    return false;
  }

  const containsForbidden = FORBIDDEN_PATTERNS.some((pattern) =>
    trimmed.includes(pattern)
  );
  return !containsForbidden;
}
