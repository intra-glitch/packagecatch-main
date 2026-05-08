// Auth Feature — barrel export
// Pages
export { default as LandingPage }  from './LandingPage'
export { default as LoginPage }    from './LoginPage'
export { default as RegisterPage } from './RegisterPage'

// Context / Hooks
export { AuthProvider, useAuth }   from './AuthContext'

// Service (legacy REST — currently unused, replaced by Supabase directly in AuthContext)
export { authService }             from './authService'
