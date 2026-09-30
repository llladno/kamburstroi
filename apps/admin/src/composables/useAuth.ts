import { computed, ref } from 'vue';
import { api, setUnauthorizedHandler } from '../lib/api';
import { clearToken, getToken, setToken } from '../lib/token';
import type { LoginResponse } from '../types/api';

const token = ref<string | null>(getToken());

setUnauthorizedHandler(() => {
  token.value = null;
  clearToken();
});

export function useAuth() {
  const isAuthenticated = computed(() => token.value !== null);

  async function login(login: string, password: string): Promise<void> {
    const { accessToken } = await api.post<LoginResponse>('/admin/auth/login', { login, password });
    token.value = accessToken;
    setToken(accessToken);
  }

  function logout(): void {
    token.value = null;
    clearToken();
  }

  return { isAuthenticated, login, logout };
}
