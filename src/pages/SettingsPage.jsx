import { useNavigate } from 'react-router-dom'
import SectionHeader from '../components/ui/SectionHeader'
import { getStoredUser, clearAuthSession } from '../utils/authStorage'

function SettingsPage() {
  const navigate = useNavigate()
  const user = getStoredUser()
  const initials = user?.name
    ? user.name.split(' ').map(w => w[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const handleLogout = () => {
    clearAuthSession()
    navigate('/login', { replace: true })
  }

  return (
    <section className="space-y-5">
      <SectionHeader title="Workspace Settings" subtitle="System" />

      <div className="rounded-2xl border border-cyan-400/20 bg-slate-950/40 p-5 space-y-4">
        <p className="text-xs uppercase tracking-widest text-slate-500">Account</p>

        <div className="flex items-center gap-4">
          {user?.profile?.avatarUrl ? (
            <img src={user.profile.avatarUrl} alt={user.name} className="h-14 w-14 rounded-full border border-cyan-300/30 object-cover" />
          ) : (
            <div className="flex h-14 w-14 items-center justify-center rounded-full border border-cyan-300/30 bg-gradient-to-br from-cyan-400/30 to-emerald-400/30 text-lg font-semibold text-cyan-100">
              {initials}
            </div>
          )}
          <div>
            <p className="text-sm font-medium text-white">{user?.name || '—'}</p>
            <p className="text-xs text-slate-400">{user?.email || '—'}</p>
            <p className="mt-1 text-xs capitalize text-emerald-400">{user?.role || 'user'}</p>
          </div>
        </div>

        <div className="border-t border-white/10 pt-4">
          <button
            onClick={handleLogout}
            className="rounded-xl border border-red-500/30 bg-red-500/10 px-5 py-2.5 text-sm font-medium text-red-400 transition hover:bg-red-500/20 hover:text-red-300"
          >
            Sign out
          </button>
        </div>
      </div>
    </section>
  )
}

export default SettingsPage
