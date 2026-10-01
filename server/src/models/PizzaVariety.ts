import mongoose, { Document, Schema, Model } from 'mongoose';

// ── Interface ─────────────────────────────────────────────────────────────────
export interface IPizzaVariety extends Document {
  name: string;
  description: string;
  imageUrl: string;
  price: number;
  isAvailable: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ── Schema ────────────────────────────────────────────────────────────────────
const PizzaVarietySchema = new Schema<IPizzaVariety>(
  {
    name: {
      type: String,
      required: [true, 'Pizza name is required'],
      trim: true,
      maxlength: [120, 'Name cannot exceed 120 characters'],
    },
    description: {
      type: String,
      default: '',
      trim: true,
      maxlength: [500, 'Description cannot exceed 500 characters'],
    },
    imageUrl: {
      type: String,
      default: '',
      trim: true,
    },
    price: {
      type: Number,
      required: [true, 'Price is required'],
      min: [0, 'Price cannot be negative'],
    },
    isAvailable: {
      type: Boolean,
      default: true,
    },
  },
  {
    timestamps: true,
    versionKey: false,
  }
);

// ── Indexes ───────────────────────────────────────────────────────────────────
PizzaVarietySchema.index({ isAvailable: 1 });
PizzaVarietySchema.index({ name: 'text', description: 'text' });

// ── Model ─────────────────────────────────────────────────────────────────────
const PizzaVariety: Model<IPizzaVariety> = mongoose.model<IPizzaVariety>(
  'PizzaVariety',
  PizzaVarietySchema
);
export default PizzaVariety;
