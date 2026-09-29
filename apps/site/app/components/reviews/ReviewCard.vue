<script setup lang="ts">
import type { Review } from '~/types/api';

const props = defineProps<{ review: Review }>();
const formattedDate = computed(() =>
  new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(props.review.createdAt),
  ),
);
</script>

<template>
  <div class="rounded-card bg-card shadow-card p-6">
    <p class="text-sm tracking-widest text-amber-500" aria-hidden="true">
      {{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}
    </p>
    <p class="text-text-secondary mt-3 text-sm leading-relaxed">«{{ review.text }}»</p>
    <div class="mt-4 flex items-center justify-between">
      <p class="text-text text-sm font-medium">{{ review.name }}</p>
      <p class="text-text-muted text-xs">{{ formattedDate }}</p>
    </div>
  </div>
</template>
