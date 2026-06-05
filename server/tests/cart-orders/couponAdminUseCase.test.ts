import { CouponAdminUseCase } from '../../src/application/use-cases/CouponAdminUseCase';
import { makeCouponRepo, buildCoupon } from './helpers';

describe('CouponAdminUseCase', () => {
  it('rejects a duplicate code', async () => {
    const repo = makeCouponRepo([buildCoupon({ code: 'SAVE10' })]);
    const useCase = new CouponAdminUseCase(repo);
    await expect(
      useCase.create({ code: 'save10', discountType: 'percentage', discountValue: 10 }),
    ).rejects.toMatchObject({ statusCode: 409 });
  });

  it('rejects a percentage above 100', async () => {
    const repo = makeCouponRepo([]);
    const useCase = new CouponAdminUseCase(repo);
    await expect(
      useCase.create({ code: 'HALF', discountType: 'percentage', discountValue: 150 }),
    ).rejects.toMatchObject({ statusCode: 400 });
  });

  it('creates a valid coupon (uppercased code, default active)', async () => {
    const created = buildCoupon({ id: 'c1', code: 'WELCOME', discountValue: 15 });
    const repo = makeCouponRepo([]);
    (repo.create as jest.Mock).mockResolvedValueOnce(created);
    const useCase = new CouponAdminUseCase(repo);

    const dto = await useCase.create({
      code: 'welcome',
      discountType: 'percentage',
      discountValue: 15,
    });

    expect(repo.create).toHaveBeenCalledWith(expect.objectContaining({ code: 'WELCOME' }));
    expect(dto.code).toBe('WELCOME');
    expect(dto.isActive).toBe(true);
  });

  it('404s when updating a missing coupon', async () => {
    const repo = makeCouponRepo([]);
    (repo.findById as jest.Mock).mockResolvedValueOnce(null);
    const useCase = new CouponAdminUseCase(repo);
    await expect(useCase.update('nope', { isActive: false })).rejects.toMatchObject({
      statusCode: 404,
    });
  });
});
