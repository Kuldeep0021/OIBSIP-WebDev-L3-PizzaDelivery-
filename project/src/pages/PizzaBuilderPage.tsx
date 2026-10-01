import { useState, useEffect } from 'react';
import api from '@/lib/api';
import { useCart } from '@/context/CartContext';
import { useRouter } from '@/context/RouterContext';
import {
  Check, ChevronRight, ChevronLeft, Loader2, ShoppingBag,
  Layers, Soup, Sprout, Pizza
} from 'lucide-react';

interface InventoryItem {
  _id: string;
  name: string;
  category: 'base' | 'sauce' | 'cheese' | 'vegetable';
  stockQuantity: number;
  threshold: number;
  price: number;
}

const STEPS = [
  { key: 'base' as const, label: 'Pizza Base', icon: Layers, category: 'base' as const, multi: false },
  { key: 'sauce' as const, label: 'Sauce', icon: Soup, category: 'sauce' as const, multi: false },
  { key: 'cheese' as const, label: 'Cheese', icon: Pizza, category: 'cheese' as const, multi: false },
  { key: 'vegetables' as const, label: 'Vegetables', icon: Sprout, category: 'vegetable' as const, multi: true },
];

export function PizzaBuilderPage() {
  const { addToCart } = useCart();
  const { navigate } = useRouter();
  const [currentStep, setCurrentStep] = useState(0);
  const [inventory, setInventory] = useState<Record<string, InventoryItem[]>>({
    base: [], sauce: [], cheese: [], vegetable: [],
  });
  const [loading, setLoading] = useState(true);
  const [selections, setSelections] = useState<{
    base: InventoryItem | null;
    sauce: InventoryItem | null;
    cheese: InventoryItem | null;
    vegetables: InventoryItem[];
  }>({ base: null, sauce: null, cheese: null, vegetables: [] });

  useEffect(() => {
    async function fetchInventory() {
      try {
        const { data } = await api.get('/inventory');
        const items: InventoryItem[] = data.inventoryItems || [];
        const grouped = items.reduce((acc: Record<string, InventoryItem[]>, item) => {
          if (!acc[item.category]) acc[item.category] = [];
          acc[item.category].push(item);
          return acc;
        }, { base: [], sauce: [], cheese: [], vegetable: [] });
        setInventory(grouped);
      } catch (err) {
        console.error('Error fetching inventory:', err);
      } finally {
        setLoading(false);
      }
    }
    fetchInventory();
  }, []);

  const step = STEPS[currentStep];
  const items = inventory[step.category] || [];

  const toggleSelection = (item: InventoryItem) => {
    if (step.multi) {
      setSelections((prev) => {
        const exists = prev.vegetables.find((v) => v._id === item._id);
        if (exists) {
          return { ...prev, vegetables: prev.vegetables.filter((v) => v._id !== item._id) };
        }
        return { ...prev, vegetables: [...prev.vegetables, item] };
      });
    } else {
      setSelections((prev) => ({ ...prev, [step.key]: item }));
    }
  };

  const isSelected = (item: InventoryItem) => {
    if (step.multi) return selections.vegetables.some((v) => v._id === item._id);
    return (selections[step.key as 'base' | 'sauce' | 'cheese'] as InventoryItem | null)?._id === item._id;
  };

  const canProceed = () => {
    if (step.multi) return selections.vegetables.length > 0;
    return selections[step.key as 'base' | 'sauce' | 'cheese'] !== null;
  };

  const calculatePrice = () => {
    let total = 0;
    if (selections.base) total += selections.base.price;
    if (selections.sauce) total += selections.sauce.price;
    if (selections.cheese) total += selections.cheese.price;
    selections.vegetables.forEach((v) => (total += v.price));
    return total;
  };

  const totalPrice = calculatePrice();

  const handleNext = () => {
    if (currentStep < STEPS.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      const inventoryItemIds: Record<string, string> = {};
      if (selections.base) inventoryItemIds.base = selections.base._id;
      if (selections.sauce) inventoryItemIds.sauce = selections.sauce._id;
      if (selections.cheese) inventoryItemIds.cheese = selections.cheese._id;
      selections.vegetables.forEach((v) => { inventoryItemIds[`veg_${v._id}`] = v._id; });

      const pizzaName = `Custom Pizza (${selections.base?.name ?? ''}, ${selections.sauce?.name ?? ''}, ${selections.cheese?.name ?? ''})`;

      addToCart({
        type: 'custom_pizza',
        id: `custom-${Date.now()}`,
        name: pizzaName,
        price: totalPrice,
        quantity: 1,
        details: {
          base: selections.base?.name,
          sauce: selections.sauce?.name,
          cheese: selections.cheese?.name,
          vegetables: selections.vegetables.map((v) => v.name),
          inventory_item_ids: inventoryItemIds,
        },
      });

      navigate('/cart');
    }
  };

  const handleBack = () => {
    if (currentStep > 0) setCurrentStep(currentStep - 1);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-stone-50">
        <Loader2 className="w-8 h-8 text-orange-600 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-stone-50">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-orange-100 text-orange-700 rounded-full text-sm font-semibold mb-4">
            <Pizza className="w-4 h-4" />
            Custom Pizza Builder
          </div>
          <h1 className="text-3xl md:text-4xl font-bold text-stone-900 mb-2">Craft Your Perfect Pizza</h1>
          <p className="text-stone-500">Choose your base, sauce, cheese, and toppings</p>
        </div>

        {/* Step indicators */}
        <div className="flex items-center justify-center mb-12">
          {STEPS.map((s, idx) => {
            const Icon = s.icon;
            const completed = idx < currentStep;
            const active = idx === currentStep;
            return (
              <div key={s.key} className="flex items-center">
                <div className="flex flex-col items-center gap-2">
                  <div className={`step-indicator ${active ? 'step-active' : completed ? 'step-completed' : 'step-inactive'}`}>
                    {completed ? <Check className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span className={`text-xs font-medium ${active ? 'text-orange-600' : completed ? 'text-green-600' : 'text-stone-400'}`}>
                    {s.label}
                  </span>
                </div>
                {idx < STEPS.length - 1 && (
                  <div className={`h-0.5 w-8 sm:w-16 mx-1 sm:mx-2 mb-6 ${idx < currentStep ? 'bg-green-600' : 'bg-stone-200'}`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Current step content */}
        <div className="card p-6 md:p-8 animate-fade-in">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h2 className="text-xl font-bold text-stone-900">Step {currentStep + 1}: {step.label}</h2>
              <p className="text-sm text-stone-500 mt-1">
                {step.multi ? 'Select one or more toppings' : 'Choose one option'}
              </p>
            </div>
            <div className="text-right">
              <span className="text-sm text-stone-400">Current total</span>
              <p className="text-2xl font-bold text-orange-600">₹{totalPrice}</p>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {items.map((item) => {
              const selected = isSelected(item);
              const outOfStock = item.stockQuantity <= 0;
              return (
                <button
                  key={item._id}
                  onClick={() => !outOfStock && toggleSelection(item)}
                  disabled={outOfStock}
                  className={`relative flex items-center justify-between p-4 rounded-xl border-2 transition-all duration-200 text-left ${
                    selected
                      ? 'border-orange-500 bg-orange-50 shadow-md'
                      : outOfStock
                        ? 'border-stone-100 bg-stone-50 opacity-50 cursor-not-allowed'
                        : 'border-stone-200 hover:border-orange-300 hover:bg-orange-50/50'
                  }`}
                >
                  <div className="flex-1">
                    <p className="font-semibold text-stone-900">{item.name}</p>
                    <p className="text-sm text-stone-500">
                      ₹{item.price} {outOfStock && '· Out of stock'}
                    </p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${
                    selected ? 'border-orange-600 bg-orange-600' : 'border-stone-300'
                  }`}>
                    {selected && <Check className="w-4 h-4 text-white" />}
                  </div>
                </button>
              );
            })}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-8 pt-6 border-t border-stone-100">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-stone-600 hover:bg-stone-100 disabled:opacity-40 disabled:cursor-not-allowed transition-all"
            >
              <ChevronLeft className="w-5 h-5" />
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="btn-primary flex items-center gap-2"
            >
              {currentStep === STEPS.length - 1 ? (
                <>
                  <ShoppingBag className="w-5 h-5" />
                  Add to Cart · ₹{totalPrice}
                </>
              ) : (
                <>
                  Next
                  <ChevronRight className="w-5 h-5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Summary preview */}
        {(selections.base || selections.sauce || selections.cheese || selections.vegetables.length > 0) && (
          <div className="mt-6 card p-5 bg-stone-50 border-stone-200">
            <h3 className="text-sm font-semibold text-stone-700 mb-3">Your Pizza So Far</h3>
            <div className="flex flex-wrap gap-2">
              {selections.base && (
                <span className="badge bg-orange-100 text-orange-700">Base: {selections.base.name}</span>
              )}
              {selections.sauce && (
                <span className="badge bg-red-100 text-red-700">Sauce: {selections.sauce.name}</span>
              )}
              {selections.cheese && (
                <span className="badge bg-yellow-100 text-yellow-700">Cheese: {selections.cheese.name}</span>
              )}
              {selections.vegetables.map((v) => (
                <span key={v._id} className="badge bg-green-100 text-green-700">{v.name}</span>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
