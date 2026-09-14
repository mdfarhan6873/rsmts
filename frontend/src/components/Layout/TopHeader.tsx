'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

export default function TopHeader() {
  const { user, loading, logout } = useAuth();
  const router = useRouter();

  const handleLogout = async () => {
    await logout();
    router.push('/login');
  };

  if (!user) return null;

  return (
    <div
      className="flex flex-col items-end cursor-pointer hover:opacity-80 transition-opacity"
      onDoubleClick={handleLogout}
      title="Double click to logout"
    >
      <span className="text-sm font-medium text-gray-900">Hi, {user.name}</span>
      <span className="text-xs text-blue-500">{user.role}</span>
    </div>
  );
}
