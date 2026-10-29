/** Designer spec §9.1 — external link decoration (not read by screen readers). */
export function AffiliateExternalLinkIcon() {
  return (
    <svg
      aria-hidden="true"
      focusable="false"
      viewBox="0 0 24 24"
      width="16"
      height="16"
      className="h-4 w-4 shrink-0 text-[#9AA0AA] transition-colors duration-150 motion-reduce:transition-none group-hover:text-[#C4275F] group-focus-visible:text-[#C4275F]"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.75"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M14 4h6v6" />
      <path d="M20 4 10 14" />
      <path d="M18 14v4a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4" />
    </svg>
  );
}
