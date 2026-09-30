import { createRouter, createWebHistory } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import { resolveRedirect } from './guard';

const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/login', name: 'login', component: () => import('../pages/LoginPage.vue') },
    {
      path: '/',
      component: () => import('../layouts/AdminLayout.vue'),
      children: [
        { path: '', name: 'dashboard', component: () => import('../pages/DashboardPage.vue') },
        { path: 'objects', name: 'objects', component: () => import('../pages/ObjectsListPage.vue') },
        { path: 'objects/new', name: 'object-new', component: () => import('../pages/ObjectEditPage.vue') },
        { path: 'objects/:id', name: 'object-edit', component: () => import('../pages/ObjectEditPage.vue') },
        { path: 'services', name: 'services', component: () => import('../pages/ServicesPage.vue') },
        { path: 'advantages', name: 'advantages', component: () => import('../pages/AdvantagesPage.vue') },
        { path: 'team', name: 'team', component: () => import('../pages/TeamPage.vue') },
        { path: 'reviews', name: 'reviews', component: () => import('../pages/ReviewsPage.vue') },
        { path: 'leads', name: 'leads', component: () => import('../pages/LeadsPage.vue') },
        { path: 'settings', name: 'settings', component: () => import('../pages/SettingsPage.vue') },
      ],
    },
  ],
});

router.beforeEach((to) => {
  const { isAuthenticated } = useAuth();
  const redirect = resolveRedirect(isAuthenticated.value, to.path);
  return redirect ?? true;
});

export default router;
