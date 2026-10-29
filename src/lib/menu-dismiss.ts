export function isEscapeKey(key: string): boolean {
  return key === "Escape";
}

export function isPointerOutsideRoot(
  root: Element | null,
  target: EventTarget | null,
): boolean {
  if (target == null || typeof target !== "object") return true;
  if (!root?.contains) return true;
  if (!("nodeType" in target)) return true;
  return !root.contains(target as Node);
}
