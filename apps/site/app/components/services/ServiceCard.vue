<script setup lang="ts">
import type { Service } from '~/types/api';

const props = withDefaults(defineProps<{ service: Service; index?: number }>(), {
  index: 0,
});
const reveal = useRevealMotion((props.index % 6) * 70);
</script>

<template>
  <div
    v-motion
    class="rounded-card bg-card shadow-card p-6"
    :initial="reveal.initial"
    :visible-once="reveal.visibleOnce"
  >
    <h3 class="text-text text-base font-medium">{{ service.title }}</h3>
    <p class="text-text-secondary mt-2 text-sm leading-relaxed">{{ service.description }}</p>
  </div>
</template>
