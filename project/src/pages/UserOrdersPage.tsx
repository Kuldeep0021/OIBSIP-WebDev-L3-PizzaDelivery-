import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import {
  Package, Clock, ChefHat, Bike, CheckCircle2, Loader2,
  Receipt, MapPin, Phone, Calendar
} from 'lucide-react';

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
  status: 'received' | 'kitchen' | 'delivery';
  totalAmount: number;
  deliveryAddress?: string;
  customerName?: string;
  customerPhone?: string;
  paymentStatus: 'pending' | 'paid';
  paymentId?: string;
  notes?: string;
  items: OrderItem[];
  createdAt: string;
  updatedAt: string;
}

const STATUS_FLOW = [
  { key: 'received' as const, label: 'Order Received', icon: Clock, color: 'text-blue-600', bg: 'bg-blue-100' },
  { key: 'kitchen' as const, label: 'In Kitchen', icon: ChefHat, color: 'text-amber-600', bg: 'bg-amber-100' },
  { key: 'delivery' as const, label: 'Out for Delivery', icon: Bike, color: 'text-green-600', bg: 'bg-green-100' },
];

export function UserOrdersPage() {
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchOrders = useCallback(async () => {
    if (!user) return;
    try {
      const { data } = await api.get('/orders');
      setOrders(data.orders || []);
    } catch (err) {
      console.error('Error fetching orders:', err);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    fetchOrders();
    // Poll every 5 seconds for real-time updates
    const interval = setInterval(fetchOrders, 5000);
    return () => clearInterval(interval);
  }, [fetchOrders]);

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-stone-50">
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
      </div>
    );
  }

  if (orders.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
        <div className="card p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <Package className="w-10 h-10 text-stone-400" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">No Orders Yet</h2>
          <p className="text-stone-500 mb-6">Place your first order to see it here!</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Order Now
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <h1 className="text-3xl font-bold text-stone-900 mb-2">My Orders</h1>
        <p className="text-stone-500 mb-8">Track your orders in real-time</p>

        <div className="space-y-6">
          {orders.map((order, idx) => {
            const currentStepIndex = STATUS_FLOW.findIndex((s) => s.key === order.status);

            return (
              <div key={order._id} className="card p-6 animate-slide-up" style={{ animationDelay: `${idx * 50}ms` }}>
                {/* Order header */}
                <div className="flex flex-wrap items-start justify-between gap-3 mb-6">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <Receipt className="w-5 h-5 text-stone-400" />
                      <span className="font-bold text-stone-900 text-lg">{order.orderNumber}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sm text-stone-500">
                      <span className="flex items-center gap-1">
                        <Calendar className="w-4 h-4" />
                        {new Date(order.createdAt).toLocaleDateString('en-IN', {
                          day: 'numeric', month: 'short', year: 'numeric',
                          hour: '2-digit', minute: '2-digit',
                        })}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className={`badge ${
                      order.paymentStatus === 'paid' ? 'badge-paid' : 'badge-pending'
                    }`}>
                      {order.paymentStatus === 'paid' ? (
                        <><CheckCircle2 className="w-3.5 h-3.5" /> Paid</>
                      ) : (
                        <><Clock className="w-3.5 h-3.5" /> Payment Pending</>
                      )}
                    </span>
                  </div>
                </div>

                {/* Status tracker */}
                <div className="bg-stone-50 rounded-2xl p-5 mb-5">
                  <div className="flex items-center justify-between relative">
                    {STATUS_FLOW.map((step, stepIdx) => {
                      const Icon = step.icon;
                      const isCompleted = stepIdx < currentStepIndex;
                      const isActive = stepIdx === currentStepIndex;
                      return (
                        <div key={step.key} className="flex-1 flex flex-col items-center relative z-10">
                          <div className={`w-12 h-12 rounded-full flex items-center justify-center transition-all duration-500 ${
                            isCompleted ? 'bg-green-600 text-white' :
                            isActive ? `${step.bg} ${step.color} ring-4 ring-orange-100` :
                            'bg-stone-200 text-stone-400'
                          }`}>
                            {isCompleted ? <CheckCircle2 className="w-6 h-6" /> : <Icon className="w-6 h-6" />}
                          </div>
                          <span className={`text-xs font-medium mt-2 text-center ${
                            isActive ? step.color : isCompleted ? 'text-green-600' : 'text-stone-400'
                          }`}>
                            {step.label}
                          </span>
                          {isActive && (
                            <span className="text-xs text-orange-500 mt-1 animate-pulse">In progress...</span>
                          )}
                        </div>
                      );
                    })}
                    {/* Progress line */}
                    <div className="absolute top-6 left-[16%] right-[16%] h-1 bg-stone-200 -z-0 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-green-600 transition-all duration-1000"
                        style={{ width: `${(currentStepIndex / (STATUS_FLOW.length - 1)) * 100}%` }}
                      />
                    </div>
                  </div>
                </div>

                {/* Order items */}
                <div className="space-y-2 mb-5">
                  {order.items.map((item) => (
                    <div key={item._id} className="flex items-start justify-between p-3 bg-stone-50 rounded-lg">
                      <div>
                        <span className="font-medium text-stone-900">{item.itemName}</span>
                        <span className="text-stone-400 text-sm ml-2">× {item.quantity}</span>
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
                      <span className="font-semibold text-stone-900">₹{item.price * item.quantity}</span>
                    </div>
                  ))}
                </div>

                {/* Delivery info and total */}
                <div className="flex flex-wrap items-start justify-between gap-4 pt-5 border-t border-stone-100">
                  <div className="space-y-1 text-sm text-stone-500">
                    {order.customerName && (
                      <div className="flex items-center gap-2">
                        <Phone className="w-4 h-4" />
                        {order.customerName} · {order.customerPhone}
                      </div>
                    )}
                    {order.deliveryAddress && (
                      <div className="flex items-center gap-2">
                        <MapPin className="w-4 h-4" />
                        {order.deliveryAddress}
                      </div>
                    )}
                  </div>
                  <div className="text-right">
                    <span className="text-sm text-stone-500">Total</span>
                    <p className="text-xl font-bold text-orange-600">₹{order.totalAmount}</p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
