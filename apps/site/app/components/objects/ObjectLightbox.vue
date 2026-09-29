<script setup lang="ts">
import type { ObjectItem } from '~/types/api';

const props = defineProps<{ object: ObjectItem | null }>();
const emit = defineEmits<{ close: [] }>();

const activeIndex = ref(0);
watch(
  () => props.object,
  () => {
    activeIndex.value = 0;
  },
);

const activeImage = computed(() => props.object?.images[activeIndex.value]);

function next() {
  if (!props.object) return;
  activeIndex.value = (activeIndex.value + 1) % props.object.images.length;
}
function prev() {
  if (!props.object) return;
  activeIndex.value =
    (activeIndex.value - 1 + props.object.images.length) % props.object.images.length;
}
</script>

<template>
  <Teleport to="body">
    <div
      v-if="object"
      class="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/80 p-4"
      @click.self="emit('close')"
    >
      <button
        class="absolute top-6 right-6 text-2xl text-white"
        aria-label="Закрыть"
        @click="emit('close')"
      >
        ✕
      </button>

      <img
        v-if="activeImage"
        :src="activeImage.url"
        :alt="object.title"
        class="max-h-[80vh] max-w-[90vw] rounded-lg object-contain"
      />

      <div v-if="object.images.length > 1" class="mt-4 flex items-center gap-6 text-white">
        <button aria-label="Предыдущее фото" @click="prev">‹</button>
        <span class="text-sm">{{ activeIndex + 1 }} / {{ object.images.length }}</span>
        <button aria-label="Следующее фото" @click="next">›</button>
      </div>

      <p class="mt-4 max-w-lg text-center text-sm text-white/80">{{ object.description }}</p>
    </div>
  </Teleport>
</template>
