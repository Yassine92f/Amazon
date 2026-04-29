import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../../src/app';
import { ProductModel } from '../../src/infrastructure/database/models/Product';
import { PriceHistoryModel } from '../../src/infrastructure/database/models/PriceHistory';

/**
 * End-to-end integration tests against the real Express app and an in-memory
 * MongoDB — no mocks. Exercises the wired HTTP stack: auth, cart and the order
 * flow, plus the OpenAPI document.
 */
let mongo: MongoMemoryServer;

beforeAll(async () => {
  mongo = await MongoMemoryServer.create();
  await mongoose.connect(mongo.getUri());
}, 60000);

afterAll(async () => {
  await mongoose.disconnect();
  await mongo.stop();
});

async function seedProduct(slug: string, price = 30, stock = 5) {
  const product = await ProductModel.create({
    sellerId: new mongoose.Types.ObjectId(),
    categoryId: new mongoose.Types.ObjectId(),
    name: `Test ${slug}`,
    slug,
    description: 'An integration test product',
    variants: [{ name: 'Black', sku: `SKU-${slug}`, price, stock }],
    images: ['https://cdn.example.com/x.jpg'],
    isActive: true,
  });
  return { productId: product._id.toString(), variantId: product.variants[0]._id.toString() };
}

describe('Auth', () => {
  it('registers a user and returns the current profile', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email: 'auth1@test.fr', password: 'Password123', firstName: 'A', lastName: 'One' });
    expect(reg.status).toBe(201);
    const token = reg.body.data.accessToken;
    expect(token).toBeTruthy();

    const me = await request(app).get('/api/auth/me').set('Authorization', `Bearer ${token}`);
    expect(me.status).toBe(200);
    expect(me.body.data.email).toBe('auth1@test.fr');
  });

  it('rejects an unknown login and an unauthenticated /me', async () => {
    const bad = await request(app)
      .post('/api/auth/login')
      .send({ email: 'ghost@test.fr', password: 'whatever' });
    expect(bad.status).toBeGreaterThanOrEqual(400);

    const me = await request(app).get('/api/auth/me');
    expect(me.status).toBe(401);
  });
});

describe('Purchase flow', () => {
  it('register → add address → add to cart → create order (stock decremented)', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email: 'buyer@test.fr', password: 'Password123', firstName: 'Buy', lastName: 'Er' });
    const token = reg.body.data.accessToken;
    const bearer = `Bearer ${token}`;

    const { productId, variantId } = await seedProduct('headphones', 30, 5);

    const addr = await request(app).post('/api/users/addresses').set('Authorization', bearer).send({
      label: 'Home',
      street: '1 rue de Paris',
      city: 'Paris',
      postalCode: '75001',
      country: 'France',
      isDefault: true,
    });
    expect(addr.status).toBe(201);
    const addressId = addr.body.data[0].id ?? addr.body.data[0]._id;

    const add = await request(app)
      .post('/api/cart/items')
      .set('Authorization', bearer)
      .send({ productId, variantId, quantity: 2 });
    expect(add.status).toBe(201);

    const cart = await request(app).get('/api/cart').set('Authorization', bearer);
    expect(cart.body.data.totalItems).toBe(2);

    const order = await request(app)
      .post('/api/orders')
      .set('Authorization', bearer)
      .send({
        items: [{ productId, variantId, quantity: 2 }],
        deliveryType: 'home',
        shippingAddressId: addressId,
      });
    expect(order.status).toBe(201);
    expect(order.body.data.status).toBe('pending');
    expect(order.body.data.totalAmount).toBeGreaterThan(0);

    // Stock was reserved atomically.
    const fresh = await ProductModel.findById(productId);
    expect(fresh?.variants[0].stock).toBe(3);
  });

  it('rejects an order with insufficient stock', async () => {
    const reg = await request(app)
      .post('/api/auth/register')
      .send({ email: 'buyer2@test.fr', password: 'Password123', firstName: 'B', lastName: 'Two' });
    const bearer = `Bearer ${reg.body.data.accessToken}`;
    const { productId, variantId } = await seedProduct('limited', 20, 1);

    const addr = await request(app).post('/api/users/addresses').set('Authorization', bearer).send({
      label: 'Home',
      street: '2 rue',
      city: 'Lyon',
      postalCode: '69001',
      country: 'France',
      isDefault: true,
    });
    const addressId = addr.body.data[0].id ?? addr.body.data[0]._id;

    const order = await request(app)
      .post('/api/orders')
      .set('Authorization', bearer)
      .send({
        items: [{ productId, variantId, quantity: 5 }],
        deliveryType: 'home',
        shippingAddressId: addressId,
      });
    expect(order.status).toBe(409);
  });
});

