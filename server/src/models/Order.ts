import mongoose, { Document, Schema, Model, Types } from 'mongoose';

// ── Sub-document interfaces ───────────────────────────────────────────────────
export interface IOrderItemDetails {
  base?: string;
  sauce?: string;
  cheese?: string;
  vegetables?: string[];
  /** Maps ingredient category/name → InventoryItem ObjectId string */
  inventoryItemIds?: Map<string, string>;
}

export interface IOrderItem {
  itemType: 'pizza_variety' | 'custom_pizza';
  itemName: string;
  quantity: number;
  price: number;
  details?: IOrderItemDetails;
}

// ── Order document interface ──────────────────────────────────────────────────
export interface IOrder extends Document {
  userId: Types.ObjectId;
  orderNumber: string;
  status: 'received' | 'kitchen' | 'delivery';
  items: IOrderItem[];
  totalAmount: number;
  deliveryAddress: string;
  customerName: string;
  customerPhone: string;
  paymentStatus: 'pending' | 'paid';
  paymentId?: string;
  razorpayOrderId?: string;
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ── Sub-schemas ───────────────────────────────────────────────────────────────
const OrderItemDetailsSchema = new Schema<IOrderItemDetails>(
  {
    base: { type: String, trim: true },
    sauce: { type: String, trim: true },
    cheese: { type: String, trim: true },
    vegetables: [{ type: String, trim: true }],
    inventoryItemIds: {
      type: Map,
      of: String,
    },
  },
  { _id: false }
);

const OrderItemSchema = new Schema<IOrderItem>(
  {
    itemType: {
      type: String,
      enum: ['pizza_variety', 'custom_pizza'],
      required: [true, 'Item type is required'],
    },
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    quantity: {
      type: Number,
      required: [true, 'Quantity is required'],
      min: [1, 'Quantity must be at least 1'],
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    details: {
      type: OrderItemDetailsSchema,
    },
  },
  { _id: false }
);

// ── Main Schema ───────────────────────────────────────────────────────────────
const OrderSchema = new Schema<IOrder>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
    },
    orderNumber: {
      type: String,
      unique: true,
      required: [true, 'Order number is required'],
      trim: true,
    },
    status: {
      type: String,
      enum: {
        values: ['received', 'kitchen', 'delivery'],
        message: 'Status must be one of: received, kitchen, delivery',
      },
      default: 'received',
    },
    items: {
      type: [OrderItemSchema],
      required: [true, 'Order must have at least one item'],
      validate: {
        validator: (v: IOrderItem[]) => v.length > 0,
        message: 'Order must contain at least one item',
      },
    },
    totalAmount: {
      type: Number,
      required: [true, 'Total amount is required'],
      min: [0, 'Total amount cannot be negative'],
    },
    deliveryAddress: {
      type: String,
      required: [true, 'Delivery address is required'],
      trim: true,
    },
    customerName: {
      type: String,
      required: [true, 'Customer name is required'],
      trim: true,
    },
    customerPhone: {
      type: String,
      required: [true, 'Customer phone is required'],
      trim: true,
    },
    paymentStatus: {
      type: String,
      enum: ['pending', 'paid'],
      default: 'pending',
    },
    paymentId: { type: String, trim: true },
    razorpayOrderId: { type: String, trim: true },
    notes: { type: String, trim: true, maxlength: 500 },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
OrderSchema.index({ userId: 1, createdAt: -1 });
OrderSchema.index({ status: 1 });
OrderSchema.index({ paymentStatus: 1 });
OrderSchema.index({ razorpayOrderId: 1 });

// ── Model ─────────────────────────────────────────────────────────────────────
const Order: Model<IOrder> = mongoose.model<IOrder>('Order', OrderSchema);
export default Order;
