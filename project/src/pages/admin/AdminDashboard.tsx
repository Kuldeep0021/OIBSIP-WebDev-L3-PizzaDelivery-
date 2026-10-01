import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useRouter } from '@/context/RouterContext';
import {
  Package, ShoppingCart, AlertTriangle, TrendingUp, Loader2,
  ArrowRight, Clock, ChefHat, Bike, Layers, Soup, Cheese, Sprout
} from 'lucide-react';

interface InventoryItem {
  _id: string;
  name: string;
  category: string;
  stockQuantity: number;
  threshold: number;
  price: number;
}

interface StockAlert {
  _id: string;
  itemName: string;
  stockAtAlert: number;
  threshold: number;
  sentAt: string;
}

interface Order {
  _id: string;
  orderNumber: string;
  status: 'received' | 'kitchen' | 'delivery';
  totalAmount: number;
  paymentStatus: 'pending' | 'paid';
  createdAt: string;
}

export function AdminDashboard() {
  const { navigate } = useRouter();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    totalOrders: 0,
    pendingOrders: 0,
    lowStockItems: 0,
    totalRevenue: 0,
  });
  const [recentOrders, setRecentOrders] = useState<Order[]>([]);
  const [lowStock, setLowStock] = useState<InventoryItem[]>([]);
  const [recentAlerts, setRecentAlerts] = useState<StockAlert[]>([]);

  const fetchDashboardData = useCallback(async () => {
    try {
      const [ordersRes, inventoryRes, alertsRes] = await Promise.all([
        api.get('/orders?limit=5'),
        api.get('/inventory'),
        api.get('/inventory/alerts?limit=5'),
      ]);

      const orders: Order[] = ordersRes.data.orders || [];
      const inventory: InventoryItem[] = inventoryRes.data.inventoryItems || [];
      const alerts: StockAlert[] = alertsRes.data.alerts || [];

      const lowStockItems = inventory.filter((i) => i.stockQuantity < i.threshold);
      const revenue = orders
        .filter((o) => o.paymentStatus === 'paid')
        .reduce((sum, o) => sum + Number(o.totalAmount), 0);

      setStats({
        totalOrders: orders.length,
        pendingOrders: orders.filter((o) => o.status !== 'delivery').length,
        lowStockItems: lowStockItems.length,
        totalRevenue: revenue,
      });
      setRecentOrders(orders);
      setLowStock(lowStockItems);
      setRecentAlerts(alerts);
    } catch (err) {
      console.error('Error fetching dashboard data:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDashboardData();
    const interval = setInterval(fetchDashboardData, 10000);
    return () => clearInterval(interval);
  }, [fetchDashboardData]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-stone-50">
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
      </div>
    );
  }

  const statCards = [
    { label: 'Total Orders', value: stats.totalOrders, icon: ShoppingCart, color: 'text-blue-600', bg: 'bg-blue-100', route: '/admin/orders' },
    { label: 'Pending Orders', value: stats.pendingOrders, icon: Clock, color: 'text-amber-600', bg: 'bg-amber-100', route: '/admin/orders' },
    { label: 'Low Stock Items', value: stats.lowStockItems, icon: AlertTriangle, color: 'text-red-600', bg: 'bg-red-100', route: '/admin/inventory' },
    { label: 'Total Revenue', value: `₹${stats.totalRevenue.toLocaleString('en-IN')}`, icon: TrendingUp, color: 'text-green-600', bg: 'bg-green-100', route: '/admin/orders' },
  ];

  const categoryIcon = (category: string) => {
    const icons: Record<string, typeof Layers> = { base: Layers, sauce: Soup, cheese: Cheese, vegetable: Sprout };
    return icons[category] || Package;
  };

  const statusInfo = (status: string) => {
    if (status === 'received') return { label: 'Received', icon: Clock, badge: 'badge-received' };
    if (status === 'kitchen') return { label: 'In Kitchen', icon: ChefHat, badge: 'badge-kitchen' };
    return { label: 'Delivery', icon: Bike, badge: 'badge-delivery' };
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <h1 className="text-3xl font-bold text-stone-900 mb-2">Admin Dashboard</h1>
        <p className="text-stone-500 mb-8">Overview of orders, inventory, and alerts</p>

        {/* Stat cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
          {statCards.map((stat, idx) => {
            const Icon = stat.icon;
            return (
              <button
                key={stat.label}
                onClick={() => navigate(stat.route)}
                className="card card-hover p-5 text-left animate-slide-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="flex items-center justify-between mb-3">
                  <div className={`w-12 h-12 ${stat.bg} rounded-xl flex items-center justify-center`}>
                    <Icon className={`w-6 h-6 ${stat.color}`} />
                  </div>
                  <ArrowRight className="w-5 h-5 text-stone-300" />
                </div>
                <p className="text-sm text-stone-500 mb-1">{stat.label}</p>
                <p className="text-2xl font-bold text-stone-900">{stat.value}</p>
              </button>
            );
          })}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent orders */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-stone-900">Recent Orders</h2>
              <button onClick={() => navigate('/admin/orders')} className="text-sm text-orange-600 font-medium hover:underline">
                View All
              </button>
            </div>
            {recentOrders.length === 0 ? (
              <p className="text-stone-400 text-center py-8">No orders yet</p>
            ) : (
              <div className="space-y-3">
                {recentOrders.map((order) => {
                  const si = statusInfo(order.status);
                  const SI = si.icon;
                  return (
                    <div
                      key={order._id}
                      className="flex items-center justify-between p-3 bg-stone-50 rounded-xl hover:bg-stone-100 transition-colors cursor-pointer"
                      onClick={() => navigate('/admin/orders')}
                    >
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <ShoppingCart className="w-5 h-5 text-stone-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-stone-900 text-sm">{order.orderNumber}</p>
                          <p className="text-xs text-stone-500">
                            {new Date(order.createdAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className={`badge ${si.badge}`}>
                          <SI className="w-3.5 h-3.5" />
                          {si.label}
                        </span>
                        <span className="font-semibold text-stone-900 text-sm">₹{order.totalAmount}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Low stock alerts */}
          <div className="card p-6">
            <div className="flex items-center justify-between mb-5">
              <h2 className="text-lg font-bold text-stone-900">Low Stock Alerts</h2>
              <button onClick={() => navigate('/admin/inventory')} className="text-sm text-orange-600 font-medium hover:underline">
                Manage Inventory
              </button>
            </div>
            {lowStock.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mb-3">
                  <Package className="w-6 h-6 text-green-600" />
                </div>
                <p className="text-stone-500">All items are well stocked</p>
              </div>
            ) : (
              <div className="space-y-3">
                {lowStock.slice(0, 5).map((item) => {
                  const Icon = categoryIcon(item.category);
                  return (
                    <div key={item._id} className="flex items-center justify-between p-3 bg-red-50 rounded-xl">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-white rounded-lg flex items-center justify-center shadow-sm">
                          <Icon className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <p className="font-semibold text-stone-900 text-sm">{item.name}</p>
                          <p className="text-xs text-stone-500 capitalize">{item.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-red-600">{item.stockQuantity}</p>
                        <p className="text-xs text-stone-400">min {item.threshold}</p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Recent alerts log */}
            {recentAlerts.length > 0 && (
              <div className="mt-5 pt-5 border-t border-stone-100">
                <h3 className="text-sm font-semibold text-stone-700 mb-3">Recent Alert Notifications</h3>
                <div className="space-y-2">
                  {recentAlerts.map((alert) => (
                    <div key={alert._id} className="flex items-center justify-between text-sm">
                      <span className="text-stone-600 flex items-center gap-2">
                        <AlertTriangle className="w-4 h-4 text-amber-500" />
                        {alert.itemName}
                      </span>
                      <span className="text-xs text-stone-400">
                        {new Date(alert.sentAt).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' })}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
