<script setup lang="ts">
defineProps<{ open: boolean; title: string; message?: string }>();
const emit = defineEmits<{ confirm: []; cancel: [] }>();
</script>

<template>
  <div v-if="open" class="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
    <div class="w-full max-w-sm rounded-card bg-bg p-6 shadow-lg">
      <h2 class="text-lg font-semibold text-text">{{ title }}</h2>
      <p v-if="message" class="mt-2 text-sm text-text-secondary">{{ message }}</p>
      <div class="mt-6 flex justify-end gap-2">
        <button class="rounded-control px-4 py-2 text-sm" @click="emit('cancel')">Отмена</button>
        <button
          class="rounded-control bg-danger px-4 py-2 text-sm text-white"
          @click="emit('confirm')"
        >
          Удалить
        </button>
      </div>
    </div>
  </div>
</template>
