import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import AuthShell from '../../components/auth/AuthShell'
import AuthTextField from '../../components/auth/AuthTextField'
import { loginUser } from '../../services/authService'
import { validateLoginForm } from '../../utils/authValidation'

const initialForm = {
  email: '',
  password: '',
}

function LoginPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState(initialForm)
  const [errors, setErrors] = useState({})
  const [apiError, setApiError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  const handleChange = (event) => {
    const { name, value } = event.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setErrors((prev) => ({ ...prev, [name]: '' }))
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    const nextErrors = validateLoginForm(form)
    setErrors(nextErrors)
    setApiError('')

    if (Object.keys(nextErrors).length > 0) return

    try {
      setIsSubmitting(true)
      await loginUser(form)
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setApiError(error.response?.data?.message || 'Login failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="Secure Access"
      title="Monitor the planet from one intelligent command layer."
      subtitle="Sign in to continue tracking air quality, carbon intelligence, alerts, and environmental signals across EcoSphere AI."
    >
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, x: 22 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45 }}
        className="rounded-lg border border-emerald-300/20 bg-[#06100d]/86 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-6"
      >
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Welcome back</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Login</h2>
        </div>

        <div className="space-y-4">
          <AuthTextField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="you@ecosphere.ai"
            autoComplete="email"
          />
          <AuthTextField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="Enter your password"
            autoComplete="current-password"
          />
        </div>

        {apiError ? <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{apiError}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full rounded-lg bg-emerald-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Signing in...' : 'Sign in'}
        </button>

        <p className="mt-5 text-center text-sm text-slate-300">
          New to EcoSphere AI?{' '}
          <Link to="/register" className="font-semibold text-emerald-300 hover:text-cyan-200">
            Create account
          </Link>
        </p>
      </motion.form>
    </AuthShell>
  )
}

export default LoginPage
