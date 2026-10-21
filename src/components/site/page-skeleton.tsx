export function PageSkeleton({ kind }: { kind: "map" | "index" }) {
  return (
    <div className={"site-skeleton is-" + kind} aria-hidden="true">
      <div className="site-skeleton-hero" />
      <div className="site-skeleton-line" />
      <div className="site-skeleton-line is-short" />
      <div className="site-skeleton-grid">
        <i />
        <i />
        <i />
        <i />
        <i />
        <i />
      </div>
    </div>
  );
}
