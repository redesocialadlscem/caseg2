import { useState, useEffect, useCallback } from 'react';
import { useAuthContext } from '../context/AuthContext';

export interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: 'student' | 'admin';
  isActive: boolean;
  createdAt: string;
}

interface UseAdminUsersOptions {
  page?: number;
  limit?: number;
  search?: string;
  role?: 'student' | 'admin';
  isActive?: boolean;
}

interface UseAdminUsersResult {
  users: AdminUser[];
  total: number;
  page: number;
  limit: number;
  loading: boolean;
  error: string | null;
  setPage: (page: number) => void;
  refetch: () => void;
  toggleRole: (userId: number, newRole: 'student' | 'admin') => Promise<boolean>;
  toggleStatus: (userId: number, isActive: boolean) => Promise<boolean>;
}

export function useAdminUsers(options: UseAdminUsersOptions = {}): UseAdminUsersResult {
  const { accessToken } = useAuthContext();
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(options.page ?? 1);
  const [limit] = useState(options.limit ?? 20);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refetchKey, setRefetchKey] = useState(0);

  const fetchUsers = useCallback(async () => {
    if (!accessToken) return;
    setLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams();
      params.set('page', String(page));
      params.set('limit', String(limit));
      if (options.search) params.set('search', options.search);
      if (options.role) params.set('role', options.role);
      if (options.isActive !== undefined) params.set('isActive', String(options.isActive));

      const res = await fetch(`/api/admin/users?${params.toString()}`, {
        headers: { Authorization: `Bearer ${accessToken}` },
      });

      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || `Erro ${res.status}`);
      }

      const data = await res.json();
      setUsers(data.users);
      setTotal(data.total);
      setPage(data.page);
    } catch (err: any) {
      setError(err.message || 'Falha ao carregar usuários');
    } finally {
      setLoading(false);
    }
  }, [accessToken, page, limit, options.search, options.role, options.isActive, refetchKey]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const refetch = useCallback(() => setRefetchKey((k) => k + 1), []);

  const toggleRole = useCallback(
    async (userId: number, newRole: 'student' | 'admin'): Promise<boolean> => {
      if (!accessToken) return false;
      try {
        const res = await fetch(`/api/admin/users/${userId}/role`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ role: newRole }),
        });
        if (!res.ok) return false;
        refetch();
        return true;
      } catch {
        return false;
      }
    },
    [accessToken, refetch]
  );

  const toggleStatus = useCallback(
    async (userId: number, isActive: boolean): Promise<boolean> => {
      if (!accessToken) return false;
      try {
        const res = await fetch(`/api/admin/users/${userId}/status`, {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${accessToken}`,
          },
          body: JSON.stringify({ isActive }),
        });
        if (!res.ok) return false;
        refetch();
        return true;
      } catch {
        return false;
      }
    },
    [accessToken, refetch]
  );

  return { users, total, page, limit, loading, error, setPage, refetch, toggleRole, toggleStatus };
}
