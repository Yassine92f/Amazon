import mongoose from 'mongoose';
import { MongoMemoryServer } from 'mongodb-memory-server';
import request from 'supertest';
import app from '../../src/app';
import { ProductModel } from '../../src/infrastructure/database/models/Product';

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
