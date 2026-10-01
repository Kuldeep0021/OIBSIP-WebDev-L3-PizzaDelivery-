import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import { useCart } from '@/context/CartContext';
import { Pizza, ShoppingCart, LogOut, LayoutDashboard, Package, ShieldCheck, Menu, X } from 'lucide-react';

export function Navbar() {
  const { user, profile, isAdmin, signOut } = useAuth();
  const { navigate, path } = useRouter();
  const { totalItems } = useCart();
  const [mobileOpen, setMobileOpen] = useState(false);

  const handleSignOut = async () => {
    await signOut();
    navigate('/login');
  };

  const isActive = (route: string) => path === route;

  const navLink = (route: string, label: string, icon: React.ReactNode) => (
    <button
      onClick={() => {
        navigate(route);
        setMobileOpen(false);
      }}
      className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm transition-all duration-200 ${
        isActive(route)
          ? 'bg-orange-100 text-orange-700'
          : 'text-stone-600 hover:bg-stone-100 hover:text-stone-900'
      }`}
    >
      {icon}
      {label}
    </button>
  );

  return (
    <nav className="sticky top-0 z-50 bg-white/90 backdrop-blur-lg border-b border-stone-100 shadow-sm">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <button
            onClick={() => navigate(isAdmin ? '/admin' : '/')}
            className="flex items-center gap-2.5 group"
          >
            <div className="w-10 h-10 bg-orange-600 rounded-xl flex items-center justify-center shadow-lg shadow-orange-600/20 group-hover:scale-105 transition-transform">
              <Pizza className="w-6 h-6 text-white" />
            </div>
            <span className="text-xl font-bold text-stone-900 font-display">PizzaHub</span>
          </button>

          <div className="hidden md:flex items-center gap-2">
            {isAdmin ? (
              <>
                {navLink('/admin', 'Dashboard', <LayoutDashboard className="w-4 h-4" />)}
                {navLink('/admin/inventory', 'Inventory', <Package className="w-4 h-4" />)}
                {navLink('/admin/orders', 'Orders', <ShieldCheck className="w-4 h-4" />)}
              </>
            ) : (
              <>
                {navLink('/', 'Menu', <Pizza className="w-4 h-4" />)}
                {navLink('/builder', 'Custom Pizza', <LayoutDashboard className="w-4 h-4" />)}
                {navLink('/orders', 'My Orders', <Package className="w-4 h-4" />)}
              </>
            )}
          </div>

          <div className="hidden md:flex items-center gap-3">
            {!isAdmin && (
              <button
                onClick={() => navigate('/cart')}
                className="relative flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-stone-600 hover:bg-stone-100 transition-colors"
              >
                <ShoppingCart className="w-5 h-5" />
                <span>Cart</span>
                {totalItems > 0 && (
                  <span className="absolute -top-1 -right-1 w-5 h-5 bg-orange-600 text-white text-xs rounded-full flex items-center justify-center font-bold">
                    {totalItems}
                  </span>
                )}
              </button>
            )}

            <div className="flex items-center gap-2 pl-3 border-l border-stone-200">
              <span className="text-sm text-stone-600">
                {profile?.full_name || user?.email}
              </span>
              <button
                onClick={handleSignOut}
                className="p-2 rounded-lg text-stone-500 hover:bg-stone-100 hover:text-red-600 transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-5 h-5" />
              </button>
            </div>
          </div>

          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden p-2 rounded-lg text-stone-600 hover:bg-stone-100"
          >
            {mobileOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
          </button>
        </div>

        {mobileOpen && (
          <div className="md:hidden py-4 border-t border-stone-100 space-y-2 animate-fade-in">
            {isAdmin ? (
              <>
                {navLink('/admin', 'Dashboard', <LayoutDashboard className="w-4 h-4" />)}
                {navLink('/admin/inventory', 'Inventory', <Package className="w-4 h-4" />)}
                {navLink('/admin/orders', 'Orders', <ShieldCheck className="w-4 h-4" />)}
              </>
            ) : (
              <>
                {navLink('/', 'Menu', <Pizza className="w-4 h-4" />)}
                {navLink('/builder', 'Custom Pizza', <LayoutDashboard className="w-4 h-4" />)}
                {navLink('/orders', 'My Orders', <Package className="w-4 h-4" />)}
                <button
                  onClick={() => { navigate('/cart'); setMobileOpen(false); }}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg font-medium text-sm text-stone-600 hover:bg-stone-100 w-full"
                >
                  <ShoppingCart className="w-5 h-5" />
                  Cart ({totalItems})
                </button>
              </>
            )}
            <div className="flex items-center justify-between px-4 py-2 border-t border-stone-100">
              <span className="text-sm text-stone-600">{profile?.full_name || user?.email}</span>
              <button
                onClick={handleSignOut}
                className="flex items-center gap-2 text-sm text-red-600 font-medium"
              >
                <LogOut className="w-5 h-5" />
                Sign Out
              </button>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}
