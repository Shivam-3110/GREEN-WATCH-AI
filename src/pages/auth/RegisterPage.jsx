import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import AuthShell from '../../components/auth/AuthShell'
import AuthTextField from '../../components/auth/AuthTextField'
import { registerUser } from '../../services/authService'
import { validateRegisterForm } from '../../utils/authValidation'

const initialForm = {
  name: '',
  email: '',
  password: '',
  confirmPassword: '',
}

function RegisterPage() {
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
    const nextErrors = validateRegisterForm(form)
    setErrors(nextErrors)
    setApiError('')

    if (Object.keys(nextErrors).length > 0) return

    try {
      setIsSubmitting(true)
      await registerUser({
        name: form.name,
        email: form.email,
        password: form.password,
      })
      navigate('/dashboard', { replace: true })
    } catch (error) {
      setApiError(error.response?.data?.message || 'Registration failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <AuthShell
      eyebrow="New Operator"
      title="Create your environmental intelligence workspace."
      subtitle="Start a secure GREEN-WATCH AI profile for carbon scoring, pollution insights, waste intelligence, and realtime alerts."
    >
      <motion.form
        onSubmit={handleSubmit}
        initial={{ opacity: 0, x: 22 }}
        animate={{ opacity: 1, x: 0 }}
        transition={{ duration: 0.45 }}
        className="rounded-lg border border-emerald-300/20 bg-[#06100d]/86 p-5 shadow-[0_24px_80px_rgba(0,0,0,0.42)] backdrop-blur-xl sm:p-6"
      >
        <div className="mb-6">
          <p className="text-xs uppercase tracking-[0.2em] text-cyan-200">Join GREEN-WATCH</p>
          <h2 className="mt-2 text-2xl font-semibold text-white">Register</h2>
        </div>

        <div className="space-y-4">
          <AuthTextField
            label="Full Name"
            name="name"
            value={form.name}
            onChange={handleChange}
            error={errors.name}
            placeholder="Aarav Sharma"
            autoComplete="name"
          />
          <AuthTextField
            label="Email"
            name="email"
            type="email"
            value={form.email}
            onChange={handleChange}
            error={errors.email}
            placeholder="you@green-watch.ai"
            autoComplete="email"
          />
          <AuthTextField
            label="Password"
            name="password"
            type="password"
            value={form.password}
            onChange={handleChange}
            error={errors.password}
            placeholder="Minimum 6 characters"
            autoComplete="new-password"
          />
          <AuthTextField
            label="Confirm Password"
            name="confirmPassword"
            type="password"
            value={form.confirmPassword}
            onChange={handleChange}
            error={errors.confirmPassword}
            placeholder="Repeat your password"
            autoComplete="new-password"
          />
        </div>

        {apiError ? <p className="mt-4 rounded-lg border border-red-400/30 bg-red-500/10 px-3 py-2 text-sm text-red-200">{apiError}</p> : null}

        <button
          type="submit"
          disabled={isSubmitting}
          className="mt-6 w-full rounded-lg bg-emerald-300 px-4 py-3 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 disabled:cursor-not-allowed disabled:opacity-60"
        >
          {isSubmitting ? 'Creating account...' : 'Create account'}
        </button>

        <p className="mt-5 text-center text-sm text-slate-300">
          Already registered?{' '}
          <Link to="/login" className="font-semibold text-emerald-300 hover:text-cyan-200">
            Sign in
          </Link>
        </p>
      </motion.form>
    </AuthShell>
  )
}

export default RegisterPage
