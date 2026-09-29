<script setup lang="ts">
import type { Advantage } from '~/types/api';

defineProps<{ advantages: Advantage[] }>();
</script>

<template>
  <section class="mx-auto max-w-7xl px-6 py-20 md:py-28">
    <h2 class="text-text text-2xl font-medium md:text-3xl">Почему выбирают нас</h2>
    <div v-if="advantages.length === 0" class="text-text-muted mt-8 text-sm">
      Скоро здесь появится список преимуществ.
    </div>
    <div v-else class="mt-8 grid grid-cols-1 md:grid-cols-2">
      <AdvantageItem v-for="advantage in advantages" :key="advantage.id" :advantage="advantage" />
    </div>
  </section>
</template>
