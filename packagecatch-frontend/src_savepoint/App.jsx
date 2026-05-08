import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'

// ── Auth Feature ──────────────────────────────────────────────
import LandingPage       from './features/auth/LandingPage'
import LoginPage         from './features/auth/LoginPage'
import RegisterPage      from './features/auth/RegisterPage'
import AccountRecoveryPage from './features/auth/AccountRecoveryPage'
import { AuthProvider, useAuth } from './features/auth/AuthContext'

// ── Products Feature ──────────────────────────────────────────
import HomePage          from './features/products/HomePage'
import ProductDetailPage from './features/products/ProductDetailPage'

// ── Cart Feature ──────────────────────────────────────────────
import CartPage          from './features/cart/CartPage'

// ── Checkout Feature ──────────────────────────────────────────
import CheckoutPage      from './features/checkout/CheckoutPage'

// ── Orders Feature ────────────────────────────────────────────
import TrackOrderPage    from './features/orders/TrackOrderPage'

// ── Wishlist Feature ──────────────────────────────────────────
import WishlistPage      from './features/wishlist/WishlistPage'

// ── Profile Feature ───────────────────────────────────────────
import ProfilePage       from './features/profile/ProfilePage'

// ── Admin Feature ─────────────────────────────────────────────
import AdminDashboard    from './features/admin/AdminDashboard'
import ProductDraftPage  from './features/admin/ProductDraftPage'
import AddProductPage    from './features/admin/AddProductPage'
import AdminUserProfilePage from './features/admin/AdminUserProfilePage'

// ── Route Guards ──────────────────────────────────────────────

// Redirects to /login if not logged in
function ProtectedRoute({ children }) {
    const { isLoggedIn } = useAuth()
    if (!isLoggedIn) return <Navigate to="/login" replace />
    return children
}

// Redirects to / if not an admin
function AdminRoute({ children }) {
    const { isLoggedIn, isAdmin } = useAuth()
    if (!isLoggedIn) return <Navigate to="/login" replace />
    if (!isAdmin)    return <Navigate to="/"      replace />
    return children
}

// ── App ───────────────────────────────────────────────────────

function App() {
    return (
        <AuthProvider>
            <BrowserRouter>
                <Routes>

                    {/* ── Public routes ── */}
                    <Route path="/"          element={<LandingPage />} />
                    <Route path="/login"     element={<LoginPage />} />
                    <Route path="/register"  element={<RegisterPage />} />
                    <Route path="/recover"   element={<AccountRecoveryPage />} />
                    <Route path="/home"      element={<HomePage />} />
                    <Route path="/product/:id" element={<ProductDetailPage />} />

                    {/* ── Customer routes (login required) ── */}
                    <Route path="/cart" element={
                        <ProtectedRoute><CartPage /></ProtectedRoute>
                    } />
                    <Route path="/checkout" element={
                        <ProtectedRoute><CheckoutPage /></ProtectedRoute>
                    } />
                    <Route path="/profile" element={
                        <ProtectedRoute><ProfilePage /></ProtectedRoute>
                    } />
                    <Route path="/wishlist" element={
                        <ProtectedRoute><WishlistPage /></ProtectedRoute>
                    } />
                    <Route path="/orders/track" element={
                        <ProtectedRoute><TrackOrderPage /></ProtectedRoute>
                    } />

                    {/* ── Admin routes (admin role required) ── */}
                    <Route path="/admin" element={
                        <AdminRoute><AdminDashboard /></AdminRoute>
                    } />
                    <Route path="/admin/drafts" element={
                        <AdminRoute><ProductDraftPage /></AdminRoute>
                    } />
                    <Route path="/admin/products/new" element={
                        <AdminRoute><AddProductPage /></AdminRoute>
                    } />
                    <Route path="/admin/products/edit/:id" element={
                        <AdminRoute><AddProductPage /></AdminRoute>
                    } />
                    <Route path="/admin/user/:id" element={
                        <AdminRoute><AdminUserProfilePage /></AdminRoute>
                    } />

                    {/* ── Catch-all: redirect unknown URLs to home ── */}
                    <Route path="*" element={<Navigate to="/" replace />} />

                </Routes>
            </BrowserRouter>
        </AuthProvider>
    )
}

export default App