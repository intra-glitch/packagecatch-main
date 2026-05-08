import api from './api';

export const adminService = {
    async getStats() {
        const res = await api.get('/admin/stats');
        return res.data;
    },
    
    async getActivity() {
        const res = await api.get('/admin/activity');
        return res.data;
    },

    async getUsers() {
        const res = await api.get('/admin/users');
        return res.data;
    },

    async updateUserRole(id, role) {
        const res = await api.patch(`/admin/users/${id}/role`, { role });
        return res.data;
    },

    async updateUserStatus(id, status) {
        const res = await api.patch(`/admin/users/${id}/status`, { status });
        return res.data;
    },

    async getReviews() {
        const res = await api.get('/admin/reviews');
        return res.data;
    }
};
