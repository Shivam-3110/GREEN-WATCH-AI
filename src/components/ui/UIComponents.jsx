import { motion } from 'framer-motion';

// Glass Card Component
export function GlassCard({ children, className = '', hover = true, ...props }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      whileHover={hover ? { y: -4, boxShadow: '0 0 30px rgba(0, 255, 136, 0.3)' } : {}}
      className={`
        bg-gradient-to-br from-slate-900/70 to-slate-800/70 
        backdrop-blur-xl 
        border border-emerald-500/20 
        rounded-2xl 
        shadow-xl shadow-black/20
        transition-all duration-300
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.div>
  );
}

// Neon Button Component
export function NeonButton({ children, variant = 'primary', className = '', ...props }) {
  const variants = {
    primary: 'bg-gradient-to-r from-emerald-500 to-cyan-500 hover:from-emerald-400 hover:to-cyan-400 shadow-[0_0_20px_rgba(16,185,129,0.5)] hover:shadow-[0_0_30px_rgba(16,185,129,0.7)]',
    secondary: 'bg-gradient-to-r from-cyan-500 to-blue-500 hover:from-cyan-400 hover:to-blue-400 shadow-[0_0_20px_rgba(6,182,212,0.5)] hover:shadow-[0_0_30px_rgba(6,182,212,0.7)]',
    outline: 'border-2 border-emerald-500 text-emerald-400 hover:bg-emerald-500/10 hover:shadow-[0_0_20px_rgba(16,185,129,0.3)]',
  };

  return (
    <motion.button
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      className={`
        px-6 py-3 
        rounded-xl 
        font-semibold 
        text-white 
        transition-all duration-300
        ${variants[variant]}
        ${className}
      `}
      {...props}
    >
      {children}
    </motion.button>
  );
}

// Loading Skeleton
export function Skeleton({ className = '', variant = 'rect' }) {
  const variants = {
    rect: 'rounded-lg',
    circle: 'rounded-full',
    text: 'rounded h-4',
  };

  return (
    <div className={`animate-pulse bg-gradient-to-r from-slate-700/50 to-slate-600/50 ${variants[variant]} ${className}`} />
  );
}

// Stat Card
export function StatCard({ icon, label, value, trend, className = '' }) {
  return (
    <GlassCard className={`p-6 ${className}`}>
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className="text-sm text-gray-400 mb-1">{label}</p>
          <p className="text-3xl font-bold text-white mb-2">{value}</p>
          {trend && (
            <span className={`text-sm font-medium ${trend > 0 ? 'text-emerald-400' : 'text-red-400'}`}>
              {trend > 0 ? '↑' : '↓'} {Math.abs(trend)}%
            </span>
          )}
        </div>
        <div className="text-4xl">{icon}</div>
      </div>
    </GlassCard>
  );
}

// Progress Bar with Glow
export function NeonProgress({ value, max = 100, className = '' }) {
  const percentage = (value / max) * 100;

  return (
    <div className={`relative h-3 bg-slate-800/50 rounded-full overflow-hidden ${className}`}>
      <motion.div
        initial={{ width: 0 }}
        animate={{ width: `${percentage}%` }}
        transition={{ duration: 1, ease: 'easeOut' }}
        className="absolute inset-y-0 left-0 bg-gradient-to-r from-emerald-500 to-cyan-500 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.5)]"
      />
      <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent animate-shimmer" />
    </div>
  );
}

// Badge Component
export function Badge({ children, variant = 'success', className = '' }) {
  const variants = {
    success: 'bg-emerald-500/20 text-emerald-400 border-emerald-500/30',
    warning: 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
    danger: 'bg-red-500/20 text-red-400 border-red-500/30',
    info: 'bg-cyan-500/20 text-cyan-400 border-cyan-500/30',
  };

  return (
    <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-semibold border ${variants[variant]} ${className}`}>
      {children}
    </span>
  );
}

// Icon Button
export function IconButton({ icon, className = '', ...props }) {
  return (
    <motion.button
      whileHover={{ scale: 1.1, boxShadow: '0 0 20px rgba(16, 185, 129, 0.4)' }}
      whileTap={{ scale: 0.9 }}
      className={`
        p-3 
        rounded-xl 
        bg-slate-800/50 
        border border-emerald-500/20 
        text-emerald-400 
        hover:bg-emerald-500/10 
        transition-all duration-300
        ${className}
      `}
      {...props}
    >
      {icon}
    </motion.button>
  );
}

