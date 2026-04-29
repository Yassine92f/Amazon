import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole, UserStatus } from '@ecommerce/shared';
import { config } from '../config';
import { UserModel } from '../infrastructure/database/models/User';
import { SellerModel } from '../infrastructure/database/models/Seller';
import { CategoryModel } from '../infrastructure/database/models/Category';
import { ProductModel } from '../infrastructure/database/models/Product';
import { PriceHistoryModel } from '../infrastructure/database/models/PriceHistory';
import { ReviewModel } from '../infrastructure/database/models/Review';

const DEFAULT_PASSWORD = 'Password123';

interface SellerSeed {
  email: string;
  firstName: string;
  lastName: string;
  shopName: string;
  shopSlug: string;
  description: string;
  isVerified: boolean;
}

interface CategorySeed {
  slug: string;
  name: string;
  description?: string;
  icon?: string;
  parentSlug?: string;
}

interface VariantSeed {
  name: string;
  sku: string;
  price: number;
  compareAtPrice?: number;
  stock: number;
  attributes?: Record<string, string>;
}

interface ProductSeed {
  slug: string;
  name: string;
  description: string;
  shopSlug: string;
  categorySlug: string;
  brand: string;
  tags: string[];
  image: string;
  variants: VariantSeed[];
  rating: number;
  reviewCount: number;
  totalSold: number;
  isFeatured?: boolean;
}

const sellers: SellerSeed[] = [
  {
    email: 'apple@abracadabra.local',
    firstName: 'Apple',
    lastName: 'Store',
    shopName: 'Apple Store',
    shopSlug: 'apple-store',
    description:
      'Official Apple reseller. Latest iPhones, Macs, AirPods, Apple Watch and accessories with full Apple Care.',
    isVerified: true,
  },
  {
    email: 'sony@abracadabra.local',
    firstName: 'Sony',
    lastName: 'Official',
    shopName: 'Sony Official',
    shopSlug: 'sony-official',
    description:
      'Sony electronics directly from the brand: headphones, PlayStation accessories, cameras and home audio.',
    isVerified: true,
  },
  {
    email: 'techhub@abracadabra.local',
    firstName: 'Tech',
    lastName: 'Hub',
    shopName: 'TechHub Premium',
    shopSlug: 'techhub-premium',
    description:
      'Premium tech curated for professionals. Samsung, LG, Logitech, gaming gear and home office essentials.',
    isVerified: true,
  },
  {
    email: 'fitlife@abracadabra.local',
    firstName: 'FitLife',
    lastName: 'Pro',
    shopName: 'FitLife Pro',
    shopSlug: 'fitlife-pro',
    description:
      'Equipment and apparel for athletes and fitness enthusiasts. Free shipping over €50.',
    isVerified: true,
  },
  {
    email: 'lifestyle@abracadabra.local',
    firstName: 'Lifestyle',
    lastName: 'Co',
    shopName: 'Lifestyle Co',
    shopSlug: 'lifestyle-co',
    description: 'Coffee machines, beauty, books and lifestyle picks for the modern home.',
    isVerified: false,
  },
];

const categories: CategorySeed[] = [
  // L1
  {
    slug: 'electronics',
    name: 'Electronics',
    icon: '📱',
    description: 'Phones, audio, computers and accessories',
  },
  {
    slug: 'gaming',
    name: 'Gaming',
    icon: '🎮',
    description: 'Consoles, controllers and gaming gear',
  },
  {
    slug: 'fashion',
    name: 'Fashion',
    icon: '👟',
    description: 'Footwear and apparel from top brands',
  },
  { slug: 'sports', name: 'Sports', icon: '⚽', description: 'Equipment for every sport' },
  { slug: 'beauty', name: 'Beauty', icon: '💎', description: 'Skincare, makeup, perfumes' },
  { slug: 'books', name: 'Books', icon: '📚', description: 'Bestsellers and timeless classics' },
  {
    slug: 'home',
    name: 'Home & Kitchen',
    icon: '🏠',
    description: 'Appliances and home essentials',
  },
  { slug: 'toys', name: 'Toys', icon: '🧸', description: 'Building sets, models and collectibles' },
  // L2 (children)
  {
    slug: 'audio',
    name: 'Audio',
    icon: '🎧',
    parentSlug: 'electronics',
    description: 'Headphones, earbuds, speakers',
  },
  { slug: 'phones', name: 'Smartphones', icon: '📱', parentSlug: 'electronics' },
  { slug: 'computers', name: 'Computers & Peripherals', icon: '⌨️', parentSlug: 'electronics' },
  { slug: 'wearables', name: 'Wearables', icon: '⌚', parentSlug: 'electronics' },
];

