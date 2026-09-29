<script setup lang="ts">
import type { SiteSettings } from '~/types/api';

defineProps<{ settings: SiteSettings }>();
</script>

<template>
  <section id="about" class="mx-auto max-w-7xl px-6 py-20 md:py-28">
    <div class="grid gap-10 md:grid-cols-2">
      <h2 class="text-text text-2xl font-medium md:text-3xl">О компании</h2>
      <p class="text-text-secondary text-base leading-relaxed whitespace-pre-line">
        {{ settings.aboutText || 'Мы специализируемся на отделке и ремонте квартир и домов под ключ.' }}
      </p>
    </div>
  </section>
</template>
