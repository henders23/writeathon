export default function Loading({ label = "Loading…" }: { label?: string; dark?: boolean }) {
  return (
    <div className="app">
      <div className="loading" role="status">
        <div className="spinner" />
        <p style={{ marginTop: 16 }}>{label}</p>
      </div>
    </div>
  );
}
