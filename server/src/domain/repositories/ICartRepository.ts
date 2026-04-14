import { CartEntity, CartItemEntity, CartOwner } from '../entities/Cart';

export interface ICartRepository {
  get(owner: CartOwner): Promise<CartEntity | null>;
  save(owner: CartOwner, items: CartItemEntity[]): Promise<CartEntity>;
  clear(owner: CartOwner): Promise<void>;
}
