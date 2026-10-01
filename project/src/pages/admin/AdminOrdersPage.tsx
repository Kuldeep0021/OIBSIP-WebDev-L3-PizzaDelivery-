import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import {
  Loader2, Clock, ChefHat, Bike, ShoppingCart, Search,
  Receipt, MapPin, Phone, Calendar, ChevronDown, ChevronUp, User, CheckCircle2
} from 'lucide-react';

type OrderStatus = 'received' | 'kitchen' | 'delivery';

interface OrderItem {
  _id: string;
  itemType: string;
  itemName: string;
  quantity: number;
  price: number;
  details?: {
    base?: string;
    sauce?: string;
    cheese?: string;
    vegetables?: string[];
  };
}

interface Order {
  _id: string;
  orderNumber: string;
  status: OrderStatus;
  totalAmount: number;
  deliveryAddress?: string;
  customerName?: string;
  customerPhone?: string;
  paymentStatus: 'pending' | 'paid';
  notes?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

const STATUS_OPTIONS = [
  { key: 'received' as const, label: 'Order Received', icon: Clock, badge: 'badge-received' },
  { key: 'kitchen' as const, label: 'In Kitchen', icon: ChefHat, badge: 'badge-kitchen' },
  { key: 'delivery' as const, label: 'Out for Delivery', icon: Bike, badge: 'badge-delivery' },
];

export function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('all');
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const fetchOrders = useCallback(async () => {
    try {
      const { data } = await api.get('/orders');
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  const updateOrderStatus = async (orderId: string, newStatus: string) => {
    setUpdatingId(orderId);
    try {
      await api.patch(`/orders/${orderId}/status`, { status: newStatus });
      setOrders((prev) =>
        prev.map((o) => (o._id === orderId ? { ...o, status: newStatus as OrderStatus } : o))
      );
    } catch (err) {
      console.error('Error updating order status:', err);
    } finally {
      setUpdatingId(null);
    }
  };

  const filteredOrders = orders
    .filter((o) => statusFilter === 'all' || o.status === statusFilter)
    .filter((o) =>
      o.orderNumber.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerName?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.customerPhone?.includes(searchQuery)
    );

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-stone-50">
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <h1 className="text-3xl font-bold text-stone-900 mb-2">Order Management</h1>
        <p className="text-stone-500 mb-8">View and update order statuses in real-time</p>

        {/* Filters */}
        <div className="flex flex-col sm:flex-row gap-4 mb-6">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input-field pl-11"
              placeholder="Search by order number, name, or phone..."
            />
          </div>
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setStatusFilter('all')}
              className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all ${
                statusFilter === 'all' ? 'bg-stone-800 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
              }`}
            >
              All ({orders.length})
            </button>
            {STATUS_OPTIONS.map((opt) => {
              const count = orders.filter((o) => o.status === opt.key).length;
              return (
                <button
                  key={opt.key}
                  onClick={() => setStatusFilter(opt.key)}
                  className={`px-4 py-2.5 rounded-xl font-medium text-sm transition-all flex items-center gap-2 ${
                    statusFilter === opt.key ? 'bg-orange-600 text-white' : 'bg-white text-stone-600 border border-stone-200 hover:bg-stone-50'
                  }`}
                >
                  <opt.icon className="w-4 h-4" />
                  {opt.label.split(' ')[0]} ({count})
                </button>
              );
            })}
          </div>
        </div>

        {/* Orders list */}
        {filteredOrders.length === 0 ? (
          <div className="card p-12 text-center">
            <div className="w-16 h-16 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <ShoppingCart className="w-8 h-8 text-stone-400" />
            </div>
            <p className="text-stone-500">No orders found</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order, idx) => {
              const isExpanded = expandedId === order._id;
              const currentStatus = STATUS_OPTIONS.find((s) => s.key === order.status)!;

              return (
                <div
                  key={order._id}
                  className="card overflow-hidden animate-slide-up"
                  style={{ animationDelay: `${idx * 30}ms` }}
                >
                  {/* Order header */}
                  <div
                    className="p-5 cursor-pointer hover:bg-stone-50 transition-colors"
                    onClick={() => setExpandedId(isExpanded ? null : order._id)}
                  >
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <div className="flex items-center gap-4">
                        <div className="w-12 h-12 bg-orange-100 rounded-xl flex items-center justify-center">
                          <Receipt className="w-6 h-6 text-orange-600" />
                        </div>
                        <div>
                          <p className="font-bold text-stone-900">{order.orderNumber}</p>
                          <div className="flex items-center gap-3 text-xs text-stone-500 mt-0.5">
                            <span className="flex items-center gap-1">
                              <Calendar className="w-3.5 h-3.5" />
                              {new Date(order.createdAt).toLocaleDateString('en-IN', {
                                day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit',
                              })}
                            </span>
                            <span className="flex items-center gap-1">
                              <User className="w-3.5 h-3.5" />
                              {order.customerName || 'N/A'}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center gap-3">
                        <span className={`badge ${currentStatus.badge}`}>
                          <currentStatus.icon className="w-3.5 h-3.5" />
                          {currentStatus.label}
                        </span>
                        <span className={`badge ${order.paymentStatus === 'paid' ? 'badge-paid' : 'badge-pending'}`}>
                          {order.paymentStatus === 'paid' ? (
                            <><CheckCircle2 className="w-3.5 h-3.5" />Paid</>
                          ) : 'Pending'}
                        </span>
                        <span className="font-bold text-stone-900">₹{order.totalAmount}</span>
                        {isExpanded ? (
                          <ChevronUp className="w-5 h-5 text-stone-400" />
                        ) : (
                          <ChevronDown className="w-5 h-5 text-stone-400" />
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Expanded details */}
                  {isExpanded && (
                    <div className="border-t border-stone-100 p-5 bg-stone-50/50 animate-fade-in">
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {/* Order items */}
                        <div>
                          <h4 className="text-sm font-semibold text-stone-700 mb-3">Order Items</h4>
                          <div className="space-y-2">
                            {order.items.map((item) => (
                              <div key={item._id} className="flex items-start justify-between p-3 bg-white rounded-lg border border-stone-100">
                                <div>
                                  <p className="font-medium text-stone-900 text-sm">
                                    {item.itemName}
                                    <span className="text-stone-400 ml-1">× {item.quantity}</span>
                                  </p>
                                  {item.details && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {item.details.base && <span className="text-xs text-stone-500">{item.details.base}</span>}
                                      {item.details.sauce && <span className="text-xs text-stone-500">· {item.details.sauce}</span>}
                                      {item.details.cheese && <span className="text-xs text-stone-500">· {item.details.cheese}</span>}
                                      {item.details.vegetables?.map((v) => (
                                        <span key={v} className="text-xs text-stone-500">· {v}</span>
                                      ))}
                                    </div>
                                  )}
                                </div>
                                <span className="font-semibold text-stone-900 text-sm">₹{item.price * item.quantity}</span>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Customer info + status controls */}
                        <div className="space-y-4">
                          <div>
                            <h4 className="text-sm font-semibold text-stone-700 mb-3">Customer Details</h4>
                            <div className="space-y-2 text-sm">
                              <div className="flex items-center gap-2 text-stone-600">
                                <User className="w-4 h-4 text-stone-400" />
                                {order.customerName || 'N/A'}
                              </div>
                              <div className="flex items-center gap-2 text-stone-600">
                                <Phone className="w-4 h-4 text-stone-400" />
                                {order.customerPhone || 'N/A'}
                              </div>
                              <div className="flex items-start gap-2 text-stone-600">
                                <MapPin className="w-4 h-4 text-stone-400 mt-0.5" />
                                {order.deliveryAddress || 'N/A'}
                              </div>
                              {order.notes && (
                                <p className="text-stone-500 italic mt-2 p-2 bg-white rounded-lg border border-stone-100">
                                  "{order.notes}"
                                </p>
                              )}
                            </div>
                          </div>

                          {/* Status update controls */}
                          <div>
                            <h4 className="text-sm font-semibold text-stone-700 mb-3">Update Status</h4>
                            <div className="flex gap-2">
                              {STATUS_OPTIONS.map((opt) => {
                                const isActive = order.status === opt.key;
                                const Icon = opt.icon;
                                return (
                                  <button
                                    key={opt.key}
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      updateOrderStatus(order._id, opt.key);
                                    }}
                                    disabled={isActive || updatingId === order._id}
                                    className={`flex-1 flex flex-col items-center gap-1.5 px-3 py-3 rounded-xl border-2 font-medium text-xs transition-all ${
                                      isActive
                                        ? 'border-orange-500 bg-orange-50 text-orange-700 cursor-default'
                                        : 'border-stone-200 bg-white text-stone-600 hover:border-orange-300 hover:bg-orange-50/50'
                                    } ${updatingId === order._id ? 'opacity-50' : ''}`}
                                  >
                                    {updatingId === order._id && !isActive ? (
                                      <Loader2 className="w-5 h-5 animate-spin" />
                                    ) : (
                                      <Icon className="w-5 h-5" />
                                    )}
                                    {opt.label}
                                  </button>
                                );
                              })}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
