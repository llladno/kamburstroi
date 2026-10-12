<script setup lang="ts">
import type { Service } from '~/types/api';

const props = defineProps<{ services: Service[] }>();
const teaser = computed(() => props.services);
const heading = useRevealMotion();
</script>

<template>
  <section id="services" class="bg-surface">
    <div class="mx-auto max-w-7xl px-6 py-20 md:py-28">
      <div
        v-motion
        class="flex items-center justify-between"
        :initial="heading.initial"
        :visible-once="heading.visibleOnce"
      >
        <h2 class="text-text text-2xl font-medium md:text-3xl">Наши услуги</h2>
      </div>

      <div v-if="teaser.length === 0" class="text-text-muted mt-8 text-sm">
        Список услуг скоро появится.
      </div>
      <div v-else class="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
        <ServiceCard v-for="(service, index) in teaser" :key="service.id" :service="service" :index="index" />
      </div>
    </div>
  </section>
</template>
