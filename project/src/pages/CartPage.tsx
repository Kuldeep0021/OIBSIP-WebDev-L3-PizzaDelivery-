import { useState } from 'react';
import { useCart } from '@/context/CartContext';
import { useAuth } from '@/context/AuthContext';
import { useRouter } from '@/context/RouterContext';
import api from '@/lib/api';
import {
  ShoppingCart, Plus, Minus, Trash2, ArrowRight, Loader2,
  CheckCircle2, MapPin, Phone, User as UserIcon, CreditCard, X
} from 'lucide-react';
import type { CartItem } from '@/types';

declare global {
  interface Window {
    Razorpay: new (options: RazorpayOptions) => RazorpayInstance;
  }
}

interface RazorpayOptions {
  key: string;
  amount: number;
  currency: string;
  name: string;
  description: string;
  order_id: string;
  handler: (response: { razorpay_order_id: string; razorpay_payment_id: string; razorpay_signature: string }) => void;
  prefill: { name: string; email?: string; contact: string };
  theme: { color: string };
  modal: { ondismiss: () => void };
}

interface RazorpayInstance {
  open: () => void;
}

export function CartPage() {
  const { items, updateQuantity, removeFromCart, clearCart, total } = useCart();
  const { user } = useAuth();
  const { navigate } = useRouter();
  const [checkout, setCheckout] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [orderComplete, setOrderComplete] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [deliveryInfo, setDeliveryInfo] = useState({
    name: user?.name || '',
    phone: user?.phone || '',
    address: '',
    notes: '',
  });

  const loadRazorpayScript = (): Promise<boolean> => {
    return new Promise((resolve) => {
      if (typeof window.Razorpay !== 'undefined') {
        resolve(true);
        return;
      }
      const script = document.createElement('script');
      script.src = 'https://checkout.razorpay.com/v1/checkout.js';
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  const handleCheckout = async () => {
    if (!user) return;
    if (!deliveryInfo.name || !deliveryInfo.phone || !deliveryInfo.address) {
      setError('Please fill in all delivery details.');
      return;
    }

    setError('');
    setProcessing(true);

    try {
      // Load Razorpay SDK
      const sdkLoaded = await loadRazorpayScript();
      if (!sdkLoaded) throw new Error('Failed to load Razorpay SDK');

      // Create Razorpay order from backend
      const { data: rzpData } = await api.post('/payment/create-order', { amount: total });

      // Open Razorpay checkout
      const options: RazorpayOptions = {
        key: rzpData.keyId,
        amount: rzpData.amount,
        currency: rzpData.currency,
        name: 'PizzaHub',
        description: 'Pizza Order Payment',
        order_id: rzpData.orderId,
        handler: async (response) => {
          try {
            // Create order in our backend
            const orderItems = items.map((item: CartItem) => ({
              itemType: item.type,
              itemName: item.name,
              quantity: item.quantity,
              price: item.price,
              details: item.details || null,
            }));

            const { data: order } = await api.post('/orders', {
              items: orderItems,
              totalAmount: total,
              deliveryAddress: deliveryInfo.address,
              customerName: deliveryInfo.name,
              customerPhone: deliveryInfo.phone,
              notes: deliveryInfo.notes,
              razorpayOrderId: response.razorpay_order_id,
            });

            // Verify payment
            await api.post('/payment/verify', {
              razorpayOrderId: response.razorpay_order_id,
              razorpayPaymentId: response.razorpay_payment_id,
              razorpaySignature: response.razorpay_signature,
              orderId: order.order._id,
            });

            setOrderComplete(order.order.orderNumber);
            clearCart();
          } catch (err) {
            setError('Payment verification failed. Please contact support.');
          } finally {
            setProcessing(false);
          }
        },
        prefill: {
          name: deliveryInfo.name,
          contact: deliveryInfo.phone,
        },
        theme: { color: '#ea580c' },
        modal: {
          ondismiss: () => {
            setProcessing(false);
          },
        },
      };

      const rzp = new window.Razorpay(options);
      rzp.open();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to initiate payment. Please try again.');
      setProcessing(false);
    }
  };

  if (orderComplete) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
        <div className="card p-8 max-w-md w-full text-center animate-scale-in">
          <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <CheckCircle2 className="w-10 h-10 text-green-600" />
          </div>
          <h2 className="text-2xl font-bold text-stone-900 mb-3">Order Confirmed!</h2>
          <p className="text-stone-600 mb-2">
            Your order has been placed and payment confirmed.
          </p>
          <p className="text-lg font-bold text-orange-600 mb-6">{orderComplete}</p>
          <div className="bg-stone-50 rounded-xl p-4 mb-6">
            <p className="text-sm text-stone-500 mb-2">Track your order in real-time:</p>
            <div className="flex items-center justify-center gap-2 text-sm">
              <span className="badge badge-received">Order Received</span>
              <ArrowRight className="w-4 h-4 text-stone-400" />
              <span className="badge badge-kitchen">In Kitchen</span>
              <ArrowRight className="w-4 h-4 text-stone-400" />
              <span className="badge badge-delivery">Delivery</span>
            </div>
          </div>
          <button onClick={() => navigate('/orders')} className="btn-primary w-full">
            Track My Order
          </button>
        </div>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-stone-50 p-4">
        <div className="card p-12 max-w-md w-full text-center">
          <div className="w-20 h-20 bg-stone-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <ShoppingCart className="w-10 h-10 text-stone-400" />
          </div>
          <h2 className="text-xl font-bold text-stone-900 mb-2">Your Cart is Empty</h2>
          <p className="text-stone-500 mb-6">Add some delicious pizzas to get started!</p>
          <button onClick={() => navigate('/')} className="btn-primary">
            Browse Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <h1 className="text-3xl font-bold text-stone-900 mb-8">
          {checkout ? 'Checkout' : 'Your Cart'}
        </h1>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Items / Checkout form */}
          <div className="lg:col-span-2 space-y-4">
            {!checkout ? (
              <>
                {items.map((item) => (
                  <div key={item.id} className="card p-5 animate-fade-in">
                    <div className="flex items-start gap-4">
                      <div className="w-14 h-14 bg-orange-100 rounded-xl flex items-center justify-center flex-shrink-0">
                        <span className="text-2xl">🍕</span>
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-stone-900">{item.name}</h3>
                        {item.details && (
                          <div className="flex flex-wrap gap-1 mt-1">
                            {item.details.base && <span className="text-xs text-stone-500">{item.details.base}</span>}
                            {item.details.sauce && <span className="text-xs text-stone-500">· {item.details.sauce}</span>}
                            {item.details.Pizza && <span className="text-xs text-stone-500">· {item.details.Pizza}</span>}
                            {item.details.vegetables?.map((v) => (
                              <span key={v} className="text-xs text-stone-500">· {v}</span>
                            ))}
                          </div>
                        )}
                        <p className="text-lg font-bold text-orange-600 mt-1">₹{item.price}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity - 1)}
                          className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center hover:bg-stone-50"
                        >
                          <Minus className="w-4 h-4" />
                        </button>
                        <span className="w-8 text-center font-semibold">{item.quantity}</span>
                        <button
                          onClick={() => updateQuantity(item.id, item.quantity + 1)}
                          className="w-8 h-8 rounded-lg border border-stone-200 flex items-center justify-center hover:bg-stone-50"
                        >
                          <Plus className="w-4 h-4" />
                        </button>
                        <button
                          onClick={() => removeFromCart(item.id)}
                          className="w-8 h-8 rounded-lg flex items-center justify-center text-stone-400 hover:text-red-600 hover:bg-red-50"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                    <div className="flex justify-between mt-3 pt-3 border-t border-stone-100">
                      <span className="text-sm text-stone-500">Subtotal</span>
                      <span className="font-semibold text-stone-900">₹{item.price * item.quantity}</span>
                    </div>
                  </div>
                ))}
              </>
            ) : (
              <div className="card p-6 space-y-5 animate-fade-in">
                <h3 className="text-lg font-bold text-stone-900">Delivery Details</h3>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">Full Name</label>
                  <div className="relative">
                    <UserIcon className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input
                      type="text"
                      required
                      value={deliveryInfo.name}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, name: e.target.value })}
                      className="input-field pl-11"
                      placeholder="John Doe"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">Phone Number</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
                    <input
                      type="tel"
                      required
                      value={deliveryInfo.phone}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, phone: e.target.value })}
                      className="input-field pl-11"
                      placeholder="+91 98765 43210"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">Delivery Address</label>
                  <div className="relative">
                    <MapPin className="absolute left-3 top-3 w-5 h-5 text-stone-400" />
                    <textarea
                      required
                      value={deliveryInfo.address}
                      onChange={(e) => setDeliveryInfo({ ...deliveryInfo, address: e.target.value })}
                      className="input-field pl-11 min-h-[80px]"
                      placeholder="Street address, city, zip code"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-stone-700 mb-1.5">Order Notes (Optional)</label>
                  <input
                    type="text"
                    value={deliveryInfo.notes}
                    onChange={(e) => setDeliveryInfo({ ...deliveryInfo, notes: e.target.value })}
                    className="input-field"
                    placeholder="Special instructions"
                  />
                </div>

                <div className="p-4 bg-blue-50 border border-blue-200 rounded-xl">
                  <div className="flex items-center gap-2 mb-2">
                    <CreditCard className="w-5 h-5 text-blue-600" />
                    <span className="font-semibold text-blue-900 text-sm">Razorpay Secure Payment</span>
                  </div>
                  <p className="text-sm text-blue-700">
                    You'll be redirected to Razorpay's secure checkout. Complete the payment to confirm your order.
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Order summary sidebar */}
          <div className="lg:col-span-1">
            <div className="card p-6 sticky top-20">
              <h3 className="text-lg font-bold text-stone-900 mb-4">Order Summary</h3>
              <div className="space-y-2 mb-4">
                {items.map((item) => (
                  <div key={item.id} className="flex justify-between text-sm">
                    <span className="text-stone-600">{item.name} × {item.quantity}</span>
                    <span className="font-medium text-stone-900">₹{item.price * item.quantity}</span>
                  </div>
                ))}
              </div>
              <div className="border-t border-stone-100 pt-4 space-y-2">
                <div className="flex justify-between text-sm text-stone-500">
                  <span>Subtotal</span>
                  <span>₹{total}</span>
                </div>
                <div className="flex justify-between text-sm text-stone-500">
                  <span>Delivery</span>
                  <span>Free</span>
                </div>
                <div className="flex justify-between text-lg font-bold text-stone-900 pt-2 border-t border-stone-100">
                  <span>Total</span>
                  <span className="text-orange-600">₹{total}</span>
                </div>
              </div>

              {error && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <button
                onClick={() => (checkout ? handleCheckout() : setCheckout(true))}
                disabled={processing}
                className="btn-primary w-full mt-6 flex items-center justify-center gap-2"
              >
                {processing ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : checkout ? (
                  <>
                    Pay ₹{total} with Razorpay
                    <CreditCard className="w-5 h-5" />
                  </>
                ) : (
                  <>
                    Proceed to Checkout
                    <ArrowRight className="w-5 h-5" />
                  </>
                )}
              </button>

              {checkout && (
                <button
                  onClick={() => setCheckout(false)}
                  className="btn-ghost w-full mt-2 flex items-center justify-center gap-2"
                >
                  <X className="w-4 h-4" />
                  Back to Cart
                </button>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
