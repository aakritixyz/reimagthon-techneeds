import AdminPanel from '@/components/adminPanel';
import { notFound } from 'next/navigation';
export default async function AdminSection({ params }) {
  const { section } = await params;
  if (!['programs', 'mentors', 'allocations', 'activity'].includes(section)) notFound();
  return <AdminPanel initialView={section} />;
}
