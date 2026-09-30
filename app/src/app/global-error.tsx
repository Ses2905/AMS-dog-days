"use client";

/** Last resort: the page shell itself failed. It carries its own styles because the normal ones did not load. */
export default function GlobalError({ retry }: { error: Error & { digest?: string }; retry: () => void }) {
  return (
    <html lang="en">
      <body style={{ margin: 0, fontFamily: "system-ui, sans-serif", background: "#f3f5f2", color: "#111512" }}>
        <div style={{ maxWidth: 420, margin: "20vh auto", padding: 24, textAlign: "center" }}>
          <h1 style={{ fontSize: 24 }}>Coach OS Hit a Problem</h1>
          <p style={{ lineHeight: 1.5 }}>Your data is safe. Try again in a moment.</p>
          <button onClick={() => retry()} style={{ minHeight: 48, padding: "0 20px", borderRadius: 8, border: 0, background: "#003810", color: "#fff", fontSize: 16, fontWeight: 600 }}>Try Again</button>
        </div>
      </body>
    </html>
  );
}
