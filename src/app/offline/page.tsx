export const metadata = { title: "Offline · ROOS" };

export default function OfflinePage() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "grid",
        placeItems: "center",
        padding: 24,
        textAlign: "center",
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
        <div
          style={{
            width: 64,
            height: 64,
            borderRadius: "50%",
            background: "var(--color-accent-800)",
            display: "grid",
            placeItems: "center",
          }}
        >
          <svg width="30" height="30" viewBox="0 0 256 256" fill="none" aria-hidden>
            <path
              d="M128 24 40 56v56c0 68 88 108 88 108s88-40 88-108V56Z"
              stroke="#ffdccf"
              strokeWidth="14"
              strokeLinejoin="round"
            />
            <path
              d="M96 128l24 24 44-52"
              stroke="#ffdccf"
              strokeWidth="14"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h3 style={{ margin: 0 }}>You&apos;re offline</h3>
        <p className="text-muted" style={{ margin: 0, maxWidth: 300, fontSize: 13 }}>
          No connection right now. Submissions you complete are saved on this device and will sync
          once you&apos;re back online.
        </p>
      </div>
    </div>
  );
}