const products: ProductSeed[] = [
  {
    slug: 'sony-wh-1000xm5',
    name: 'Sony WH-1000XM5 Wireless Noise-Cancelling Headphones',
    description:
      'Industry-leading noise cancellation with dual processors and 8 microphones. Crystal-clear hands-free calling. Up to 30 hours of battery life. Multipoint connection for two devices. Includes carrying case and USB-C cable.',
    shopSlug: 'sony-official',
    categorySlug: 'audio',
    brand: 'Sony',
    tags: ['headphones', 'wireless', 'noise-cancelling'],
    image: '/products/sony-wh1000xm5-sm.jpg',
    variants: [
      {
        name: 'Black',
        sku: 'SONY-1000XM5-BLK',
        price: 209,
        compareAtPrice: 349.99,
        stock: 42,
        attributes: { color: 'black' },
      },
      {
        name: 'Silver',
        sku: 'SONY-1000XM5-SLV',
        price: 219,
        compareAtPrice: 349.99,
        stock: 12,
        attributes: { color: 'silver' },
      },
    ],
    rating: 4.7,
    reviewCount: 2341,
    totalSold: 982,
    isFeatured: true,
  },
  {
    slug: 'samsung-galaxy-s24-ultra',
    name: 'Samsung Galaxy S24 Ultra 256GB',
    description:
      'Galaxy AI features. Titanium frame, 6.8-inch QHD+ Dynamic AMOLED. 200MP camera, S Pen included. Snapdragon 8 Gen 3. 5G ready.',
    shopSlug: 'techhub-premium',
    categorySlug: 'phones',
    brand: 'Samsung',
    tags: ['smartphone', '5g', 'android'],
    image: '/products/samsung-s24ultra-sm.jpg',
    variants: [
      {
        name: 'Titanium Black 256GB',
        sku: 'SAM-S24U-256-BLK',
        price: 899,
        compareAtPrice: 1299,
        stock: 23,
        attributes: { color: 'black', storage: '256GB' },
      },
      {
        name: 'Titanium Violet 256GB',
        sku: 'SAM-S24U-256-VLT',
        price: 899,
        compareAtPrice: 1299,
        stock: 8,
        attributes: { color: 'violet', storage: '256GB' },
      },
    ],
    rating: 4.8,
    reviewCount: 5672,
    totalSold: 1421,
    isFeatured: true,
  },
  {
    slug: 'logitech-mx-keys-s',
    name: 'Logitech MX Keys S Wireless Keyboard',
    description:
      'Perfect-stroke typing. Smart illumination adapts to hands and ambient light. USB-C charging, up to 10 days per charge. Bluetooth Multi-OS.',
    shopSlug: 'techhub-premium',
    categorySlug: 'computers',
    brand: 'Logitech',
    tags: ['keyboard', 'wireless', 'productivity'],
    image: '/products/logitech-mxkeys-sm.jpg',
    variants: [
      {
        name: 'Graphite',
        sku: 'LOG-MXK-GRP',
        price: 89,
        compareAtPrice: 119,
        stock: 67,
        attributes: { color: 'graphite' },
      },
      {
        name: 'Pale Grey',
        sku: 'LOG-MXK-PGY',
        price: 89,
        compareAtPrice: 119,
        stock: 15,
        attributes: { color: 'pale-grey' },
      },
    ],
    rating: 4.6,
    reviewCount: 1893,
    totalSold: 612,
    isFeatured: true,
  },
  {
    slug: 'lg-ultragear-27',
    name: 'LG UltraGear 27" QHD Gaming Monitor',
    description:
      '27-inch QHD 2560×1440, 240Hz refresh, 1ms response, IPS panel. NVIDIA G-SYNC compatible, HDR10. Pivot, tilt and height-adjustable stand.',
    shopSlug: 'techhub-premium',
    categorySlug: 'computers',
    brand: 'LG',
    tags: ['monitor', 'gaming', '240hz'],
    image: '/products/lg-ultragear-sm.jpg',
    variants: [
      {
        name: '27" QHD 240Hz',
        sku: 'LG-UG-27-QHD-240',
        price: 279,
        compareAtPrice: 399,
        stock: 31,
      },
    ],
    rating: 4.9,
    reviewCount: 8234,
    totalSold: 2143,
    isFeatured: true,
  },
  {
    slug: 'sony-dualsense-edge',
    name: 'Sony DualSense Edge Wireless Controller',
    description:
      'Highly customizable controller for PS5. Swappable stick modules, back buttons, multiple profiles. Includes carrying case, USB-C cable and replacement caps.',
    shopSlug: 'sony-official',
    categorySlug: 'gaming',
    brand: 'Sony',
    tags: ['playstation', 'controller', 'ps5'],
    image: '/products/sony-dualsense-sm.jpg',
    variants: [
      {
        name: 'White',
        sku: 'SONY-DSE-WHT',
        price: 179,
        compareAtPrice: 249,
        stock: 22,
        attributes: { color: 'white' },
      },
    ],
    rating: 4.4,
    reviewCount: 1456,
    totalSold: 487,
  },
  {
    slug: 'nike-air-max-90',
    name: 'Nike Air Max 90',
    description:
      'Iconic comfort with visible Max Air, plush midsole and durable rubber Waffle outsole. Mesh and synthetic leather upper. Available in classic and modern colorways.',
    shopSlug: 'lifestyle-co',
    categorySlug: 'fashion',
    brand: 'Nike',
    tags: ['shoes', 'sneakers', 'streetwear'],
    image: '/products/nike-airmax90-sm.jpg',
    variants: [
      {
        name: 'White / Black — EU 42',
        sku: 'NIKE-AM90-WB-42',
        price: 139.99,
        stock: 14,
        attributes: { size: '42', color: 'white-black' },
      },
      {
        name: 'White / Black — EU 43',
        sku: 'NIKE-AM90-WB-43',
        price: 139.99,
        stock: 9,
        attributes: { size: '43', color: 'white-black' },
      },
      {
        name: 'White / Black — EU 44',
        sku: 'NIKE-AM90-WB-44',
        price: 139.99,
        stock: 3,
        attributes: { size: '44', color: 'white-black' },
      },
    ],
    rating: 4.6,
    reviewCount: 3421,
    totalSold: 1899,
  },
  {
    slug: 'apple-watch-ultra-2',
    name: 'Apple Watch Ultra 2',
    description:
      '49mm titanium case, always-on Retina display up to 3000 nits. Precision dual-frequency GPS, depth gauge, 86-decibel siren. Up to 36 hours of battery.',
    shopSlug: 'apple-store',
    categorySlug: 'wearables',
    brand: 'Apple',
    tags: ['smartwatch', 'fitness', 'apple'],
    image: '/products/apple-watch-ultra2-sm.jpg',
    variants: [
      {
        name: 'Titanium / Trail Loop',
        sku: 'APL-WU2-TRL',
        price: 799,
        stock: 18,
        attributes: { band: 'trail-loop' },
      },
      {
        name: 'Titanium / Ocean Band',
        sku: 'APL-WU2-OCN',
        price: 799,
        stock: 6,
        attributes: { band: 'ocean' },
      },
    ],
    rating: 4.8,
    reviewCount: 2876,
    totalSold: 1054,
  },
  {
    slug: 'airpods-pro-2',
    name: 'Apple AirPods Pro (2nd Gen) with USB-C',
    description:
      'H2 chip for richer audio and smarter noise cancellation. Adaptive Audio, Personalized Spatial Audio. Up to 6 hours of listening time, 30 hours with case.',
    shopSlug: 'apple-store',
    categorySlug: 'audio',
    brand: 'Apple',
    tags: ['earbuds', 'wireless', 'apple'],
    image: '/products/airpods-pro2-sm.jpg',
    variants: [
      { name: 'White', sku: 'APL-APP2-WHT', price: 249, stock: 88, attributes: { color: 'white' } },
    ],
    rating: 4.8,
    reviewCount: 12453,
    totalSold: 4231,
    isFeatured: true,
  },
  {
    slug: 'lego-porsche-911',
    name: 'LEGO Technic Porsche 911 GT3 RS',
    description:
      '1580 pieces, exact replica with working 8-speed sequential gearbox, double-wishbone suspension, differential and steering. Display stand included.',
    shopSlug: 'lifestyle-co',
    categorySlug: 'toys',
    brand: 'LEGO',
    tags: ['building', 'collectible', 'cars'],
    image: '/products/lego-porsche-sm.jpg',
    variants: [
      {
        name: 'Standard set',
        sku: 'LEGO-PORSCHE-911',
        price: 379.99,
        compareAtPrice: 449.99,
        stock: 11,
      },
    ],
    rating: 4.9,
    reviewCount: 7654,
    totalSold: 3210,
  },
  {
    slug: 'cerave-moisturizing-cream',
    name: 'CeraVe Moisturizing Cream 340g',
    description:
      'Daily face and body moisturizer for dry to very dry skin. With 3 essential ceramides + hyaluronic acid. Fragrance-free, non-comedogenic.',
    shopSlug: 'lifestyle-co',
    categorySlug: 'beauty',
    brand: 'CeraVe',
    tags: ['skincare', 'moisturizer', 'dermatology'],
    image: '/products/cerave-cream-sm.jpg',
    variants: [
      { name: '340g jar', sku: 'CERAVE-MC-340', price: 14.99, stock: 142 },
      { name: '454g jar', sku: 'CERAVE-MC-454', price: 19.49, stock: 76 },
    ],
    rating: 4.7,
    reviewCount: 24876,
    totalSold: 9482,
  },
  {
    slug: 'delonghi-magnifica-evo',
    name: "De'Longhi Magnifica Evo Bean-to-Cup Coffee Machine",
    description:
      'Fully automatic espresso machine. Built-in conical burr grinder with 13 settings. LatteCrema system for cappuccinos at the touch of a button. Auto-clean cycles.',
    shopSlug: 'lifestyle-co',
    categorySlug: 'home',
    brand: "De'Longhi",
    tags: ['coffee', 'kitchen', 'espresso'],
    image: '/products/delonghi-coffee-sm.jpg',
    variants: [
      { name: 'Silver', sku: 'DLG-MAG-EVO-SLV', price: 379, stock: 24 },
      { name: 'Black', sku: 'DLG-MAG-EVO-BLK', price: 379, stock: 7 },
    ],
    rating: 4.6,
    reviewCount: 892,
    totalSold: 318,
  },
  {
    slug: 'atomic-habits-book',
    name: 'Atomic Habits by James Clear',
    description:
      'An easy & proven way to build good habits & break bad ones. International bestseller. Paperback edition, 320 pages.',
    shopSlug: 'lifestyle-co',
    categorySlug: 'books',
    brand: 'Avery',
    tags: ['self-help', 'productivity', 'bestseller'],
    image: '/products/atomic-habits-sm.jpg',
    variants: [
      { name: 'Paperback', sku: 'BOOK-AHJC-PB', price: 12.99, stock: 234 },
      { name: 'Hardcover', sku: 'BOOK-AHJC-HC', price: 22.99, stock: 41 },
    ],
    rating: 4.9,
    reviewCount: 48234,
    totalSold: 18923,
  },
  {
    slug: 'adjustable-dumbbells-20kg',
    name: 'Adjustable Dumbbells Set 20kg (pair)',
    description:
      'Two adjustable dumbbells, 2.5kg → 20kg each in 2.5kg increments. Compact replacing 15 traditional dumbbells. Anti-slip handle. Storage tray included.',
    shopSlug: 'fitlife-pro',
    categorySlug: 'sports',
    brand: 'FitLife',
    tags: ['fitness', 'strength', 'home-gym'],
    image: '/products/dumbbells-sm.jpg',
    variants: [
      { name: '2 × 20kg', sku: 'FL-AD-20-PAIR', price: 89.99, stock: 38 },
      { name: '2 × 32kg', sku: 'FL-AD-32-PAIR', price: 129.99, stock: 21 },
    ],
    rating: 4.4,
    reviewCount: 3456,
    totalSold: 1287,
  },
];

