<script setup lang="ts">
defineProps<{ value: string; label: string }>();
</script>

<template>
  <div class="bg-card rounded-card shadow-card relative flex h-[173px] w-[162px] flex-col justify-end p-4">
    <p class="text-text text-3xl font-medium">{{ value }}</p>
    <p class="text-text-muted mt-1 text-xs leading-tight">{{ label }}</p>
  </div>
</template>
