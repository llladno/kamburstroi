<script setup lang="ts">
import { ref } from 'vue';
import { api, ApiError } from '../lib/api';
import { useToast } from '../composables/useToast';

const props = withDefaults(defineProps<{ multiple?: boolean }>(), { multiple: false });
const emit = defineEmits<{ uploaded: [url: string]; uploadedMany: [urls: string[]] }>();
const { push } = useToast();
const uploading = ref(false);
const progress = ref({ done: 0, total: 0 });
const inputRef = ref<HTMLInputElement | null>(null);

async function onFileChange(event: Event) {
  const files = Array.from((event.target as HTMLInputElement).files ?? []);
  if (files.length === 0) return;
  uploading.value = true;
  progress.value = { done: 0, total: files.length };
  const urls: string[] = [];
  try {
    for (const file of files) {
      try {
        const { url } = await api.upload<{ url: string }>('/admin/uploads', file);
        urls.push(url);
      } catch (error) {
        push(
          error instanceof ApiError
            ? `${file.name}: ${error.message}`
            : `Не удалось загрузить ${file.name}`,
        );
      }
      progress.value.done += 1;
    }
    if (urls.length === 0) return;
    if (props.multiple) emit('uploadedMany', urls);
    else emit('uploaded', urls[0]!);
  } finally {
    uploading.value = false;
    if (inputRef.value) inputRef.value.value = '';
  }
}
</script>

<template>
  <label class="inline-flex cursor-pointer items-center gap-2 rounded-control border border-border px-4 py-2 text-sm">
    <span v-if="uploading">
      Загрузка{{ progress.total > 1 ? ` ${progress.done}/${progress.total}` : '' }}…
    </span>
    <span v-else>{{ multiple ? 'Загрузить фото (можно несколько)' : 'Загрузить фото' }}</span>
    <input
      ref="inputRef"
      type="file"
      accept="image/*"
      class="hidden"
      :multiple="multiple"
      :disabled="uploading"
      @change="onFileChange"
    />
  </label>
</template>
