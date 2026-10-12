<script setup lang="ts">
import type { ObjectItem } from '~/types/api';

const props = withDefaults(defineProps<{ object: ObjectItem; index?: number }>(), {
  index: 0,
});
const emit = defineEmits<{ open: [ObjectItem] }>();

const cover = computed(
  () => props.object.images.find((i) => i.isCover) ?? props.object.images[0],
);
const reveal = useRevealMotion((props.index % 6) * 70);
</script>

<template>
  <button
    v-motion
    type="button"
    class="rounded-card group bg-card shadow-card hover:shadow-floating block w-full overflow-hidden text-left transition-[translate,box-shadow] duration-300 ease-[cubic-bezier(.22,1,.36,1)] hover:-translate-y-1.5"
    :initial="reveal.initial"
    :visible-once="reveal.visibleOnce"
    @click="emit('open', object)"
  >
    <div class="aspect-[4/3] overflow-hidden">
      <img
        v-if="cover"
        :src="cover.url"
        :alt="object.title"
        class="h-full w-full object-cover transition-transform duration-500 group-hover:scale-[1.06]"
      />
      <div v-else class="bg-surface h-full w-full" />
    </div>
    <div class="p-5">
      <h3 class="text-text group-hover:text-accent text-base font-medium transition-colors duration-200">{{ object.title }}</h3>
      <p class="text-text-muted mt-1 text-xs">{{ object.workType }} · {{ object.year }}</p>
    </div>
  </button>
</template>
