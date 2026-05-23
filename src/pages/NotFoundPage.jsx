import { Link } from 'react-router-dom'

function NotFoundPage() {
  return (
    <section className="flex min-h-screen items-center justify-center p-6">
      <div className="rounded-2xl border border-cyan-400/20 bg-slate-950/50 p-8 text-center">
        <p className="text-sm text-cyan-300">404</p>
        <h2 className="mt-2 text-2xl font-semibold text-cyan-50">Route not found</h2>
        <Link to="/dashboard" className="mt-4 inline-block rounded-lg bg-cyan-500/20 px-4 py-2 text-cyan-100">
          Go to Dashboard
        </Link>
      </div>
    </section>
  )
}

export default NotFoundPage