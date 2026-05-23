import SectionHeader from '../components/ui/SectionHeader'

function SettingsPage() {
  return (
    <section>
      <SectionHeader title="Workspace Settings" subtitle="System" />
      <div className="rounded-2xl border border-cyan-400/20 bg-slate-950/40 p-4 text-slate-300">
        Environment configuration and preferences will be managed here.
      </div>
    </section>
  )
}

export default SettingsPage