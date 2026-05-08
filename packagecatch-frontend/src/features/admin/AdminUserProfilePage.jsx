import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { adminService } from '../../api/adminService';

const AdminUserProfilePage = () => {
    const { id } = useParams();
    const navigate = useNavigate();
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        // Fetch all users and find the one (since we don't have a single user endpoint yet)
        adminService.getUsers().then(users => {
            const foundUser = users.find(u => u.email === id || u.id === id); // id could be email or UUID based on how we pass it
            setUser(foundUser);
            setLoading(false);
        }).catch(err => {
            console.error(err);
            setLoading(false);
        });
    }, [id]);

    if (loading) return <div style={{ padding: '40px', textAlign: 'center' }}>Loading user profile...</div>;

    if (!user) return <div style={{ padding: '40px', textAlign: 'center' }}>User not found.</div>;

    return (
        <div style={{ padding: '40px', maxWidth: '800px', margin: '0 auto' }}>
            <button onClick={() => navigate(-1)} style={{ marginBottom: '20px', padding: '8px 16px', background: '#e4e6eb', border: 'none', borderRadius: '6px', cursor: 'pointer', fontWeight: '600' }}>
                ← Back
            </button>
            <div style={{ background: '#fff', padding: '32px', borderRadius: '12px', border: '1px solid #e0e0e0', display: 'flex', gap: '24px', alignItems: 'center' }}>
                <div style={{ width: '100px', height: '100px', borderRadius: '50%', background: '#111', color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '36px', fontWeight: '700' }}>
                    {(user.full_name || user.email || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                    <h1 style={{ margin: '0 0 8px 0', fontSize: '24px' }}>{user.full_name || 'No Name Provided'}</h1>
                    <div style={{ fontSize: '15px', color: '#65676B', marginBottom: '4px' }}><strong>Email:</strong> {user.email}</div>
                    <div style={{ fontSize: '15px', color: '#65676B', marginBottom: '4px' }}><strong>Phone:</strong> {user.phone || 'N/A'}</div>
                    <div style={{ fontSize: '15px', color: '#65676B', marginBottom: '4px' }}><strong>Role:</strong> {user.role}</div>
                    <div style={{ fontSize: '15px', color: '#65676B', marginBottom: '4px' }}><strong>Joined:</strong> {new Date(user.created_at).toLocaleDateString()}</div>
                </div>
            </div>
        </div>
    );
};

export default AdminUserProfilePage;
