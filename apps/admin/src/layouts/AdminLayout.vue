<script setup lang="ts">
import { useRouter } from 'vue-router';
import { useAuth } from '../composables/useAuth';
import ToastHost from '../components/ToastHost.vue';

const { logout } = useAuth();
const router = useRouter();

const links = [
  { to: '/', label: 'Дашборд' },
  { to: '/objects', label: 'Объекты' },
  { to: '/services', label: 'Услуги' },
  { to: '/advantages', label: 'Преимущества' },
  { to: '/team', label: 'Команда' },
  { to: '/reviews', label: 'Отзывы' },
  { to: '/leads', label: 'Заявки' },
  { to: '/settings', label: 'Настройки' },
];

function onLogout() {
  logout();
  router.push('/login');
}
</script>

<template>
  <div class="flex min-h-screen">
    <aside class="w-56 shrink-0 border-r border-border bg-bg p-4">
      <div class="mb-6 text-lg font-semibold text-text">Kambyrstroi</div>
      <nav class="flex flex-col gap-1">
        <router-link
          v-for="link in links"
          :key="link.to"
          :to="link.to"
          class="rounded-control px-3 py-2 text-sm text-text-secondary hover:bg-surface"
          active-class="bg-surface text-text font-medium"
          exact-active-class="bg-surface text-text font-medium"
        >
          {{ link.label }}
        </router-link>
      </nav>
      <button
        class="mt-6 w-full rounded-control border border-border px-3 py-2 text-sm text-text-secondary"
        @click="onLogout"
      >
        Выйти
      </button>
    </aside>
    <main class="flex-1 bg-surface p-8">
      <router-view />
    </main>
    <ToastHost />
  </div>
</template>
