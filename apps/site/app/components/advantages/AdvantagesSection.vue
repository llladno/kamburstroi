<script setup lang="ts">
import type { Advantage } from '~/types/api';

defineProps<{ advantages: Advantage[] }>();
const heading = useRevealMotion();
</script>

<template>
  <section class="mx-auto max-w-7xl px-6 py-20 md:py-28">
    <h2
      v-motion
      class="text-text text-2xl font-medium md:text-3xl"
      :initial="heading.initial"
      :visible-once="heading.visibleOnce"
    >
      Почему выбирают нас
    </h2>
    <div v-if="advantages.length === 0" class="text-text-muted mt-8 text-sm">
      Скоро здесь появится список преимуществ.
    </div>
    <div v-else class="mt-8 grid grid-cols-1 md:grid-cols-2">
      <AdvantageItem
        v-for="(advantage, index) in advantages"
        :key="advantage.id"
        :advantage="advantage"
        :index="index"
      />
    </div>
  </section>
</template>
