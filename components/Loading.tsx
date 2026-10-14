export default function Loading({ label = "Loading…", dark = false }: { label?: string; dark?: boolean }) {
  return (
    <main className={`shell${dark ? " dark" : ""}`}>
      <div className="loading" role="status">
        <div className="spinner" />
        <p style={{ marginTop: 16 }}>{label}</p>
      </div>
    </main>
  );
}
