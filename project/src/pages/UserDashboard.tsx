import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useRouter } from '@/context/RouterContext';
import { Pizza, Plus, Loader2, Star, Clock } from 'lucide-react';

interface PizzaVariety {
  _id: string;
  name: string;
  description?: string;
  imageUrl?: string;
  price: number;
  isAvailable: boolean;
}

export function UserDashboard() {
  const { addToCart } = useCart();
  const { navigate } = useRouter();
  const [pizzas, setPizzas] = useState<PizzaVariety[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchPizzas() {
      try {
        const { data } = await api.get('/pizza');
        setPizzas(data.pizzaVarieties || []);
      } catch (err) {
        console.error('Error fetching pizzas:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchPizzas();
  }, []);

  const handleAddToCart = (pizza: PizzaVariety) => {
    addToCart({
      type: 'pizza_variety',
      id: pizza._id,
      name: pizza.name,
      price: pizza.price,
      quantity: 1,
    });
    navigate('/cart');
  };

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="relative bg-gradient-to-br from-orange-600 via-orange-600 to-red-600 text-white overflow-hidden">
        <div className="absolute inset-0 opacity-10" style={{
          backgroundImage: 'radial-gradient(circle at 20% 80%, white 1px, transparent 1px), radial-gradient(circle at 80% 20%, white 1px, transparent 1px)',
          backgroundSize: '40px 40px',
        }} />
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24">
          <div className="text-center max-w-2xl mx-auto">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/15 backdrop-blur-sm rounded-full text-sm font-medium mb-6 animate-fade-in">
              <Star className="w-4 h-4 fill-white" />
              #1 Rated Pizza in Town
            </span>
            <h1 className="text-4xl md:text-6xl font-extrabold mb-4 animate-slide-up">
              Build Your Perfect Pizza
            </h1>
            <p className="text-lg md:text-xl text-orange-100 mb-8 animate-slide-up">
              Choose from our signature varieties or craft your own with fresh ingredients.
              Delivered hot to your door.
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-slide-up">
              <button
                onClick={() => navigate('/builder')}
                className="bg-white text-orange-600 font-semibold px-8 py-3.5 rounded-xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-200 flex items-center gap-2"
              >
                <Pizza className="w-5 h-5" />
                Build Custom Pizza
              </button>
              <button
                onClick={() => document.getElementById('menu')?.scrollIntoView({ behavior: 'smooth' })}
                className="bg-white/15 backdrop-blur-sm border border-white/30 text-white font-semibold px-8 py-3.5 rounded-xl hover:bg-white/25 transition-all duration-200"
              >
                Browse Menu
              </button>
            </div>
          </div>
        </div>
      </div>

      <div id="menu" className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 md:py-16">
        <div className="flex items-end justify-between mb-8">
          <div>
            <h2 className="text-3xl font-bold text-stone-900 mb-2">Signature Pizzas</h2>
            <p className="text-stone-500">Crafted by our master chefs with premium ingredients</p>
          </div>
          <div className="hidden sm:flex items-center gap-2 text-stone-500 text-sm">
            <Clock className="w-4 h-4" />
            30 min delivery
          </div>
        </div>

        {loading ? (
          <div className="flex justify-center py-20">
            <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {pizzas.map((pizza, idx) => (
              <div
                key={pizza._id}
                className="card card-hover overflow-hidden animate-slide-up"
                style={{ animationDelay: `${idx * 50}ms` }}
              >
                <div className="relative h-56 overflow-hidden">
                  {pizza.imageUrl ? (
                    <img
                      src={pizza.imageUrl}
                      alt={pizza.name}
                      className="w-full h-full object-cover transition-transform duration-500 hover:scale-105"
                    />
                  ) : (
                    <div className="w-full h-full bg-stone-200 flex items-center justify-center">
                      <Pizza className="w-16 h-16 text-stone-400" />
                    </div>
                  )}
                  <div className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm px-3 py-1.5 rounded-full shadow-lg">
                    <span className="font-bold text-orange-600">₹{pizza.price}</span>
                  </div>
                </div>

                <div className="p-6">
                  <h3 className="text-xl font-bold text-stone-900 mb-2">{pizza.name}</h3>
                  <p className="text-sm text-stone-500 mb-4 line-clamp-2">{pizza.description}</p>
                  <button
                    onClick={() => handleAddToCart(pizza)}
                    className="btn-primary w-full flex items-center justify-center gap-2"
                  >
                    <Plus className="w-5 h-5" />
                    Add to Cart
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
