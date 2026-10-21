export default function NotFound() {
  return (
    <html lang="en">
      <body
        style={{
          margin: 0,
          background: "#f7f6f3",
          color: "#1f2430",
          fontFamily: "sans-serif",
        }}
      >
        <main style={{ padding: "64px 24px" }}>
          <p>404</p>
          <h1>Page not found</h1>
          <a href="/ja" style={{ color: "#c2276b", fontWeight: 700 }}>
            AniGuessr
          </a>
        </main>
      </body>
    </html>
  );
}
