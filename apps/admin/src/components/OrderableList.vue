<script setup lang="ts" generic="T extends { id: string }">
import { ref } from 'vue';
import { moveItem } from '../lib/reorder';

const props = defineProps<{ items: T[] }>();
const emit = defineEmits<{ reorder: [ids: string[]] }>();

const draggedIndex = ref<number | null>(null);

function onDragStart(index: number) {
  draggedIndex.value = index;
}

function onDrop(targetIndex: number) {
  if (draggedIndex.value === null || draggedIndex.value === targetIndex) return;
  const reordered = moveItem(props.items, draggedIndex.value, targetIndex);
  draggedIndex.value = null;
  emit('reorder', reordered.map((item) => item.id));
}
</script>

<template>
  <div class="flex flex-col gap-2">
    <div
      v-for="(item, index) in items"
      :key="item.id"
      draggable="true"
      class="cursor-move rounded-card border border-border bg-card p-3"
      @dragstart="onDragStart(index)"
      @dragover.prevent
      @drop="onDrop(index)"
    >
      <slot :item="item" />
    </div>
  </div>
</template>
