import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { UserRole, UserStatus, OrderStatus, DeliveryType } from '@ecommerce/shared';
import { config } from '../config';
import { UserModel } from '../infrastructure/database/models/User';
import { SellerModel } from '../infrastructure/database/models/Seller';
import { CategoryModel } from '../infrastructure/database/models/Category';
import { ProductModel } from '../infrastructure/database/models/Product';
import { PriceHistoryModel } from '../infrastructure/database/models/PriceHistory';
import { ReviewModel } from '../infrastructure/database/models/Review';
import { OrderModel } from '../infrastructure/database/models/Order';
import { CouponModel, CouponRedemptionModel } from '../infrastructure/database/models/Coupon';
import { ProductViewModel } from '../infrastructure/database/models/ProductView';
import { ConversationModel, MessageModel } from '../infrastructure/database/models/Conversation';
import { DisputeModel } from '../infrastructure/database/models/Dispute';

const DEFAULT_PASSWORD = 'Password123';

// Deterministic PRNG (mulberry32) so every seed run produces the SAME dataset —
// stable demos and reproducible screenshots for the team and the report.
let _rngState = 0x9e3779b9;
function rand(): number {
  _rngState |= 0;
  _rngState = (_rngState + 0x6d2b79f5) | 0;
  let t = Math.imul(_rngState ^ (_rngState >>> 15), 1 | _rngState);
  t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
  return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
}
function randInt(min: number, max: number): number {
  return min + Math.floor(rand() * (max - min + 1));
}
function pick<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}
function daysAgo(n: number): Date {
  return new Date(Date.now() - n * 86_400_000);
}

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
  image?: string;
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
  {
    email: 'gamezone@abracadabra.local',
    firstName: 'Game',
    lastName: 'Zone',
    shopName: 'GameZone',
    shopSlug: 'gamezone',
    description: 'Consoles, controllers and accessories for every gamer. Latest releases in stock.',
    isVerified: true,
  },
  {
    email: 'mobileplanet@abracadabra.local',
    firstName: 'Mobile',
    lastName: 'Planet',
    shopName: 'Mobile Planet',
    shopSlug: 'mobile-planet',
    description: 'Smartphones, chargers and mobile accessories from every major brand.',
    isVerified: true,
  },
  {
    email: 'sneaklab@abracadabra.local',
    firstName: 'Sneak',
    lastName: 'Lab',
    shopName: 'SneakLab',
    shopSlug: 'sneaklab',
    description: 'Curated sneakers and streetwear. Authentic pairs, fast shipping.',
    isVerified: true,
  },
  {
    email: 'maisonco@abracadabra.local',
    firstName: 'Maison',
    lastName: 'Co',
    shopName: 'Maison & Co',
    shopSlug: 'maison-co',
    description: 'Home appliances and smart home essentials for a modern interior.',
    isVerified: true,
  },
  {
    email: 'beautycorner@abracadabra.local',
    firstName: 'Beauty',
    lastName: 'Corner',
    shopName: 'Beauty Corner',
    shopSlug: 'beauty-corner',
    description: 'Skincare, fragrance and beauty from dermatologist-loved brands.',
    isVerified: false,
  },
  {
    email: 'bookhaven@abracadabra.local',
    firstName: 'Book',
    lastName: 'Haven',
    shopName: 'BookHaven',
    shopSlug: 'bookhaven',
    description: 'Bestsellers, classics and timeless reads for every shelf.',
    isVerified: true,
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
    variants: [
      { name: '2 × 20kg', sku: 'FL-AD-20-PAIR', price: 89.99, stock: 38 },
      { name: '2 × 32kg', sku: 'FL-AD-32-PAIR', price: 129.99, stock: 21 },
    ],
    rating: 4.4,
    reviewCount: 3456,
    totalSold: 1287,
  },

  // ── Extra catalog depth (so each category has enough for recommendations) ──
  // Audio
  {
    slug: 'bose-quietcomfort-ultra',
    name: 'Bose QuietComfort Ultra Headphones',
    description:
      'Immersive spatial audio, world-class noise cancellation and CustomTune sound calibration.',
    shopSlug: 'techhub-premium',
    categorySlug: 'audio',
    brand: 'Bose',
    tags: ['headphones', 'wireless', 'noise-cancelling'],
    variants: [
      {
        name: 'Black',
        sku: 'BOSE-QCU-BLK',
        price: 349,
        compareAtPrice: 449,
        stock: 28,
        attributes: { color: 'black' },
      },
    ],
    rating: 4.6,
    reviewCount: 1204,
    totalSold: 540,
  },
  {
    slug: 'jbl-charge-5',
    name: 'JBL Charge 5 Portable Bluetooth Speaker',
    description:
      'Bold JBL Pro Sound, 20 hours of playtime, IP67 waterproof and dustproof, built-in powerbank.',
    shopSlug: 'techhub-premium',
    categorySlug: 'audio',
    brand: 'JBL',
    tags: ['speaker', 'bluetooth', 'portable'],
    variants: [
      {
        name: 'Black',
        sku: 'JBL-CHG5-BLK',
        price: 129,
        compareAtPrice: 179,
        stock: 64,
        attributes: { color: 'black' },
      },
    ],
    rating: 4.7,
    reviewCount: 3890,
    totalSold: 2100,
  },
  {
    slug: 'sony-wf-1000xm5',
    name: 'Sony WF-1000XM5 Wireless Earbuds',
    description:
      'The best noise-cancelling earbuds from Sony. Crystal-clear calls and 8mm drivers for rich bass.',
    shopSlug: 'sony-official',
    categorySlug: 'audio',
    brand: 'Sony',
    tags: ['earbuds', 'wireless', 'noise-cancelling'],
    variants: [
      {
        name: 'Black',
        sku: 'SONY-WF5-BLK',
        price: 249,
        compareAtPrice: 319,
        stock: 33,
        attributes: { color: 'black' },
      },
    ],
    rating: 4.5,
    reviewCount: 980,
    totalSold: 470,
  },
  // Phones
  {
    slug: 'apple-iphone-15-pro',
    name: 'Apple iPhone 15 Pro 256GB',
    description: 'Titanium design, A17 Pro chip, 48MP main camera and the Action button. USB-C.',
    shopSlug: 'apple-store',
    categorySlug: 'phones',
    brand: 'Apple',
    tags: ['smartphone', '5g', 'apple'],
    variants: [
      {
        name: 'Natural Titanium 256GB',
        sku: 'APL-IP15P-256-NAT',
        price: 1099,
        stock: 19,
        attributes: { color: 'titanium', storage: '256GB' },
      },
      {
        name: 'Blue Titanium 256GB',
        sku: 'APL-IP15P-256-BLU',
        price: 1099,
        stock: 7,
        attributes: { color: 'blue', storage: '256GB' },
      },
    ],
    rating: 4.8,
    reviewCount: 6120,
    totalSold: 1980,
    isFeatured: true,
  },
  {
    slug: 'google-pixel-8',
    name: 'Google Pixel 8 128GB',
    description: 'Google Tensor G3, Magic Editor and a 50MP camera. Seven years of OS updates.',
    shopSlug: 'techhub-premium',
    categorySlug: 'phones',
    brand: 'Google',
    tags: ['smartphone', '5g', 'android'],
    variants: [
      {
        name: 'Obsidian 128GB',
        sku: 'GGL-PX8-128-OBS',
        price: 599,
        compareAtPrice: 799,
        stock: 26,
        attributes: { color: 'black', storage: '128GB' },
      },
    ],
    rating: 4.6,
    reviewCount: 2340,
    totalSold: 870,
  },
  // Wearables
  {
    slug: 'apple-watch-se',
    name: 'Apple Watch SE (2nd Gen)',
    description:
      'Essential Apple Watch features: crash detection, fitness tracking and sleep stages.',
    shopSlug: 'apple-store',
    categorySlug: 'wearables',
    brand: 'Apple',
    tags: ['smartwatch', 'fitness', 'apple'],
    variants: [
      {
        name: '40mm Midnight',
        sku: 'APL-WSE-40-MID',
        price: 279,
        stock: 41,
        attributes: { color: 'black' },
      },
    ],
    rating: 4.7,
    reviewCount: 5210,
    totalSold: 2600,
  },
  {
    slug: 'samsung-galaxy-watch-6',
    name: 'Samsung Galaxy Watch 6',
    description:
      'Advanced sleep coaching, body composition and personalized heart-rate zones. Wear OS.',
    shopSlug: 'techhub-premium',
    categorySlug: 'wearables',
    brand: 'Samsung',
    tags: ['smartwatch', 'fitness', 'android'],
    variants: [
      {
        name: '44mm Graphite',
        sku: 'SAM-GW6-44-GRP',
        price: 319,
        compareAtPrice: 369,
        stock: 22,
        attributes: { color: 'graphite' },
      },
    ],
    rating: 4.5,
    reviewCount: 1430,
    totalSold: 610,
  },
  {
    slug: 'garmin-forerunner-265',
    name: 'Garmin Forerunner 265 GPS Running Watch',
    description:
      'Vibrant AMOLED display, training readiness and recovery metrics for serious runners.',
    shopSlug: 'fitlife-pro',
    categorySlug: 'wearables',
    brand: 'Garmin',
    tags: ['smartwatch', 'running', 'gps'],
    variants: [
      {
        name: 'Black',
        sku: 'GRM-FR265-BLK',
        price: 449,
        stock: 17,
        attributes: { color: 'black' },
      },
    ],
    rating: 4.8,
    reviewCount: 920,
    totalSold: 330,
  },
  // Computers & peripherals
  {
    slug: 'logitech-mx-master-3s',
    name: 'Logitech MX Master 3S Wireless Mouse',
    description:
      'Quiet clicks, 8K DPI tracking on any surface and MagSpeed electromagnetic scrolling.',
    shopSlug: 'techhub-premium',
    categorySlug: 'computers',
    brand: 'Logitech',
    tags: ['mouse', 'wireless', 'productivity'],
    variants: [
      {
        name: 'Graphite',
        sku: 'LOG-MXM3S-GRP',
        price: 99,
        compareAtPrice: 129,
        stock: 73,
        attributes: { color: 'graphite' },
      },
    ],
    rating: 4.8,
    reviewCount: 4120,
    totalSold: 2210,
    isFeatured: true,
  },
  {
    slug: 'samsung-t7-ssd-1tb',
    name: 'Samsung T7 Portable SSD 1TB',
    description:
      'Read speeds up to 1,050 MB/s, shock-resistant, pocket-sized USB 3.2 external drive.',
    shopSlug: 'techhub-premium',
    categorySlug: 'computers',
    brand: 'Samsung',
    tags: ['storage', 'ssd', 'usb-c'],
    variants: [
      { name: '1TB Titan Grey', sku: 'SAM-T7-1TB-GRY', price: 109, compareAtPrice: 159, stock: 88 },
    ],
    rating: 4.7,
    reviewCount: 6540,
    totalSold: 4300,
  },
  {
    slug: 'macbook-air-m3',
    name: 'Apple MacBook Air 13" M3 256GB',
    description:
      'Apple M3 chip, up to 18 hours of battery, 13.6-inch Liquid Retina display. Fanless and silent.',
    shopSlug: 'apple-store',
    categorySlug: 'computers',
    brand: 'Apple',
    tags: ['laptop', 'apple', 'm3'],
    variants: [
      {
        name: 'Midnight 256GB',
        sku: 'APL-MBA-M3-256-MID',
        price: 1199,
        stock: 14,
        attributes: { color: 'black', storage: '256GB' },
      },
    ],
    rating: 4.9,
    reviewCount: 3210,
    totalSold: 1120,
    isFeatured: true,
  },
  // Gaming
  {
    slug: 'sony-ps5-slim',
    name: 'Sony PlayStation 5 Slim Console',
    description:
      'Next-gen gaming with lightning-fast loading, 4K graphics and the DualSense controller.',
    shopSlug: 'sony-official',
    categorySlug: 'gaming',
    brand: 'Sony',
    tags: ['console', 'ps5', 'playstation'],
    variants: [{ name: 'Disc Edition', sku: 'SONY-PS5-SLIM-DISC', price: 549, stock: 12 }],
    rating: 4.9,
    reviewCount: 9870,
    totalSold: 3400,
    isFeatured: true,
  },
  {
    slug: 'razer-kraken-v3',
    name: 'Razer Kraken V3 Gaming Headset',
    description:
      'TriForce titanium drivers, HyperSense haptics and a noise-cancelling cardioid mic.',
    shopSlug: 'techhub-premium',
    categorySlug: 'gaming',
    brand: 'Razer',
    tags: ['headset', 'gaming', 'wired'],
    variants: [
      {
        name: 'Black',
        sku: 'RZR-KRKV3-BLK',
        price: 99,
        compareAtPrice: 129,
        stock: 45,
        attributes: { color: 'black' },
      },
    ],
    rating: 4.5,
    reviewCount: 1760,
    totalSold: 720,
  },
  // Fashion
  {
    slug: 'adidas-ultraboost-light',
    name: 'Adidas Ultraboost Light',
    description:
      'The lightest Ultraboost ever, with responsive BOOST midsole and a supportive Linear Energy Push.',
    shopSlug: 'lifestyle-co',
    categorySlug: 'fashion',
    brand: 'Adidas',
    tags: ['shoes', 'running', 'sneakers'],
    variants: [
      {
        name: 'Core Black — EU 42',
        sku: 'ADI-UBL-BLK-42',
        price: 159.99,
        stock: 18,
        attributes: { size: '42', color: 'black' },
      },
      {
        name: 'Core Black — EU 43',
        sku: 'ADI-UBL-BLK-43',
        price: 159.99,
        stock: 11,
        attributes: { size: '43', color: 'black' },
      },
    ],
    rating: 4.6,
    reviewCount: 2210,
    totalSold: 980,
  },
  {
    slug: 'the-north-face-puffer',
    name: 'The North Face Nuptse Puffer Jacket',
    description: 'Iconic 700-fill down insulation, water-repellent finish and a packable design.',
    shopSlug: 'lifestyle-co',
    categorySlug: 'fashion',
    brand: 'The North Face',
    tags: ['jacket', 'winter', 'outdoor'],
    variants: [
      {
        name: 'Black — M',
        sku: 'TNF-NUP-BLK-M',
        price: 299,
        stock: 9,
        attributes: { size: 'M', color: 'black' },
      },
    ],
    rating: 4.7,
    reviewCount: 1340,
    totalSold: 560,
  },
  // Sports
  {
    slug: 'manduka-pro-yoga-mat',
    name: 'Manduka PRO Yoga Mat 6mm',
    description:
      'Dense cushioning, non-slip surface and a lifetime guarantee. The mat that lasts a lifetime.',
    shopSlug: 'fitlife-pro',
    categorySlug: 'sports',
    brand: 'Manduka',
    tags: ['yoga', 'fitness', 'mat'],
    variants: [
      {
        name: 'Midnight',
        sku: 'MND-PRO-MID',
        price: 119,
        stock: 52,
        attributes: { color: 'black' },
      },
    ],
    rating: 4.8,
    reviewCount: 4560,
    totalSold: 2300,
  },
  {
    slug: 'fitlife-resistance-bands',
    name: 'FitLife Resistance Bands Set (5 levels)',
    description:
      'Five stackable bands up to 68kg, with handles, ankle straps and a door anchor. Full-body workouts anywhere.',
    shopSlug: 'fitlife-pro',
    categorySlug: 'sports',
    brand: 'FitLife',
    tags: ['fitness', 'home-gym', 'strength'],
    variants: [{ name: 'Set of 5', sku: 'FL-RB-SET5', price: 34.99, stock: 120 }],
    rating: 4.5,
    reviewCount: 6700,
    totalSold: 5100,
  },
  // Beauty
  {
    slug: 'la-roche-posay-anthelios',
    name: 'La Roche-Posay Anthelios SPF50+ Sunscreen',
    description:
      'Very high broad-spectrum UVA/UVB protection. Lightweight, fast-absorbing, suitable for sensitive skin.',
    shopSlug: 'lifestyle-co',
    categorySlug: 'beauty',
    brand: 'La Roche-Posay',
    tags: ['skincare', 'sunscreen', 'spf'],
    variants: [{ name: '50ml', sku: 'LRP-ANT-50', price: 16.99, stock: 210 }],
    rating: 4.8,
    reviewCount: 8900,
    totalSold: 6200,
  },
  {
    slug: 'the-ordinary-niacinamide',
    name: 'The Ordinary Niacinamide 10% + Zinc 1%',
    description:
      'High-strength vitamin and mineral blemish formula to reduce the look of skin blemishes and congestion.',
    shopSlug: 'lifestyle-co',
    categorySlug: 'beauty',
    brand: 'The Ordinary',
    tags: ['skincare', 'serum', 'niacinamide'],
    variants: [{ name: '30ml', sku: 'TO-NIA-30', price: 6.9, stock: 340 }],
    rating: 4.6,
    reviewCount: 15600,
    totalSold: 12400,
  },
  // Books
  {
    slug: 'the-psychology-of-money',
    name: 'The Psychology of Money by Morgan Housel',
    description:
      'Timeless lessons on wealth, greed and happiness. 19 short stories on how people think about money.',
    shopSlug: 'lifestyle-co',
    categorySlug: 'books',
    brand: 'Harriman House',
    tags: ['finance', 'bestseller', 'self-help'],
    variants: [{ name: 'Paperback', sku: 'BOOK-POM-PB', price: 11.99, stock: 178 }],
    rating: 4.8,
    reviewCount: 33400,
    totalSold: 14200,
  },
  // Home
  {
    slug: 'ninja-air-fryer-max',
    name: 'Ninja Air Fryer MAX 5.2L',
    description:
      'Cook from frozen to crispy in minutes. Up to 75% less fat. Six cooking functions, dishwasher-safe basket.',
    shopSlug: 'lifestyle-co',
    categorySlug: 'home',
    brand: 'Ninja',
    tags: ['kitchen', 'air-fryer', 'appliance'],
    variants: [
      { name: '5.2L Black', sku: 'NNJ-AF-MAX-BLK', price: 129, compareAtPrice: 169, stock: 36 },
    ],
    rating: 4.8,
    reviewCount: 12100,
    totalSold: 7800,
  },

  // ── Expanded catalogue (more shops, more variety) ──
  {
    slug: 'sennheiser-momentum-4',
    name: 'Sennheiser Momentum 4 Wireless',
    description:
      'Audiophile sound, adaptive noise cancellation and an exceptional 60-hour battery life. Refined, comfortable design for all-day listening.',
    shopSlug: 'techhub-premium',
    categorySlug: 'audio',
    brand: 'Sennheiser',
    tags: ['headphones', 'wireless', 'noise-cancelling'],
    variants: [
      {
        name: 'Black',
        sku: 'SENN-M4-BLK',
        price: 299,
        compareAtPrice: 349,
        stock: 26,
        attributes: { color: 'black' },
      },
    ],
    rating: 4.6,
    reviewCount: 1840,
    totalSold: 720,
  },
  {
    slug: 'marshall-emberton-2',
    name: 'Marshall Emberton II Portable Speaker',
    description:
      'Iconic Marshall design with 360° True Stereophonic sound, 30+ hours of playtime and IP67 water resistance.',
    shopSlug: 'techhub-premium',
    categorySlug: 'audio',
    brand: 'Marshall',
    tags: ['speaker', 'bluetooth', 'portable'],
    variants: [
      {
        name: 'Black & Brass',
        sku: 'MRSH-EMB2-BLK',
        price: 169,
        stock: 44,
        attributes: { color: 'black' },
      },
    ],
    rating: 4.7,
    reviewCount: 2210,
    totalSold: 980,
  },
  {
    slug: 'apple-iphone-15',
    name: 'Apple iPhone 15 128GB',
    description:
      'Dynamic Island, 48MP main camera and USB-C. A16 Bionic chip and an all-day battery in a durable aluminium design.',
    shopSlug: 'apple-store',
    categorySlug: 'phones',
    brand: 'Apple',
    tags: ['smartphone', '5g', 'apple'],
    variants: [
      {
        name: 'Blue 128GB',
        sku: 'APL-IP15-128-BLU',
        price: 869,
        stock: 30,
        attributes: { color: 'blue', storage: '128GB' },
      },
      {
        name: 'Black 128GB',
        sku: 'APL-IP15-128-BLK',
        price: 869,
        stock: 21,
        attributes: { color: 'black', storage: '128GB' },
      },
    ],
    rating: 4.7,
    reviewCount: 4310,
    totalSold: 1620,
    isFeatured: true,
  },
  {
    slug: 'oneplus-12',
    name: 'OnePlus 12 256GB',
    description:
      'Snapdragon 8 Gen 3, 120Hz ProXDR display and Hasselblad camera. 100W fast charging for a full day in 30 minutes.',
    shopSlug: 'mobile-planet',
    categorySlug: 'phones',
    brand: 'OnePlus',
    tags: ['smartphone', '5g', 'android'],
    variants: [
      {
        name: 'Flowy Emerald 256GB',
        sku: 'OP-12-256-GRN',
        price: 749,
        compareAtPrice: 869,
        stock: 24,
        attributes: { color: 'green', storage: '256GB' },
      },
    ],
    rating: 4.6,
    reviewCount: 1290,
    totalSold: 540,
  },
  {
    slug: 'dell-xps-13',
    name: 'Dell XPS 13 Laptop',
    description:
      'InfinityEdge 13.4-inch display, Intel Core Ultra, machined aluminium chassis. Premium ultraportable for work on the go.',
    shopSlug: 'techhub-premium',
    categorySlug: 'computers',
    brand: 'Dell',
    tags: ['laptop', 'ultrabook', 'windows'],
    variants: [
      {
        name: 'Platinum 512GB',
        sku: 'DELL-XPS13-512',
        price: 1099,
        compareAtPrice: 1399,
        stock: 16,
      },
    ],
    rating: 4.5,
    reviewCount: 980,
    totalSold: 410,
  },
  {
    slug: 'samsung-monitor-32',
    name: 'Samsung Smart Monitor M8 32"',
    description:
      '4K UHD smart monitor with built-in streaming apps, SlimFit camera and sleek design. Works as a monitor and a smart TV.',
    shopSlug: 'techhub-premium',
    categorySlug: 'computers',
    brand: 'Samsung',
    tags: ['monitor', '4k', 'smart'],
    variants: [
      {
        name: '32" 4K Warm White',
        sku: 'SAM-M8-32-WHT',
        price: 599,
        compareAtPrice: 729,
        stock: 19,
      },
    ],
    rating: 4.4,
    reviewCount: 760,
    totalSold: 290,
  },
  {
    slug: 'anker-charger-hub',
    name: 'Anker 735 GaNPrime 65W Charger',
    description:
      'Compact 3-port GaN charger that powers a laptop, phone and earbuds at once. Foldable plug for travel.',
    shopSlug: 'mobile-planet',
    categorySlug: 'computers',
    brand: 'Anker',
    tags: ['charger', 'usb-c', 'travel'],
    variants: [
      {
        name: 'Black',
        sku: 'ANK-735-BLK',
        price: 49,
        compareAtPrice: 69,
        stock: 120,
        attributes: { color: 'black' },
      },
    ],
    rating: 4.8,
    reviewCount: 5400,
    totalSold: 4100,
  },
  {
    slug: 'xbox-series-x',
    name: 'Xbox Series X Console',
    description:
      'The fastest, most powerful Xbox ever. 4K gaming at up to 120 FPS, 1TB SSD and Quick Resume across multiple games.',
    shopSlug: 'gamezone',
    categorySlug: 'gaming',
    brand: 'Microsoft',
    tags: ['console', 'xbox', '4k'],
    variants: [{ name: '1TB Black', sku: 'XBX-SX-1TB', price: 499, stock: 14 }],
    rating: 4.8,
    reviewCount: 6700,
    totalSold: 2400,
    isFeatured: true,
  },
  {
    slug: 'nintendo-switch-oled',
    name: 'Nintendo Switch OLED',
    description:
      'Vivid 7-inch OLED screen, enhanced audio and a wide adjustable stand. Play at home or on the go.',
    shopSlug: 'gamezone',
    categorySlug: 'gaming',
    brand: 'Nintendo',
    tags: ['console', 'nintendo', 'handheld'],
    variants: [
      {
        name: 'White',
        sku: 'NIN-SW-OLED-WHT',
        price: 349,
        stock: 33,
        attributes: { color: 'white' },
      },
    ],
    rating: 4.9,
    reviewCount: 9100,
    totalSold: 3600,
    isFeatured: true,
  },
  {
    slug: 'xbox-controller',
    name: 'Xbox Wireless Controller',
    description:
      'Textured grips, hybrid D-pad and Bluetooth for play on console, PC and mobile. Up to 40 hours on AA batteries.',
    shopSlug: 'gamezone',
    categorySlug: 'gaming',
    brand: 'Microsoft',
    tags: ['controller', 'xbox', 'wireless'],
    variants: [
      {
        name: 'Carbon Black',
        sku: 'XBX-CTRL-BLK',
        price: 59,
        compareAtPrice: 69,
        stock: 78,
        attributes: { color: 'black' },
      },
      {
        name: 'Robot White',
        sku: 'XBX-CTRL-WHT',
        price: 59,
        compareAtPrice: 69,
        stock: 41,
        attributes: { color: 'white' },
      },
    ],
    rating: 4.7,
    reviewCount: 8800,
    totalSold: 5200,
  },
  {
    slug: 'fitbit-charge-6',
    name: 'Fitbit Charge 6',
    description:
      'Advanced fitness tracker with built-in GPS, heart-rate tracking and Google apps. Up to 7 days of battery.',
    shopSlug: 'techhub-premium',
    categorySlug: 'wearables',
    brand: 'Fitbit',
    tags: ['fitness-tracker', 'health', 'gps'],
    variants: [
      {
        name: 'Obsidian',
        sku: 'FB-CH6-OBS',
        price: 149,
        compareAtPrice: 179,
        stock: 52,
        attributes: { color: 'black' },
      },
    ],
    rating: 4.5,
    reviewCount: 3200,
    totalSold: 1700,
  },
  {
    slug: 'ray-ban-aviator',
    name: 'Ray-Ban Aviator Classic',
    description:
      'The timeless aviator with crystal lenses and a lightweight metal frame. 100% UV protection, made in Italy.',
    shopSlug: 'sneaklab',
    categorySlug: 'fashion',
    brand: 'Ray-Ban',
    tags: ['sunglasses', 'accessories', 'classic'],
    variants: [
      {
        name: 'Gold / Green',
        sku: 'RB-AV-GLD',
        price: 169,
        stock: 36,
        attributes: { color: 'gold' },
      },
    ],
    rating: 4.8,
    reviewCount: 5600,
    totalSold: 3100,
  },
  {
    slug: 'new-balance-550',
    name: 'New Balance 550',
    description:
      'Retro basketball silhouette with premium leather and a clean, versatile look. An everyday streetwear staple.',
    shopSlug: 'sneaklab',
    categorySlug: 'fashion',
    brand: 'New Balance',
    tags: ['sneakers', 'shoes', 'streetwear'],
    variants: [
      {
        name: 'White / Green — EU 42',
        sku: 'NB-550-WG-42',
        price: 119.99,
        stock: 22,
        attributes: { size: '42', color: 'white' },
      },
      {
        name: 'White / Green — EU 43',
        sku: 'NB-550-WG-43',
        price: 119.99,
        stock: 17,
        attributes: { size: '43', color: 'white' },
      },
    ],
    rating: 4.7,
    reviewCount: 2400,
    totalSold: 1300,
  },
  {
    slug: 'levis-501-jeans',
    name: "Levi's 501 Original Jeans",
    description:
      'The original blue jean since 1873. Straight leg, button fly and a timeless fit in durable cotton denim.',
    shopSlug: 'sneaklab',
    categorySlug: 'fashion',
    brand: "Levi's",
    tags: ['jeans', 'denim', 'classic'],
    variants: [
      {
        name: 'Mid Blue — W32 L32',
        sku: 'LV-501-3232',
        price: 99.99,
        stock: 40,
        attributes: { size: '32', color: 'blue' },
      },
    ],
    rating: 4.6,
    reviewCount: 8900,
    totalSold: 5400,
  },
  {
    slug: 'herschel-backpack',
    name: 'Herschel Little America Backpack',
    description:
      'Mountaineering-inspired backpack with a padded 15" laptop sleeve, magnetic strap closures and signature striped lining.',
    shopSlug: 'sneaklab',
    categorySlug: 'fashion',
    brand: 'Herschel',
    tags: ['backpack', 'bag', 'everyday'],
    variants: [
      {
        name: 'Black',
        sku: 'HSL-LA-BLK',
        price: 89.99,
        compareAtPrice: 109.99,
        stock: 31,
        attributes: { color: 'black' },
      },
    ],
    rating: 4.7,
    reviewCount: 3400,
    totalSold: 1900,
  },
  {
    slug: 'hydro-flask-bottle',
    name: 'Hydro Flask 32oz Wide Mouth',
    description:
      'TempShield insulation keeps drinks cold 24h, hot 12h. Durable powder coat and a leak-proof Flex Cap.',
    shopSlug: 'fitlife-pro',
    categorySlug: 'sports',
    brand: 'Hydro Flask',
    tags: ['bottle', 'hydration', 'outdoor'],
    variants: [
      {
        name: 'Pacific Blue',
        sku: 'HF-32-BLU',
        price: 44.95,
        stock: 86,
        attributes: { color: 'blue' },
      },
      { name: 'Black', sku: 'HF-32-BLK', price: 44.95, stock: 64, attributes: { color: 'black' } },
    ],
    rating: 4.8,
    reviewCount: 11200,
    totalSold: 8700,
  },
  {
    slug: 'foam-roller-fitness',
    name: 'FitLife High-Density Foam Roller',
    description:
      'Firm, textured EVA foam roller for deep-tissue massage and recovery. Lightweight and grid-patterned for targeted relief.',
    shopSlug: 'fitlife-pro',
    categorySlug: 'sports',
    brand: 'FitLife',
    tags: ['recovery', 'fitness', 'massage'],
    variants: [{ name: '45cm Black', sku: 'FL-FR-45', price: 29.99, stock: 95 }],
    rating: 4.5,
    reviewCount: 4200,
    totalSold: 3300,
  },
  {
    slug: 'kettlebell-16kg',
    name: 'FitLife Cast Iron Kettlebell 16kg',
    description:
      'Solid cast-iron kettlebell with a smooth, wide handle and a flat base. Powder-coated for a secure grip.',
    shopSlug: 'fitlife-pro',
    categorySlug: 'sports',
    brand: 'FitLife',
    tags: ['strength', 'home-gym', 'fitness'],
    variants: [
      { name: '16kg', sku: 'FL-KB-16', price: 54.99, stock: 48 },
      { name: '24kg', sku: 'FL-KB-24', price: 74.99, stock: 27 },
    ],
    rating: 4.7,
    reviewCount: 2100,
    totalSold: 1100,
  },
  {
    slug: 'chanel-no5-perfume',
    name: 'Chanel N°5 Eau de Parfum 100ml',
    description:
      'The legendary fragrance: a timeless floral aldehyde bouquet. An icon of elegance in its minimalist bottle.',
    shopSlug: 'beauty-corner',
    categorySlug: 'beauty',
    brand: 'Chanel',
    tags: ['perfume', 'fragrance', 'luxury'],
    variants: [{ name: '100ml', sku: 'CHN-N5-100', price: 169, stock: 38 }],
    rating: 4.9,
    reviewCount: 6700,
    totalSold: 2900,
    isFeatured: true,
  },
  {
    slug: 'dyson-v15-vacuum',
    name: 'Dyson V15 Detect Cordless Vacuum',
    description:
      'Laser reveals microscopic dust, and a sensor counts particles in real time. Powerful suction with up to 60 minutes of run time.',
    shopSlug: 'maison-co',
    categorySlug: 'home',
    brand: 'Dyson',
    tags: ['vacuum', 'cordless', 'appliance'],
    variants: [
      { name: 'Yellow / Nickel', sku: 'DYS-V15-YLW', price: 599, compareAtPrice: 699, stock: 17 },
    ],
    rating: 4.7,
    reviewCount: 3900,
    totalSold: 1400,
  },
  {
    slug: 'nespresso-vertuo',
    name: 'Nespresso Vertuo Next Coffee Machine',
    description:
      'Barista-grade coffee and espresso at the touch of a button. Centrifusion tech reads each capsule for the perfect cup.',
    shopSlug: 'maison-co',
    categorySlug: 'home',
    brand: 'Nespresso',
    tags: ['coffee', 'kitchen', 'espresso'],
    variants: [
      {
        name: 'Matte Black',
        sku: 'NSP-VTX-BLK',
        price: 129,
        compareAtPrice: 179,
        stock: 42,
        attributes: { color: 'black' },
      },
    ],
    rating: 4.5,
    reviewCount: 5100,
    totalSold: 3200,
  },
  {
    slug: 'philips-hue-kit',
    name: 'Philips Hue White & Color Starter Kit',
    description:
      'Three smart bulbs plus a bridge. 16 million colours, voice control and scenes that sync with music and movies.',
    shopSlug: 'maison-co',
    categorySlug: 'home',
    brand: 'Philips Hue',
    tags: ['smart-home', 'lighting', 'connected'],
    variants: [
      { name: 'E27 x3 + Bridge', sku: 'PHL-HUE-KIT3', price: 169, compareAtPrice: 199, stock: 29 },
    ],
    rating: 4.6,
    reviewCount: 4400,
    totalSold: 2100,
  },
  {
    slug: 'sapiens-book',
    name: 'Sapiens: A Brief History of Humankind',
    description:
      'Yuval Noah Harari’s landmark exploration of how Homo sapiens came to dominate the planet. International bestseller.',
    shopSlug: 'bookhaven',
    categorySlug: 'books',
    brand: 'Harper',
    tags: ['history', 'bestseller', 'non-fiction'],
    variants: [
      { name: 'Paperback', sku: 'BK-SAP-PB', price: 13.99, stock: 160 },
      { name: 'Hardcover', sku: 'BK-SAP-HC', price: 24.99, stock: 38 },
    ],
    rating: 4.8,
    reviewCount: 28700,
    totalSold: 12300,
  },
  {
    slug: 'dune-book',
    name: 'Dune by Frank Herbert',
    description:
      'The science-fiction masterpiece of politics, religion and ecology on the desert planet Arrakis. The book behind the films.',
    shopSlug: 'bookhaven',
    categorySlug: 'books',
    brand: 'Hodder',
    tags: ['sci-fi', 'classic', 'fiction'],
    variants: [{ name: 'Paperback', sku: 'BK-DUNE-PB', price: 11.99, stock: 142 }],
    rating: 4.8,
    reviewCount: 19400,
    totalSold: 9800,
  },
  {
    slug: 'lego-millennium-falcon',
    name: 'LEGO Star Wars Millennium Falcon',
    description:
      '1351-piece model of the iconic starship with detailed interior, minifigures and rotating gun turrets. A collector favourite.',
    shopSlug: 'lifestyle-co',
    categorySlug: 'toys',
    brand: 'LEGO',
    tags: ['building', 'collectible', 'star-wars'],
    variants: [
      { name: 'Standard set', sku: 'LEGO-SW-MF', price: 169.99, compareAtPrice: 189.99, stock: 21 },
    ],
    rating: 4.9,
    reviewCount: 8700,
    totalSold: 3900,
    isFeatured: true,
  },
  {
    slug: 'rubiks-cube',
    name: "Rubik's Cube 3x3",
    description:
      'The original 3x3 puzzle. Over 43 quintillion combinations and only one solution. Faster turning, smoother play.',
    shopSlug: 'lifestyle-co',
    categorySlug: 'toys',
    brand: "Rubik's",
    tags: ['puzzle', 'classic', 'brain'],
    variants: [{ name: 'Classic', sku: 'RBK-3X3', price: 12.99, stock: 210 }],
    rating: 4.7,
    reviewCount: 15600,
    totalSold: 11200,
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

// Default shipping address attached to every buyer (and copied onto their orders).
const DEFAULT_ADDRESS = {
  label: 'Domicile',
  street: '12 rue de la République',
  city: 'Paris',
  postalCode: '75011',
  country: 'France',
  isDefault: true,
};

/**
 * Per-buyer taste so seeded purchases AND views are coherent — this is what
 * makes the recommendation engine produce meaningful, demoable results. Each
 * `basket` is a set of products bought together (drives the "bought together"
 * co-purchase signal); `categories` drive the broader content affinity + views.
 */
const personas: Record<string, { categories: string[]; baskets: string[][] }> = {
  'alice@abracadabra.local': {
    categories: ['audio', 'wearables', 'phones'],
    baskets: [
      ['airpods-pro-2', 'apple-watch-ultra-2'],
      ['sony-wh-1000xm5', 'samsung-galaxy-s24-ultra'],
    ],
  },
  'bruno@abracadabra.local': {
    categories: ['gaming', 'computers', 'audio'],
    baskets: [
      ['sony-dualsense-edge', 'lg-ultragear-27'],
      ['logitech-mx-keys-s', 'lg-ultragear-27'],
    ],
  },
  'chloe@abracadabra.local': {
    categories: ['beauty', 'books', 'home'],
    baskets: [
      ['cerave-moisturizing-cream', 'atomic-habits-book'],
      ['delonghi-magnifica-evo', 'atomic-habits-book'],
    ],
  },
  'driss@abracadabra.local': {
    categories: ['computers', 'phones', 'audio'],
    baskets: [
      ['logitech-mx-keys-s', 'lg-ultragear-27'],
      ['sony-wh-1000xm5', 'logitech-mx-keys-s'],
    ],
  },
  'emma@abracadabra.local': {
    categories: ['sports', 'fashion', 'home'],
    baskets: [['adjustable-dumbbells-20kg', 'nike-air-max-90']],
  },
};

interface CouponSeed {
  code: string;
  discountType: 'percentage' | 'fixed';
  discountValue: number;
  minOrderAmount?: number;
  maxDiscount?: number;
  perUserLimit?: number;
  usageLimit?: number;
  expiresInDays?: number;
  isActive: boolean;
}

const coupons: CouponSeed[] = [
  {
    code: 'WELCOME10',
    discountType: 'percentage',
    discountValue: 10,
    perUserLimit: 1,
    usageLimit: 5000,
    isActive: true,
  },
  {
    code: 'SUMMER20',
    discountType: 'fixed',
    discountValue: 20,
    minOrderAmount: 100,
    usageLimit: 1000,
    isActive: true,
  },
  {
    code: 'BIGSPENDER',
    discountType: 'percentage',
    discountValue: 15,
    minOrderAmount: 300,
    maxDiscount: 100,
    usageLimit: 500,
    isActive: true,
  },
  // An expired coupon, handy to demo the rejection path.
  {
    code: 'EXPIRED5',
    discountType: 'percentage',
    discountValue: 5,
    expiresInDays: -10,
    isActive: true,
  },
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
  {
    rating: 5,
    title: 'Exactement ce que je cherchais',
    comment:
      'Commande passée le soir, reçue le surlendemain. Le produit est fidèle aux photos et fonctionne parfaitement. Rien à redire.',
  },
  {
    rating: 5,
    title: 'Achat les yeux fermés',
    comment:
      'Troisième commande chez ce vendeur, toujours impeccable. Emballage protecteur et finition haut de gamme.',
  },
  {
    rating: 4,
    title: 'Très bien pour le prix',
    comment:
      'Difficile de trouver mieux dans cette gamme de prix. Quelques finitions perfectibles mais l’essentiel y est.',
  },
  {
    rating: 4,
    title: 'Conforme et fiable',
    comment:
      'Utilisé quotidiennement depuis trois semaines, aucun souci à signaler. Je le rachèterais sans hésiter.',
  },
  {
    rating: 3,
    title: 'Mitigé',
    comment:
      'Le produit en lui-même est correct mais l’emballage était abîmé à la réception. Le contenu était heureusement intact.',
  },
  {
    rating: 3,
    title: 'Fait le travail',
    comment:
      'Ni bon ni mauvais, il remplit sa fonction. Je m’attendais à un peu mieux au vu des avis, mais ça reste honnête.',
  },
  {
    rating: 5,
    title: 'Qualité au rendez-vous',
    comment:
      'Matériaux premium, prise en main agréable. On sent que c’est pensé dans le détail. Vendeur sérieux et réactif.',
  },
  {
    rating: 2,
    title: 'Un peu déçu',
    comment:
      'Le produit fonctionne mais ne correspond pas tout à fait à mes attentes. Le rapport qualité-prix me semble un peu juste.',
  },
  {
    rating: 4,
    title: 'Livraison rapide',
    comment:
      'Expédition le jour même, suivi clair. Le produit est de bonne qualité et l’ensemble est cohérent avec la description.',
  },
  {
    rating: 5,
    title: 'Rien à redire',
    comment:
      'Parfait du début à la fin : commande simple, livraison soignée, produit excellent. Je recommande à 100 %.',
  },
  {
    rating: 4,
    title: 'Bon achat',
    comment:
      'Produit sérieux, conforme à la fiche. Une légère odeur de neuf au déballage qui part vite, sinon rien à signaler.',
  },
  {
    rating: 3,
    title: 'Correct mais sans plus',
    comment:
      'Ça fait le job pour un usage occasionnel. Pour un usage intensif, j’aurais peut-être visé une gamme au-dessus.',
  },
];

// French keyword tags appended per category so the (French) UI search matches
// the English product catalogue (e.g. searching "casque" finds the headphones).
const frTagsByCategory: Record<string, string[]> = {
  audio: ['casque', 'écouteurs', 'audio', 'sans-fil'],
  phones: ['smartphone', 'téléphone', 'mobile'],
  computers: ['informatique', 'ordinateur', 'bureautique'],
  wearables: ['montre connectée', 'objet connecté', 'fitness'],
  gaming: ['jeu vidéo', 'console', 'manette'],
  fashion: ['mode', 'vêtement', 'chaussures'],
  sports: ['sport', 'fitness', 'musculation'],
  beauty: ['beauté', 'soin', 'cosmétique'],
  books: ['livre', 'lecture'],
  home: ['maison', 'cuisine', 'électroménager'],
  toys: ['jouet', 'loisir'],
};

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

    // Buyer/admin accounts and everything that belongs to them.
    const buyerEmails = buyers.map((b) => b.email);
    const buyerDocs = await UserModel.find({ email: { $in: buyerEmails } });
    const buyerUserIds = buyerDocs.map((u) => u._id);

    // Conversations + their messages involving any seeded user.
    const seedUserIds = [...buyerUserIds, ...sellerUserIds];
    const convDocs = await ConversationModel.find({ participants: { $in: seedUserIds } });
    await MessageModel.deleteMany({ conversationId: { $in: convDocs.map((c) => c._id) } });
    await ConversationModel.deleteMany({ _id: { $in: convDocs.map((c) => c._id) } });

    await CouponRedemptionModel.deleteMany({});
    await CouponModel.deleteMany({ code: { $in: coupons.map((c) => c.code) } });
    // Disputes are pure demo data — wipe all so re-seeding never leaves orphans
    // (e.g. a dispute whose order/user was removed in a prior run).
    await DisputeModel.deleteMany({});
    await OrderModel.deleteMany({ userId: { $in: buyerUserIds } });
    await ProductViewModel.deleteMany({ userId: { $in: buyerUserIds } });
    await ReviewModel.deleteMany({ productId: { $exists: true } });
    await PriceHistoryModel.deleteMany({});
    await ProductModel.deleteMany({ sellerId: { $in: sellerIds } });
    await SellerModel.deleteMany({ _id: { $in: sellerIds } });
    await UserModel.deleteMany({ _id: { $in: sellerUserIds } });
    await UserModel.deleteMany({ email: { $in: [ADMIN.email, ...buyerEmails] } });
    await CategoryModel.deleteMany({ slug: { $in: categories.map((c) => c.slug) } });
  }

  // ── Users + Sellers ────────────────────────────────────────
  const hashedPassword = await bcrypt.hash(DEFAULT_PASSWORD, 10);
  const sellerIdByShopSlug = new Map<string, mongoose.Types.ObjectId>();
  const sellerUserIdByShopSlug = new Map<string, mongoose.Types.ObjectId>();

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
    sellerUserIdByShopSlug.set(s.shopSlug, user._id as mongoose.Types.ObjectId);
    const seller = await SellerModel.create({
      userId: user._id,
      shopName: s.shopName,
      shopSlug: s.shopSlug,
      description: s.description,
      isVerified: s.isVerified,
      rating: 4 + rand(),
      reviewCount: randInt(200, 5200),
      totalSales: randInt(1000, 21000),
      totalRevenue: randInt(20000, 820000),
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

  // Buyer accounts (place the seeded orders + reviews and have a saved address).
  const buyerIds: mongoose.Types.ObjectId[] = [];
  const buyerByEmail = new Map<string, mongoose.Types.ObjectId>();
  for (const b of buyers) {
    const user = await UserModel.create({
      email: b.email,
      password: hashedPassword,
      firstName: b.firstName,
      lastName: b.lastName,
      role: UserRole.USER,
      status: UserStatus.ACTIVE,
      emailVerified: true,
      addresses: [DEFAULT_ADDRESS],
    });
    buyerIds.push(user._id as mongoose.Types.ObjectId);
    buyerByEmail.set(b.email, user._id as mongoose.Types.ObjectId);
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
  interface SeededProduct {
    id: mongoose.Types.ObjectId;
    categorySlug: string;
    name: string;
    image: string;
    variantId: mongoose.Types.ObjectId;
    variantName: string;
    price: number;
  }
  const createdProducts: mongoose.Types.ObjectId[] = [];
  const productBySlug = new Map<string, SeededProduct>();
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
      // English tags + French keywords so the French UI search finds them.
      tags: [...new Set([...p.tags, ...(frTagsByCategory[p.categorySlug] ?? [])])],
      // Real product photo downloaded from Pexels into client/public/products.
      images: [`/products/${p.slug}.jpg`],
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

    // Index this product so persona-driven orders + views can resolve it later.
    const firstVariant = doc.variants[0];
    productBySlug.set(p.slug, {
      id: doc._id as mongoose.Types.ObjectId,
      categorySlug: p.categorySlug,
      name: p.name,
      image: `/products/${p.slug}.jpg`,
      variantId: firstVariant._id,
      variantName: firstVariant.name,
      price: firstVariant.price,
    });

    // ── Synthetic price history (~120 days, varied storylines) ──
    // Each variant gets one of a small set of "stories" so the demo isn't all
    // noise — some products are at their lowest ever, some had a big spike,
    // some are gently trending down. The latest observation always lands on
    // the current buy-box price.
    await seedPriceHistoryForProduct(doc);
    console.log(`[seed]   product: ${p.name}`);
  }

  // Group product slugs by category, for persona-driven orders + views.
  const slugsByCategory = new Map<string, string[]>();
  for (const p of products) {
    const list = slugsByCategory.get(p.categorySlug) ?? [];
    list.push(p.slug);
    slugsByCategory.set(p.categorySlug, list);
  }

  // ── Reviews ────────────────────────────────────────────────
  // Authored by buyers. orderId is synthetic until Section 3 (orders) lands;
  // some reviews ship with a seller response, most are left open so the seller
  // hub can demonstrate replying to them.
  // Keep the demo buyer's delivered-order products un-reviewed BY HER, so the
  // "write a review" flow can be shown live from her orders page. Other buyers
  // still review these products, so they never look empty.
  const DEMO_BUYER_EMAIL = 'alice@abracadabra.local';
  const demoBuyerId = buyerByEmail.get(DEMO_BUYER_EMAIL);
  const demoReservedProductIds = new Set(
    (personas[DEMO_BUYER_EMAIL]?.baskets.flat() ?? [])
      .map((slug) => productBySlug.get(slug)?.id.toString())
      .filter((id): id is string => Boolean(id)),
  );

  let reviewTotal = 0;
  for (const productId of createdProducts) {
    const n = randInt(3, 4); // 3–4 reviews per product
    const shuffled = [...buyerIds].sort(() => rand() - 0.5).slice(0, n);
    for (let i = 0; i < shuffled.length; i++) {
      // Skip the demo buyer on her own purchased products (see note above).
      if (
        demoBuyerId &&
        shuffled[i].equals(demoBuyerId) &&
        demoReservedProductIds.has(productId.toString())
      ) {
        continue;
      }
      const tpl = reviewPool[Math.floor(rand() * reviewPool.length)];
      const withResponse = i === 0 && rand() < 0.4;
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

  // ── Coupons ────────────────────────────────────────────────
  const couponIdByCode = new Map<string, mongoose.Types.ObjectId>();
  for (const c of coupons) {
    const doc = await CouponModel.create({
      code: c.code,
      discountType: c.discountType,
      discountValue: c.discountValue,
      minOrderAmount: c.minOrderAmount,
      maxDiscount: c.maxDiscount,
      perUserLimit: c.perUserLimit,
      usageLimit: c.usageLimit,
      expiresAt: c.expiresInDays != null ? daysAgo(-c.expiresInDays) : undefined,
      isActive: c.isActive,
    });
    couponIdByCode.set(c.code, doc._id as mongoose.Types.ObjectId);
  }
  console.log(`[seed]   ${coupons.length} coupons`);

  // ── Orders ─────────────────────────────────────────────────
  // Persona-driven so the data tells a coherent story and powers the
  // recommendation engine (purchase history + "bought together" pairs).
  let orderSeq = 0;

  async function createOrder(
    userId: mongoose.Types.ObjectId,
    slugs: string[],
    status: OrderStatus,
    ageDays: number,
    couponCode?: string,
  ): Promise<void> {
    const items = slugs
      .map((slug) => productBySlug.get(slug))
      .filter((sp): sp is SeededProduct => Boolean(sp))
      .map((sp) => {
        const quantity = 1;
        return {
          productId: sp.id,
          variantId: sp.variantId,
          productName: sp.name,
          variantName: sp.variantName,
          image: sp.image,
          quantity,
          unitPrice: sp.price,
          totalPrice: sp.price * quantity,
        };
      });
    if (items.length === 0) return;

    const subtotal = items.reduce((s, i) => s + i.totalPrice, 0);
    const shippingCost = subtotal >= 50 ? 0 : 4.99;

    let discountAmount = 0;
    let appliedCode: string | undefined;
    const coupon = couponCode ? coupons.find((c) => c.code === couponCode) : undefined;
    if (coupon && (!coupon.minOrderAmount || subtotal >= coupon.minOrderAmount)) {
      discountAmount =
        coupon.discountType === 'percentage'
          ? Math.min((subtotal * coupon.discountValue) / 100, coupon.maxDiscount ?? Infinity)
          : coupon.discountValue;
      discountAmount = Math.round(discountAmount * 100) / 100;
      appliedCode = coupon.code;
    }

    const totalAmount = Math.max(0, subtotal + shippingCost - discountAmount);
    const createdAt = daysAgo(ageDays);

    const order = await OrderModel.create({
      userId,
      orderNumber: `ABRA-${100001 + orderSeq++}`,
      items,
      subtotal,
      shippingCost,
      discountAmount,
      couponCode: appliedCode,
      totalAmount,
      status,
      deliveryType: DeliveryType.HOME,
      shippingAddress: {
        street: DEFAULT_ADDRESS.street,
        city: DEFAULT_ADDRESS.city,
        postalCode: DEFAULT_ADDRESS.postalCode,
        country: DEFAULT_ADDRESS.country,
      },
    });

    // Backdate the timestamps so recency-aware features have a realistic spread.
    const dates: Record<string, Date> = { createdAt, updatedAt: createdAt };
    const paid = [
      OrderStatus.CONFIRMED,
      OrderStatus.PROCESSING,
      OrderStatus.SHIPPED,
      OrderStatus.DELIVERED,
    ];
    if (paid.includes(status)) dates.paidAt = createdAt;
    if (status === OrderStatus.SHIPPED || status === OrderStatus.DELIVERED) {
      dates.shippedAt = daysAgo(Math.max(0, ageDays - 1));
    }
    if (status === OrderStatus.DELIVERED) dates.deliveredAt = daysAgo(Math.max(0, ageDays - 3));
    await OrderModel.updateOne({ _id: order._id }, { $set: dates }, { timestamps: false });

    if (appliedCode) {
      await CouponModel.updateOne({ code: appliedCode }, { $inc: { usedCount: 1 } });
      await CouponRedemptionModel.create({
        couponId: couponIdByCode.get(appliedCode),
        userId,
        orderId: order._id,
      });
    }
  }

  for (const b of buyers) {
    const persona = personas[b.email];
    const userId = buyerByEmail.get(b.email);
    if (!persona || !userId) continue;

    // Older delivered orders from the persona's "bought together" baskets.
    let age = randInt(70, 110);
    for (let i = 0; i < persona.baskets.length; i++) {
      await createOrder(
        userId,
        persona.baskets[i],
        OrderStatus.DELIVERED,
        age,
        i === 0 ? 'WELCOME10' : undefined,
      );
      age -= randInt(15, 28);
    }

    // A couple of recent single-item orders with in-flight statuses.
    const recentStatuses = [OrderStatus.SHIPPED, OrderStatus.PROCESSING, OrderStatus.PENDING];
    const extra = randInt(1, 2);
    for (let i = 0; i < extra; i++) {
      const slug = pick(slugsByCategory.get(pick(persona.categories)) ?? []);
      if (slug) await createOrder(userId, [slug], pick(recentStatuses), randInt(2, 18));
    }
  }
  console.log(`[seed]   ${orderSeq} orders`);

  // ── Disputes (litiges) for the admin demo ──────────────────
  // Two delivered orders get a dispute: one still open, one already resolved,
  // so the admin "Litiges" hub shows both an actionable and a closed case.
  const deliveredForDisputes = await OrderModel.find({
    status: OrderStatus.DELIVERED,
    userId: { $in: buyerIds },
  })
    .sort({ createdAt: 1 })
    .limit(2);
  if (deliveredForDisputes.length >= 1) {
    await DisputeModel.create({
      orderId: deliveredForDisputes[0]._id,
      userId: deliveredForDisputes[0].userId,
      reason: 'damaged',
      description:
        'Le colis est arrivé avec un produit visiblement abîmé sur un coin. La boîte était enfoncée.',
      status: 'open',
    });
  }
  if (deliveredForDisputes.length >= 2) {
    await DisputeModel.create({
      orderId: deliveredForDisputes[1]._id,
      userId: deliveredForDisputes[1].userId,
      reason: 'not_received',
      description: 'Je n’ai jamais reçu un des articles de ma commande.',
      status: 'resolved',
      resolution: 'Article manquant renvoyé et livré. Un geste commercial a été appliqué.',
      resolvedAt: new Date(),
    });
  }
  console.log(`[seed]   ${deliveredForDisputes.length} disputes`);

  // ── Product views (behavioral signal for recommendations) ──
  let viewTotal = 0;
  for (const b of buyers) {
    const persona = personas[b.email];
    const userId = buyerByEmail.get(b.email);
    if (!persona || !userId) continue;

    // Sample a few products to view (not the whole category) so plenty remain
    // as fresh recommendation candidates.
    const pool = new Set<string>();
    for (const cat of persona.categories) {
      for (const slug of slugsByCategory.get(cat) ?? []) pool.add(slug);
    }
    for (const basket of persona.baskets) for (const slug of basket) pool.add(slug);

    const sampled = [...pool].sort(() => rand() - 0.5).slice(0, 4);
    for (const slug of sampled) {
      const sp = productBySlug.get(slug);
      if (!sp) continue;
      await ProductViewModel.create({
        userId,
        productId: sp.id,
        viewedAt: daysAgo(randInt(1, 25)),
      });
      viewTotal++;
    }
  }
  console.log(`[seed]   ${viewTotal} product views`);

  // ── A sample conversation (so the messaging UI isn't empty in a demo) ──
  const aliceId = buyerByEmail.get('alice@abracadabra.local');
  const appleSellerUserId = sellerUserIdByShopSlug.get('apple-store');
  if (aliceId && appleSellerUserId) {
    const thread = [
      { from: aliceId, text: "Bonjour, l'iPhone 15 Pro est-il disponible en bleu titane ?" },
      {
        from: appleSellerUserId,
        text: 'Bonjour ! Oui, le coloris Bleu Titane est en stock, expédié sous 24h.',
      },
      { from: aliceId, text: 'Parfait, merci beaucoup pour votre réactivité !' },
    ];
    const conv = await ConversationModel.create({
      participants: [aliceId, appleSellerUserId],
      lastMessage: thread[thread.length - 1].text,
      lastMessageAt: daysAgo(1),
    });
    for (let i = 0; i < thread.length; i++) {
      await MessageModel.create({
        conversationId: conv._id,
        senderId: thread[i].from,
        content: thread[i].text,
        isRead: i < thread.length - 1, // last message left unread for the seller
        createdAt: daysAgo(1),
      });
    }
    console.log(`[seed]   1 sample conversation (${thread.length} messages)`);
  }

  console.log('\n[seed] ✅ Done.');
  console.log(`[seed]   ${sellers.length} sellers (login with password "${DEFAULT_PASSWORD}")`);
  console.log(`[seed]   ${categories.length} categories, ${products.length} products`);
  console.log(`[seed]   ${reviewTotal} reviews, ${orderSeq} orders, ${viewTotal} views`);
  console.log(`[seed]   ${coupons.length} coupons (try WELCOME10, SUMMER20, BIGSPENDER)`);
  console.log(
    `[seed]   admin <${ADMIN.email}>, ${buyers.length} buyers — all password "${DEFAULT_PASSWORD}"`,
  );
  console.log('[seed]\n[seed] Demo logins (password "' + DEFAULT_PASSWORD + '"):');
  console.log(`[seed]   alice@abracadabra.local  → Apple / audio recommendations`);
  console.log(`[seed]   bruno@abracadabra.local  → gaming / desk setup recommendations`);
  console.log(`[seed]   ${ADMIN.email}  → admin dashboard`);
  for (const s of sellers) console.log(`[seed]   ${s.email}  (shop /sellers/${s.shopSlug})`);

  await mongoose.disconnect();
}

const args = process.argv.slice(2);
const cleanFirst = !args.includes('--no-clean');

run({ cleanFirst }).catch((err) => {
  console.error('[seed] failed', err);
  process.exit(1);
});
