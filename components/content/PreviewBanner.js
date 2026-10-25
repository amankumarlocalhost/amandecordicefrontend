/** Shown on draft previews so a preview is never mistaken for the live site. */
export default function PreviewBanner({ expired = false }) {
  if (expired) {
    return (
      <div className="container-lux py-24 text-center">
        <h1 className="font-display text-4xl">Preview link expired</h1>
        <p className="mt-3 text-sm text-muted">Open the preview again from the admin panel. Preview links are valid for 15 minutes.</p>
      </div>
    );
  }
  return (
    <div className="sticky top-0 z-50 bg-gold-soft px-4 py-2 text-center text-[0.7rem] font-medium tracking-[0.15em] text-ink uppercase" role="status">
      Draft preview — not visible to customers until published
    </div>
  );
}
