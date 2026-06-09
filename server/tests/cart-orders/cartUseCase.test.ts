import { CartUseCase } from '../../src/application/use-cases/CartUseCase';
import { CartOwner } from '../../src/domain/entities/Cart';
import { buildProduct, makeProductRepo, makeCartRepo } from './helpers';

const guest: CartOwner = { type: 'guest', id: 'guest-1' };
const user: CartOwner = { type: 'user', id: 'user-1' };

describe('CartUseCase', () => {
  it('adds an item using the server price and merges quantities', async () => {
    const cartRepo = makeCartRepo();
    const useCase = new CartUseCase(cartRepo, makeProductRepo([buildProduct()]));

    let cart = await useCase.addItem(guest, {
      productId: 'product-1',
      variantId: 'v1',
      quantity: 1,
    });
    expect(cart.items[0].price).toBe(30);
    expect(cart.totalAmount).toBe(30);

    cart = await useCase.addItem(guest, { productId: 'product-1', variantId: 'v1', quantity: 2 });
    expect(cart.items).toHaveLength(1);
    expect(cart.items[0].quantity).toBe(3);
    expect(cart.totalItems).toBe(3);
  });

  it('refuses to add more than the available stock', async () => {
    const product = buildProduct({ variants: [{ ...buildProduct().variants[0], stock: 2 }] });
    const useCase = new CartUseCase(makeCartRepo(), makeProductRepo([product]));
    await expect(
      useCase.addItem(guest, { productId: 'product-1', variantId: 'v1', quantity: 3 }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('removes an item when its quantity is updated to 0', async () => {
    const useCase = new CartUseCase(makeCartRepo(), makeProductRepo([buildProduct()]));
    await useCase.addItem(user, { productId: 'product-1', variantId: 'v1', quantity: 2 });
    const cart = await useCase.updateItem(user, 'product-1', 'v1', 0);
    expect(cart.items).toHaveLength(0);
  });

  it('merges the guest cart into the user cart, clamps to stock and clears the guest cart', async () => {
    const product = buildProduct({ variants: [{ ...buildProduct().variants[0], stock: 4 }] });
    const cartRepo = makeCartRepo();
    const useCase = new CartUseCase(cartRepo, makeProductRepo([product]));

    await useCase.addItem(guest, { productId: 'product-1', variantId: 'v1', quantity: 3 });
    await useCase.addItem(user, { productId: 'product-1', variantId: 'v1', quantity: 3 });

    const merged = await useCase.mergeGuestIntoUser('user-1', { guestId: 'guest-1' });
    // 3 + 3 = 6 but stock is 4 -> clamped to 4
    expect(merged.items[0].quantity).toBe(4);
    expect(await cartRepo.get(guest)).toBeNull();
  });

  it('merges from client-provided items when the guest cookie is absent', async () => {
    const product = buildProduct({ variants: [{ ...buildProduct().variants[0], stock: 4 }] });
    const cartRepo = makeCartRepo();
    const useCase = new CartUseCase(cartRepo, makeProductRepo([product]));

    await useCase.addItem(user, { productId: 'product-1', variantId: 'v1', quantity: 1 });

    // No guestId (cookie dropped by the browser) — the lines come from the client.
    const merged = await useCase.mergeGuestIntoUser('user-1', {
      items: [{ productId: 'product-1', variantId: 'v1', quantity: 2 }],
    });

    expect(merged.items[0].quantity).toBe(3); // 1 (user) + 2 (client) merged
    expect(merged.items[0].price).toBe(product.variants[0].price); // refreshed, not 0
  });
});
