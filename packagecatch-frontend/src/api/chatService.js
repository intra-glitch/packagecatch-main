import api from './api';

export const chatService = {
    async getConversations() {
        const res = await api.get('/chat/admin/conversations');
        return res.data;
    },
    
    async getMessages(userId) {
        const res = await api.get(`/chat/${userId}`);
        return res.data;
    },

    async sendMessage(data) {
        const res = await api.post('/chat', data);
        return res.data;
    }
};
