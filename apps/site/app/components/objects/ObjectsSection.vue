<script setup lang="ts">
import type { ObjectItem } from '~/types/api';

defineProps<{ objects: ObjectItem[] }>();

const activeObject = ref<ObjectItem | null>(null);
const heading = useRevealMotion();
</script>

<template>
  <section id="objects" class="mx-auto max-w-7xl px-6 py-20 md:py-28">
    <h2
      v-motion
      class="text-text text-2xl font-medium md:text-3xl"
      :initial="heading.initial"
      :visible-once="heading.visibleOnce"
    >
      Наши объекты
    </h2>

    <div v-if="objects.length === 0" class="text-text-muted mt-8 text-sm">
      Скоро здесь появятся выполненные объекты.
    </div>
    <div v-else class="mt-10 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
      <ObjectCard
        v-for="(object, index) in objects"
        :key="object.id"
        :object="object"
        :index="index"
        @open="activeObject = $event"
      />
    </div>

    <ObjectLightbox :object="activeObject" @close="activeObject = null" />
  </section>
</template>
