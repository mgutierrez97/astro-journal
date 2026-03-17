export default function JournalEntryPage({ params }: { params: { id: string } }) {
  return (
    <div style={{ minHeight: "100dvh", background: "#0D1117", display: "flex", alignItems: "center", justifyContent: "center" }}>
      <span style={{ color: "#4A5060", fontSize: 13, fontStyle: "italic", fontFamily: "EB Garamond, serif" }}>
        Entry {params.id} — coming soon
      </span>
    </div>
  );
}