describe('OpenAPI', () => {
  it('serves the OpenAPI document', async () => {
    const res = await request(app).get('/api/docs.json');
    expect(res.status).toBe(200);
    expect(res.body.openapi).toBe('3.0.3');
    expect(res.body.paths['/orders']).toBeDefined();
    expect(res.body.paths['/auth/login']).toBeDefined();
  });
});

describe('Eco-delivery', () => {
  it('lists the static catalogue of options', async () => {
    const res = await request(app).get('/api/eco-delivery/options');
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(Array.isArray(res.body.data.options)).toBe(true);
    expect(res.body.data.options.length).toBeGreaterThan(2);
    expect(res.body.data.baselineCo2Kg).toBeGreaterThan(0);
  });

  it('previews the impact for a known option id', async () => {
    const res = await request(app)
      .get('/api/eco-delivery/impact')
      .query({ optionId: 'bike_cargo' });
    expect(res.status).toBe(200);
    expect(res.body.data.co2SavedKg).toBeGreaterThan(0);
    expect(res.body.data.equivalentCarKm).toBeGreaterThan(0);
  });

  it('rejects an unknown option id with 400', async () => {
    const res = await request(app)
      .get('/api/eco-delivery/impact')
      .query({ optionId: 'flying-car' });
    expect(res.status).toBe(400);
  });

  it('records the buyer choice on their own order and reads it back', async () => {
    const reg = await request(app).post('/api/auth/register').send({
      email: 'eco@test.fr',
      password: 'Password123',
      firstName: 'E',
      lastName: 'Co',
    });
    const bearer = `Bearer ${reg.body.data.accessToken}`;
    const { productId, variantId } = await seedProduct('eco-product', 25, 5);

    const addr = await request(app).post('/api/users/addresses').set('Authorization', bearer).send({
      label: 'Home',
      street: '1 rue verte',
      city: 'Nantes',
      postalCode: '44000',
      country: 'France',
      isDefault: true,
    });
    const addressId = addr.body.data[0].id ?? addr.body.data[0]._id;

    const order = await request(app)
      .post('/api/orders')
      .set('Authorization', bearer)
      .send({
        items: [{ productId, variantId, quantity: 1 }],
        deliveryType: 'home',
        shippingAddressId: addressId,
      });
    expect(order.status).toBe(201);
    const orderId = order.body.data._id;

    const choice = await request(app)
      .post(`/api/eco-delivery/orders/${orderId}/choice`)
      .set('Authorization', bearer)
      .send({ optionId: 'bike_cargo', donateTree: true });
    expect(choice.status).toBe(200);
    expect(choice.body.data.co2SavedKg).toBeGreaterThan(0);
    expect(choice.body.data.treesPlanted).toBe(1);
    expect(choice.body.data.treeDonationCents).toBe(100);

    // Public trees-planted counter reflects the pledge.
    const planted = await request(app).get('/api/eco-delivery/trees-planted');
    expect(planted.status).toBe(200);
    expect(planted.body.data.totalTrees).toBeGreaterThanOrEqual(1);

    const fetched = await request(app)
      .get(`/api/eco-delivery/orders/${orderId}/metric`)
      .set('Authorization', bearer);
    expect(fetched.status).toBe(200);
    expect(fetched.body.data.optionId).toBe('bike_cargo');
  });

  it('blocks recording on someone else’s order with 403', async () => {
    // Attacker
    const attacker = await request(app).post('/api/auth/register').send({
      email: 'attacker@test.fr',
      password: 'Password123',
      firstName: 'A',
      lastName: 'X',
    });
    const attackerBearer = `Bearer ${attacker.body.data.accessToken}`;

    // Legit owner creates an order
    const owner = await request(app).post('/api/auth/register').send({
      email: 'owner@test.fr',
      password: 'Password123',
      firstName: 'O',
      lastName: 'W',
    });
    const ownerBearer = `Bearer ${owner.body.data.accessToken}`;
    const { productId, variantId } = await seedProduct('owner-product', 20, 3);
    const addr = await request(app)
      .post('/api/users/addresses')
      .set('Authorization', ownerBearer)
      .send({
        label: 'Home',
        street: '1 r',
        city: 'Lille',
        postalCode: '59000',
        country: 'France',
        isDefault: true,
      });
    const order = await request(app)
      .post('/api/orders')
      .set('Authorization', ownerBearer)
      .send({
        items: [{ productId, variantId, quantity: 1 }],
        deliveryType: 'home',
        shippingAddressId: addr.body.data[0].id ?? addr.body.data[0]._id,
      });
    const orderId = order.body.data._id;

    // Attacker tries to annotate it
    const res = await request(app)
      .post(`/api/eco-delivery/orders/${orderId}/choice`)
      .set('Authorization', attackerBearer)
      .send({ optionId: 'standard' });
    expect(res.status).toBe(403);
  });
});

