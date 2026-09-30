export function resolveRedirect(isAuthenticated: boolean, path: string): string | null {
  const isLoginPage = path === '/login';
  if (!isAuthenticated && !isLoginPage) return '/login';
  if (isAuthenticated && isLoginPage) return '/';
  return null;
}
