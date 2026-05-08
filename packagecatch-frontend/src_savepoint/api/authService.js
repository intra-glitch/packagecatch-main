import api from './api'

export const authService = {

    async login(email, password) {
        const response = await api.post('/auth/login', { email, password })
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data))
        return response.data
    },

    async register(email, password, firstName, lastName) {
        const response = await api.post('/auth/register', {
            email,
            password,
            firstName,
            lastName,
        })
        localStorage.setItem('token', response.data.token)
        localStorage.setItem('user', JSON.stringify(response.data))
        return response.data
    },

    logout() {
        localStorage.removeItem('token')
        localStorage.removeItem('user')
    },

    getCurrentUser() {
        const user = localStorage.getItem('user')
        return user ? JSON.parse(user) : null
    },

    isLoggedIn() {
        return !!localStorage.getItem('token')
    },

    isAdmin() {
        const user = this.getCurrentUser()
        return user?.role === 'ADMIN'
    },

    async getEmailHint(fullName, phone = null) {
        const res = await api.post('/auth/recover/email-hint', { fullName, phone });
        return res.data;
    },

    async resetPassword(email, fullName, newPassword) {
        const res = await api.post('/auth/recover/password', { email, fullName, newPassword });
        return res.data;
    }
}