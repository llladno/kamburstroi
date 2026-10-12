<script setup lang="ts">
import ButtonComponent from '~/components/button/ButtonComponent.vue';

const { open } = useLeadModal();
const isMobileMenuOpen = ref(false);
const { data: settings } = await useAsyncData('header-settings', fetchSettings);

const navLinks = [
  { label: 'Наши объекты', to: '/#objects' },
  { label: 'О компании', to: '/#about' },
  { label: 'Услуги', to: '/#services' },
  { label: 'Отзывы', to: '/#reviews' },
  { label: 'Контакты', to: '/#contacts' },
];
</script>

<template>
  <header class="bg-bg/80 sticky top-0 z-40 backdrop-blur-md">
    <div class="mx-auto flex max-w-7xl items-center justify-between px-6 py-5">
      <NuxtLink to="/" class="flex items-center gap-2.5" aria-label="КамбурСтрой — на главную">
        <img src="/logo.jpg" alt="КамбурСтрой" class="h-9 w-auto rounded-md" />
        <span class="text-text hidden text-base font-medium sm:inline">КамбурСтрой</span>
      </NuxtLink>

      <nav class="hidden items-center gap-10 md:flex">
        <NuxtLink
          v-for="link in navLinks"
          :key="link.label"
          :to="link.to"
          class="hover-underline text-text-muted hover:text-accent pb-0.5 text-xs"
        >
          {{ link.label }}
        </NuxtLink>
      </nav>

      <div class="hidden items-center gap-4 md:flex">
        <a
          v-if="settings?.phone"
          :href="`tel:${settings.phone.replace(/[^+\d]/g, '')}`"
          class="hover-underline text-text-secondary hover:text-accent pb-0.5 text-xs"
        >
          {{ settings.phone }}
        </a>
        <ButtonComponent size="sm" @click="open">
          Оставить заявку
        </ButtonComponent>
      </div>

      <div class="md:hidden">
        <ButtonComponent
          variant="ghost"
          size="sm"
          icon-only
          aria-label="Открыть меню"
          @click="isMobileMenuOpen = !isMobileMenuOpen"
        >
          <span class="flex flex-col gap-1.5">
            <span class="block h-0.5 w-5 bg-current" />
            <span class="block h-0.5 w-5 bg-current" />
            <span class="block h-0.5 w-5 bg-current" />
          </span>
        </ButtonComponent>
      </div>
    </div>

    <Transition name="mobile-nav">
      <div
        v-if="isMobileMenuOpen"
        class="bg-bg shadow-floating absolute inset-x-0 top-full max-h-[calc(100dvh-5rem)] overflow-y-auto border-t border-black/5 px-6 py-5 md:hidden"
      >
        <nav class="flex flex-col gap-4">
          <NuxtLink
            v-for="link in navLinks"
            :key="link.label"
            :to="link.to"
            class="hover-underline text-text-secondary hover:text-accent w-fit pb-0.5 text-sm"
            @click="isMobileMenuOpen = false"
          >
            {{ link.label }}
          </NuxtLink>
          <ButtonComponent
            block
            class="mt-2"
            @click="
              open();
              isMobileMenuOpen = false;
            "
          >
            Оставить заявку
          </ButtonComponent>
        </nav>
      </div>
    </Transition>
  </header>
</template>

<style scoped>
.mobile-nav-enter-active,
.mobile-nav-leave-active {
  transition:
    opacity 200ms ease,
    transform 200ms cubic-bezier(0.22, 1, 0.36, 1);
}

.mobile-nav-enter-from,
.mobile-nav-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}

@media (prefers-reduced-motion: reduce) {
  .mobile-nav-enter-active,
  .mobile-nav-leave-active {
    transition: none;
  }
}
</style>