describe('Price history', () => {
  it('returns a series and a summary for a product with recorded prices', async () => {
    const { productId, variantId } = await seedProduct('price-history-demo', 50, 10);
    const now = Date.now();
    const oneDay = 24 * 60 * 60 * 1000;

    // Seed three observations: 60d ago (80), 30d ago (60), 5d ago (50).
    await PriceHistoryModel.insertMany([
      {
        productId,
        variantId,
        price: 80,
        recordedAt: new Date(now - 60 * oneDay),
      },
      {
        productId,
        variantId,
        price: 60,
        recordedAt: new Date(now - 30 * oneDay),
      },
      {
        productId,
        variantId,
        price: 50,
        recordedAt: new Date(now - 5 * oneDay),
      },
    ]);

    const res = await request(app)
      .get(`/api/products/${productId}/price-history`)
      .query({ variantId, days: 90 });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);

    const body = res.body.data;
    expect(body.productId).toBe(productId);
    expect(body.variantId).toBe(variantId);
    expect(body.period.days).toBe(90);
    expect(body.points.length).toBeGreaterThan(0);
    expect(body.summary.currentPrice).toBe(50);
    expect(body.summary.minPrice).toBe(50);
    expect(body.summary.maxPrice).toBe(80);
    expect(body.summary.isLowestEver).toBe(true);
    expect(body.summary.dropFromMaxPercent).toBe(38);
  });

  it('clamps the days param into [7, 365]', async () => {
    const { productId, variantId } = await seedProduct('price-history-clamp', 20, 1);

    const huge = await request(app)
      .get(`/api/products/${productId}/price-history`)
      .query({ variantId, days: 999 });
    expect(huge.body.data.period.days).toBe(365);

    const tiny = await request(app)
      .get(`/api/products/${productId}/price-history`)
      .query({ variantId, days: 1 });
    expect(tiny.body.data.period.days).toBe(7);
  });

  it('returns 404 for an unknown product id', async () => {
    const ghost = new mongoose.Types.ObjectId().toString();
    const res = await request(app).get(`/api/products/${ghost}/price-history`);
    expect(res.status).toBe(404);
  });

  it('falls back to the cheapest variant when no variantId is provided', async () => {
    const product = await ProductModel.create({
      sellerId: new mongoose.Types.ObjectId(),
      categoryId: new mongoose.Types.ObjectId(),
      name: 'Cheapest fallback',
      slug: 'cheapest-fallback',
      description: 'Two variants — should default to the cheaper one',
      variants: [
        { name: 'Small', sku: 'SML', price: 30, stock: 4 },
        { name: 'Large', sku: 'LRG', price: 50, stock: 2 },
      ],
      images: ['https://cdn.example.com/x.jpg'],
      isActive: true,
    });

    const res = await request(app).get(`/api/products/${product._id}/price-history`);
    expect(res.status).toBe(200);
    expect(res.body.data.summary.currentPrice).toBe(30);
  });
});