// Admin + buyer accounts (buyers author the seeded product reviews).
const ADMIN = { email: 'admin@abracadabra.local', firstName: 'Admin', lastName: 'Abracadabra' };

const buyers = [
  { email: 'alice@abracadabra.local', firstName: 'Alice', lastName: 'Martin' },
  { email: 'bruno@abracadabra.local', firstName: 'Bruno', lastName: 'Diallo' },
  { email: 'chloe@abracadabra.local', firstName: 'Chloé', lastName: 'Nguyen' },
  { email: 'driss@abracadabra.local', firstName: 'Driss', lastName: 'El Amrani' },
  { email: 'emma@abracadabra.local', firstName: 'Emma', lastName: 'Rossi' },
];

// Pool of realistic French reviews drawn at random per product.
const reviewPool: { rating: number; title: string; comment: string }[] = [
  {
    rating: 5,
    title: 'Parfait, rien à redire',
    comment:
      'Livraison rapide et produit conforme à la description. Je recommande vivement, la qualité est au rendez-vous.',
  },
  {
    rating: 5,
    title: 'Excellent rapport qualité-prix',
    comment:
      'Très satisfait de mon achat, je ne m’attendais pas à une telle finition à ce prix. À recommander.',
  },
  {
    rating: 4,
    title: 'Très bon produit',
    comment:
      'Conforme à mes attentes, quelques détails perfectibles mais rien de bloquant. Je rachèterais.',
  },
  {
    rating: 4,
    title: 'Satisfait dans l’ensemble',
    comment:
      'Bon produit, emballage soigné. Un point en moins pour le délai de livraison un peu long.',
  },
  {
    rating: 3,
    title: 'Correct sans plus',
    comment:
      'Le produit fait le travail mais sans surprise. La qualité est moyenne pour le prix demandé.',
  },
  {
    rating: 5,
    title: 'Je suis conquis',
    comment:
      'Au-delà de mes espérances, je l’utilise tous les jours. Service client réactif en prime.',
  },
  {
    rating: 2,
    title: 'Déçu',
    comment:
      'La qualité ne correspond pas vraiment aux photos. Heureusement le vendeur a été à l’écoute.',
  },
  {
    rating: 4,
    title: 'Bonne surprise',
    comment: 'Je recommande, l’ensemble est solide et bien pensé. Parfait pour un usage quotidien.',
  },
];

