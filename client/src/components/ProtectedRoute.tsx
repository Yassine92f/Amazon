'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuthStore } from '../store';

interface Props {
  children: React.ReactNode;
  roles?: string[];
}

export function ProtectedRoute({ children, roles }: Props) {
  const { isAuthenticated, isLoading, user } = useAuthStore();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
    if (!isLoading && isAuthenticated && roles && user && !roles.includes(user.role)) {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, user, roles, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-[var(--color-brand-500)] border-t-transparent" />
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (roles && user && !roles.includes(user.role)) return null;

  return <>{children}</>;
}
