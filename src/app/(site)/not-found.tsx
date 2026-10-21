import Link from "next/link";

export default function NotFound() {
  return (
    <main className="site-missing">
      <p>404</p>
      <h1>Page not found</h1>
      <Link href="/en">AniGuessr</Link>
    </main>
  );
}