interface RunOptions {
  cleanFirst: boolean;
}

// Storylines for the price-history chart so the seeded data reads as real
// market motion instead of random noise. Each variant rolls one of these.
type PriceStory = 'lowest-ever' | 'recent-drop' | 'spike-then-back' | 'gentle-down' | 'volatile';

const PRICE_STORIES: PriceStory[] = [
  'lowest-ever',
  'recent-drop',
  'spike-then-back',
  'gentle-down',
  'volatile',
];

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function seedPriceHistoryForProduct(productDoc: any): Promise<void> {
  const DAYS = 120;
  const now = Date.now();
  const oneDay = 24 * 60 * 60 * 1000;

  for (const variant of productDoc.variants) {
    const current: number = variant.price;
    const story = PRICE_STORIES[Math.floor(Math.random() * PRICE_STORIES.length)];

    const entries: { daysAgo: number; price: number }[] = [];

    switch (story) {
      case 'lowest-ever':
        // Was much pricier (+30–40%), then steadily dropped to today's value
        // which is the lowest ever recorded. Earns the green badge.
        entries.push({ daysAgo: DAYS, price: round(current * 1.4) });
        entries.push({ daysAgo: 90, price: round(current * 1.3) });
        entries.push({ daysAgo: 60, price: round(current * 1.2) });
        entries.push({ daysAgo: 30, price: round(current * 1.1) });
        entries.push({ daysAgo: 10, price: round(current * 1.05) });
        break;

      case 'recent-drop':
        // Stable around +20% for most of the window, then a sharp markdown in
        // the last two weeks. Earns the orange "drop from max" badge.
        entries.push({ daysAgo: DAYS, price: round(current * 1.2) });
        entries.push({ daysAgo: 80, price: round(current * 1.22) });
        entries.push({ daysAgo: 40, price: round(current * 1.2) });
        entries.push({ daysAgo: 14, price: round(current * 1.18) });
        entries.push({ daysAgo: 7, price: round(current * 1.05) });
        break;

      case 'spike-then-back':
        // A one-month spike (e.g. shortage), then back to the original level.
        // Demonstrates that "regular" price ≠ recent peak.
        entries.push({ daysAgo: DAYS, price: round(current) });
        entries.push({ daysAgo: 80, price: round(current * 1.05) });
        entries.push({ daysAgo: 50, price: round(current * 1.35) });
        entries.push({ daysAgo: 30, price: round(current * 1.3) });
        entries.push({ daysAgo: 15, price: round(current * 1.1) });
        break;

      case 'gentle-down':
        // Slow, monotonic decrease — a maturing product.
        entries.push({ daysAgo: DAYS, price: round(current * 1.15) });
        entries.push({ daysAgo: 90, price: round(current * 1.12) });
        entries.push({ daysAgo: 60, price: round(current * 1.08) });
        entries.push({ daysAgo: 30, price: round(current * 1.04) });
        entries.push({ daysAgo: 10, price: round(current * 1.02) });
        break;

      case 'volatile':
        // Up-and-down — exposes a seller that keeps repricing.
        entries.push({ daysAgo: DAYS, price: round(current * 1.0) });
        entries.push({ daysAgo: 95, price: round(current * 1.18) });
        entries.push({ daysAgo: 70, price: round(current * 0.92) });
        entries.push({ daysAgo: 45, price: round(current * 1.25) });
        entries.push({ daysAgo: 20, price: round(current * 1.0) });
        entries.push({ daysAgo: 8, price: round(current * 1.08) });
        break;
    }

    // Latest observation always equals the current buy-box price.
    entries.push({ daysAgo: 1, price: current });

    await PriceHistoryModel.insertMany(
      entries.map((e) => ({
        productId: productDoc._id,
        variantId: variant._id,
        price: e.price,
        recordedAt: new Date(now - e.daysAgo * oneDay),
      })),
    );
  }
}

