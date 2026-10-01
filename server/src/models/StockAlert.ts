import mongoose, { Document, Schema, Model, Types } from 'mongoose';

// ── Interface ─────────────────────────────────────────────────────────────────
export interface IStockAlert extends Document {
  inventoryItemId: Types.ObjectId;
  itemName: string;
  stockAtAlert: number;
  threshold: number;
  emailSent: boolean;
  sentAt: Date;
}

// ── Schema ────────────────────────────────────────────────────────────────────
const StockAlertSchema = new Schema<IStockAlert>(
  {
    inventoryItemId: {
      type: Schema.Types.ObjectId,
      ref: 'InventoryItem',
      required: [true, 'Inventory item reference is required'],
    },
    itemName: {
      type: String,
      required: [true, 'Item name is required'],
      trim: true,
    },
    stockAtAlert: {
      type: Number,
      required: [true, 'Stock quantity at alert time is required'],
      min: 0,
    },
    threshold: {
      type: Number,
      required: [true, 'Threshold is required'],
      min: 1,
    },
    emailSent: {
      type: Boolean,
      default: false,
    },
    sentAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    versionKey: false,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
StockAlertSchema.index({ inventoryItemId: 1, sentAt: -1 });
StockAlertSchema.index({ emailSent: 1 });

// ── Model ─────────────────────────────────────────────────────────────────────
const StockAlert: Model<IStockAlert> = mongoose.model<IStockAlert>(
  'StockAlert',
  StockAlertSchema
);
export default StockAlert;
