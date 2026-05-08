import api from './api';

export const couponService = {
    async getAll() {
        const res = await api.get('/coupons');
        return res.data;
    },

    async create(couponData) {
        const res = await api.post('/coupons', couponData);
        return res.data;
    },

    async delete(id) {
        const res = await api.delete(`/coupons/${id}`);
        return res.data;
    }
};
