import { useMutation } from '@tanstack/react-query';
import { api } from '@/lib/api';
import type { AuthResponse } from '@/lib/types';

export function useLoginGoogle() {
  return useMutation({
    mutationFn: async (idToken: string) => {
      const { data } = await api.post<AuthResponse>('/api/v1/auth/google', {
        idToken,
      });
      return data;
    },
  });
}
