export type UserRole = 'user' | 'admin';

export type OrderStatus = 'received' | 'kitchen' | 'delivery';
export type PaymentStatus = 'pending' | 'paid';

export type InventoryCategory = 'base' | 'sauce' | 'cheese' | 'vegetable';

export interface Profile {
  id: string;
  email: string;
  full_name: string | null;
  role: UserRole;
  phone: string | null;
  created_at: string;
}

export interface InventoryItem {
  id: string;
  name: string;
  category: InventoryCategory;
  stock_quantity: number;
  threshold: number;
  price: number;
  created_at: string;
  updated_at: string;
}

export interface PizzaVariety {
  id: string;
  name: string;
  description: string | null;
  image_url: string | null;
  price: number;
  is_available: boolean;
  created_at: string;
}

export interface Order {
  id: string;
  user_id: string | null;
  order_number: string;
  status: OrderStatus;
  total_amount: number;
  delivery_address: string | null;
  customer_name: string | null;
  customer_phone: string | null;
  payment_status: PaymentStatus;
  payment_id: string | null;
  notes: string | null;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  order_id: string;
  item_type: 'pizza_variety' | 'custom_pizza';
  item_name: string;
  quantity: number;
  price: number;
  details: {
    base?: string;
    sauce?: string;
    cheese?: string;
    vegetables?: string[];
    inventory_item_ids?: Record<string, string>;
  } | null;
}

export interface StockAlert {
  id: string;
  inventory_item_id: string | null;
  item_name: string;
  stock_at_alert: number;
  threshold: number;
  sent_at: string;
}

export interface CartItem {
  type: 'pizza_variety' | 'custom_pizza';
  id: string;
  name: string;
  price: number;
  quantity: number;
  details?: {
    base?: string;
    sauce?: string;
    cheese?: string;
    vegetables?: string[];
    inventory_item_ids?: Record<string, string>;
  };
}

export interface CustomPizzaSelection {
  base: InventoryItem | null;
  sauce: InventoryItem | null;
  cheese: InventoryItem | null;
  vegetables: InventoryItem[];
}
