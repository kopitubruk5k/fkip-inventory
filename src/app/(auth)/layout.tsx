export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        background: "linear-gradient(135deg, #6b63e8 0%, #aa5ee7 100%)",
        padding: "1rem",
        fontFamily: "'Inter', sans-serif"
      }}
    >
      {children}
      <div style={{ marginTop: '1.5rem', color: 'rgba(255,255,255,0.7)', fontSize: '0.8rem' }}>
        © 2026 FKIP UMS
      </div>
    </div>
  );
}
