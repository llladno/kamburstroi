<script setup lang="ts">
const { open } = useLeadModal();
const isMobileMenuOpen = ref(false);
const { data: settings } = await useAsyncData('header-settings', fetchSettings);

const navLinks = [
  { label: 'Наши объекты', href: '#objects' },
  { label: 'О компании', href: '#about' },
  { label: 'Услуги', to: '/services' },
  { label: 'Отзывы', href: '#reviews' },
  { label: 'Контакты', href: '#contacts' },
];
</script>

<template>
  <header class="bg-bg/80 sticky top-0 z-40 backdrop-blur-md">
    <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
      <NuxtLink to="/" class="text-text text-base font-medium">Kambyrstroi</NuxtLink>

      <nav class="hidden items-center gap-10 md:flex">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.label"
          :to="link.to ?? link.href"
          class="text-text-muted hover:text-text text-xs transition-colors"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <div class="hidden items-center gap-4 md:flex">
        <a
          v-if="settings?.phone"
          :href="`tel:${settings.phone.replace(/[^+\d]/g, '')}`"
          class="text-text-secondary text-xs"
        >
          {{ settings.phone }}
        </a>
        <button
          class="bg-primary text-primary-text rounded-control px-5 py-2.5 text-xs font-medium"
          @click="open"
        >
          Оставить заявку
        </button>
      </div>

      <button
        class="text-text md:hidden"
        aria-label="Открыть меню"
        @click="isMobileMenuOpen = !isMobileMenuOpen"
      >
        <span class="block h-0.5 w-6 bg-current" />
        <span class="mt-1.5 block h-0.5 w-6 bg-current" />
        <span class="mt-1.5 block h-0.5 w-6 bg-current" />
      </button>
    </div>

    <div v-if="isMobileMenuOpen" class="bg-bg border-border border-t px-6 py-4 md:hidden">
      <nav class="flex flex-col gap-4">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.label"
          :to="link.to ?? link.href"
          class="text-text-secondary text-sm"
          @click="isMobileMenuOpen = false"
        >
          {{ link.label }}
        </NuxtLink>
        <button
          class="bg-primary text-primary-text rounded-control mt-2 px-5 py-3 text-sm font-medium"
          @click="
            open();
            isMobileMenuOpen = false;
          "
        >
          Оставить заявку
        </button>
      </nav>
    </div>
  </header>
</template>
