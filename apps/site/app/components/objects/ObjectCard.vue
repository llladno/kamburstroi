<script setup lang="ts">
import type { ObjectItem } from '~/types/api';

const props = defineProps<{ object: ObjectItem }>();
const emit = defineEmits<{ open: [ObjectItem] }>();

const cover = computed(
  () => props.object.images.find((i) => i.isCover) ?? props.object.images[0],
);
</script>

<template>
  <button
    type="button"
    class="rounded-card group bg-card shadow-card block w-full overflow-hidden text-left"
    @click="emit('open', object)"
  >
    <div class="aspect-[4/3] overflow-hidden">
      <img
        v-if="cover"
        :src="cover.url"
        :alt="object.title"
        class="h-full w-full object-cover transition-transform duration-300 group-hover:scale-[1.02]"
      />
      <div v-else class="bg-surface h-full w-full" />
    </div>
    <div class="p-5">
      <h3 class="text-text text-base font-medium">{{ object.title }}</h3>
      <p class="text-text-muted mt-1 text-xs">{{ object.workType }} · {{ object.year }}</p>
    </div>
  </button>
</template>
