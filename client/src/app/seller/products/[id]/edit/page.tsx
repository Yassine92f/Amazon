'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import ProductForm from '../../../../../components/seller/ProductForm';
import {
  getMyProduct,
  updateProduct,
  deleteProduct,
  type ProductDto,
  type ProductInput,
} from '../../../../../lib/catalog';

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const router = useRouter();
  const [product, setProduct] = useState<ProductDto | null>(null);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    getMyProduct(id)
      .then((p) => {
        if (!cancelled) setProduct(p);
      })
      .catch(() => {
        if (!cancelled) setNotFound(true);
      });
    return () => {
      cancelled = true;
    };
  }, [id]);

  if (notFound) {
    return (
      <div className="container-main py-20 text-center">
        <h1 className="mb-2 text-xl font-bold text-brand-900">Product not found</h1>
        <p className="text-sm text-muted">
          This product doesn&apos;t exist or doesn&apos;t belong to your shop.
        </p>
      </div>
    );
  }

  if (!product) {
    return <div className="container-main py-20 text-center text-sm text-muted">Loading…</div>;
  }

  const submit = async (input: ProductInput, isActive: boolean) => {
    await updateProduct(id, { ...input, isActive });
    router.push('/seller/products');
  };

  const handleDelete = async () => {
    await deleteProduct(id);
  };

  return (
    <ProductForm
      initial={product}
      onSubmit={submit}
      onDelete={handleDelete}
      submitLabel="Save changes"
    />
  );
}
