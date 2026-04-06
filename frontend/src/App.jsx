import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import PrivateRoute from './components/PrivateRoute';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Footer from './components/Footer';
import Navbar from './components/Navbar';
import Login from './pages/Login';
import Register from './pages/Register';
import AdminDashboard from './pages/admin/Dashboard';
import AdminProducts from './pages/admin/Products';
import AdminCategories from './pages/admin/Categories';
import AdminOrders from './pages/admin/Orders';
import AdminSuppliers from './pages/admin/Suppliers';
import AdminUsers from './pages/admin/Users';
import AdminProfile from './pages/admin/Profile';
import StaffProducts from './pages/staff/Products';
import StaffOrders from './pages/staff/Orders';
import StaffProfile from './pages/staff/Profile';
import UserProducts from './pages/user/Products';
import UserOrders from './pages/user/Orders';
import UserProfile from './pages/user/Profile';
import 'bootstrap/dist/css/bootstrap.min.css';

function AppLayout({ children }) {
  return (
    <div className="d-flex" style={{ minHeight: '100vh' }}>
      <Sidebar />
      <div className="d-flex flex-column flex-grow-1" style={{ background: '#f4f5f7' }}>
        <Header />
        <div className="flex-grow-1">{children}</div>
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
        <Routes>
          <Route path="/login"    element={<PublicLayout><Login /></PublicLayout>} />
          <Route path="/register" element={<PublicLayout><Register /></PublicLayout>} />

          {/* Admin routes */}
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
                </Routes>
              </AppLayout>
            </PrivateRoute>
          } />

          {/* Staff routes */}
          <Route path="/staff/*" element={
            <PrivateRoute role="staff">
              <AppLayout>
                <Routes>
                  <Route path="products" element={<StaffProducts />} />
                  <Route path="orders"   element={<StaffOrders />} />
                  <Route path="profile"  element={<StaffProfile />} />
                </Routes>
              </AppLayout>
            </PrivateRoute>
          } />

          {/* User routes */}
          <Route path="/user/*" element={
            <PrivateRoute role="user">
              <AppLayout>
                <Routes>
                  <Route path="products" element={<UserProducts />} />
                  <Route path="orders"   element={<UserOrders />} />
                  <Route path="profile"  element={<UserProfile />} />
                </Routes>
              </AppLayout>
            </PrivateRoute>
          } />

          <Route path="*" element={<Navigate to="/login" />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
