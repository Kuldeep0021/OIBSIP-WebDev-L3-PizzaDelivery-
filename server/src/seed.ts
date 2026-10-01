/**
 * Seed Script — Pizza Hub
 * Run with: npm run seed
 *
 * Creates:
 *  - 1 admin user
 *  - 5 bases, 5 sauces, 3 cheeses, 8 vegetables (InventoryItems)
 *  - 6 pizza varieties
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import User from './models/User';
import InventoryItem from './models/InventoryItem';
import PizzaVariety from './models/PizzaVariety';

// ── Connection ────────────────────────────────────────────────────────────────
async function connect(): Promise<void> {
  const uri = process.env.MONGODB_URI;
  if (!uri) throw new Error('MONGODB_URI not set');
  await mongoose.connect(uri);
  console.log('✅ Connected to MongoDB');
}

// ── Admin User ────────────────────────────────────────────────────────────────
async function seedAdmin(): Promise<void> {
  const email = 'admin@pizzahub.com';
  const existing = await User.findOne({ email });
  if (existing) {
    console.log('ℹ️  Admin user already exists — skipping.');
    return;
  }

  await User.create({
    name: 'Pizza Hub Admin',
    email,
    password: 'Admin@123456',
    role: 'admin',
    isEmailVerified: true,
  });

  console.log('✅ Admin user created: admin@pizzahub.com / Admin@123456');
}

// ── Inventory ─────────────────────────────────────────────────────────────────
async function seedInventory(): Promise<void> {
  const items = [
    // Bases
    { name: 'Thin Crust', category: 'base', price: 50, stockQuantity: 100, threshold: 20 },
    { name: 'Thick Crust', category: 'base', price: 60, stockQuantity: 100, threshold: 20 },
    { name: 'Whole Wheat', category: 'base', price: 70, stockQuantity: 100, threshold: 20 },
    { name: 'Cheese Burst', category: 'base', price: 100, stockQuantity: 100, threshold: 20 },
    { name: 'Gluten-Free', category: 'base', price: 90, stockQuantity: 100, threshold: 20 },

    // Sauces
    { name: 'Tomato Marinara', category: 'sauce', price: 30, stockQuantity: 100, threshold: 20 },
    { name: 'Pesto', category: 'sauce', price: 50, stockQuantity: 100, threshold: 20 },
    { name: 'Barbecue', category: 'sauce', price: 40, stockQuantity: 100, threshold: 20 },
    { name: 'White Garlic', category: 'sauce', price: 45, stockQuantity: 100, threshold: 20 },
    { name: 'Spicy Arrabbiata', category: 'sauce', price: 35, stockQuantity: 100, threshold: 20 },

    // Cheeses
    { name: 'Mozzarella', category: 'cheese', price: 60, stockQuantity: 100, threshold: 20 },
    { name: 'Cheddar', category: 'cheese', price: 70, stockQuantity: 100, threshold: 20 },
    { name: 'Parmesan', category: 'cheese', price: 80, stockQuantity: 100, threshold: 20 },

    // Vegetables
    { name: 'Bell Peppers', category: 'vegetable', price: 15, stockQuantity: 100, threshold: 20 },
    { name: 'Mushrooms', category: 'vegetable', price: 20, stockQuantity: 100, threshold: 20 },
    { name: 'Onions', category: 'vegetable', price: 10, stockQuantity: 100, threshold: 20 },
    { name: 'Black Olives', category: 'vegetable', price: 25, stockQuantity: 100, threshold: 20 },
    { name: 'Jalapeños', category: 'vegetable', price: 20, stockQuantity: 100, threshold: 20 },
    { name: 'Corn', category: 'vegetable', price: 15, stockQuantity: 100, threshold: 20 },
    { name: 'Tomatoes', category: 'vegetable', price: 10, stockQuantity: 100, threshold: 20 },
    { name: 'Spinach', category: 'vegetable', price: 20, stockQuantity: 100, threshold: 20 },
  ] as const;

  let created = 0;
  for (const item of items) {
    const exists = await InventoryItem.findOne({
      name: item.name,
      category: item.category,
    });
    if (!exists) {
      await InventoryItem.create(item);
      created++;
    }
  }

  console.log(
    `✅ Inventory seeded: ${created} new item(s) created (${items.length - created} already existed).`
  );
}

// ── Pizza Varieties ───────────────────────────────────────────────────────────
async function seedPizzaVarieties(): Promise<void> {
  const varieties = [
    {
      name: 'Margherita Classic',
      description:
        'Fresh tomato sauce, premium mozzarella, and basil leaves on a thin crust. Simple. Perfect. Timeless.',
      imageUrl: 'https://images.unsplash.com/photo-1574071318508-1cdbab80d002?w=400',
      price: 199,
      isAvailable: true,
    },
    {
      name: 'Farmhouse Veggie',
      description:
        'Loaded with fresh bell peppers, mushrooms, onions, and tomatoes on a whole-wheat base with marinara.',
      imageUrl: 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=400',
      price: 249,
      isAvailable: true,
    },
    {
      name: 'Pesto Paradise',
      description:
        'Creamy pesto sauce with mozzarella, spinach, and black olives on a crispy thin crust.',
      imageUrl: 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=400',
      price: 299,
      isAvailable: true,
    },
    {
      name: 'Spicy Firecracker',
      description:
        'Arrabbiata sauce, jalapeños, corn, onions, and cheddar on a thick crust. Not for the faint-hearted!',
      imageUrl: 'https://images.unsplash.com/photo-1594007654729-407eedc4be65?w=400',
      price: 329,
      isAvailable: true,
    },
    {
      name: 'BBQ Smoky Delight',
      description:
        'Rich barbecue sauce with caramelised onions, mushrooms, and mozzarella on a cheese-burst base.',
      imageUrl: 'https://images.unsplash.com/photo-1571997478779-2adcbbe9ab2f?w=400',
      price: 379,
      isAvailable: true,
    },
    {
      name: 'The Works',
      description:
        'Everything we have! All vegetables, triple cheese blend, white garlic sauce on a cheese-burst base.',
      imageUrl: 'https://images.unsplash.com/photo-1528137871618-79d2761e3fd5?w=400',
      price: 499,
      isAvailable: true,
    },
  ];

  let created = 0;
  for (const pizza of varieties) {
    const exists = await PizzaVariety.findOne({ name: pizza.name });
    if (!exists) {
      await PizzaVariety.create(pizza);
      created++;
    }
  }

  console.log(
    `✅ Pizza varieties seeded: ${created} new item(s) created (${varieties.length - created} already existed).`
  );
}

// ── Main ──────────────────────────────────────────────────────────────────────
async function main(): Promise<void> {
  try {
    await connect();
    await seedAdmin();
    await seedInventory();
    await seedPizzaVarieties();
    console.log('\n🎉 Database seeding completed successfully!');
  } catch (err) {
    console.error('❌ Seeding failed:', (err as Error).message);
    process.exit(1);
  } finally {
    await mongoose.disconnect();
    console.log('🔌 Disconnected from MongoDB');
  }
}

main();
