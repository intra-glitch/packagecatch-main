import api from './api'

const USE_MOCK = false // ← set to false when backend is running

const MOCK_ORDERS = [
    {
        id: 1001,
        status: 'SHIPPED',
        totalAmount: 369.98,
        shippingAddress: '123 Main St, Cebu City, PH',
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
            { quantity: 1, priceAtTime: 279.99, product: { id: 1, name: 'Sony WH-1000XM5 Headphones', imageUrl: 'https://images.unsplash.com/photo-1505740420928-5e560c06d30e?w=100&h=100&fit=crop' } },
            { quantity: 1, priceAtTime: 89.99,  product: { id: 2, name: 'Nike Air Max 270', imageUrl: 'https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=100&h=100&fit=crop' } },
        ],
    },
    {
        id: 1002,
        status: 'PENDING',
        totalAmount: 189.99,
        shippingAddress: '456 Cebu St, Mandaue, PH',
        createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
        items: [
            { quantity: 1, priceAtTime: 189.99, product: { id: 3, name: 'Apple AirPods Pro (2nd Gen)', imageUrl: 'https://images.unsplash.com/photo-1600294037681-c80b4cb5b434?w=100&h=100&fit=crop' } },
        ],
    },
]

export const orderService = {

    async getMyOrders() {
        if (USE_MOCK) return MOCK_ORDERS
        const res = await api.get('/orders/my')
        return res.data
    },

    async createOrder(orderData) {
        if (USE_MOCK) return { id: 'MOCK-' + Math.random().toString(36).substring(7) }
        const res = await api.post('/orders', orderData)
        window.dispatchEvent(new Event('ordersUpdated'));
        return res.data
    },

    async validateCoupon(code, total) {
        const res = await api.get(`/coupons/validate?code=${code}&total=${total}`);
        return res.data;
    },

    async cancelOrder(orderId) {
        if (USE_MOCK) return { id: orderId, status: 'cancelled' }
        const res = await api.patch(`/orders/${orderId}/cancel`)
        return res.data
    },

    async getAllOrders() {
        const res = await api.get('/orders');
        return res.data;
    },


    async updateOrderStatus(orderId, status) {
        const res = await api.put(`/orders/${orderId}/status`, { status });
        window.dispatchEvent(new Event('ordersUpdated'));
        return res.data;
    },

    getActiveCount(orders) {
        if (!orders) return 0;
        // Count orders that are not completed or cancelled
        return orders.filter(o => ['pending', 'packed', 'out_for_delivery'].includes(o.status)).length;
    }

}