function round(value: number): number {
  return Math.max(1, Math.round(value * 100) / 100);
}

async function run({ cleanFirst }: RunOptions): Promise<void> {
  console.log(`[seed] Connecting to ${config.mongodb.uri}`);
  await mongoose.connect(config.mongodb.uri);

  if (cleanFirst) {
    console.log('[seed] Cleaning seed-related collections…');
    const sellerEmails = sellers.map((s) => s.email);
    const sellerUserDocs = await UserModel.find({ email: { $in: sellerEmails } });
    const sellerUserIds = sellerUserDocs.map((u) => u._id);

    const sellerDocs = await SellerModel.find({ userId: { $in: sellerUserIds } });
    const sellerIds = sellerDocs.map((s) => s._id);

    await ReviewModel.deleteMany({ productId: { $exists: true } });
    await PriceHistoryModel.deleteMany({});
    await ProductModel.deleteMany({ sellerId: { $in: sellerIds } });
    await SellerModel.deleteMany({ _id: { $in: sellerIds } });
    await UserModel.deleteMany({ _id: { $in: sellerUserIds } });
    await UserModel.deleteMany({ email: { $in: [ADMIN.email, ...buyers.map((b) => b.email)] } });
    await CategoryModel.deleteMany({ slug: { $in: categories.map((c) => c.slug) } });
  }

  // ── Users + Sellers ────────────────────────────────────────
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const sellerIdByShopSlug = new Map<string, mongoose.Types.ObjectId>();

  for (const s of sellers) {
    const user = await UserModel.create({
      email: s.email.toLowerCase(),
      password: hashedPassword,
      firstName: s.firstName,
      lastName: s.lastName,
      role: UserRole.SELLER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    });
    const seller = await SellerModel.create({
      userId: user._id,
      shopName: s.shopName,
      shopSlug: s.shopSlug,
      description: s.description,
      isVerified: s.isVerified,
      rating: 4 + Math.random(),
      reviewCount: Math.floor(Math.random() * 5000) + 200,
      totalSales: Math.floor(Math.random() * 20000) + 1000,
      totalRevenue: Math.floor(Math.random() * 800000) + 20000,
    });
    sellerIdByShopSlug.set(s.shopSlug, seller._id as mongoose.Types.ObjectId);
    console.log(`[seed]   seller: ${s.shopName} <${s.email}>`);
  }

  // Admin account (for the admin dashboard + product moderation).
  await UserModel.create({
    email: ADMIN.email,
    password: hashedPassword,
    firstName: ADMIN.firstName,
    lastName: ADMIN.lastName,
    role: UserRole.ADMIN,
    status: UserStatus.ACTIVE,
    emailVerified: true,
  });
  console.log(`[seed]   admin: <${ADMIN.email}>`);

  // Buyer accounts (authors of the seeded reviews).
  const buyerIds: mongoose.Types.ObjectId[] = [];
  for (const b of buyers) {
    const user = await UserModel.create({
      email: b.email,
      password: hashedPassword,
      firstName: b.firstName,
      lastName: b.lastName,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
    });
    buyerIds.push(user._id as mongoose.Types.ObjectId);
  }
  console.log(`[seed]   ${buyers.length} buyers`);

  // ── Categories (parents first) ─────────────────────────────
  const catIdBySlug = new Map<string, mongoose.Types.ObjectId>();

  for (const c of categories.filter((x) => !x.parentSlug)) {
    const cat = await CategoryModel.create({
      slug: c.slug,
      name: c.name,
      description: c.description,
      icon: c.icon,
      isActive: true,
    });
    catIdBySlug.set(c.slug, cat._id as mongoose.Types.ObjectId);
    console.log(`[seed]   category: ${c.name}`);
  }
  for (const c of categories.filter((x) => x.parentSlug)) {
    const parentId = catIdBySlug.get(c.parentSlug!);
    if (!parentId) throw new Error(`Missing parent ${c.parentSlug} for ${c.slug}`);
    const cat = await CategoryModel.create({
      slug: c.slug,
      name: c.name,
      description: c.description,
      icon: c.icon,
      isActive: true,
      parentId,
    });
    catIdBySlug.set(c.slug, cat._id as mongoose.Types.ObjectId);
    console.log(`[seed]   subcategory: ${c.name} (parent: ${c.parentSlug})`);
  }

  // ── Products ───────────────────────────────────────────────
  const createdProducts: mongoose.Types.ObjectId[] = [];
  for (const p of products) {
    const sellerId = sellerIdByShopSlug.get(p.shopSlug);
    const categoryId = catIdBySlug.get(p.categorySlug);
    if (!sellerId) throw new Error(`Unknown shop ${p.shopSlug}`);
    if (!categoryId) throw new Error(`Unknown category ${p.categorySlug}`);

    const doc = await ProductModel.create({
      sellerId,
      categoryId,
      name: p.name,
      slug: p.slug,
      description: p.description,
      brand: p.brand,
      tags: p.tags,
      images: [p.image],
      variants: p.variants.map((v) => ({
        name: v.name,
        sku: v.sku,
        price: v.price,
        compareAtPrice: v.compareAtPrice,
        stock: v.stock,
        attributes: v.attributes ?? {},
        images: [],
      })),
      rating: p.rating,
      reviewCount: p.reviewCount,
      totalSold: p.totalSold,
      isActive: true,
      isFeatured: p.isFeatured ?? false,
    });
    createdProducts.push(doc._id as mongoose.Types.ObjectId);

    // ── Synthetic price history (~120 days, varied storylines) ──
    // Each variant gets one of a small set of "stories" so the demo isn't all
    // noise — some products are at their lowest ever, some had a big spike,
    // some are gently trending down. The latest observation always lands on
    // the current buy-box price.
    await seedPriceHistoryForProduct(doc);
    console.log(`[seed]   product: ${p.name}`);
  }

  // ── Reviews ────────────────────────────────────────────────
  // Authored by buyers. orderId is synthetic until Section 3 (orders) lands;
  // some reviews ship with a seller response, most are left open so the seller
  // hub can demonstrate replying to them.
  let reviewTotal = 0;
  for (const productId of createdProducts) {
    const n = 3 + Math.floor(Math.random() * 2); // 3–4 reviews per product
    const shuffled = [...buyerIds].sort(() => Math.random() - 0.5).slice(0, n);
    for (let i = 0; i < shuffled.length; i++) {
      const tpl = reviewPool[Math.floor(Math.random() * reviewPool.length)];
      const withResponse = i === 0 && Math.random() < 0.4;
      await ReviewModel.create({
        userId: shuffled[i],
        productId,
        orderId: new mongoose.Types.ObjectId(),
        rating: tpl.rating,
        title: tpl.title,
        comment: tpl.comment,
        images: [],
        sellerResponse: withResponse
          ? {
              comment: 'Merci beaucoup pour votre retour, ravi que le produit vous plaise !',
              respondedAt: new Date(),
            }
          : undefined,
      });
      reviewTotal++;
    }
  }
  console.log(`[seed]   ${reviewTotal} reviews`);

  console.log('\n[seed] ✅ Done.');
  console.log(`[seed]   ${sellers.length} sellers (login with password "${DEFAULT_PASSWORD}")`);
  console.log(`[seed]   ${categories.length} categories`);
  console.log(`[seed]   ${products.length} products, ${reviewTotal} reviews`);
  console.log(
    `[seed]   admin <${ADMIN.email}>, ${buyers.length} buyers — all password "${DEFAULT_PASSWORD}"`,
  );
  console.log('[seed]\n[seed] Sample logins:');
  for (const s of sellers) console.log(`[seed]   ${s.email}  (shop /sellers/${s.shopSlug})`);

  await mongoose.disconnect();
}

const args = process.argv.slice(2);
const cleanFirst = !args.includes('--no-clean');

run({ cleanFirst }).catch((err) => {
  console.error('[seed] failed', err);
  process.exit(1);
});