// Section Header
export function SectionHeader({ title, subtitle, action }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: -20 }}
      animate={{ opacity: 1, y: 0 }}
      className="flex items-center justify-between mb-6"
    >
      <div>
        <h2 className="text-2xl font-bold text-white mb-1 bg-gradient-to-r from-emerald-400 to-cyan-400 bg-clip-text text-transparent">
          {title}
        </h2>
        {subtitle && <p className="text-sm text-gray-400">{subtitle}</p>}
      </div>
      {action && <div>{action}</div>}
    </motion.div>
  );
}

// Input with Neon Effect
export function NeonInput({ label, icon, className = '', ...props }) {
  return (
    <div className={className}>
      {label && <label className="block text-sm font-medium text-gray-300 mb-2">{label}</label>}
      <div className="relative">
        {icon && (
          <div className="absolute left-4 top-1/2 -translate-y-1/2 text-emerald-400">
            {icon}
          </div>
        )}
        <input
          className={`
            w-full 
            bg-slate-800/50 
            border border-emerald-500/20 
            rounded-xl 
            px-4 py-3 
            text-white 
            placeholder-gray-500
            focus:outline-none 
            focus:border-emerald-500/50 
            focus:ring-2 
            focus:ring-emerald-500/20
            transition-all duration-300
            ${icon ? 'pl-12' : ''}
          `}
          {...props}
        />
      </div>
    </div>
  );
}

// Tooltip
export function Tooltip({ children, content, position = 'top' }) {
  return (
    <div className="relative group">
      {children}
      <div className={`
        absolute z-50 
        px-3 py-2 
        text-xs 
        bg-slate-900 
        text-white 
        rounded-lg 
        border border-emerald-500/30
        shadow-xl
        opacity-0 
        group-hover:opacity-100 
        transition-opacity duration-300
        pointer-events-none
        whitespace-nowrap
        ${position === 'top' ? 'bottom-full left-1/2 -translate-x-1/2 mb-2' : ''}
        ${position === 'bottom' ? 'top-full left-1/2 -translate-x-1/2 mt-2' : ''}
      `}>
        {content}
        <div className={`
          absolute w-2 h-2 bg-slate-900 border-emerald-500/30 rotate-45
          ${position === 'top' ? 'border-b border-r -bottom-1 left-1/2 -translate-x-1/2' : ''}
          ${position === 'bottom' ? 'border-t border-l -top-1 left-1/2 -translate-x-1/2' : ''}
        `} />
      </div>
    </div>
  );
}

// Loading Spinner
export function LoadingSpinner({ size = 'md' }) {
  const sizes = {
    sm: 'w-6 h-6',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
  };

  return (
    <div className={`${sizes[size]} relative`}>
      <div className="absolute inset-0 rounded-full border-4 border-emerald-500/20" />
      <div className="absolute inset-0 rounded-full border-4 border-transparent border-t-emerald-500 animate-spin" />
    </div>
  );
}

// Alert Component
export function Alert({ type = 'info', title, message, onClose }) {
  const types = {
    success: { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', icon: '✓' },
    error: { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', icon: '✕' },
    warning: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/30', text: 'text-yellow-400', icon: '⚠' },
    info: { bg: 'bg-cyan-500/10', border: 'border-cyan-500/30', text: 'text-cyan-400', icon: 'ℹ' },
  };

  const style = types[type];

  return (
    <motion.div
      initial={{ opacity: 0, x: 100 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 100 }}
      className={`${style.bg} border ${style.border} rounded-xl p-4 flex items-start gap-3`}
    >
      <span className={`text-2xl ${style.text}`}>{style.icon}</span>
      <div className="flex-1">
        {title && <h4 className={`font-semibold ${style.text} mb-1`}>{title}</h4>}
        <p className="text-sm text-gray-300">{message}</p>
      </div>
      {onClose && (
        <button onClick={onClose} className="text-gray-400 hover:text-white transition">
          ✕
        </button>
      )}
    </motion.div>
  );
}
