// A titled group of settings rows — an uppercase section label above a single
// subtle card that holds divided rows (the native grouped-list pattern).

export default function Group({ label, children, className = '' }) {
  return (
    <section className={`mt-8 ${className}`}>
      {label && <p className="section-label mb-2">{label}</p>}
      <div className="card divide-y divide-teal/[0.06] px-4">{children}</div>
    </section>
  )
}
