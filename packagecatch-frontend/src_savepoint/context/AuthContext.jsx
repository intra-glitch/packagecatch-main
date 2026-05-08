import { createContext, useContext, useState, useEffect } from 'react'
import { supabase } from '../api/supabaseClient'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        // Get initial session
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session) {
                setUser(session.user)
            }
            setLoading(false)
        })

        // Listen for auth changes (login, logout, token refresh, etc.)
        const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
            setUser(session?.user || null)
            setLoading(false)
        })

        return () => subscription.unsubscribe()
    }, [])

    const login = async (email, password) => {
        const { data, error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) throw new Error(error.message)
        return data.user
    }

    const register = async (email, password, additionalData = {}) => {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: {
                data: additionalData // This goes into user_metadata
            }
        })
        if (error) throw new Error(error.message)
        return data.user
    }

    const updateProfile = async (updates) => {
        // Update Supabase Auth user metadata
        const { data, error } = await supabase.auth.updateUser({
            data: updates
        })
        if (error) throw new Error(error.message)
        setUser(data.user)

        // Update profiles table
        const userId = data.user.id;
        const { error: dbError } = await supabase.from('profiles').update({
            full_name: updates.fullName,
            mobile_number: updates.phone,
            delivery_address: updates.address,
            landmark: updates.landmark,
            avatar: updates.avatar
        }).eq('id', userId);
        if (dbError) throw new Error(dbError.message);

        return data.user;
    }

    const updatePassword = async (newPassword) => {
        const { error } = await supabase.auth.updateUser({
            password: newPassword
        })
        if (error) throw new Error(error.message)
    }

    const logout = async () => {
        const { error } = await supabase.auth.signOut()
        if (error) throw new Error(error.message)
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{
            user,
            loading,
            login,
            register,
            logout,
            updateProfile,
            updatePassword,
            isLoggedIn: !!user,
            isAdmin: user?.user_metadata?.role === 'ADMIN',
        }}>
            {!loading && children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)