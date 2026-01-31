export function SourceList({ sources }: { sources: string[] }) {
  if (!sources?.length) return null;

  return (
    <div style={{ marginTop: 6 }}>
      <strong>Sources:</strong>
      <ul>
        {sources.map((s) => (
          <li key={s}>{s}</li>
        ))}
      </ul>
    </div>
  );
}
