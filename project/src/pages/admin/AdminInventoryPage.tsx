import { useState, useEffect, useCallback } from 'react';
import api from '@/lib/api';
import {
  Package, Layers, Soup, Pizza, Sprout, Plus, Minus, Loader2,
  AlertTriangle, Save, Search, Pencil, Check, X
} from 'lucide-react';

type InventoryCategory = 'base' | 'sauce' | 'cheese' | 'vegetable';

interface InventoryItem {
  _id: string;
  name: string;
  category: InventoryCategory;
  stockQuantity: number;
  threshold: number;
  price: number;
}

const CATEGORIES: { key: InventoryCategory; label: string; icon: typeof Layers }[] = [
  { key: 'base', label: 'Pizza Bases', icon: Layers },
  { key: 'sauce', label: 'Sauces', icon: Soup },
  { key: 'cheese', label: 'Cheeses', icon: Pizza },
  { key: 'vegetable', label: 'Vegetables', icon: Sprout },
];

export function AdminInventoryPage() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeCategory, setActiveCategory] = useState<InventoryCategory>('base');
  const [searchQuery, setSearchQuery] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editValues, setEditValues] = useState<{ stockQuantity: string; threshold: string; price: string }>({
    stockQuantity: '', threshold: '', price: '',
  });
  const [saving, setSaving] = useState(false);
  const [addingNew, setAddingNew] = useState(false);
  const [newItem, setNewItem] = useState({ name: '', stockQuantity: '', threshold: '20', price: '' });

  const fetchItems = useCallback(async () => {
    try {
      const { data } = await api.get('/inventory');
      setItems(data.inventoryItems || []);
    } catch (err) {
      console.error('Error fetching inventory:', err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const filteredItems = items
    .filter((i) => i.category === activeCategory)
    .filter((i) => i.name.toLowerCase().includes(searchQuery.toLowerCase()));

  const startEdit = (item: InventoryItem) => {
    setEditingId(item._id);
    setEditValues({
      stockQuantity: String(item.stockQuantity),
      threshold: String(item.threshold),
      price: String(item.price),
    });
  };

  const saveEdit = async (id: string) => {
    setSaving(true);
    try {
      const { data } = await api.put(`/inventory/${id}`, {
        stockQuantity: parseInt(editValues.stockQuantity) || 0,
        threshold: parseInt(editValues.threshold) || 20,
        price: parseFloat(editValues.price) || 0,
      });
      setItems((prev) => prev.map((i) => (i._id === id ? data.inventoryItem : i)));
      setEditingId(null);
    } catch (err) {
      console.error('Error updating inventory:', err);
    } finally {
      setSaving(false);
    }
  };

  const quickAdjust = async (item: InventoryItem, delta: number) => {
    const newStock = Math.max(0, item.stockQuantity + delta);
    try {
      await api.patch(`/inventory/${item._id}/adjust`, { delta });
      setItems((prev) => prev.map((i) => (i._id === item._id ? { ...i, stockQuantity: newStock } : i)));
    } catch (err) {
      console.error('Error adjusting inventory:', err);
    }
  };

  const handleAddItem = async () => {
    if (!newItem.name || !newItem.stockQuantity) return;
    setSaving(true);
    try {
      const { data } = await api.post('/inventory', {
        name: newItem.name,
        category: activeCategory,
        stockQuantity: parseInt(newItem.stockQuantity) || 0,
        threshold: parseInt(newItem.threshold) || 20,
        price: parseFloat(newItem.price) || 0,
      });
      setItems((prev) => [...prev, data.inventoryItem]);
      setNewItem({ name: '', stockQuantity: '', threshold: '20', price: '' });
      setAddingNew(false);
    } catch (err) {
      console.error('Error adding inventory item:', err);
    } finally {
      setSaving(false);
    }
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
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 md:py-12">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <h1 className="text-3xl font-bold text-stone-900 mb-2">Inventory Management</h1>
            <p className="text-stone-500">Manage stock levels and set alert thresholds</p>
          </div>
          <button
            onClick={() => setAddingNew(!addingNew)}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="w-5 h-5" />
            Add Item
          </button>
        </div>

        {/* Category tabs */}
        <div className="flex gap-2 mb-6 overflow-x-auto scrollbar-hide">
          {CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const count = items.filter((i) => i.category === cat.key).length;
            const lowCount = items.filter((i) => i.category === cat.key && i.stockQuantity < i.threshold).length;
            return (
              <button
                key={cat.key}
                onClick={() => { setActiveCategory(cat.key); setAddingNew(false); setEditingId(null); }}
                className={`flex items-center gap-2 px-5 py-2.5 rounded-xl font-medium text-sm whitespace-nowrap transition-all ${
                  activeCategory === cat.key
                    ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20'
                    : 'bg-white text-stone-600 hover:bg-stone-100 border border-stone-200'
                }`}
              >
                <Icon className="w-4 h-4" />
                {cat.label}
                <span className={`text-xs px-1.5 py-0.5 rounded-full ${
                  activeCategory === cat.key ? 'bg-white/20' : 'bg-stone-100'
                }`}>
                  {count}
                </span>
                {lowCount > 0 && (
                  <span className="flex items-center gap-0.5 text-xs px-1.5 py-0.5 rounded-full bg-red-500 text-white">
                    <AlertTriangle className="w-3 h-3" />
                    {lowCount}
                  </span>
                )}
              </button>
            );
          })}
        </div>

        {/* Search */}
        <div className="relative mb-6">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-stone-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="input-field pl-11"
            placeholder="Search items..."
          />
        </div>

        {/* Add new item form */}
        {addingNew && (
          <div className="card p-5 mb-6 border-2 border-orange-200 animate-slide-up">
            <h3 className="font-bold text-stone-900 mb-4">Add New {CATEGORIES.find(c => c.key === activeCategory)?.label.slice(0, -1)} Item</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              <input
                type="text"
                value={newItem.name}
                onChange={(e) => setNewItem({ ...newItem, name: e.target.value })}
                className="input-field"
                placeholder="Item name"
              />
              <input
                type="number"
                value={newItem.stockQuantity}
                onChange={(e) => setNewItem({ ...newItem, stockQuantity: e.target.value })}
                className="input-field"
                placeholder="Stock quantity"
              />
              <input
                type="number"
                value={newItem.threshold}
                onChange={(e) => setNewItem({ ...newItem, threshold: e.target.value })}
                className="input-field"
                placeholder="Alert threshold"
              />
              <input
                type="number"
                value={newItem.price}
                onChange={(e) => setNewItem({ ...newItem, price: e.target.value })}
                className="input-field"
                placeholder="Price (₹)"
              />
            </div>
            <div className="flex items-center gap-3 mt-4">
              <button
                onClick={handleAddItem}
                disabled={saving || !newItem.name}
                className="btn-primary flex items-center gap-2"
              >
                {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
                Save Item
              </button>
              <button
                onClick={() => setAddingNew(false)}
                className="btn-ghost flex items-center gap-2"
              >
                <X className="w-4 h-4" />
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Inventory table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-stone-50 border-b border-stone-200">
                  <th className="text-left px-6 py-4 text-sm font-semibold text-stone-600">Item Name</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-stone-600">Stock</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-stone-600">Threshold</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-stone-600">Price</th>
                  <th className="text-center px-6 py-4 text-sm font-semibold text-stone-600">Status</th>
                  <th className="text-right px-6 py-4 text-sm font-semibold text-stone-600">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredItems.map((item) => {
                  const isLow = item.stockQuantity < item.threshold;
                  const isEditing = editingId === item._id;
                  return (
                    <tr key={item._id} className="hover:bg-stone-50 transition-colors">
                      <td className="px-6 py-4">
                        <span className="font-medium text-stone-900">{item.name}</span>
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValues.stockQuantity}
                            onChange={(e) => setEditValues({ ...editValues, stockQuantity: e.target.value })}
                            className="w-20 px-2 py-1 border border-stone-200 rounded-lg text-center"
                          />
                        ) : (
                          <div className="flex items-center justify-center gap-2">
                            <button
                              onClick={() => quickAdjust(item, -1)}
                              className="w-7 h-7 rounded-lg border border-stone-200 flex items-center justify-center hover:bg-stone-100"
                            >
                              <Minus className="w-3.5 h-3.5" />
                            </button>
                            <span className={`font-bold w-12 ${isLow ? 'text-red-600' : 'text-stone-900'}`}>
                              {item.stockQuantity}
                            </span>
                            <button
                              onClick={() => quickAdjust(item, 1)}
                              className="w-7 h-7 rounded-lg border border-stone-200 flex items-center justify-center hover:bg-stone-100"
                            >
                              <Plus className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValues.threshold}
                            onChange={(e) => setEditValues({ ...editValues, threshold: e.target.value })}
                            className="w-20 px-2 py-1 border border-stone-200 rounded-lg text-center"
                          />
                        ) : (
                          <span className="text-stone-600">{item.threshold}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isEditing ? (
                          <input
                            type="number"
                            value={editValues.price}
                            onChange={(e) => setEditValues({ ...editValues, price: e.target.value })}
                            className="w-20 px-2 py-1 border border-stone-200 rounded-lg text-center"
                          />
                        ) : (
                          <span className="text-stone-600">₹{item.price}</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-center">
                        {isLow ? (
                          <span className="badge bg-red-100 text-red-700">
                            <AlertTriangle className="w-3.5 h-3.5" />
                            Low Stock
                          </span>
                        ) : (
                          <span className="badge bg-green-100 text-green-700">
                            <Package className="w-3.5 h-3.5" />
                            In Stock
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {isEditing ? (
                          <div className="flex items-center justify-end gap-2">
                            <button
                              onClick={() => saveEdit(item._id)}
                              disabled={saving}
                              className="w-8 h-8 rounded-lg bg-green-600 text-white flex items-center justify-center hover:bg-green-700"
                            >
                              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
                            </button>
                            <button
                              onClick={() => setEditingId(null)}
                              className="w-8 h-8 rounded-lg bg-stone-200 text-stone-600 flex items-center justify-center hover:bg-stone-300"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => startEdit(item)}
                            className="w-8 h-8 rounded-lg text-stone-500 hover:bg-stone-100 flex items-center justify-center inline-flex"
                          >
                            <Pencil className="w-4 h-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
          {filteredItems.length === 0 && (
            <div className="text-center py-12 text-stone-400">
              <Package className="w-12 h-12 mx-auto mb-3 opacity-50" />
              <p>No items found</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
