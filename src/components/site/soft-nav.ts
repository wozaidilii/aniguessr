let soft = false;

/** Set once the first page has hydrated, so the next client navigation can paint a short list first. */
export function markSoftNav(): void {
  soft = true;
}

export function isSoftNav(): boolean {
  return soft;
}
