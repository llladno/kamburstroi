<script setup lang="ts">
import type { Advantage } from '~/types/api';

const props = withDefaults(defineProps<{ advantage: Advantage; index?: number }>(), {
  index: 0,
});
const reveal = useRevealMotion((props.index % 6) * 70);
</script>

<template>
  <div
    v-motion
    class="border-border border-t py-6 first:border-t-0"
    :initial="reveal.initial"
    :visible-once="reveal.visibleOnce"
  >
    <h3 class="text-text text-base font-medium">{{ advantage.title }}</h3>
    <p class="text-text-secondary mt-2 text-sm leading-relaxed">{{ advantage.description }}</p>
  </div>
</template>
