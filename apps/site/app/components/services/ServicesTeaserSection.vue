<script setup lang="ts">
import type { Service } from '~/types/api';

const props = defineProps<{ services: Service[] }>();
const teaser = computed(() => props.services.slice(0, 6));
</script>

<template>
  <section class="bg-surface">
    <div class="mx-auto max-w-7xl px-6 py-20 md:py-28">
      <div class="flex items-center justify-between">
        <h2 class="text-text text-2xl font-medium md:text-3xl">Наши услуги</h2>
        <NuxtLink to="/services" class="text-text-secondary text-sm underline">
          Все услуги
        </NuxtLink>
      </div>

      <div v-if="teaser.length === 0" class="text-text-muted mt-8 text-sm">
        Список услуг скоро появится.
      </div>
      <div v-else class="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ServiceCard v-for="service in teaser" :key="service.id" :service="service" />
      </div>
    </div>
  </section>
</template>
