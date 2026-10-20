import Link from "next/link";
import { AyioraMark } from "~/components/brand/AyioraMark";

export function BrandLockup({
  href,
  className = "",
}: {
  href: string;
  className?: string;
}) {
  return (
    <Link href={href} className={`ag-lockup ${className}`.trim()}>
      <span className="ag-lockup-name">ANIGUESSR</span>
      <span className="ag-lockup-by">
        by <AyioraMark size={14} />
        <b>Ayiora</b>
      </span>
    </Link>
  );
}
