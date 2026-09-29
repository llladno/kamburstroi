<script setup lang="ts">
import type { Advantage } from '~/types/api';

defineProps<{ advantage: Advantage }>();
</script>

<template>
  <div class="border-border border-t py-6 first:border-t-0">
    <h3 class="text-text text-base font-medium">{{ advantage.title }}</h3>
    <p class="text-text-secondary mt-2 text-sm leading-relaxed">{{ advantage.description }}</p>
  </div>
</template>
