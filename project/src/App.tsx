import { useEffect } from 'react';
import { AuthProvider, useAuth } from '@/context/AuthContext';
import { CartProvider } from '@/context/CartContext';
import { RouterProvider, useRouter } from '@/context/RouterContext';
import { Navbar } from '@/components/Navbar';
import { LoginPage } from '@/pages/LoginPage';
import { AdminLoginPage } from '@/pages/AdminLoginPage';
import { RegisterPage } from '@/pages/RegisterPage';
import { ForgotPasswordPage } from '@/pages/ForgotPasswordPage';
import { UserDashboard } from '@/pages/UserDashboard';
import { PizzaBuilderPage } from '@/pages/PizzaBuilderPage';
import { CartPage } from '@/pages/CartPage';
import { UserOrdersPage } from '@/pages/UserOrdersPage';
import { AdminDashboard } from '@/pages/admin/AdminDashboard';
import { AdminInventoryPage } from '@/pages/admin/AdminInventoryPage';
import { AdminOrdersPage } from '@/pages/admin/AdminOrdersPage';
import { Loader2 } from 'lucide-react';

function AppRoutes() {
  const { user, loading, isAdmin } = useAuth();
  const { path, navigate } = useRouter();

  useEffect(() => {
    if (!loading && !user && path !== '/register' && path !== '/forgot-password' && path !== '/admin-login') {
      navigate('/login');
    }
  }, [user, loading, path, navigate]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
      </div>
    );
  }

  if (!user) {
    if (path === '/register') return <RegisterPage />;
    if (path === '/forgot-password') return <ForgotPasswordPage />;
    if (path === '/admin-login') return <AdminLoginPage />;
    return <LoginPage />;
  }

  // Admin routes
  if (isAdmin) {
    const adminPages = (
      <>
        {path === '/admin' && <AdminDashboard />}
        {path === '/admin/inventory' && <AdminInventoryPage />}
        {path === '/admin/orders' && <AdminOrdersPage />}
      </>
    );

    if (path.startsWith('/admin')) {
      return (
        <div className="min-h-screen bg-stone-50">
          <Navbar />
          {adminPages}
        </div>
      );
    }

    // Non-admin route accessed by admin -> redirect to admin dashboard
    navigate('/admin');
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
      </div>
    );
  }

  // User routes
  const userPages = (
    <>
      {path === '/' && <UserDashboard />}
      {path === '/builder' && <PizzaBuilderPage />}
      {path === '/cart' && <CartPage />}
      {path === '/orders' && <UserOrdersPage />}
    </>
  );

  // If user tries to access admin routes, redirect to user dashboard
  if (path.startsWith('/admin')) {
    navigate('/');
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50">
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <Navbar />
      {userPages}
    </div>
  );
}

function App() {
  return (
    <RouterProvider>
      <AuthProvider>
        <CartProvider>
          <AppRoutes />
        </CartProvider>
      </AuthProvider>
    </RouterProvider>
  );
}

export default App;
