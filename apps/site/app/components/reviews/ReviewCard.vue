<script setup lang="ts">
import type { Review } from '~/types/api';

const props = withDefaults(defineProps<{ review: Review; index?: number }>(), {
  index: 0,
});
const formattedDate = computed(() =>
  new Intl.DateTimeFormat('ru-RU', { day: '2-digit', month: '2-digit', year: 'numeric' }).format(
    new Date(props.review.createdAt),
  ),
);
const reveal = useRevealMotion((props.index % 6) * 70);
</script>

<template>
  <div
    v-motion
    class="rounded-card bg-card shadow-card p-6"
    :initial="reveal.initial"
    :visible-once="reveal.visibleOnce"
  >
    <p class="text-sm tracking-widest text-amber-500" aria-hidden="true">
      {{ '★'.repeat(review.rating) }}{{ '☆'.repeat(5 - review.rating) }}
    </p>
    <p
      class="custom-scroll text-text-secondary mt-3 max-h-[140px] overflow-y-auto pr-2 text-sm leading-relaxed break-words"
    >
      «{{ review.text }}»
    </p>
    <div class="mt-4 flex items-center justify-between">
      <p class="text-text text-sm font-medium">{{ review.name }}</p>
      <p class="text-text-muted text-xs">{{ formattedDate }}</p>
    </div>
  </div>
</template>
