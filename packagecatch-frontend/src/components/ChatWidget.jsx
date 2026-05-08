import React, { useState, useEffect, useRef } from 'react';
import io from 'socket.io-client';
import { MessageSquare, X, Send } from 'lucide-react';
import { useAuth } from '../features/auth/AuthContext';
import { chatService } from '../api/chatService';

const ChatWidget = () => {
    const { user, isAdmin } = useAuth();
    const [isOpen, setIsOpen] = useState(false);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState('');
    const socketRef = useRef();
    const scrollRef = useRef();

    useEffect(() => {
        if (!user) return;

        socketRef.current = io(import.meta.env.VITE_API_URL || 'http://localhost:8080');
        socketRef.current.emit('join_room', user.id);

        loadMessages();

        const handleMsg = (msg) => {
            setMessages(prev => {
                const exists = prev.find(m => m.id === msg.id);
                return exists ? prev : [...prev, msg];
            });
        };

        socketRef.current.on('receive_message', handleMsg);

        return () => {
            socketRef.current.off('receive_message', handleMsg);
            socketRef.current.disconnect();
        };
    }, [user]);

    useEffect(() => {
        if (scrollRef.current) {
            scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
        }
    }, [messages, isOpen]);

    const loadMessages = async () => {
        try {
            const data = await chatService.getMessages('me');
            setMessages(data);
        } catch (e) {
            console.error('Failed to load chat', e);
        }
    };

    const handleSend = async () => {
        if (!newMessage.trim() || !user) return;
        const msgData = {
            user_id: user.id,
            text: newMessage,
            is_from_admin: false
        };
        await chatService.sendMessage(msgData);
        setNewMessage('');
    };

    if (!user || isAdmin) return null;

    return (
        <div style={{ position: 'fixed', bottom: '30px', right: '30px', zIndex: 1000 }}>
            {/* Chat Window */}
            {isOpen && (
                <div style={{ 
                    position: 'absolute', bottom: '80px', right: 0, 
                    width: '350px', height: '500px', 
                    background: '#fff', borderRadius: '24px', 
                    boxShadow: '0 10px 40px rgba(0,0,0,0.15)',
                    display: 'flex', flexDirection: 'column', overflow: 'hidden',
                    border: '1px solid #f0f0f0'
                }}>
                    <div style={{ padding: '20px', background: '#111', color: '#fff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '8px', height: '8px', background: '#2a9d8f', borderRadius: '50%' }} />
                            <span style={{ fontWeight: '800', fontSize: '14px' }}>PackageCatch Support</span>
                        </div>
                        <X size={20} style={{ cursor: 'pointer' }} onClick={() => setIsOpen(false)} />
                    </div>

                    <div ref={scrollRef} style={{ flex: 1, padding: '20px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '16px', background: '#fafafa' }} className="custom-scroll">
                        {messages.length === 0 ? (
                            <div style={{ textAlign: 'center', padding: '40px', color: '#bbb', fontSize: '12px' }}>
                                👋 Hi! How can we help you today?
                            </div>
                        ) : messages.map((msg, i) => {
                            const isMe = msg.is_from_admin === false || msg.is_from_admin === 0;
                            return (
                                <div key={i} style={{ 
                                    display: 'flex',
                                    flexDirection: 'column',
                                    alignItems: isMe ? 'flex-end' : 'flex-start',
                                    width: '100%'
                                }}>
                                    <div style={{ 
                                        maxWidth: '85%',
                                        padding: '12px 16px',
                                        borderRadius: isMe ? '20px 20px 4px 20px' : '20px 20px 20px 4px',
                                        background: isMe ? '#111' : '#fff',
                                        color: isMe ? '#fff' : '#111',
                                        fontSize: '13px',
                                        fontWeight: '600',
                                        boxShadow: '0 2px 10px rgba(0,0,0,0.02)',
                                        border: isMe ? 'none' : '1px solid #eee',
                                        lineHeight: '1.5'
                                    }}>
                                        {msg.text}
                                    </div>
                                    <div style={{ fontSize: '9px', color: '#bbb', marginTop: '4px', fontWeight: '700' }}>
                                        {new Date(msg.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                    </div>
                                </div>
                            );
                        })}
                    </div>

                    <div style={{ padding: '20px', background: '#fff', borderTop: '1px solid #f0f0f0' }}>
                        <div style={{ display: 'flex', gap: '10px' }}>
                            <input 
                                placeholder="Message support..." 
                                value={newMessage}
                                onChange={e => setNewMessage(e.target.value)}
                                onKeyPress={e => e.key === 'Enter' && handleSend()}
                                style={{ flex: 1, padding: '12px 16px', borderRadius: '12px', border: '1.5px solid #eee', outline: 'none', fontSize: '13px' }}
                            />
                            <button 
                                onClick={handleSend}
                                style={{ width: '45px', height: '45px', borderRadius: '12px', background: '#111', color: '#fff', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                            >
                                <Send size={18} />
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Toggle Button */}
            <button 
                onClick={() => setIsOpen(!isOpen)}
                style={{ 
                    width: '60px', height: '60px', 
                    borderRadius: '50%', background: '#111', 
                    color: '#fff', border: 'none', 
                    boxShadow: '0 10px 30px rgba(0,0,0,0.2)',
                    cursor: 'pointer', display: 'flex', 
                    alignItems: 'center', justifyContent: 'center',
                    transition: 'transform 0.2s'
                }}
                onMouseOver={e => e.currentTarget.style.transform = 'scale(1.1)'}
                onMouseOut={e => e.currentTarget.style.transform = 'scale(1)'}
            >
                {isOpen ? <X size={24} /> : <MessageSquare size={24} />}
            </button>
        </div>
    );
};

export default ChatWidget;
