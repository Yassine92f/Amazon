import { OrderStatus } from '@ecommerce/shared';
import { t } from '../../lib/i18n';

const STYLES: Record<OrderStatus, string> = {
  [OrderStatus.PENDING]: 'bg-amber-50 text-amber-700',
  [OrderStatus.CONFIRMED]: 'bg-blue-50 text-blue-700',
  [OrderStatus.PROCESSING]: 'bg-indigo-50 text-indigo-700',
  [OrderStatus.SHIPPED]: 'bg-sky-50 text-sky-700',
  [OrderStatus.DELIVERED]: 'bg-green-50 text-green-700',
  [OrderStatus.CANCELLED]: 'bg-red-50 text-[var(--color-error)]',
  [OrderStatus.REFUNDED]: 'bg-gray-100 text-gray-600',
};

export default function StatusBadge({ status }: { status: OrderStatus }) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-bold ${STYLES[status]}`}
    >
      <span className="h-1.5 w-1.5 rounded-full bg-current" />
      {t.orders.status[status]}
    </span>
  );
}
