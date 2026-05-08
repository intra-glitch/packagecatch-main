import api from './api';

export const productService = {
    async getAll(status = null) {
        let url = '/products';
        if (status) {
            url += `?status=${status}`;
        }
        const res = await api.get(url);
        // Transform the backend response if needed, but we can just use the backend data
        return res.data.map(row => ({
            id: row.id,
            name: row.name,
            description: row.description,
            price: Number(row.price),
            originalPrice: row.original_price ? Number(row.original_price) : null,
            images: row.images || (row.image_url ? [row.image_url] : []),
            imageUrl: row.images && row.images.length > 0 ? row.images[0] : row.image_url,
            category: row.category,
            tag: row.tag,
            stockQuantity: row.stock_quantity,
            bg: row.bg_color,
            active: row.active,
            status: row.status || 'active',
            condition: row.condition || 'New'
        }));
    },

    async getById(id) {
        const res = await api.get(`/products/${id}`);
        const row = res.data;
        return {
            id: row.id,
            name: row.name,
            description: row.description,
            price: Number(row.price),
            originalPrice: row.original_price ? Number(row.original_price) : null,
            images: row.images || (row.image_url ? [row.image_url] : []),
            imageUrl: row.images && row.images.length > 0 ? row.images[0] : row.image_url,
            category: row.category,
            tag: row.tag,
            stockQuantity: row.stock_quantity,
            bg: row.bg_color,
            active: row.active,
            status: row.status || 'active',
            condition: row.condition || 'New'
        };
    },

    async create(productData) {
        const payload = {
            name: productData.name,
            description: productData.description,
            price: productData.price,
            original_price: productData.originalPrice,
            category: productData.category,
            tag: productData.tag,
            stock_quantity: productData.stockQuantity,
            bg_color: productData.bg,
            images: productData.images || [],
            image_url: productData.images && productData.images.length > 0 ? productData.images[0] : '',
            status: productData.status || 'active',
            condition: productData.condition || 'New'
        };

        const res = await api.post('/products', payload);
        return res.data;
    },

    async update(id, productData) {
        const payload = {
            name: productData.name,
            description: productData.description,
            price: productData.price,
            original_price: productData.originalPrice,
            category: productData.category,
            tag: productData.tag,
            stock_quantity: productData.stockQuantity,
            bg_color: productData.bg,
            images: productData.images || [],
            image_url: productData.images && productData.images.length > 0 ? productData.images[0] : '',
            status: productData.status || 'active',
            condition: productData.condition || 'New'
        };

        const res = await api.put(`/products/${id}`, payload);
        return res.data;
    },

    async delete(id) {
        await api.delete(`/products/${id}`);
    },

    async getReviews(productId) {
        const res = await api.get(`/products/${productId}/reviews`);
        return res.data;
    },

    async addReview(productId, reviewData) {
        const res = await api.post(`/products/${productId}/reviews`, reviewData);
        return res.data;
    },

    async deleteReview(productId, reviewId) {
        await api.delete(`/products/${productId}/reviews/${reviewId}`);
    },

    async replyToReview(productId, reviewId, comment, replyToName = null) {
        const res = await api.post(`/products/${productId}/reviews/${reviewId}/replies`, { 
            comment, 
            reply_to_name: replyToName 
        });
        return res.data;
    }
};