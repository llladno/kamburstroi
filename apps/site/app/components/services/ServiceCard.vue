<script setup lang="ts">
import type { Service } from '~/types/api';

defineProps<{ service: Service }>();
</script>

<template>
  <div class="rounded-card bg-card shadow-card p-6">
    <h3 class="text-text text-base font-medium">{{ service.title }}</h3>
    <p class="text-text-secondary mt-2 text-sm leading-relaxed">{{ service.description }}</p>
  </div>
</template>
