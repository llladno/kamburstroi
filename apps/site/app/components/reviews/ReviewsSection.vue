<script setup lang="ts">
import type { Review } from '~/types/api';
import ButtonComponent from '~/components/button/ButtonComponent.vue';

defineProps<{ reviews: Review[] }>();
const isModalOpen = ref(false);
const isThankYouVisible = ref(false);
const heading = useRevealMotion();

function handleSubmitted() {
  isModalOpen.value = false;
  isThankYouVisible.value = true;
}
</script>

<template>
  <section id="reviews" class="bg-surface">
    <div class="mx-auto max-w-7xl px-6 py-20 md:py-28">
      <div
        v-motion
        class="flex flex-wrap items-center justify-between gap-4"
        :initial="heading.initial"
        :visible-once="heading.visibleOnce"
      >
        <h2 class="text-text text-2xl font-medium md:text-3xl">Отзывы</h2>
        <ButtonComponent @click="isModalOpen = true">
          Оставить отзыв
        </ButtonComponent>
      </div>

      <p v-if="isThankYouVisible" class="mt-6 text-sm text-green-700">
        Спасибо! Ваш отзыв появится на сайте после проверки.
      </p>

      <div v-if="reviews.length === 0" class="text-text-muted mt-8 text-sm">
        Пока нет опубликованных отзывов.
      </div>
      <div v-else class="mt-10 grid grid-cols-1 items-start gap-6 md:grid-cols-2 lg:grid-cols-3">
        <ReviewCard v-for="(review, index) in reviews" :key="review.id" :review="review" :index="index" />
      </div>

      <ReviewFormModal
        :is-open="isModalOpen"
        @close="isModalOpen = false"
        @submitted="handleSubmitted"
      />
    </div>
  </section>
</template>
