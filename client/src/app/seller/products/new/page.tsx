'use client';

import { useRouter } from 'next/navigation';
import ProductForm from '../../../../components/seller/ProductForm';
import { createProduct, updateProduct, type ProductInput } from '../../../../lib/catalog';

export default function NewProductPage() {
  const router = useRouter();

  const submit = async (input: ProductInput, isActive: boolean) => {
    const created = await createProduct(input);
    if (!isActive) {
      try {
        await updateProduct(created._id, { isActive: false });
      } catch {
        // non-fatal: product still created as active
      }
    }
    router.push('/seller/products');
  };

  return <ProductForm onSubmit={submit} submitLabel="Publish" />;
}
