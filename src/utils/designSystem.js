// EcoSphere AI Design System

export const colors = {
  primary: {
    neon: '#00ff88',
    green: '#10b981',
    dark: '#064e3b',
    light: '#d1fae5',
  },
  secondary: {
    cyan: '#06b6d4',
    blue: '#3b82f6',
    purple: '#8b5cf6',
  },
  dark: {
    bg: '#0a0e1a',
    card: '#0f172a',
    border: '#1e293b',
  },
  glass: {
    bg: 'rgba(15, 23, 42, 0.7)',
    border: 'rgba(16, 185, 129, 0.2)',
  },
};

export const shadows = {
  glow: '0 0 20px rgba(0, 255, 136, 0.3)',
  glowHover: '0 0 30px rgba(0, 255, 136, 0.5)',
  card: '0 8px 32px rgba(0, 0, 0, 0.3)',
};

export const animations = {
  fadeIn: {
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.5 },
  },
  slideIn: {
    initial: { opacity: 0, x: -50 },
    animate: { opacity: 1, x: 0 },
    transition: { duration: 0.6, ease: 'easeOut' },
  },
  scaleIn: {
    initial: { opacity: 0, scale: 0.8 },
    animate: { opacity: 1, scale: 1 },
    transition: { duration: 0.4, ease: 'easeOut' },
  },
};

export const spacing = {
  xs: '0.5rem',    // 8px
  sm: '0.75rem',   // 12px
  md: '1rem',      // 16px
  lg: '1.5rem',    // 24px
  xl: '2rem',      // 32px
  '2xl': '3rem',   // 48px
  '3xl': '4rem',   // 64px
};

export const typography = {
  fontFamily: {
    primary: "'Inter', -apple-system, sans-serif",
    mono: "'Fira Code', monospace",
  },
  fontSize: {
    xs: '0.75rem',
    sm: '0.875rem',
    base: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
  },
};
