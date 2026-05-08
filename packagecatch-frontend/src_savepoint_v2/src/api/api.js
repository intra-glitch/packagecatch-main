import axios from 'axios'

const api = axios.create({
    baseURL: 'http://localhost:8080/api',
    headers: {
        'Content-Type': 'application/json',
    },
})

import { supabase } from '../shared/supabaseClient'

// Attach JWT token to every request automatically
api.interceptors.request.use(async (config) => {
    const { data: { session } } = await supabase.auth.getSession();
    if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
    }
    return config;
})

// Auto-logout on 401 Unauthorized
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response?.status === 401) {
            supabase.auth.signOut();
            window.location.href = '/login'
        }
        return Promise.reject(error)
    }
)

export default api