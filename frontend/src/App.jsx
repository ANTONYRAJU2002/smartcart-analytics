import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, AuthContext } from './context/AuthContext';
import { CartProvider } from './context/CartContext';
import { useContext } from 'react';
import Login from './pages/Login';
import Register from './pages/Register';
import Dashboard from './pages/Dashboard';
import StaffPortal from './pages/StaffPortal';
import StaffLanding from './pages/StaffLanding';
import Home from './pages/Home';
import ProductDetails from './pages/ProductDetails';
import CustomPC from './pages/CustomPC';

import Cart from './pages/Cart';
import Checkout from './pages/Checkout';
import OrderSuccess from './pages/OrderSuccess';
import Profile from './pages/Profile';
import Support from './pages/Support';
import Wishlist from './pages/Wishlist';
import Orders from './pages/Orders';
import ProductList from './pages/ProductList';
import AdminLayout from './components/AdminLayout';
import MainLayout from './components/MainLayout';
import AdminProductList from './pages/admin/AdminProductManagement';
import OrderList from './pages/admin/OrderList';
import UserList from './pages/admin/UserList';
import StaffManagement from './pages/admin/StaffManagement';
import OfflineSalesList from './pages/admin/OfflineSalesList';
import CustomerSegments from './pages/admin/CustomerSegments';
import ProductAssociations from './pages/admin/ProductAssociations';
import AdminSupport from './pages/admin/TicketManager';
import ReviewManager from './pages/admin/ReviewManager';
import AdminCSVUpload from './pages/admin/AdminCSVUpload';
import StaffTargetsManager from './pages/admin/StaffTargetsManager';
import DeliveryDashboard from './pages/DeliveryDashboard';

const PrivateRoute = ({ children, roles }) => {
  const { user, loading } = useContext(AuthContext);

  if (loading) return <div className="flex-center" style={{ height: '100vh' }}>Loading...</div>;

  if (!user) return <Navigate to="/login" />;

  if (roles && !roles.includes(user.role)) {
    return <div className="container"><h1>Unauthorized</h1></div>;
  }

  return children;
};

function App() {
  return (
    <Router>
      <AuthProvider>
        <CartProvider>
          <Routes>
            {/* Storefront Routes wrapped in MainLayout */}
            <Route element={<MainLayout />}>
              <Route path="/" element={<Home />} />
              <Route path="/products" element={<ProductList />} />
              <Route path="/products/:id" element={<ProductDetails />} />
              <Route path="/custom-pc" element={<CustomPC />} />
              <Route path="/cart" element={<Cart />} />
              <Route path="/checkout" element={<PrivateRoute roles={['customer', 'admin']}><Checkout /></PrivateRoute>} />
              <Route path="/order-success" element={<PrivateRoute roles={['customer', 'admin']}><OrderSuccess /></PrivateRoute>} />
              <Route path="/wishlist" element={<PrivateRoute roles={['customer', 'admin']}><Wishlist /></PrivateRoute>} />

              <Route
                path="/profile"
                element={
                  <PrivateRoute roles={['customer', 'admin']}>
                    <Profile />
                  </PrivateRoute>
                }
              />
              <Route
                path="/support"
                element={
                  <PrivateRoute roles={['customer', 'admin']}>
                    <Support />
                  </PrivateRoute>
                }
              />
              <Route
                path="/orders"
                element={
                  <PrivateRoute roles={['customer', 'admin']}>
                    <Orders />
                  </PrivateRoute>
                }
              />
            </Route>

            {/* Auth Routes - Standalone */}
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/portal" element={<StaffLanding />} />

            {/* Admin Routes */}
            <Route
              path="/admin"
              element={
                <PrivateRoute roles={['admin']}>
                  <AdminLayout />
                </PrivateRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="products" element={<AdminProductList />} />
              <Route path="orders" element={<OrderList />} />
              <Route path="users" element={<UserList />} />
              <Route path="staff-management" element={<StaffManagement />} />
              <Route path="staff" element={<StaffManagement />} />
              <Route path="targets" element={<StaffTargetsManager />} />
              <Route path="offline" element={<OfflineSalesList />} />
              <Route path="segments" element={<CustomerSegments />} />
              <Route path="associations" element={<ProductAssociations />} />
              <Route path="reviews" element={<ReviewManager />} />
              <Route path="support" element={<AdminSupport />} />
              <Route path="analytics" element={<Dashboard />} />
              <Route path="live-analytics" element={<Dashboard />} />
              <Route path="upload" element={<AdminCSVUpload />} />
            </Route>

            {/* Staff Routes */}
            <Route
              path="/staff"
              element={
                <PrivateRoute roles={['staff', 'admin']}>
                  <StaffPortal />
                </PrivateRoute>
              }
            />
            <Route
              path="/delivery"
              element={
                <PrivateRoute roles={['delivery_agent', 'admin']}>
                  <DeliveryDashboard />
                </PrivateRoute>
              }
            />
          </Routes>
        </CartProvider>
      </AuthProvider>
    </Router>
  );
}

export default App;
