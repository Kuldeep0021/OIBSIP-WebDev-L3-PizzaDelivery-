import mongoose, { Document, Schema, Model } from 'mongoose';

// ── Interface ─────────────────────────────────────────────────────────────────
export interface IInventoryItem extends Document {
  name: string;
  category: 'base' | 'sauce' | 'cheese' | 'vegetable';
  stockQuantity: number;
  threshold: number;
  price: number;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ────────────────────────────────────────────────────────────────────
const InventoryItemSchema = new Schema<IInventoryItem>(
  {
    name: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
      maxlength: [100, 'Name cannot exceed 100 characters'],
    },
    category: {
      type: String,
      enum: {
        values: ['base', 'sauce', 'cheese', 'vegetable'],
        message: 'Category must be one of: base, sauce, cheese, vegetable',
      },
      required: [true, 'Category is required'],
    },
    stockQuantity: {
      type: Number,
      default: 100,
      min: [0, 'Stock quantity cannot be negative'],
    },
    threshold: {
      type: Number,
      default: 20,
      min: [1, 'Threshold must be at least 1'],
    },
    price: {
      type: Number,
      default: 0,
      min: [0, 'Price cannot be negative'],
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
InventoryItemSchema.index({ category: 1 });
InventoryItemSchema.index({ stockQuantity: 1, threshold: 1 });

// ── Model ─────────────────────────────────────────────────────────────────────
const InventoryItem: Model<IInventoryItem> = mongoose.model<IInventoryItem>(
  'InventoryItem',
  InventoryItemSchema
);
export default InventoryItem;
