import { Sidebar } from '@/components/layout/Sidebar';
import { StatsCards } from '@/components/layout/StatsCards';

export default function ProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="flex">
      <Sidebar />
      <main className="flex-1 ml-64">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <StatsCards />
          {children}
        </div>
      </main>
    </div>
  );
}
