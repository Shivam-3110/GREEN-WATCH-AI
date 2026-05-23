function SectionHeader({ title, subtitle }) {
  return (
    <div className="mb-6">
      <p className="text-xs uppercase tracking-[0.18em] text-cyan-300/80">{subtitle}</p>
      <h2 className="mt-1 text-2xl font-semibold text-cyan-50 md:text-3xl">{title}</h2>
    </div>
  )
}

export default SectionHeader