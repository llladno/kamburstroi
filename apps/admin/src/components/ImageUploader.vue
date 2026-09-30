<script setup lang="ts">
import { ref } from 'vue';
import { api, ApiError } from '../lib/api';
import { useToast } from '../composables/useToast';

const emit = defineEmits<{ uploaded: [url: string] }>();
const { push } = useToast();
const uploading = ref(false);
const inputRef = ref<HTMLInputElement | null>(null);

async function onFileChange(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0];
  if (!file) return;
  uploading.value = true;
  try {
    const { url } = await api.upload<{ url: string }>('/admin/uploads', file);
    emit('uploaded', url);
  } catch (error) {
    push(error instanceof ApiError ? error.message : 'Не удалось загрузить фото');
  } finally {
    uploading.value = false;
    if (inputRef.value) inputRef.value.value = '';
  }
}
</script>

<template>
  <label class="inline-flex cursor-pointer items-center gap-2 rounded-control border border-border px-4 py-2 text-sm">
    <span>{{ uploading ? 'Загрузка…' : 'Загрузить фото' }}</span>
    <input
      ref="inputRef"
      type="file"
      accept="image/*"
      class="hidden"
      :disabled="uploading"
      @change="onFileChange"
    />
  </label>
</template>
