import { fetchTransactions } from '@/features/finances/actions/finances.action';
import { PaymentsPage } from '@/features/finances/components';

interface PageProps {
  searchParams: Promise<{
    producerId?: string;
  }>;
}

export default async function PaymentsRoute({ searchParams }: PageProps) {
  const params = await searchParams;

  const result = await fetchTransactions({
    producerId: params.producerId ? parseInt(params.producerId, 10) : undefined,
  });

  const payments = result.data.filter(
    (transaction) =>
      transaction.type === 'payment' ||
      transaction.type === 'advance' ||
      transaction.type === 'settlement'
  );

  return (
    <div className="p-6">
      <PaymentsPage initialPayments={payments} />
    </div>
  );
}
