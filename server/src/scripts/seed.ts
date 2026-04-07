import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole, UserStatus } from '@ecommerce/shared';
import { config } from '../config';
import { UserModel } from '../infrastructure/database/models/User';
import { SellerModel } from '../infrastructure/database/models/Seller';
import { CategoryModel } from '../infrastructure/database/models/Category';
import { ProductModel } from '../infrastructure/database/models/Product';
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

interface RunOptions {
  cleanFirst: boolean;
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
    await ProductModel.deleteMany({ sellerId: { $in: sellerIds } });
    await SellerModel.deleteMany({ _id: { $in: sellerIds } });
    await UserModel.deleteMany({ _id: { $in: sellerUserIds } });
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
  for (const p of products) {
    const sellerId = sellerIdByShopSlug.get(p.shopSlug);
    const categoryId = catIdBySlug.get(p.categorySlug);
    if (!sellerId) throw new Error(`Unknown shop ${p.shopSlug}`);
    if (!categoryId) throw new Error(`Unknown category ${p.categorySlug}`);

    await ProductModel.create({
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
    console.log(`[seed]   product: ${p.name}`);
  }

  console.log('\n[seed] ✅ Done.');
  console.log(`[seed]   ${sellers.length} sellers (login with password "${DEFAULT_PASSWORD}")`);
  console.log(`[seed]   ${categories.length} categories`);
  console.log(`[seed]   ${products.length} products`);
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
