export function safeUrl(value: unknown): string {
  if (typeof value !== "string") return "";
  if (
    value.startsWith("/") &&
    !value.startsWith("//") &&
    !/[\\\x00-\x20]/.test(value)
  )
    return value;
  if (/^https?:\/\//i.test(value)) {
    try {
      return new URL(value).href;
    } catch {
      return "";
    }
  }
  if (
    /^mailto:[^\s<>]+@[^\s<>]+$/.test(value) ||
    /^tel:[+\d ()-]+$/.test(value)
  )
    return value;
  return "";
}
