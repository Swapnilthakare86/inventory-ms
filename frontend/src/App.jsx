import { lazy, Suspense } from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import 'bootstrap/dist/css/bootstrap.min.css';

const Login           = lazy(() => import('./pages/Login'));
const Register        = lazy(() => import('./pages/Register'));
const ForgotPassword  = lazy(() => import('./pages/ForgotPassword'));
const ResetPassword   = lazy(() => import('./pages/ResetPassword'));
const AdminDashboard  = lazy(() => import('./pages/admin/Dashboard'));
const AdminProducts   = lazy(() => import('./pages/admin/Products'));
const AdminCategories = lazy(() => import('./pages/admin/Categories'));
const AdminOrders     = lazy(() => import('./pages/admin/Orders'));
const AdminSuppliers  = lazy(() => import('./pages/admin/Suppliers'));
const AdminUsers      = lazy(() => import('./pages/admin/Users'));
const AdminProfile    = lazy(() => import('./pages/admin/Profile'));
const StaffDashboard  = lazy(() => import('./pages/staff/Dashboard'));
const StaffProducts   = lazy(() => import('./pages/staff/Products'));
const StaffOrders     = lazy(() => import('./pages/staff/Orders'));
const StaffProfile    = lazy(() => import('./pages/staff/Profile'));
const UserProducts    = lazy(() => import('./pages/user/Products'));
const UserOrders      = lazy(() => import('./pages/user/Orders'));
const UserProfile     = lazy(() => import('./pages/user/Profile'));

const Loader = () => (
  <div className="d-flex justify-content-center align-items-center" style={{ minHeight: '60vh' }}>
    <div className="spinner-border text-primary" role="status">
      <span className="visually-hidden">Loading...</span>
    </div>
  </div>
);

const NotFound = () => (
  <div className="d-flex flex-column align-items-center justify-content-center" style={{ minHeight: '60vh' }}>
    <h1 className="fw-bold text-muted" style={{ fontSize: 80 }}>404</h1>
    <p className="text-muted">Page not found.</p>
    <a href="/login" className="btn btn-primary btn-sm">Go to Login</a>
  </div>
);

function AppLayout({ children }) {
  return (
    <div className="app-shell d-flex" style={{ minHeight: '100vh' }}>
      <Sidebar />
      <div className="app-shell__main d-flex flex-column flex-grow-1" style={{ background: '#f4f5f7' }}>
        <Header />
        <div className="app-shell__content flex-grow-1" style={{ overflowY: 'auto' }}>{children}</div>
        <Footer />
      </div>
    </div>
  );
}

function PublicLayout({ children }) {
  return (
    <div className="d-flex flex-column" style={{ minHeight: '100vh', background: '#f4f5f7' }}>
      <Navbar />
      <main className="d-flex flex-column flex-grow-1">{children}</main>
      <Footer />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Suspense fallback={<Loader />}>
          <Routes>
            <Route path="/login"          element={<PublicLayout><Login /></PublicLayout>} />
            <Route path="/register"        element={<PublicLayout><Register /></PublicLayout>} />
            <Route path="/forgot-password" element={<PublicLayout><ForgotPassword /></PublicLayout>} />
            <Route path="/reset-password/:token" element={<PublicLayout><ResetPassword /></PublicLayout>} />

            <Route path="/admin/*" element={
              <PrivateRoute role="admin">
                <AppLayout>
                  <Routes>
                    <Route path="dashboard"  element={<AdminDashboard />} />
                    <Route path="products"   element={<AdminProducts />} />
                    <Route path="categories" element={<AdminCategories />} />
                    <Route path="orders"     element={<AdminOrders />} />
                    <Route path="suppliers"  element={<AdminSuppliers />} />
                    <Route path="users"      element={<AdminUsers />} />
                    <Route path="profile"    element={<AdminProfile />} />
                    <Route path="*"          element={<NotFound />} />
                  </Routes>
                </AppLayout>
              </PrivateRoute>
            } />

            <Route path="/staff/*" element={
              <PrivateRoute role="staff">
                <AppLayout>
                  <Routes>
                    <Route path="dashboard" element={<StaffDashboard />} />
                    <Route path="products"  element={<StaffProducts />} />
                    <Route path="orders"    element={<StaffOrders />} />
                    <Route path="profile"   element={<StaffProfile />} />
                    <Route path="*"         element={<NotFound />} />
                  </Routes>
                </AppLayout>
              </PrivateRoute>
            } />

            <Route path="/user/*" element={
              <PrivateRoute role="user">
                <AppLayout>
                  <Routes>
                    <Route path="products" element={<UserProducts />} />
                    <Route path="orders"   element={<UserOrders />} />
                    <Route path="profile"  element={<UserProfile />} />
                    <Route path="*"        element={<NotFound />} />
                  </Routes>
                </AppLayout>
              </PrivateRoute>
            } />

            <Route path="404" element={<NotFound />} />
            <Route path="*"   element={<Navigate to="/login" />} />
          </Routes>
        </Suspense>
      </BrowserRouter>
    </AuthProvider>
  );
}
