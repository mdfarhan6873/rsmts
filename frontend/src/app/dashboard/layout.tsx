import Sidebar from '@/components/Layout/Sidebar';
import TopHeader from '@/components/Layout/TopHeader';
import { AuthProvider } from '@/contexts/AuthContext';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <AuthProvider>
      <div className="flex h-screen bg-white overflow-hidden font-sans text-gray-900">
        <Sidebar />
        <div className="flex flex-col flex-1 min-w-0 bg-white">
          <div className="flex justify-end items-center px-6 pt-4 bg-white">
            <TopHeader />
          </div>
          <main className="flex-1 overflow-y-auto bg-white p-6 pt-2">
            {children}
          </main>
        </div>
      </div>
    </AuthProvider>
  );
}
