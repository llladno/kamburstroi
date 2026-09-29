<script setup lang="ts">
const { data: services } = await useAsyncData('services-page', fetchServices);

useSeoMeta({
  title: 'Услуги — Kambyrstroi',
  description: 'Полный список услуг: строительство, ремонт, отделка, монтажные работы.',
});
</script>

<template>
  <section class="mx-auto max-w-7xl px-6 py-20 md:py-28">
    <h1 class="text-text text-3xl font-medium">Наши услуги</h1>

    <div v-if="!services || services.length === 0" class="text-text-muted mt-8 text-sm">
      Список услуг скоро появится.
    </div>
    <div v-else class="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <ServiceCard v-for="service in services" :key="service.id" :service="service" />
    </div>
  </section>
</template>
