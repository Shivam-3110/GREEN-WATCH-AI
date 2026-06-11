function AuthTextField({ label, error, ...props }) {
  return (
    <label className="block">
      <span className="text-sm font-medium text-slate-200">{label}</span>
      <input
        {...props}
        className={`mt-2 w-full rounded-lg border bg-[#08130f]/90 px-4 py-3 text-sm text-white outline-none transition placeholder:text-slate-500 focus:border-emerald-300 focus:ring-2 focus:ring-emerald-300/20 ${
          error ? 'border-red-400/70' : 'border-cyan-200/16'
        }`}
      />
      {error ? <span className="mt-1 block text-xs text-red-300">{error}</span> : null}
    </label>
  )
}

export default AuthTextField
